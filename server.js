import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import lunchMoneyHandler from './api/lunch-money.js';
import lunchMoneyBalancesHandler from './api/lunch-money-balances.js';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Force the secret if not in env, to match frontend expectation
if (!process.env.ULTRA_APP_SECRET) {
    process.env.ULTRA_APP_SECRET = 'ultra-budget-2024-secure';
}

// Wrapper to adapt Vercel-style handlers to Express
const adaptHandler = (handler) => async (req, res) => {
    try {
        await handler(req, res);
    } catch (error) {
        console.error('API Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

app.get('/api/lunch-money', adaptHandler(lunchMoneyHandler));
app.get('/api/lunch-money-balances', adaptHandler(lunchMoneyBalancesHandler));

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`- Lunch Money API Key config: ${process.env.LUNCH_MONEY_API_KEY ? 'FOUND' : 'MISSING (Check .env)'}`);
});
