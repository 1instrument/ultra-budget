import { createClient } from '@supabase/supabase-js';
import { fetchSimpleFinData, persistTransactions } from './_lib/simplefin.js';

const SUPABASE_URL = 'https://rsiabnbiyzhopnhjdobf.supabase.co';
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));

function authorize(req) {
    if (process.env.CRON_SECRET && req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`) return { ok: true, cron: true };
    if (process.env.ULTRA_APP_SECRET && req.headers['x-ultra-secret'] === process.env.ULTRA_APP_SECRET) return { ok: true, cron: false };
    return { ok: false, cron: false };
}

function buildSummary(appData, transactions, now = new Date()) {
    const monthKey = now.toISOString().slice(0, 7);
    const current = transactions.filter(tx => tx.posted_at.startsWith(monthKey));
    const isBusiness = tx => (tx.account_name || '').toLowerCase().includes('business');
    const bizRevenue = current.filter(tx => isBusiness(tx) && Number(tx.amount) > 0).reduce((sum, tx) => sum + Number(tx.amount), 0);
    const personalExpenses = current.filter(tx => !isBusiness(tx) && Number(tx.amount) < 0);
    const totalSpent = personalExpenses.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
    const salary = Number(appData.salary) || 0;
    const totalBudget = (appData.groups || []).reduce((sum, group) => sum + (group.items || []).reduce((s, item) => s + (Number(item.amount) || 0), 0), 0);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const expectedPace = totalBudget * (now.getDate() / daysInMonth);
    const transferNeeded = Math.max(0, salary - (Number(appData.w2Wages) || 0));
    const runway = transferNeeded > 0 ? (Number(appData.bizBalance) || 0) / transferNeeded : null;
    return {
        period: now.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/Chicago' }),
        totalSpent: Math.round(totalSpent), totalBudget: Math.round(totalBudget), budgetRemaining: Math.round(totalBudget - totalSpent),
        paceStatus: totalSpent <= expectedPace ? 'On track' : 'Spending ahead of pace',
        bizRevenue: Math.round(bizRevenue), bizBalance: Number(appData.bizBalance) || 0, personalBalance: Number(appData.personalBalance) || 0,
        transferNeeded, runway: runway === null ? null : Math.round(runway * 10) / 10, transactionCount: current.length,
        recentTransactions: [...current].sort((a, b) => b.posted_at.localeCompare(a.posted_at)).slice(0, 5).map(tx => ({ date: tx.posted_at, payee: tx.payee, amount: Number(tx.amount), account: tx.account_name }))
    };
}

function renderEmail(summary) {
    const rows = summary.recentTransactions.map(tx => `<tr><td style="padding:8px 0">${escapeHtml(tx.payee)}</td><td style="padding:8px 0;text-align:right">${money(tx.amount)}</td></tr>`).join('');
    return `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827"><div style="max-width:620px;margin:auto;padding:28px 18px"><div style="background:#111827;color:white;border-radius:16px;padding:26px"><div style="color:#c8ff00;font-weight:700">ULTRA BUDGET</div><h1 style="margin:8px 0 4px">Daily financial health</h1><div style="color:#9ca3af">${escapeHtml(summary.period)} · ${summary.paceStatus}</div></div><div style="background:white;border-radius:16px;padding:24px;margin-top:14px"><h2 style="margin-top:0">Personal</h2><p>Spent this month: <strong>${money(summary.totalSpent)}</strong> of ${money(summary.totalBudget)}</p><p>Budget remaining: <strong>${money(summary.budgetRemaining)}</strong></p><p>Checking balance: <strong>${money(summary.personalBalance)}</strong></p><h2>Business</h2><p>Revenue this month: <strong>${money(summary.bizRevenue)}</strong></p><p>Balance: <strong>${money(summary.bizBalance)}</strong></p><p>Estimated draw runway: <strong>${summary.runway === null ? 'N/A' : `${summary.runway} months`}</strong></p><h2>Latest transactions</h2><table style="width:100%;border-collapse:collapse">${rows || '<tr><td>No transactions yet.</td></tr>'}</table></div></div></body></html>`;
}

async function sendEmail(to, summary) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.REPORT_FROM_EMAIL || 'Ultra Budget <onboarding@resend.dev>', to: [to], subject: `Daily financial health — ${summary.paceStatus}`, html: renderEmail(summary) }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || `Email provider error: ${response.status}`);
    return result.id;
}

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const auth = authorize(req);
    if (!auth.ok) return res.status(401).json({ error: 'Unauthorized' });
    if (!process.env.SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY missing' });
    try {
        const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
        const { data: owner, error: ownerError } = await supabase.from('app_state').select('id,user_email,data').order('updated_at', { ascending: false }).limit(1).single();
        if (ownerError) throw ownerError;
        if (process.env.SimpleFIN) {
            const fresh = await fetchSimpleFinData();
            await persistTransactions(supabase, fresh.transactions, owner.id);
        }
        const since = new Date();
        since.setMonth(since.getMonth() - 2, 1);
        const { data: transactions, error: txError } = await supabase.from('transactions').select('posted_at,payee,amount,account_name,category').eq('user_id', owner.id).gte('posted_at', since.toISOString().slice(0, 10));
        if (txError) throw txError;
        const summary = buildSummary(owner.data || {}, transactions || []);
        const shouldSend = auth.cron || req.query?.send === '1';
        let emailId = null;
        if (shouldSend) {
            const recipient = process.env.REPORT_EMAIL || owner.user_email;
            if (!recipient) throw new Error('REPORT_EMAIL missing and account has no email');
            emailId = await sendEmail(recipient, summary);
        }
        return res.status(200).json({ ...summary, email: shouldSend ? { sent: true, id: emailId } : { sent: false, preview: true } });
    } catch (error) {
        console.error('Digest error:', error);
        return res.status(500).json({ error: error.message });
    }
}
