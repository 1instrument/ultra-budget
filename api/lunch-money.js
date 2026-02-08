export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Secret header check to prevent unauthorized access
    const clientSecret = req.headers['x-ultra-secret'];
    const serverSecret = process.env.ULTRA_APP_SECRET;
    if (serverSecret && clientSecret !== serverSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { start_date, end_date } = req.query;
    const apiKey = process.env.LUNCH_MONEY_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: API key missing' });
    }

    try {
        // Fetch both transactions and accounts
        const [txResponse, accountsResponse] = await Promise.all([
            fetch(`https://dev.lunchmoney.app/v1/transactions?start_date=${start_date}&end_date=${end_date}`, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            }),
            fetch('https://dev.lunchmoney.app/v1/plaid_accounts', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            })
        ]);

        if (!txResponse.ok || !accountsResponse.ok) {
            throw new Error('Lunch Money API error');
        }

        const txData = await txResponse.json();
        const accountsData = await accountsResponse.json();

        // Create a map of account ID to account name
        const accountMap = {};
        (accountsData.plaid_accounts || []).forEach(acc => {
            accountMap[acc.id] = acc.name;
        });

        // Add account_name to each transaction
        const enrichedTransactions = (txData.transactions || []).map(tx => ({
            ...tx,
            account_name: accountMap[tx.plaid_account_id] || 'Unknown'
        }));

        res.status(200).json({ transactions: enrichedTransactions });
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
}
