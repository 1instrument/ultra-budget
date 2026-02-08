// Vercel Serverless Function to fetch Lunch Money account balances
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Secret header check
    const clientSecret = req.headers['x-ultra-secret'];
    const serverSecret = process.env.ULTRA_APP_SECRET;
    if (serverSecret && clientSecret !== serverSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const apiKey = process.env.LUNCH_MONEY_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: API key missing' });
    }

    try {
        // Fetch both Plaid accounts and manual assets
        const [plaidResponse, assetsResponse] = await Promise.all([
            fetch('https://dev.lunchmoney.app/v1/plaid_accounts', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            }),
            fetch('https://dev.lunchmoney.app/v1/assets', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            })
        ]);

        if (!plaidResponse.ok || !assetsResponse.ok) {
            throw new Error('Lunch Money API error');
        }

        const plaidData = await plaidResponse.json();
        const assetsData = await assetsResponse.json();

        // Combine both sources
        const allAccounts = [
            ...(plaidData.plaid_accounts || []).map(acc => ({
                name: acc.name,
                balance: parseFloat(acc.balance),
                type: 'plaid'
            })),
            ...(assetsData.assets || []).map(acc => ({
                name: acc.name,
                balance: parseFloat(acc.balance),
                type: 'asset'
            }))
        ];

        res.status(200).json({ accounts: allAccounts });
    } catch (error) {
        console.error('Account balance fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch account balances' });
    }
}
