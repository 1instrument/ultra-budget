import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientSecret = req.headers['x-ultra-secret'];
    const serverSecret = process.env.ULTRA_APP_SECRET;
    if (serverSecret && clientSecret !== serverSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { category, groupId } = req.body;
    if (!category || !groupId) {
        return res.status(400).json({ error: 'Missing category or groupId' });
    }

    const supabaseUrl = 'https://rsiabnbiyzhopnhjdobf.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Fetch the latest state
        const { data: rows, error: fetchError } = await supabase
            .from('app_state')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1);

        if (fetchError || !rows?.[0]) throw new Error('Could not fetch state');

        const latestRow = rows[0];
        const newData = { ...latestRow.data };

        // 2. Update the mappings
        if (!newData.mappings) newData.mappings = {};
        newData.mappings[category] = groupId;

        // 3. Save it back
        const { error: saveError } = await supabase
            .from('app_state')
            .upsert({
                id: latestRow.id,
                user_email: latestRow.user_email,
                data: newData,
                updated_at: new Date().toISOString()
            });

        if (saveError) throw saveError;

        return res.status(200).json({ success: true, message: `Mapped ${category} to ${groupId}` });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}
