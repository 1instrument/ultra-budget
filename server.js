import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import simplefinHandler from './api/simplefin.js';
import financialDigestHandler from './api/financial-digest.js';
import saveMappingHandler from './api/save-mapping.js';

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

app.get('/api/simplefin', adaptHandler(simplefinHandler));
app.get('/api/financial-digest', adaptHandler(financialDigestHandler));
app.post('/api/save-mapping', adaptHandler(saveMappingHandler));

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`- SimpleFIN Access URL configuration: ${process.env.SimpleFIN ? 'FOUND' : 'MISSING (Check .env)'}`);
});
