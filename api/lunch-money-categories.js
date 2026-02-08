// Vercel Serverless Function to fetch Lunch Money categories
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
        const response = await fetch('https://dev.lunchmoney.app/v1/categories', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!response.ok) {
            throw new Error(`Lunch Money API error: ${response.statusText}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Categories fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
}
