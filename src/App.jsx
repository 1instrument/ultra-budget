import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Trash2, ChevronDown, ChevronRight, TrendingUp, TrendingDown,
    Lightbulb, Wallet, Building2, Sparkles, LayoutDashboard, Receipt,
    Coffee, ShoppingBag, Zap, Car, Home, CreditCard, Target, CalendarCheck,
    Users, Clock, CheckCircle2, DollarSign, Filter, ShieldCheck, Moon
} from 'lucide-react';



import { useSwipe } from './useSwipe';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PAGE_ORDER = ['dashboard', 'budget', 'transactions', 'strategy'];
const CURRENT_MONTH_INDEX = new Date().getMonth();
const CURRENT_DAY = new Date().getDate();
const BIZ_SAFETY_BASELINE = 25000;

// Quartile: Q1 = days 1-7, Q2 = 8-15, Q3 = 16-22, Q4 = 23-31
const getQuartile = (day) => {
    if (day <= 7) return 1;
    if (day <= 15) return 2;
    if (day <= 22) return 3;
    return 4;
};

const QUARTILE = getQuartile(CURRENT_DAY);

const createInitialMonthlyData = () => {
    const data = {};
    MONTHS.forEach((month, i) => {
        data[month] = { revenue: i === 1 ? 10000 : 0, expenses: i === 1 ? 2498 : 0 };
    });
    return data;
};

const INITIAL_STATE = {
    salary: 4000,
    personalBalance: 5200,
    bizBalance: 28500,
    selectedMonth: MONTHS[CURRENT_MONTH_INDEX],
    streak: 1,
    lastCheckIn: new Date().toISOString().split('T')[0],
    groups: [
        {
            id: 'wealth', name: 'Wealth Building', color: '#C8FF00', collapsed: false, items: [
                { id: '1', name: 'Travel Savings', amount: 500 },
                { id: '2', name: 'Vanguard ETF', amount: 400 },
                { id: '3', name: 'Philanthropy', amount: 100 },
            ]
        },
        {
            id: 'fixed', name: 'Fixed Expenses', color: '#5B7FFF', collapsed: false, items: [
                { id: '4', name: 'Mortgage', amount: 960 },
                { id: '5', name: 'Utilities', amount: 280 },
                { id: '6', name: 'Insurance', amount: 275 },
            ]
        },
        {
            id: 'variable', name: 'Variable Spending', color: '#2DD4BF', collapsed: false, items: [
                { id: '7', name: 'Groceries', amount: 500 },
                { id: '8', name: 'Dining Out', amount: 250 },
                { id: '9', name: 'Shopping', amount: 200 },
            ]
        }
    ],
    monthlyBiz: createInitialMonthlyData(),
    goals: [
        { id: '1', name: 'Emergency Fund', target: 10000, startingBalance: 2000, monthlyContributions: {} },
        { id: '2', name: 'New Car', target: 35000, startingBalance: 5000, monthlyContributions: {} }
    ]
};


// Start with empty transactions - real data comes from Lunch Money sync
const PLACEHOLDER_TXS = [];


function getInsight(profit, sustainability, quartile, salary) {
    if (quartile === 1) {
        if (profit < 500) return { emoji: '📊', text: 'Early month. Data is just starting to come in.' };
        return { emoji: '🚀', text: 'Strong start! Keep this momentum going.' };
    }
    if (quartile === 2) {
        if (sustainability > 100) return { emoji: '💪', text: 'Behind pace, but plenty of time. Focus on closing deals.' };
        return { emoji: '✨', text: 'On track! Pacing well for a solid month.' };
    }
    if (quartile === 3) {
        if (sustainability > 120) return { emoji: '🔥', text: 'Time to hustle! Push for those last invoices.' };
        if (sustainability > 100) return { emoji: '⚡', text: 'Almost there. One good day can flip this.' };
        return { emoji: '🎯', text: 'Great pace. Stay consistent through the home stretch.' };
    }
    if (sustainability > 100) return { emoji: '💥', text: 'Final push! Every dollar counts.' };
    if (profit > salary * 1.5) return { emoji: '🏆', text: 'Crushing it! Surplus ready for wealth distribution.' };
    return { emoji: '✓', text: 'Healthy close. Salary is covered by profit.' };
}

function getDailyPrompt() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    const hour = now.getHours();

    if (day === 5 && hour >= 16) return { icon: Users, text: "Weekly Sync: Time for a partner review?" };
    if (day === 0) return { icon: Target, text: "Sunday Strategy: Review your goals for the week." };
    if (hour < 10) return { icon: Zap, text: "Morning Check: Review yesterday's transactions." };
    if (hour > 20) return { icon: Moon, text: "Nightly Reflection: How balanced was today's spending?" };
    return { icon: ShieldCheck, text: "System Check: Sustainability looks healthy today." };
}

function ConfirmationModal({ isOpen, message, onConfirm, onCancel }) {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-title">Confirm Action</div>
                <div className="modal-text">{message}</div>
                <div className="modal-actions">
                    <button className="btn-modal btn-cancel" onClick={onCancel}>Cancel</button>
                    <button className="btn-modal btn-confirm" onClick={onConfirm}>Delete</button>
                </div>
            </div>
        </div>
    );
}

// Simple hash function for PIN (not cryptographically secure, but sufficient for client-side gating)
const hashPin = (pin) => {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
        const char = pin.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
};

function SetupPin({ onComplete }) {
    const [pin, setPin] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (pin.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }
        if (pin !== confirm) {
            setError('PINs do not match');
            return;
        }
        localStorage.setItem('ultra_pin_hash', hashPin(pin));
        sessionStorage.setItem('ultra_unlocked', 'true');
        onComplete();
    };

    return (
        <div className="lock-screen">
            <div className="lock-card">
                <div className="lock-icon">🔐</div>
                <div className="lock-title">Create Your PIN</div>
                <div className="lock-subtitle">Secure your budget dashboard</div>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 4-6 digit PIN"
                        autoFocus
                        maxLength={6}
                        className="lock-input"
                    />
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))}
                        placeholder="Confirm PIN"
                        maxLength={6}
                        className="lock-input"
                    />
                    {error && <div className="lock-error">{error}</div>}
                    <button type="submit" className="lock-btn">Set PIN</button>
                </form>
            </div>
        </div>
    );
}

function LockScreen({ onUnlock }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);

    const handleSubmit = (e) => {
        e.preventDefault();
        const storedHash = localStorage.getItem('ultra_pin_hash');
        if (hashPin(pin) === storedHash) {
            sessionStorage.setItem('ultra_unlocked', 'true');
            onUnlock();
        } else {
            setAttempts(a => a + 1);
            setError(`Incorrect PIN${attempts >= 2 ? ` (${attempts + 1} attempts)` : ''}`);
            setPin('');
        }
    };

    return (
        <div className="lock-screen">
            <div className="lock-card">
                <div className="lock-icon">🔒</div>
                <div className="lock-title">Ultra Budget</div>
                <div className="lock-subtitle">Enter PIN to unlock</div>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter PIN"
                        autoFocus
                        maxLength={6}
                        className="lock-input"
                    />
                    {error && <div className="lock-error">{error}</div>}
                    <button type="submit" className="lock-btn">Unlock</button>
                </form>
            </div>
        </div>
    );
}


export default function App() {

    const [page, setPage] = useState('dashboard');
    // chartMode removed
    const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expenses'
    const [filterCategory, setFilterCategory] = useState('all'); // 'all' or specific category name
    const [isSyncing, setIsSyncing] = useState(false);
    const [transactions, setTransactions] = useState(PLACEHOLDER_TXS);

    // Lock Screen State
    const [needsSetup, setNeedsSetup] = useState(() => !localStorage.getItem('ultra_pin_hash'));
    const [isLocked, setIsLocked] = useState(() => sessionStorage.getItem('ultra_unlocked') !== 'true');

    // Modal State - MUST be before any conditional returns (React hooks rule)
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null });
    const [data, setData] = useState(() => {
        const saved = localStorage.getItem('ultra_budget_v4');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Migrations / Defaults for new features
            if (!parsed.selectedMonth) parsed.selectedMonth = MONTHS[CURRENT_MONTH_INDEX];
            if (!parsed.selectedYear) parsed.selectedYear = new Date().getFullYear();
            if (!parsed.personalBalance) parsed.personalBalance = 5200;
            if (!parsed.bizBalance) parsed.bizBalance = 28500;
            if (!parsed.goals) parsed.goals = INITIAL_STATE.goals;
            if (parsed.streak === undefined) parsed.streak = 0;
            if (!parsed.lastCheckIn) parsed.lastCheckIn = '';
            return parsed;
        }
        return INITIAL_STATE;
    });

    useEffect(() => {
        localStorage.setItem('ultra_budget_v4', JSON.stringify(data));

        // Streak logic
        const today = new Date().toISOString().split('T')[0];
        if (data.lastCheckIn !== today) {
            const last = new Date(data.lastCheckIn);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            let newStreak = 1;
            if (data.lastCheckIn === yesterdayStr) {
                newStreak = (data.streak || 0) + 1;
            }

            setData(prev => ({
                ...prev,
                lastCheckIn: today,
                streak: newStreak
            }));
        }
    }, [data]);



    const currentBizKey = `${data.selectedYear}-${data.selectedMonth}`;
    const currentBiz = data.monthlyBiz[currentBizKey] || { revenue: 0, expenses: 0 };
    const profit = currentBiz.revenue - currentBiz.expenses;
    const sustainability = profit > 500 ? (data.salary / profit) * 100 : 0;
    const isHealthy = profit > 500 && sustainability <= 100;
    const isEarlyData = profit <= 500;

    const insight = getInsight(profit, sustainability, QUARTILE, data.salary);

    const totalPersonal = useMemo(() => data.groups.reduce((a, g) => a + g.items.reduce((s, i) => s + i.amount, 0), 0), [data.groups]);

    const isBonusEligible = data.bizBalance >= BIZ_SAFETY_BASELINE && profit > data.salary * 1.5;
    const potentialBonus = isBonusEligible ? Math.floor((profit - data.salary) * 0.5) : 0;

    const dailyPrompt = getDailyPrompt();

    // Actual spending breakdown by group
    const actualSpend = useMemo(() => {
        const groups = [0, 0, 0]; // wealth, fixed, variable
        transactions.forEach(tx => {
            if (tx.amount < 0) {
                const abs = Math.abs(tx.amount);
                if (tx.category === 'Dining' || tx.category === 'Shopping' || tx.category === 'Groceries' || tx.category === 'Food') groups[2] += abs;
                else if (tx.category === 'Home' || tx.category === 'Utilities' || tx.category === 'Auto' || tx.category === 'Bills') groups[1] += abs;
            }
        });
        const total = groups.reduce((a, b) => a + b, 0);
        return { groups, total };
    }, [transactions]);

    // Transaction filtering (must be before gating)
    const uniqueCategories = useMemo(() => {
        const cats = [...new Set(transactions.map(tx => tx.category))].filter(c => c !== 'Income');
        return cats.sort();
    }, [transactions]);

    const filteredTxs = useMemo(() => {
        let txs = transactions;
        // Filter by type
        if (filterType === 'income') txs = txs.filter(tx => tx.amount > 0);
        else if (filterType === 'expenses') txs = txs.filter(tx => tx.amount < 0);
        // Filter by category
        if (filterCategory !== 'all') txs = txs.filter(tx => tx.category === filterCategory);
        return txs;
    }, [transactions, filterType, filterCategory]);

    // Gate the app behind PIN - AFTER all hooks are defined
    if (needsSetup) {
        return <SetupPin onComplete={() => { setNeedsSetup(false); setIsLocked(false); }} />;
    }
    if (isLocked) {
        return <LockScreen onUnlock={() => setIsLocked(false)} />;
    }


    const requestConfirm = (message, action) => {
        setConfirmModal({
            isOpen: true,
            message,
            onConfirm: () => {
                action();
                setConfirmModal({ isOpen: false, message: '', onConfirm: null });
            }
        });
    };

    const updateField = (f, v) => setData(p => ({ ...p, [f]: Number(v) || 0 }));
    const selectMonth = (m) => setData(p => ({ ...p, selectedMonth: m }));

    const toggleGroup = (id) => setData(p => ({ ...p, groups: p.groups.map(g => g.id === id ? { ...g, collapsed: !g.collapsed } : g) }));
    const addItem = (gid) => setData(p => ({ ...p, groups: p.groups.map(g => g.id === gid ? { ...g, items: [...g.items, { id: Date.now().toString(), name: 'New Item', amount: 0 }] } : g) }));

    const deleteItem = (gid, iid) => requestConfirm('Are you sure you want to delete this item?', () =>
        setData(p => ({ ...p, groups: p.groups.map(g => g.id === gid ? { ...g, items: g.items.filter(i => i.id !== iid) } : g) }))
    );

    const updateItem = (gid, iid, f, v) => setData(p => ({ ...p, groups: p.groups.map(g => g.id === gid ? { ...g, items: g.items.map(i => i.id === iid ? { ...i, [f]: f === 'amount' ? (Number(v) || 0) : v } : i) } : g) }));
    const addGroup = (type) => setData(p => ({ ...p, groups: [...p.groups, { id: Date.now().toString(), name: 'New ' + type, color: type === 'wealth' ? '#C8FF00' : type === 'fixed' ? '#5B7FFF' : '#2DD4BF', collapsed: false, items: [] }] }));

    const deleteGroup = (id) => requestConfirm('Are you sure you want to delete this group and all its items?', () =>
        setData(p => ({ ...p, groups: p.groups.filter(g => g.id !== id) }))
    );

    const updateGroup = (id, f, v) => setData(p => ({ ...p, groups: p.groups.map(g => g.id === id ? { ...g, [f]: v } : g) }));

    const updateGoal = (id, f, v) => setData(p => ({ ...p, goals: p.goals.map(g => g.id === id ? { ...g, [f]: f === 'name' ? v : (Number(v) || 0) } : g) }));
    const updateGoalContribution = (gid, m, v) => setData(p => ({ ...p, goals: p.goals.map(g => g.id === gid ? { ...g, monthlyContributions: { ...g.monthlyContributions, [m]: (Number(v) || 0) } } : g) }));
    const addGoal = () => setData(p => ({ ...p, goals: [...p.goals, { id: Date.now().toString(), name: 'New Goal', target: 0, startingBalance: 0, monthlyContributions: {} }] }));

    const deleteGoal = (id) => requestConfirm('Are you sure you want to delete this goal?', () =>
        setData(p => ({ ...p, goals: p.goals.filter(g => g.id !== id) }))
    );

    const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
    const pct = (a) => data.salary > 0 ? ((a / data.salary) * 100).toFixed(0) : 0;


    const syncLunchMoneyData = async () => {



        setIsSyncing(true);
        try {
            const year = data.selectedYear;
            const monthIndex = MONTHS.indexOf(data.selectedMonth);
            const start = new Date(year, monthIndex, 1).toISOString().split('T')[0];
            const end = new Date(year, monthIndex + 1, 0).toISOString().split('T')[0];

            // Fetch both transactions and account balances
            const [txResponse, balanceResponse] = await Promise.all([
                fetch(`/api/lunch-money?start_date=${start}&end_date=${end}`, {
                    headers: { 'x-ultra-secret': 'ultra-budget-2024-secure' }
                }),
                fetch('/api/lunch-money-balances', {
                    headers: { 'x-ultra-secret': 'ultra-budget-2024-secure' }
                })
            ]);

            const txJson = await txResponse.json();
            const balanceJson = await balanceResponse.json();

            // Update transactions
            if (txJson.transactions) {
                const mapped = txJson.transactions.map(t => ({
                    id: t.id,
                    name: t.payee,
                    category: t.category_name || 'Uncategorized',
                    amount: Number(t.amount),
                    date: t.date,
                    account_name: t.account_name || 'Unknown',
                    icon: t.amount > 0 ? CreditCard : Receipt
                }));
                setTransactions(mapped);

                // Calculate business revenue (Checking only to avoid CC payments counting as income)
                const bizChecking = txJson.transactions.filter(t => t.account_name === 'Business Checking');
                const bizRevenue = bizChecking
                    .filter(t => Number(t.amount) > 0)
                    .reduce((sum, t) => sum + Number(t.amount), 0);

                // Calculate business expenses (Checking + Credit Card)
                const expenseAccounts = ['Business Checking', 'Business CC'];
                const expenseTransactions = txJson.transactions.filter(t => expenseAccounts.includes(t.account_name));
                const bizExpenses = expenseTransactions
                    .filter(t => Number(t.amount) < 0)
                    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

                // Update monthly business data
                // Update monthly business data
                setData(prev => ({
                    ...prev,
                    monthlyBiz: {
                        ...prev.monthlyBiz,
                        [`${prev.selectedYear}-${prev.selectedMonth}`]: {
                            revenue: bizRevenue,
                            expenses: bizExpenses
                        }
                    }
                }));
            }

            // Update account balances
            if (balanceJson.accounts) {
                const businessAccount = balanceJson.accounts.find(acc => acc.name === 'Business Checking');
                const personalAccount = balanceJson.accounts.find(acc => acc.name === 'Personal Checking');

                setData(prev => ({
                    ...prev,
                    bizBalance: businessAccount ? businessAccount.balance : prev.bizBalance,
                    personalBalance: personalAccount ? personalAccount.balance : prev.personalBalance
                }));
            }
        } catch (e) {
            console.error('Sync failed', e);
        } finally {
            setIsSyncing(false);
        }
    };

    const syncCategories = async () => {
        setIsSyncing(true);
        try {
            const response = await fetch('/api/lunch-money-categories', {
                headers: { 'x-ultra-secret': 'ultra-budget-2024-secure' }
            });

            if (!response.ok) throw new Error('Category sync failed');

            const json = await response.json();

            if (json.categories) {
                // Auto-map categories to groups using keywords
                const autoMap = (categoryName) => {
                    const name = categoryName.toLowerCase();
                    // Wealth keywords
                    if (name.includes('saving') || name.includes('invest') || name.includes('retirement') ||
                        name.includes('401k') || name.includes('ira') || name.includes('stock')) {
                        return 'wealth';
                    }
                    // Fixed keywords
                    if (name.includes('rent') || name.includes('mortgage') || name.includes('utilit') ||
                        name.includes('insurance') || name.includes('loan') || name.includes('subscript')) {
                        return 'fixed';
                    }
                    // Default to variable
                    return 'variable';
                };

                // Create new groups structure
                const newGroups = [
                    { id: 'wealth', name: 'Wealth Building', color: '#C8FF00', collapsed: false, items: [] },
                    { id: 'fixed', name: 'Fixed Expenses', color: '#5B7FFF', collapsed: false, items: [] },
                    { id: 'variable', name: 'Variable Spending', color: '#2DD4BF', collapsed: false, items: [] }
                ];

                // Populate groups with categories
                json.categories.forEach(cat => {
                    const groupId = autoMap(cat.name);
                    const group = newGroups.find(g => g.id === groupId);
                    if (group) {
                        group.items.push({
                            id: cat.id.toString(),
                            name: cat.name,
                            amount: 0 // User will set budgets manually
                        });
                    }
                });

                // Update state
                setData(prev => ({ ...prev, groups: newGroups }));
                alert(`✅ Synced ${json.categories.length} categories from Lunch Money!`);
            }
        } catch (e) {
            console.error('Category sync failed', e);
            alert('Category sync failed. Make sure your API key is set in Vercel.');
        } finally {
            setIsSyncing(false);
        }
    };


    // Swipe Navigation Logic
    const swipeHandlers = useSwipe({
        onSwipeLeft: () => {
            const currentIndex = PAGE_ORDER.indexOf(page);
            if (currentIndex < PAGE_ORDER.length - 1) {
                setPage(PAGE_ORDER[currentIndex + 1]);
            }
        },
        onSwipeRight: () => {
            const currentIndex = PAGE_ORDER.indexOf(page);
            if (currentIndex > 0) {
                setPage(PAGE_ORDER[currentIndex - 1]);
            }
        }
    });

    return (
        <>
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: null })}
            />
            <div className="app-container" {...swipeHandlers}>
                {page === 'dashboard' ? (
                    <>
                        {/* Streak Tracker */}
                        <div className="flex items-center justify-between mb-2" style={{ padding: '0 4px' }}>
                            <div className="flex items-center gap-2">
                                <CalendarCheck size={14} className="text-teal" />
                                <span style={{ fontSize: 11, fontWeight: 600 }}>Daily Check-in</span>
                            </div>
                            <div className="streak-row">
                                {[...Array(7)].map((_, i) => (
                                    <div key={i} className={`streak-pill ${i < (data.streak % 8) ? 'active' : ''}`} />
                                ))}
                                <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 4, color: 'var(--accent-teal)' }}>{data.streak} DAY STREAK</span>
                            </div>
                        </div>

                        {/* Account Section */}
                        <div className="account-section">
                            <div className="account-section-title">Account Balances</div>
                            <div className="account-grid">
                                <div className="account-card">
                                    <div className="account-label"><Wallet size={10} className="text-blue" /> Personal</div>
                                    <div className="input-inline account-value" style={{ border: 'none', background: 'transparent', padding: 0 }}>{fmt(data.personalBalance)}</div>
                                </div>
                                <div className="account-card">
                                    <div className="account-label"><Building2 size={10} className="text-green" /> Business</div>
                                    <div className="input-inline account-value text-green" style={{ border: 'none', background: 'transparent', padding: 0 }}>{fmt(data.bizBalance)}</div>
                                </div>
                            </div>
                        </div>


                        {/* Month Pills */}
                        <div className="month-pills">
                            <button className="month-pill year-pill" style={{ background: 'var(--accent)', color: '#000', fontWeight: 700 }} onClick={() => setData(p => ({ ...p, selectedYear: p.selectedYear === new Date().getFullYear() ? new Date().getFullYear() - 1 : new Date().getFullYear() }))}>{data.selectedYear}</button>
                            {MONTHS.map(m => <button key={m} className={`month-pill ${data.selectedMonth === m ? 'active' : ''}`} onClick={() => selectMonth(m)}>{m}</button>)}
                        </div>

                        {/* Sustainability + Insight */}
                        <div className="bento-grid mb-3">
                            <div className="card" style={{ marginBottom: 0 }}>
                                <div className="card-header">
                                    <span className="card-title">Sustainability</span>
                                    {!isEarlyData && <div className="btn-icon" style={{ width: 22, height: 22 }}>{isHealthy ? <TrendingUp size={12} className="text-green" /> : <TrendingDown size={12} className="text-amber" />}</div>}
                                </div>
                                <div className={`stat-hero ${isEarlyData ? 'text-secondary' : isHealthy ? 'text-green' : 'text-amber'}`}>
                                    {isEarlyData ? '—' : `${Math.min(sustainability, 999).toFixed(0)}%`}
                                </div>
                                <div className="progress-container mt-2">
                                    <div className={`progress-fill ${isHealthy ? 'bg-green' : 'bg-teal'}`} style={{ width: isEarlyData ? '0%' : `${Math.min(sustainability, 100)}%`, background: isHealthy ? 'var(--accent-green)' : 'var(--accent-amber)' }} />
                                </div>
                            </div>
                            <div className="card insight-card" style={{ marginBottom: 0 }}>
                                <div className="card-header">
                                    <span className="card-title">Q{QUARTILE} Insight</span>
                                    <Lightbulb size={12} className="text-purple" />
                                </div>
                                <p style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{insight.emoji} {insight.text}</p>
                            </div>
                        </div>

                        {/* Bonus Banner */}
                        {isBonusEligible && (
                            <div className="bonus-banner">
                                <Sparkles size={16} className="text-accent" />
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 600 }}>Bonus Eligible</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{fmt(potentialBonus)} for wealth distribution</div>
                                </div>
                            </div>
                        )}

                        {/* Salary + Profit */}
                        <div className="bento-grid mb-1">
                            <div className="card" style={{ marginBottom: 0 }}>
                                <span className="card-title">Salary Draw</span>
                                <input type="number" className="input-inline stat-medium mt-2" value={data.salary} onChange={(e) => updateField('salary', e.target.value)} />
                            </div>
                            <div className="card" style={{ marginBottom: 0 }}>
                                <span className="card-title">Biz Profit • {data.selectedMonth}</span>
                                <div className={`stat-medium mt-2 ${profit >= 0 ? 'text-green' : 'text-red'}`}>{fmt(profit)}</div>
                            </div>
                        </div>

                        {/* Daily Task Prompt */}
                        <div className="prompt-card mb-3">
                            <dailyPrompt.icon size={14} className="text-teal" />
                            <span style={{ fontSize: 11, fontWeight: 500 }}>{dailyPrompt.text}</span>
                        </div>

                        {/* Spending Pie Chart */}
                        <div className="card mb-3">
                            <div className="card-header">
                                <span className="card-title">Spending Breakdown</span>
                            </div>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                <div className="pie-chart" style={{
                                    background: `conic-gradient(
                                        ${data.groups[0]?.color || '#C8FF00'} 0% ${pct(data.groups[0]?.items.reduce((s, i) => s + i.amount, 0) || 0)}%,
                                        ${data.groups[1]?.color || '#5B7FFF'} ${pct(data.groups[0]?.items.reduce((s, i) => s + i.amount, 0) || 0)}% ${pct((data.groups[0]?.items.reduce((s, i) => s + i.amount, 0) || 0) + (data.groups[1]?.items.reduce((s, i) => s + i.amount, 0) || 0))}%,
                                        ${data.groups[2]?.color || '#2DD4BF'} ${pct((data.groups[0]?.items.reduce((s, i) => s + i.amount, 0) || 0) + (data.groups[1]?.items.reduce((s, i) => s + i.amount, 0) || 0))}% 100%
                                    )`
                                }} />
                                <div style={{ flex: 1 }}>
                                    {data.groups.map(g => {
                                        const gVal = g.items.reduce((s, i) => s + i.amount, 0);
                                        const gPct = pct(gVal);

                                        return (
                                            <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 10, height: 10, borderRadius: 2, background: g.color }} />
                                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{g.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{gPct}%</span>
                                                    <span style={{ fontSize: 11, fontWeight: 600 }}>{fmt(gVal)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Warnings/Tips Card */}
                        {(() => {
                            if (isEarlyData) return null;
                            if (sustainability > 100) {
                                return (
                                    <div className="warning-card warning mb-3">
                                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>⚠️ Overspending</div>
                                        <div style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                                            Your salary ({fmt(data.salary)}) exceeds profit ({fmt(profit)}). Consider reducing allocations or increasing revenue.
                                        </div>
                                    </div>
                                );
                            }
                            if (totalPersonal > data.salary) {
                                return (
                                    <div className="warning-card warning mb-3">
                                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>⚠️ Over-Allocated</div>
                                        <div style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                                            Allocations ({fmt(totalPersonal)}) exceed salary ({fmt(data.salary)}). Adjust on the Budget page.
                                        </div>
                                    </div>
                                );
                            }
                            if (sustainability >= 80 && sustainability <= 100) {
                                return (
                                    <div className="warning-card caution mb-3">
                                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>⚡ Close to Limit</div>
                                        <div style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                                            You're at {sustainability.toFixed(0)}% sustainability. Small increases in spending could push you over.
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div className="warning-card tip mb-3">
                                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>💡 Healthy Position</div>
                                    <div style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                                        Your spending is sustainable at {sustainability.toFixed(0)}%. {data.bizBalance >= BIZ_SAFETY_BASELINE && 'Business reserve is strong.'}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Goal Pulse (Moved to Bottom) */}
                        {data.goals.length > 0 && (
                            <div className="goal-pulse-section">
                                <div className="section-header-compact">
                                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Goal Pulse</span>
                                </div>
                                <div className="goal-pulse-grid">
                                    {data.goals.map((g, idx) => {
                                        const totalContributed = Object.values(g.monthlyContributions || {}).reduce((a, b) => a + b, 0);
                                        const totalSaved = (g.startingBalance || 0) + totalContributed;
                                        const progress = g.target > 0 ? (totalSaved / g.target) * 100 : 0;

                                        // Logic: only full width if unpaired (odd total, 1st one)
                                        const isFullWidth = (data.goals.length % 2 !== 0 && idx === 0);

                                        return (
                                            <div key={g.id} className={`goal-pulse-card ${isFullWidth ? 'full' : 'half'}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="goal-pulse-name">{g.name}</span>
                                                    <span className="goal-pulse-pct">{progress.toFixed(0)}%</span>
                                                </div>
                                                <div className="progress-container" style={{ height: 4, background: 'rgba(255,255,255,0.05)' }}>
                                                    <div className="progress-fill bg-teal" style={{ width: `${Math.min(progress, 100)}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                ) : page === 'budget' ? (
                    /* Budget Page */
                    <>
                        <div className="mb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Budget & Allocations</h1>
                                <p className="text-secondary" style={{ fontSize: 11 }}>Track business finances and salary allocations</p>
                            </div>
                            <button
                                onClick={syncCategories}
                                disabled={isSyncing}
                                style={{
                                    padding: '8px 12px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    background: '#C8FF00',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: isSyncing ? 'not-allowed' : 'pointer',
                                    opacity: isSyncing ? 0.5 : 1
                                }}
                            >
                                {isSyncing ? 'Syncing...' : 'Sync Categories'}
                            </button>
                        </div>

                        {/* Month Pills */}
                        <div className="month-pills">
                            {MONTHS.map(m => <button key={m} className={`month-pill ${data.selectedMonth === m ? 'active' : ''}`} onClick={() => selectMonth(m)}>{m}</button>)}
                        </div>

                        {/* Salary Input */}
                        <div className="card mb-3">
                            <span className="card-title">Salary Draw</span>
                            <input type="number" className="input-inline stat-medium mt-2" value={data.salary} onChange={(e) => updateField('salary', e.target.value)} />
                        </div>

                        {/* Business */}
                        <div className="card mb-3">
                            <div className="card-header"><span className="card-title">Business • {data.selectedMonth}</span></div>
                            <div className="bento-grid">
                                <div>
                                    <label className="text-secondary" style={{ fontSize: 9, textTransform: 'uppercase' }}>Revenue</label>
                                    <div className="input-field mt-2" style={{ display: 'flex', alignItems: 'center', height: 34, background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                        {fmt(currentBiz.revenue)}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-secondary" style={{ fontSize: 9, textTransform: 'uppercase' }}>Expenses</label>
                                    <div className="input-field mt-2" style={{ display: 'flex', alignItems: 'center', height: 34, background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                        {fmt(currentBiz.expenses)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Allocations */}
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-2" style={{ padding: '0 4px' }}>
                                <span className="card-title">Allocations</span>
                                <div className="flex items-center gap-2">
                                    <span className="group-percent">{pct(totalPersonal)}%</span>
                                    <span className="text-secondary" style={{ fontSize: 11, fontWeight: 600 }}>{fmt(totalPersonal)}</span>
                                </div>
                            </div>
                            {data.groups.map(g => {
                                const gTotal = g.items.reduce((s, i) => s + i.amount, 0);
                                return (
                                    <div key={g.id} className="group-card">
                                        <div className="group-header">
                                            <div className="group-name-row" style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                                <div className="group-indicator" style={{ background: g.color }} />
                                                <input className="input-inline group-name" style={{ fontWeight: 700, fontSize: 13 }} value={g.name} onChange={(e) => updateGroup(g.id, 'name', e.target.value)} />
                                            </div>
                                            <div className="group-meta" onClick={() => toggleGroup(g.id)} style={{ cursor: 'pointer' }}>
                                                <span className="group-percent">{pct(gTotal)}%</span>
                                                <span className="group-total">{fmt(gTotal)}</span>
                                                {g.collapsed ? <ChevronRight size={14} className="text-dim" /> : <ChevronDown size={14} className="text-dim" />}
                                            </div>

                                        </div>
                                        {!g.collapsed && (
                                            <div className="group-content">
                                                {g.items.map(i => (
                                                    <div key={i.id} className="item-row">
                                                        <input className="input-inline item-name" value={i.name} onChange={(e) => updateItem(g.id, i.id, 'name', e.target.value)} />
                                                        <div className="item-meta">
                                                            <span className="item-percent">{pct(i.amount)}%</span>
                                                            <div className="flex items-center"><span className="text-dim" style={{ fontSize: 10, marginRight: 2 }}>$</span>
                                                                <input type="number" className="input-inline item-amount" style={{ width: 55, textAlign: 'right' }} value={i.amount} onChange={(e) => updateItem(g.id, i.id, 'amount', e.target.value)} />
                                                            </div>
                                                        </div>
                                                        <button className="btn-icon btn-delete" style={{ width: 24, height: 24 }} onClick={() => deleteItem(g.id, i.id)}><Trash2 size={11} /></button>
                                                    </div>
                                                ))}
                                                <button className="add-item-btn" onClick={() => addItem(g.id)}><Plus size={11} /> Add Item</button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                        </div>

                        {/* Financial Goals */}
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-2" style={{ padding: '0 4px' }}>
                                <span className="card-title">Financial Goals</span>
                            </div>

                            {data.goals.map(g => {
                                const totalContributed = Object.values(g.monthlyContributions || {}).reduce((a, b) => a + b, 0);
                                const totalSaved = g.startingBalance + totalContributed;
                                const progress = g.target > 0 ? (totalSaved / g.target) * 100 : 0;
                                const currentContribution = g.monthlyContributions?.[data.selectedMonth] || 0;
                                const remaining = Math.max(0, g.target - totalSaved);
                                const monthsToGoal = (remaining > 0 && currentContribution > 0) ? Math.ceil(remaining / currentContribution) : null;

                                return (
                                    <div key={g.id} className="card mb-2" style={{ borderLeft: '3px solid var(--accent-teal)' }}>
                                        <div className="flex justify-between items-start mb-2">
                                            <input className="input-inline" style={{ fontWeight: 600, fontSize: 13, width: '150px' }} value={g.name} onChange={(e) => updateGoal(g.id, 'name', e.target.value)} />
                                            <button className="btn-icon btn-delete" onClick={() => deleteGoal(g.id)}><Trash2 size={11} /></button>
                                        </div>

                                        <div className="bento-grid mb-2">
                                            <div>
                                                <label className="text-secondary" style={{ fontSize: 9, textTransform: 'uppercase' }}>Target</label>
                                                <div className="flex items-center mt-1">
                                                    <span className="text-dim" style={{ fontSize: 10, marginRight: 2 }}>$</span>
                                                    <input type="number" className="input-inline" style={{ fontSize: 12, width: 60 }} value={g.target} onChange={(e) => updateGoal(g.id, 'target', e.target.value)} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-secondary" style={{ fontSize: 9, textTransform: 'uppercase' }}>Start Bal</label>
                                                <div className="flex items-center mt-1">
                                                    <span className="text-dim" style={{ fontSize: 10, marginRight: 2 }}>$</span>
                                                    <input type="number" className="input-inline" style={{ fontSize: 12, width: 60 }} value={g.startingBalance} onChange={(e) => updateGoal(g.id, 'startingBalance', e.target.value)} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-secondary" style={{ fontSize: 9, textTransform: 'uppercase' }}>{data.selectedMonth} Contrib</label>
                                                <div className="flex items-center mt-1">
                                                    <span className="text-dim" style={{ fontSize: 10, marginRight: 2 }}>$</span>
                                                    <input type="number" className="input-inline text-teal" style={{ fontSize: 12, width: 60, fontWeight: 700 }} value={currentContribution} onChange={(e) => updateGoalContribution(g.id, data.selectedMonth, e.target.value)} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="progress-container mb-2" style={{ height: 6 }}>
                                            <div className="progress-fill bg-teal" style={{ width: `${Math.min(progress, 100)}%` }} />
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                                                {fmt(totalSaved)} of {fmt(g.target)} ({progress.toFixed(0)}%)
                                            </span>
                                            {monthsToGoal !== null && (
                                                <span className="text-teal" style={{ fontSize: 10, fontWeight: 600 }}>
                                                    {monthsToGoal} months left
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <button className="add-item-btn" onClick={addGoal}><Plus size={11} /> Add Goal</button>
                        </div>
                    </>
                ) : page === 'transactions' ? (
                    /* Transactions Page */
                    <>
                        <div className="flex items-center justify-between mb-3">
                            <h1 style={{ fontSize: 18, fontWeight: 700 }}>Transactions</h1>
                            <button className={`sync-btn ${isSyncing ? 'syncing' : ''}`} onClick={syncLunchMoneyData} disabled={isSyncing}>
                                <Clock size={12} className={isSyncing ? 'spin' : ''} />
                                {isSyncing ? 'Syncing...' : 'Sync Lunch Money'}
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="mb-3">
                            <div className="filter-pills" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                <button className={`filter-pill ${filterType === 'all' ? 'active' : ''}`} onClick={() => { setFilterType('all'); setFilterCategory('all'); }}>All</button>
                                <button className={`filter-pill ${filterType === 'income' ? 'active' : ''}`} onClick={() => { setFilterType('income'); setFilterCategory('all'); }}>Income</button>
                                <button className={`filter-pill ${filterType === 'expenses' ? 'active' : ''}`} onClick={() => { setFilterType('expenses'); setFilterCategory('all'); }}>Expenses</button>

                                {filterType === 'expenses' && (
                                    <>
                                        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }}></div>
                                        <button
                                            className={`filter-pill ${filterCategory === 'all' ? 'active' : ''}`}
                                            onClick={() => setFilterCategory('all')}
                                        >
                                            All Categories
                                        </button>
                                        {uniqueCategories.map(cat => (
                                            <button
                                                key={cat}
                                                className={`filter-pill ${filterCategory === cat ? 'active' : ''}`}
                                                onClick={() => setFilterCategory(cat)}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Recent Activity</span>
                                <span className="text-dim" style={{ fontSize: 10 }}>({filteredTxs.length})</span>
                            </div>
                            <div className="tx-list">
                                {filteredTxs.map(tx => (
                                    <div key={tx.id} className="tx-item">
                                        <div className="tx-icon"><tx.icon size={16} className={tx.amount > 0 ? 'text-green' : 'text-secondary'} /></div>
                                        <div className="tx-details">
                                            <div className="tx-name">{tx.name}</div>
                                            <div className="tx-meta">{tx.category} • {tx.date}</div>
                                        </div>
                                        <div className={`tx-amount ${tx.amount > 0 ? 'income' : 'expense'}`}>
                                            {tx.amount > 0 ? '+' : ''}{fmt(tx.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Strategy Page */
                    <>
                        <div className="mb-3">
                            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Execution Strategy</h1>
                            <p className="text-secondary" style={{ fontSize: 11 }}>The system that makes the budget work</p>
                        </div>

                        {/* Daily Habit */}
                        <div className="card mb-3" style={{ borderLeft: '3px solid var(--accent-teal)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={14} className="text-teal" />
                                <span style={{ fontSize: 13, fontWeight: 600 }}>Daily: 2-Minute Check-in</span>
                            </div>
                            <p className="text-secondary" style={{ fontSize: 11, lineHeight: 1.6, marginBottom: 12 }}>
                                Every morning, open this app and glance at your sustainability %. No action required—just awareness. This single habit builds financial mindfulness.
                            </p>
                            <div style={{ background: 'var(--bg-input)', borderRadius: 12, padding: 12 }}>
                                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 8 }}>ASK YOURSELF:</div>
                                <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                                    ✓ Any new revenue to log?<br />
                                    ✓ Any surprise expenses?<br />
                                    ✓ Is today a spending day or earning day?
                                </div>
                            </div>
                        </div>

                        {/* Weekly Sync */}
                        <div className="card mb-3" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Users size={14} className="text-blue" />
                                <span style={{ fontSize: 13, fontWeight: 600 }}>Weekly: Partner Sync</span>
                            </div>
                            <p className="text-secondary" style={{ fontSize: 11, lineHeight: 1.6, marginBottom: 12 }}>
                                Every Sunday, 15 minutes with your wife. Share your screen. No blame—just facts and adjustments.
                            </p>
                            <div style={{ background: 'var(--bg-input)', borderRadius: 12, padding: 12 }}>
                                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 8 }}>AGENDA:</div>
                                <div style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                                    1. Show sustainability % and profit<br />
                                    2. Review variable spending together<br />
                                    3. Flag any big expenses coming up<br />
                                    4. Celebrate wins (even small ones)
                                </div>
                            </div>
                        </div>

                        {/* Monthly Goal */}
                        <div className="card mb-3" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Target size={14} className="text-accent" />
                                <span style={{ fontSize: 13, fontWeight: 600 }}>Monthly Goal</span>
                            </div>
                            <p className="text-secondary" style={{ fontSize: 11, lineHeight: 1.6, marginBottom: 12 }}>
                                Keep sustainability under 100%. When you hit a surplus month, distribute bonus to wealth accounts proportionally.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                                    <div style={{ fontSize: 18, fontWeight: 700 }} className="text-green">≤100%</div>
                                    <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>SUSTAINABILITY</div>
                                </div>
                                <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                                    <div style={{ fontSize: 18, fontWeight: 700 }} className="text-accent">$25k+</div>
                                    <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>BIZ RESERVE</div>
                                </div>
                            </div>
                        </div>

                        {/* Surplus Distribution Tool */}
                        {potentialBonus > 0 && (
                            <div className="card mb-3" style={{ background: 'rgba(200, 255, 0, 0.05)', border: '1px solid rgba(200, 255, 0, 0.2)' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles size={14} className="text-chart-wealth" />
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>Surplus Distribution</span>
                                </div>
                                <div className="mb-3">
                                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-wealth)' }}>{fmt(potentialBonus)}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>AVAILABLE TO DISTRIBUTE</div>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 12 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Suggested Split:</div>
                                    {data.goals.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {data.goals.slice(0, 2).map((g, i) => (
                                                <div key={g.id} className="flex justify-between items-center">
                                                    <span style={{ fontSize: 11 }}>{g.name}</span>
                                                    <span style={{ fontSize: 11, fontWeight: 700 }}>{fmt(potentialBonus * (i === 0 ? 0.7 : 0.3))}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Add goals in the Budget page to see suggested splits.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quick Rules */}
                        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.08), rgba(91, 127, 255, 0.05))', border: '1px solid rgba(45, 212, 191, 0.15)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 size={14} className="text-teal" />
                                <span style={{ fontSize: 13, fontWeight: 600 }}>The 3 Rules</span>
                            </div>
                            <div style={{ fontSize: 12, lineHeight: 1.9, color: 'var(--text-secondary)' }}>
                                <strong>1. Profit First.</strong> Pay yourself only from actual profit, not revenue.<br />
                                <strong>2. Buffer Before Bonus.</strong> Biz account stays above $25k before any extra distributions.<br />
                                <strong>3. Communicate, Dont Control.</strong> Your wife is your partner. Share data, discuss together, decide together.
                            </div>
                        </div>
                    </>
                )}
            </div >

            {/* Bottom Nav */}
            < nav className="bottom-nav" >
                <button className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>
                    <LayoutDashboard size={16} />
                    <span>Dashboard</span>
                </button>
                <button className={`nav-item ${page === 'budget' ? 'active' : ''}`} onClick={() => setPage('budget')}>
                    <DollarSign size={16} />
                    <span>Budget</span>
                </button>
                <button className={`nav-item ${page === 'transactions' ? 'active' : ''}`} onClick={() => setPage('transactions')}>
                    <Receipt size={16} />
                    <span>Transactions</span>
                </button>
                <button className={`nav-item ${page === 'strategy' ? 'active' : ''}`} onClick={() => setPage('strategy')}>
                    <Target size={16} />
                    <span>Strategy</span>
                </button>
            </nav >
        </>
    );
}

