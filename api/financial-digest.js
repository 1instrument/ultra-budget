import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientSecret = req.headers['x-ultra-secret'];
    const serverSecret = process.env.ULTRA_APP_SECRET;
    if (serverSecret && clientSecret !== serverSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseUrl = 'https://rsiabnbiyzhopnhjdobf.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const lmApiKey = process.env.LUNCH_MONEY_API_KEY;

    if (!supabaseServiceKey || !lmApiKey) {
        return res.status(500).json({ error: 'Server configuration error: Keys missing' });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Fetch App State
        const { data: rows, error: sbError } = await supabase
            .from('app_state')
            .select('data, updated_at')
            .order('updated_at', { ascending: false })
            .limit(1);

        if (sbError || !rows?.[0]) throw new Error('Could not fetch app state');
        const appData = rows[0].data;
        const mappings = appData.mappings || {};

        // 2. Fetch Lunch Money Transactions — current month + 2 prior months for trends
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
        const endOfToday = now.toISOString().split('T')[0];

        // Fetch Plaid accounts, manual assets, and transactions
        const [txResponse, accountsResponse, assetsResponse] = await Promise.all([
            fetch(`https://dev.lunchmoney.app/v1/transactions?start_date=${threeMonthsAgo}&end_date=${endOfToday}`, {
                headers: { 'Authorization': `Bearer ${lmApiKey}` }
            }),
            fetch('https://dev.lunchmoney.app/v1/plaid_accounts', {
                headers: { 'Authorization': `Bearer ${lmApiKey}` }
            }),
            fetch('https://dev.lunchmoney.app/v1/assets', {
                headers: { 'Authorization': `Bearer ${lmApiKey}` }
            })
        ]);

        const txData = await txResponse.json();
        const accountsData = await accountsResponse.json();
        const assetsData = await assetsResponse.json();
        const allTransactions = txData.transactions || [];

        // Build account name map from both Plaid and manual Assets
        const accountMap = {};
        (accountsData.plaid_accounts || []).forEach(acc => {
            accountMap[acc.id] = acc.name;
        });
        (assetsData.assets || []).forEach(asset => {
            // Assets don't have IDs in transactions usually, but we keep names for logic
            accountMap[asset.id] = asset.name;
        });

        // Enrich transactions with account names
        allTransactions.forEach(tx => {
            tx.account_name = accountMap[tx.plaid_account_id] || 'Unknown';
        });

        // Split into current month and historical
        const currentMonthTxs = allTransactions.filter(tx => tx.date >= startOfMonth);
        const historicalTxs = allTransactions.filter(tx => tx.date < startOfMonth);

        // 3. Business Revenue Pulse
        // In Lunch Money, income is NEGATIVE (money coming in)
        const bizRevenue = currentMonthTxs
            .filter(tx => {
                const acct = (tx.account_name || '').toLowerCase();
                return acct.includes('business') && parseFloat(tx.amount) < 0;
            })
            .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount)), 0);

        // Historical monthly averages (business income)
        const monthBuckets = {};
        historicalTxs.forEach(tx => {
            const acct = (tx.account_name || '').toLowerCase();
            if (acct.includes('business') && parseFloat(tx.amount) < 0) {
                const month = tx.date.substring(0, 7); // YYYY-MM
                if (!monthBuckets[month]) monthBuckets[month] = 0;
                monthBuckets[month] += Math.abs(parseFloat(tx.amount));
            }
        });
        const priorMonthTotals = Object.values(monthBuckets);
        const avgRevenue = priorMonthTotals.length > 0
            ? Math.round(priorMonthTotals.reduce((a, b) => a + b, 0) / priorMonthTotals.length)
            : null;

        // 4. Map personal spending to budget groups
        const groupTotals = {};
        (appData.groups || []).forEach(g => {
            groupTotals[g.id] = {
                name: g.name,
                budgeted: (g.items || []).reduce((s, i) => s + i.amount, 0),
                actual: 0
            };
        });

        const unmapped = [];

        currentMonthTxs.forEach(tx => {
            const amount = parseFloat(tx.amount);
            // In Lunch Money: positive = expense, negative = income
            if (amount <= 0) return; // Skip income

            // Only map personal/household spending
            const acct = (tx.account_name || '').toLowerCase();
            const isBusiness = acct.includes('business');
            // Skip pure business expenses (payroll, supplies, etc.) — they're not part of the personal budget
            if (isBusiness) return;

            const category = tx.category_name || 'Uncategorized';
            let mappedGroupId = mappings[category];

            // Fuzzy fallback
            if (!mappedGroupId) {
                const lowerCat = category.toLowerCase();
                const lowerPayee = (tx.payee || '').toLowerCase();
                if (['food', 'dining', 'grocery', 'restaurants', 'coffee', 'alcohol', 'shop'].some(k => lowerCat.includes(k) || lowerPayee.includes(k))) {
                    mappedGroupId = 'variable';
                } else if (['mortgage', 'rent', 'bill', 'utility', 'insurance', 'internet', 'phone'].some(k => lowerCat.includes(k))) {
                    mappedGroupId = 'fixed';
                } else if (['invest', 'save', 'vanguard', 'transfer'].some(k => lowerCat.includes(k) || lowerPayee.includes(k))) {
                    mappedGroupId = 'wealth';
                }
            }

            if (mappedGroupId && groupTotals[mappedGroupId]) {
                groupTotals[mappedGroupId].actual += amount;
            } else {
                unmapped.push({ category, amount, payee: tx.payee });
            }
        });

        // 5. Compute key numbers
        const salary = appData.salary || 0;
        const w2Wages = appData.w2Wages || 0;
        const transferNeeded = Math.max(0, salary - w2Wages);
        const bizBalance = appData.bizBalance || 0;
        const runway = transferNeeded > 0 ? Math.round((bizBalance / transferNeeded) * 10) / 10 : null;

        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysRemaining = daysInMonth - now.getDate();
        const daysPassed = now.getDate();

        // Build the response
        const summary = {
            period: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
            daysPassed,
            daysRemaining,

            // The Draw
            salary,
            w2Wages,
            transferNeeded,

            // Business Health
            bizBalance,
            runway,
            bizRevenueThisMonth: Math.round(bizRevenue),
            avgMonthlyRevenue: avgRevenue,

            // Personal Balance
            personalBalance: appData.personalBalance,

            // Budget vs Actual
            budgetVsActual: Object.values(groupTotals).map(g => ({
                group: g.name,
                budgeted: g.budgeted,
                actual: Math.round(g.actual),
                remaining: g.budgeted - Math.round(g.actual),
                paceStatus: g.budgeted > 0
                    ? (g.actual / g.budgeted) > (daysPassed / daysInMonth) ? 'ahead_of_budget' : 'on_track'
                    : 'no_budget'
            })),

            // Unmapped — the agent should ask about these
            unmappedCategories: [...new Set(unmapped.map(u => u.category))],
            unmappedTotal: Math.round(unmapped.reduce((s, u) => s + u.amount, 0)),

            // Goals
            goals: (appData.goals || []).map(g => {
                const totalContributed = Object.values(g.monthlyContributions || {}).reduce((a, b) => a + b, 0);
                const totalSaved = (g.startingBalance || 0) + totalContributed;
                const remaining = Math.max(0, (g.target || 0) - totalSaved);
                return {
                    name: g.name,
                    target: g.target,
                    saved: totalSaved,
                    pct: g.target > 0 ? Math.round((totalSaved / g.target) * 100) : 0,
                    remaining
                };
            }),

            notes: appData.notes || '',
            streak: appData.streak || 0
        };

        return res.status(200).json(summary);

    } catch (err) {
        console.error('Digest error:', err);
        return res.status(500).json({ error: err.message });
    }
}
