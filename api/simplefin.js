import { createClient } from '@supabase/supabase-js';
import { fetchSimpleFinData, persistTransactions } from './_lib/simplefin.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Secret header check to prevent unauthorized access
    const clientSecret = req.headers['x-ultra-secret'];
    const serverSecret = process.env.ULTRA_APP_SECRET || 'ultra-budget-2024-secure';
    if (serverSecret && clientSecret !== serverSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const accessUrl = process.env.SimpleFIN;
    if (!accessUrl) {
        return res.status(500).json({ error: 'Server configuration error: SimpleFIN Access URL missing' });
    }

    try {
        const result = await fetchSimpleFinData(accessUrl);
        let stored = 0;
        let storageError = null;
        const serviceKey = process.env.SUPABASE_SERVICE_KEY;
        if (serviceKey) {
            try {
                const supabase = createClient('https://rsiabnbiyzhopnhjdobf.supabase.co', serviceKey);
                const { data: owner, error: ownerError } = await supabase.from('app_state').select('id').order('updated_at', { ascending: false }).limit(1).maybeSingle();
                if (ownerError) throw ownerError;
                if (!owner?.id) throw new Error('No app user found for transaction ownership');
                stored = await persistTransactions(supabase, result.transactions, owner.id);
            } catch (error) {
                storageError = error.message;
                console.error('Transaction persistence failed:', error);
            }
        }
        res.status(200).json({ ...result, stored, storage_error: storageError });
    } catch (error) {
        console.error('SimpleFIN Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch budget data' });
    }
}
