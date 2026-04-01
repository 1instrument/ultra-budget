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
        // Fetch data from SimpleFIN
        // SimpleFIN returns nested accounts and transactions
        const url = new URL(accessUrl);
        const authHeader = `Basic ${Buffer.from(`${url.username}:${url.password}`).toString('base64')}`;
        const cleanUrl = `${url.protocol}//${url.host}${url.pathname}/accounts?version=2`;

        const response = await fetch(cleanUrl, {
            headers: { 'Authorization': authHeader }
        });

        if (!response.ok) {
            throw new Error(`SimpleFIN API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Transform the data to align with what the app expects
        // But keep original values for manual mapping later
        const transformedAccounts = (data.accounts || []).map(acc => ({
            id: acc.id,
            name: acc.name,
            balance: Number(acc.balance),
            currency: acc.currency,
            org_name: acc.org?.name || 'Bank',
            // Include raw object for full context
            ...acc
        }));

        // Flatten transactions from all accounts
        const allTransactions = [];
        (data.accounts || []).forEach(acc => {
            if (acc.transactions) {
                acc.transactions.forEach(tx => {
                    allTransactions.push({
                        ...tx,
                        id: tx.id || `tx-${Date.now()}-${Math.random()}`,
                        account_id: acc.id,
                        account_name: acc.name, // Important for the frontend mapping
                        amount: Number(tx.amount), // Bank standard (negative = expense)
                        // Lunch Money uses 'payee', SimpleFIN uses 'payee' or 'description'
                        payee: tx.payee || tx.description || 'Unknown',
                        // Map timestamp to ISO date YYYY-MM-DD
                        date: new Date(tx.posted * 1000).toISOString().split('T')[0]
                    });
                });
            }
        });

        // Current UI expects: { transactions: [...] } and { accounts: [...] }
        res.status(200).json({ 
            transactions: allTransactions,
            accounts: transformedAccounts,
            errors: data.errors || []
        });
    } catch (error) {
        console.error('SimpleFIN Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch budget data' });
    }
}
