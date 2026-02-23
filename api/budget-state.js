// Vercel Serverless Function — serves Ultra Budget app state to OpenClaw
// Reads from the same Supabase `app_state` table the app writes to.
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Secret header check — same pattern as other api routes
    const clientSecret = req.headers['x-ultra-secret'];
    const serverSecret = process.env.ULTRA_APP_SECRET;
    if (serverSecret && clientSecret !== serverSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // URL is public (already in frontend code) — only the service key is secret
    const supabaseUrl = 'https://rsiabnbiyzhopnhjdobf.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseServiceKey) {
        return res.status(500).json({ error: 'Server configuration error: SUPABASE_SERVICE_KEY missing' });
    }

    try {
        // Use the service key (server-side only) to bypass RLS and read the app state
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch the most recently updated app state row
        const { data: rows, error } = await supabase
            .from('app_state')
            .select('data, user_email, updated_at')
            .order('updated_at', { ascending: false })
            .limit(1);

        if (error) throw error;
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'No budget state found. Open the app and make sure you are logged in.' });
        }

        const { data: appData, user_email, updated_at } = rows[0];

        // Compute derived summaries server-side so OpenClaw gets clean numbers
        const groups = appData.groups || [];
        const goals = appData.goals || [];

        const groupSummaries = groups.map(g => {
            const total = (g.items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
            return {
                name: g.name,
                total,
                items: (g.items || []).map(i => ({ name: i.name, amount: i.amount }))
            };
        });

        const totalAllocated = groupSummaries.reduce((sum, g) => sum + g.total, 0);
        const remainingFromSalary = (appData.salary || 0) - totalAllocated;

        const goalSummaries = goals.map(g => {
            const totalContributed = Object.values(g.monthlyContributions || {}).reduce((a, b) => a + b, 0);
            const totalSaved = (g.startingBalance || 0) + totalContributed;
            const progressPct = g.target > 0 ? Math.round((totalSaved / g.target) * 100) : 0;
            const remaining = Math.max(0, g.target - totalSaved);
            const monthsToGoal = (remaining > 0 && g.currentContribution > 0)
                ? Math.ceil(remaining / g.currentContribution)
                : null;

            return {
                name: g.name,
                target: g.target,
                totalSaved,
                progressPct,
                remaining,
                monthsToGoal
            };
        });

        return res.status(200).json({
            lastUpdated: updated_at,
            userEmail: user_email,
            salary: appData.salary,
            personalBalance: appData.personalBalance,
            bizBalance: appData.bizBalance,
            totalAllocated,
            remainingFromSalary,
            allocationPct: appData.salary > 0 ? Math.round((totalAllocated / appData.salary) * 100) : 0,
            groups: groupSummaries,
            goals: goalSummaries,
            notes: appData.notes || '',
            streak: appData.streak || 0,
            lastCheckIn: appData.lastCheckIn || null
        });

    } catch (error) {
        console.error('Budget state fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch budget state' });
    }
}
