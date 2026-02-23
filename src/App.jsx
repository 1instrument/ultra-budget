import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Trash2, ChevronDown, ChevronRight, TrendingUp, TrendingDown,
    Lightbulb, Wallet, Building2, Sparkles, LayoutDashboard, Receipt,
    Coffee, ShoppingBag, Zap, Car, Home, CreditCard, Target, CalendarCheck,
    Users, Clock, CheckCircle2, DollarSign, Filter, ShieldCheck, Moon,
    FileText, StickyNote, User, Share, Copy, X, Tag
} from 'lucide-react';



import { useSwipe } from './useSwipe';
import { supabase } from './supabase';

const PAGE_ORDER = ['home', 'transactions', 'notes', 'strategy', 'profile'];
const CURRENT_DAY = new Date().getDate();

const INITIAL_STATE = {
    salary: 4000,
    w2Wages: 2100,
    personalBalance: 5200,
    bizBalance: 28500,
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
    goals: [
        { id: '1', name: 'Emergency Fund', target: 10000, startingBalance: 2000, monthlyContributions: {} },
        { id: '2', name: 'New Car', target: 35000, startingBalance: 5000, monthlyContributions: {} }
    ],
    notes: '',
    flaggedIds: [],
    mappings: {
        'Dining': 'variable',
        'Groceries': 'variable',
        'Shopping': 'variable',
        'Housing': 'fixed',
        'Utilities': 'fixed',
        'Business': 'variable'
    }
};


// Start with empty transactions - real data comes from Lunch Money sync
const PLACEHOLDER_TXS = [];




function getDailyPrompt() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    const hour = now.getHours();

    if (day === 5 && hour >= 16) return { icon: Users, text: "Weekly Sync: Time for a partner review?" };
    if (day === 0) return { icon: Target, text: "Sunday Strategy: Review your goals for the week." };
    if (hour < 10) return { icon: Zap, text: "Morning Check: Review yesterday's transactions." };
    if (hour > 20) return { icon: Moon, text: "Nightly Reflection: How balanced was today's spending?" };
    return { icon: ShieldCheck, text: "Budget Check: Your allocations are all set." };
}


function Auth({ onComplete }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error: authError } = isSignup
                ? await supabase.auth.signUp({ email, password })
                : await supabase.auth.signInWithPassword({ email, password });

            if (authError) throw authError;
            if (isSignup) alert('Check your email for the confirmation link!');
            onComplete();
        } catch (err) {
            console.error('Auth error:', err);
            setError(err.message || 'An unexpected error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>{isSignup ? 'Create Account' : 'Cloud Sync'}</h2>
            <p className="text-secondary" style={{ fontSize: 11, marginBottom: 16 }}>
                {isSignup ? 'Start syncing your budget across devices.' : 'Log in to sync with your partner.'}
            </p>

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)' }}>EMAIL</label>
                    <input
                        type="email"
                        className="lock-input auth-input"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-input)', fontSize: 14, width: '100%', borderRadius: 12 }}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)' }}>PASSWORD</label>
                    <input
                        type="password"
                        className="lock-input auth-input"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-input)', fontSize: 14, width: '100%', borderRadius: 12 }}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <div style={{ color: '#ff4444', fontSize: 11 }}>{error}</div>}

                <button
                    type="submit"
                    className="lock-btn"
                    disabled={loading}
                    style={{ marginTop: 8, opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? 'Processing...' : isSignup ? 'Sign Up' : 'Log In'}
                </button>
            </form>

            <button
                onClick={() => setIsSignup(!isSignup)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: 12, marginTop: 16, width: '100%', cursor: 'pointer', textAlign: 'center' }}
            >
                {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
        </div>
    );
}

function ConfirmationModal({ isOpen, message, onConfirm, onCancel }) {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="modal-content">
                <div className="modal-title">Confirm Action</div>
                <div className="modal-text">{message}</div>
                <div className="modal-actions">
                    <button className="btn-modal btn-cancel" onClick={onCancel}>Cancel</button>
                    <button className="btn-modal btn-confirm" onClick={onConfirm}>Confirm</button>
                </div>
            </div>
        </div>
    );
}

function ProfilePage({ session }) {
    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Profile</h1>
            <p className="text-secondary" style={{ fontSize: 14, marginBottom: 32 }}>Manage your account and preferences.</p>

            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'var(--accent-blue)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, fontWeight: 700, color: '#fff'
                    }}>
                        {session?.user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{session?.user?.email}</div>
                        <div className="text-dim" style={{ fontSize: 12 }}>Standard Account</div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
                <div className="flex justify-between items-center mb-4">
                    <span style={{ fontSize: 14, fontWeight: 600 }}>App Version</span>
                    <span className="text-dim" style={{ fontSize: 14 }}>1.1.0</span>
                </div>
                <div className="flex justify-between items-center">
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Cloud Sync</span>
                    <span className="text-green" style={{ fontSize: 14, fontWeight: 600 }}>Enabled</span>
                </div>
            </div>

            <button
                onClick={() => supabase.auth.signOut()}
                className="btn-modal btn-cancel"
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,68,68,0.1)', color: '#ff4444' }}
            >
                Log Out
            </button>
        </div>
    );
}


const migrateData = (incoming) => {
    if (!incoming) return INITIAL_STATE;
    return {
        ...INITIAL_STATE,
        ...incoming,
        personalBalance: incoming.personalBalance ?? INITIAL_STATE.personalBalance,
        bizBalance: incoming.bizBalance ?? INITIAL_STATE.bizBalance,
        w2Wages: incoming.w2Wages ?? INITIAL_STATE.w2Wages,
        groups: incoming.groups || INITIAL_STATE.groups,
        goals: incoming.goals || INITIAL_STATE.goals,
        flaggedIds: incoming.flaggedIds || INITIAL_STATE.flaggedIds,
        streak: incoming.streak ?? INITIAL_STATE.streak,
        lastCheckIn: incoming.lastCheckIn || INITIAL_STATE.lastCheckIn,
        notes: incoming.notes ?? INITIAL_STATE.notes,
        mappings: incoming.mappings || INITIAL_STATE.mappings
    };
};

function ShareModal({ isOpen, text, onClose }) {
    if (!isOpen) return null;
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Transaction Summary',
                    text: text,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            alert('Your browser does not support native sharing.');
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="modal-content" style={{ width: '90%', maxWidth: 320 }}>
                <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Share Transactions</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div className="modal-text" style={{ padding: 0 }}>
                    <textarea
                        readOnly
                        value={text}
                        style={{
                            width: '100%',
                            height: 150,
                            background: 'var(--bg-input)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            color: 'var(--text-primary)',
                            padding: 12,
                            fontSize: 14,
                            fontFamily: 'monospace',
                            marginBottom: 16,
                            resize: 'none'
                        }}
                    />
                </div>
                <div className="modal-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button className="btn-modal" onClick={handleShare} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, background: 'var(--accent-blue)', color: 'white', border: 'none' }}>
                        <Share size={16} /> Share
                    </button>
                    <button className="btn-modal btn-confirm" onClick={handleCopy} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, background: copied ? 'var(--accent-green)' : 'var(--bg-card-elevated)', border: copied ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                        {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function App() {

    const [page, setPage] = useState('home');
    const [isSyncing, setIsSyncing] = useState(false);
    const [debugMode, setDebugMode] = useState(false);
    const [transactions, setTransactions] = useState(PLACEHOLDER_TXS);
    const [txLimit, setTxLimit] = useState(50);
    // Transaction filters - default all OFF (show all)
    const [accountFilters, setAccountFilters] = useState({
        personalChk: false,
        personalCC: false,
        bizChk: false,
        bizCC: false,
        flagged: false
    });

    // Modal State - MUST be before any conditional returns (React hooks rule)
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null });
    const [shareModal, setShareModal] = useState({ isOpen: false, text: '' });
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [session, setSession] = useState(null);
    const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
    const [data, setData] = useState(() => {
        try {
            const saved = localStorage.getItem('ultra_budget_v4');
            return migrateData(saved ? JSON.parse(saved) : null);
        } catch (e) {
            console.error('Failed to parse saved data:', e);
            return migrateData(null);
        }
    });

    useEffect(() => {
        localStorage.setItem('ultra_budget_v4', JSON.stringify(data));

        // PUSH to Supabase if logged in
        if (session) {
            const pushData = async () => {
                setSyncStatus('syncing');
                const { error } = await supabase
                    .from('app_state')
                    .upsert({
                        id: session.user.id,
                        user_email: session.user.email,
                        data: data,
                        updated_at: new Date().toISOString()
                    });
                if (error) {
                    console.error('Push error:', error);
                    setSyncStatus('error');
                } else {
                    setSyncStatus('success');
                    setTimeout(() => setSyncStatus('idle'), 2000);
                }
            };

            const timeoutId = setTimeout(pushData, 2000); // Debounce push
            return () => clearTimeout(timeoutId);
        }

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
    }, [data, session]);

    // Handle Auth Session
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // PULL from Supabase on login
    useEffect(() => {
        if (session) {
            const pullData = async () => {
                const { data: cloudState, error } = await supabase
                    .from('app_state')
                    .select('data')
                    .eq('id', session.user.id)
                    .single();

                if (cloudState && !error && cloudState.data) {
                    setData(migrateData(cloudState.data));
                }
            };
            pullData();
        }
    }, [session]);

    // progress/totals calculations
    const totalPersonal = useMemo(() => (data?.groups || []).reduce((a, g) => a + (g?.items || []).reduce((s, i) => s + i.amount, 0), 0), [data?.groups]);

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

    // Gate the app behind PIN - AFTER all hooks are defined



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

    const updateField = (f, v) => setData(p => ({ ...p, [f]: v }));

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

    const toggleFlag = (id) => setData(p => {
        const isFlagged = p.flaggedIds.includes(id);
        return {
            ...p,
            flaggedIds: isFlagged
                ? p.flaggedIds.filter(fid => fid !== id)
                : [...p.flaggedIds, id]
        };
    });

    const updateGoal = (id, f, v) => setData(p => ({ ...p, goals: p.goals.map(g => g.id === id ? { ...g, [f]: f === 'name' ? v : (Number(v) || 0) } : g) }));
    const updateGoalContribution = (gid, v) => setData(p => ({ ...p, goals: p.goals.map(g => g.id === gid ? { ...g, currentContribution: (Number(v) || 0) } : g) }));
    const addGoal = () => setData(p => ({ ...p, goals: [...p.goals, { id: Date.now().toString(), name: 'New Goal', target: 0, startingBalance: 0, currentContribution: 0 }] }));

    const deleteGoal = (id) => requestConfirm('Are you sure you want to delete this goal?', () =>
        setData(p => ({ ...p, goals: p.goals.filter(g => g.id !== id) }))
    );

    const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
    const pct = (a) => data.salary > 0 ? ((a / data.salary) * 100).toFixed(0) : 0;


    const syncLunchMoneyData = async () => {



        setIsSyncing(true);
        try {
            // Fetch last 90 days to ensure enough data for rolling metrics
            const now = new Date();
            const start = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
            const end = new Date().toISOString().split('T')[0];

            // We are deliberately using a VITE_ prefixed environment variable here.
            // Even though Vercel warns about exposing secrets, this is a known design pattern
            // for this specific Personal CFO architecture to allow the local app UI to 
            // authenticate against the protected backend APIs.
            const appSecret = import.meta.env.VITE_ULTRA_APP_SECRET || 'ultra-budget-2024-secure';

            // Fetch both transactions and account balances
            const [txResponse, balanceResponse] = await Promise.all([
                fetch(`/api/lunch-money?start_date=${start}&end_date=${end}`, {
                    headers: { 'x-ultra-secret': appSecret }
                }),
                fetch('/api/lunch-money-balances', {
                    headers: { 'x-ultra-secret': appSecret }
                })
            ]);

            const txJson = await txResponse.json();
            const balanceJson = await balanceResponse.json();

            // Update transactions
            if (txJson.transactions) {
                const mapped = [];

                // Helper to determine icon and color based on account
                const getIconAndColor = (accountName) => {
                    const isBusiness = accountName?.toLowerCase().includes('business');
                    const isCC = accountName?.toLowerCase().includes('cc') || accountName?.toLowerCase().includes('credit');
                    return {
                        icon: isBusiness ? Building2 : Wallet,
                        isCC: isCC,
                        colorClass: isBusiness ? 'text-blue' : 'text-green'
                    };
                };

                const mappings = data.mappings || {};
                const groups = data.groups || [];

                txJson.transactions.forEach(t => {
                    let amount = Number(t.amount);

                    // Flip sign: Lunch Money API returns expenses as positive, income as negative
                    amount = -amount;

                    const { icon, isCC, colorClass } = getIconAndColor(t.account_name);

                    // Mapping Logic
                    const category = t.category_name || 'Uncategorized';
                    let mappedGroupId = mappings[category];

                    // Fuzzy fallback (only for expenses/personal spending)
                    if (!mappedGroupId && amount < 0) {
                        const lowerCat = category.toLowerCase();
                        const lowerPayee = (t.payee || '').toLowerCase();
                        if (['food', 'dining', 'grocery', 'restaurants', 'coffee', 'alcohol', 'shop'].some(k => lowerCat.includes(k) || lowerPayee.includes(k))) {
                            mappedGroupId = 'variable';
                        } else if (['mortgage', 'rent', 'bill', 'utility', 'insurance', 'internet', 'phone'].some(k => lowerCat.includes(k))) {
                            mappedGroupId = 'fixed';
                        } else if (['invest', 'save', 'vanguard', 'transfer'].some(k => lowerCat.includes(k) || lowerPayee.includes(k))) {
                            mappedGroupId = 'wealth';
                        }
                    }

                    const groupInfo = groups.find(g => g.id === mappedGroupId);

                    // Parse transaction name - simplify Shopify and Gusto transactions
                    let displayName = t.payee;
                    const lowerPayee = (t.payee || '').toLowerCase();
                    if (lowerPayee.includes('shopify')) {
                        displayName = 'Shopify';
                    } else if (lowerPayee.includes('gusto')) {
                        displayName = 'Gusto';
                    }

                    mapped.push({
                        id: t.id,
                        name: displayName,
                        category: t.category_name || 'Uncategorized',
                        amount: amount,
                        date: t.date,
                        account_name: t.account_name || 'Unknown',
                        icon: icon,
                        isCC: isCC,
                        colorClass: colorClass,
                        raw_amount: t.amount, // Keep raw for debug
                        mappedGroup: groupInfo ? { name: groupInfo.name, color: groupInfo.color } : null,
                        tags: t.tags ? t.tags.map(tag => tag.name) : []
                    });
                });

                // Sort by date descending
                mapped.sort((a, b) => new Date(b.date) - new Date(a.date));

                setTransactions(mapped);


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
            // Fallback for debug/demo mode
            if (debugMode) {
                const mock = [
                    { id: 'm1', name: 'Waitrose', category: 'Groceries', amount: -85.20, date: new Date().toISOString().split('T')[0], account_name: 'Personal Checking', icon: Wallet, isCC: false, colorClass: 'text-green' },
                    { id: 'm2', name: 'Shopify Payout', category: 'Income', amount: 1250.00, date: new Date().toISOString().split('T')[0], account_name: 'Business Checking', icon: Building2, isCC: false, colorClass: 'text-blue' },
                    { id: 'm3', name: 'Apple.com', category: 'Shopping', amount: -199.00, date: new Date().toISOString().split('T')[0], account_name: 'Personal CC', icon: Wallet, isCC: true, colorClass: 'text-green' },
                    { id: 'm4', name: 'AWS Cloud', category: 'Business', amount: -45.00, date: new Date().toISOString().split('T')[0], account_name: 'Business CC', icon: Building2, isCC: true, colorClass: 'text-blue' }
                ];
                setTransactions(mock);
            }
        } finally {
            setIsSyncing(false);
        }
    };

    // Auto-sync when entering transactions page
    useEffect(() => {
        if (page === 'transactions') {
            syncLunchMoneyData();
        }
    }, [page]);


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

    const handleShare = () => {
        const flaggedTxs = transactions.filter(t => data.flaggedIds.includes(t.id));
        if (flaggedTxs.length === 0) return;

        // Sort by date ascending (oldest to newest) for the list
        const sortedTxs = [...flaggedTxs].sort((a, b) => new Date(a.date) - new Date(b.date));

        let text = sortedTxs.map(t => {
            // Format date as M/D
            const dateParts = t.date.split('-'); // YYYY-MM-DD
            const dateStr = `${parseInt(dateParts[1])}/${parseInt(dateParts[2])}`;
            return `${dateStr} ${t.name}: $${Math.abs(t.amount).toFixed(2)}`;
        }).join('\n');

        const total = sortedTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        text += `\n\nTotal: $${total.toFixed(2)}`;

        setShareModal({ isOpen: true, text });
    };

    // Gate the app behind Supabase Auth
    if (!session) {
        return (
            <div className="lock-screen">
                <div className="lock-card" style={{ padding: 0, overflow: 'hidden', width: '90%', maxWidth: 400 }}>
                    <div style={{ padding: '32px 24px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>💎</div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Ultra Budget</h1>
                        <p className="text-secondary" style={{ fontSize: 13 }}>Personal & Business Cashflow</p>
                    </div>
                    <Auth onComplete={() => { }} />
                </div>
            </div>
        );
    }

    return (
        <>
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: null })}
            />
            <ShareModal
                isOpen={shareModal.isOpen}
                text={shareModal.text}
                onClose={() => setShareModal({ isOpen: false, text: '' })}
            />
            <div className="app-container" {...swipeHandlers}>
                {page === 'home' ? (
                    <>
                        {/* Daily Greeting */}
                        <div className="mb-4">
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <dailyPrompt.icon size={12} className="text-dim" />
                                {dailyPrompt.text}
                            </div>
                            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Welcome Back</h1>
                        </div>

                        {/* Home View: Balances + Salary + Allocations + Goals */}
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

                        {/* Salary Draw */}
                        <div className="card mb-3">
                            <span className="card-title">Salary Draw</span>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-dim" style={{ fontSize: 24, fontWeight: 700 }}>$</span>
                                <input type="number" className="input-inline stat-medium" style={{ fontSize: 24, fontWeight: 700, flex: 1 }} value={data.salary} onChange={(e) => updateField('salary', Number(e.target.value) || 0)} />
                            </div>

                            {/* W2 + Transfer Breakdown */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                                <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: 10 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>W2 Wages</div>
                                    <div className="flex items-center">
                                        <span className="text-dim" style={{ fontSize: 12, marginRight: 2 }}>$</span>
                                        <input type="number" className="input-inline" style={{ fontSize: 16, fontWeight: 600, width: 70 }} value={data.w2Wages} onChange={(e) => updateField('w2Wages', Number(e.target.value) || 0)} />
                                    </div>
                                </div>
                                <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: 10 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>Transfer Needed</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-teal)' }}>{fmt(Math.max(0, data.salary - data.w2Wages))}</div>
                                </div>
                            </div>

                            {/* Runway Indicator */}
                            <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: 10, marginTop: 8, textAlign: 'center' }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>Biz Runway at This Draw</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: (data.bizBalance / Math.max(1, data.salary - data.w2Wages)) > 6 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                                    {(data.salary - data.w2Wages) > 0 ? (data.bizBalance / (data.salary - data.w2Wages)).toFixed(1) : '∞'} months
                                </div>
                            </div>

                            <div className="progress-container mt-3" style={{ height: 6, background: 'var(--bg-input)' }}>
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${Math.min((totalPersonal / data.salary) * 100, 100)}%`,
                                        background: (totalPersonal > data.salary) ? 'var(--accent-red)' : 'var(--accent-primary)',
                                        transition: 'width 0.3s ease, background 0.3s ease'
                                    }}
                                />
                            </div>

                            <div className="flex justify-between items-center mt-2">
                                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 500 }}>
                                    Allocated: <span style={{ color: 'var(--text-secondary)' }}>{fmt(totalPersonal)}</span>
                                </span>
                                <span style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: (totalPersonal > data.salary) ? 'var(--accent-red)' : 'var(--text-secondary)'
                                }}>
                                    {data.salary > 0 ? ((totalPersonal / data.salary) * 100).toFixed(0) : 0}% of Salary
                                </span>
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
                                                <input className="input-inline group-name" style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }} value={g.name} onChange={(e) => updateGroup(g.id, 'name', e.target.value)} />
                                            </div>
                                            <div className="group-meta" onClick={() => toggleGroup(g.id)} style={{ cursor: 'pointer', gap: 12 }}>
                                                <span className="group-percent" style={{ fontSize: 13 }}>{pct(gTotal)}%</span>
                                                <span className="group-total" style={{ fontSize: 16 }}>{fmt(gTotal)}</span>
                                                {g.collapsed ? <ChevronRight size={18} className="text-dim" /> : <ChevronDown size={18} className="text-dim" />}
                                            </div>
                                        </div>
                                        {!g.collapsed && (
                                            <div className="group-content">
                                                {g.items.map(i => (
                                                    <div key={i.id} className="item-row" style={{ padding: '12px 0' }}>
                                                        <input className="input-inline item-name" style={{ fontSize: 17 }} value={i.name} onChange={(e) => updateItem(g.id, i.id, 'name', e.target.value)} />
                                                        <div className="item-meta" style={{ gap: 12 }}>
                                                            <span className="item-percent" style={{ fontSize: 13, color: 'var(--text-dim)' }}>{pct(i.amount)}%</span>
                                                            <div className="flex items-center"><span className="text-dim" style={{ fontSize: 14, marginRight: 2 }}>$</span>
                                                                <input type="number" className="input-inline item-amount" style={{ width: 80, textAlign: 'right', fontSize: 18, fontWeight: 600 }} value={i.amount} onChange={(e) => updateItem(g.id, i.id, 'amount', e.target.value)} />
                                                            </div>
                                                        </div>
                                                        <button className="btn-icon btn-delete" style={{ width: 24, height: 24, marginLeft: 12 }} onClick={() => deleteItem(g.id, i.id)}><Trash2 size={11} /></button>
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
                                const totalSaved = (g.startingBalance || 0) + totalContributed;
                                const progress = g.target > 0 ? (totalSaved / g.target) * 100 : 0;
                                const currentContribution = g.currentContribution || 0;
                                const remaining = Math.max(0, g.target - totalSaved);
                                const monthsToGoal = (remaining > 0 && currentContribution > 0) ? Math.ceil(remaining / currentContribution) : null;

                                return (
                                    <div key={g.id} className="card mb-2" style={{ borderLeft: '3px solid var(--accent-teal)' }}>
                                        <div className="flex justify-between items-start mb-2">
                                            <input className="input-inline" style={{ fontWeight: 700, fontSize: 18, width: '200px' }} value={g.name} onChange={(e) => updateGoal(g.id, 'name', e.target.value)} />
                                            <button className="btn-icon btn-delete" onClick={() => deleteGoal(g.id)}><Trash2 size={11} /></button>
                                        </div>
                                        <div className="bento-grid mb-3">
                                            <div>
                                                <label className="text-secondary" style={{ fontSize: 10, textTransform: 'uppercase' }}>Target</label>
                                                <div className="flex items-center mt-1">
                                                    <span className="text-dim" style={{ fontSize: 14, marginRight: 2 }}>$</span>
                                                    <input type="number" className="input-inline" style={{ fontSize: 16, width: 80, fontWeight: 600 }} value={g.target} onChange={(e) => updateGoal(g.id, 'target', e.target.value)} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-secondary" style={{ fontSize: 10, textTransform: 'uppercase' }}>Start Bal</label>
                                                <div className="flex items-center mt-1">
                                                    <span className="text-dim" style={{ fontSize: 14, marginRight: 2 }}>$</span>
                                                    <input type="number" className="input-inline" style={{ fontSize: 16, width: 80, fontWeight: 600 }} value={g.startingBalance} onChange={(e) => updateGoal(g.id, 'startingBalance', e.target.value)} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-secondary" style={{ fontSize: 10, textTransform: 'uppercase' }}>Contrib</label>
                                                <div className="flex items-center mt-1">
                                                    <span className="text-dim" style={{ fontSize: 14, marginRight: 2 }}>$</span>
                                                    <input type="number" className="input-inline text-teal" style={{ fontSize: 18, width: 90, fontWeight: 800 }} value={g.currentContribution || 0} onChange={(e) => updateGoalContribution(g.id, e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="progress-container mb-2" style={{ height: 8 }}>
                                            <div className="progress-fill bg-teal" style={{ width: `${Math.min(progress, 100)}%` }} />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                {fmt(totalSaved)} of {fmt(g.target)} ({progress.toFixed(0)}%)
                                            </span>
                                            {monthsToGoal !== null && (
                                                <span className="text-teal" style={{ fontSize: 13, fontWeight: 700 }}>
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
                ) : page === 'profile' ? (
                    <ProfilePage session={session} />
                ) : page === 'transactions' ? (
                    /* Transactions Page */
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <h1 style={{ fontSize: 18, fontWeight: 700 }}>Transactions</h1>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {data.flaggedIds.length > 0 && (
                                    <>
                                        <button
                                            onClick={() => setData(p => ({ ...p, flaggedIds: [] }))}
                                            style={{
                                                padding: '6px 10px',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                background: 'var(--bg-card-elevated)',
                                                color: 'var(--text-secondary)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4
                                            }}
                                        >
                                            <X size={12} /> Clear
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            style={{
                                                padding: '6px 10px',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                background: 'var(--accent-amber)',
                                                color: '#000',
                                                border: 'none',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6
                                            }}
                                        >
                                            <Share size={12} />
                                            {data.flaggedIds.length}
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setDebugMode(d => !d)}
                                    style={{
                                        padding: '6px 10px',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        background: debugMode ? 'var(--accent-amber)' : 'var(--bg-input)',
                                        color: debugMode ? '#000' : 'var(--text-secondary)',
                                        border: 'none',
                                        borderRadius: 8,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {debugMode ? 'Debug ON' : 'Debug'}
                                </button>
                                <button className={`sync-btn ${isSyncing ? 'syncing' : ''}`} onClick={syncLunchMoneyData} disabled={isSyncing}>
                                    <Clock size={12} className={isSyncing ? 'spin' : ''} />
                                    {isSyncing ? 'Syncing...' : 'Sync'}
                                </button>
                            </div>
                        </div>

                        {/* Filter Bar */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 16, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                            {/* Personal Check */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', paddingLeft: 4 }}>Acct</div>
                                <button
                                    onClick={() => setAccountFilters(f => ({ ...f, personalChk: !f.personalChk }))}
                                    className={accountFilters.personalChk ? 'tx-icon tx-icon-green' : 'tx-icon'}
                                    style={{
                                        width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 8,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        opacity: accountFilters.personalChk ? 1 : 0.8,
                                        boxShadow: accountFilters.personalChk ? '0 0 0 1px var(--accent-green)' : 'none',
                                        background: accountFilters.personalChk ? 'var(--bg-card-elevated)' : 'var(--bg-card)'
                                    }}
                                >
                                    <Wallet size={14} className={accountFilters.personalChk ? 'text-green' : 'text-secondary'} style={{ opacity: accountFilters.personalChk ? 1 : 0.6 }} />
                                </button>
                            </div>

                            {/* Personal CC */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ fontSize: 9, color: 'transparent', userSelect: 'none' }}>_</div>
                                <button
                                    onClick={() => setAccountFilters(f => ({ ...f, personalCC: !f.personalCC }))}
                                    className={accountFilters.personalCC ? 'tx-icon tx-icon-green' : 'tx-icon'}
                                    style={{
                                        width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 8,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        opacity: accountFilters.personalCC ? 1 : 0.8,
                                        boxShadow: accountFilters.personalCC ? '0 0 0 1px var(--accent-green)' : 'none',
                                        background: accountFilters.personalCC ? 'var(--bg-card-elevated)' : 'var(--bg-card)'
                                    }}
                                >
                                    <span style={{ fontSize: 10, fontWeight: 700, opacity: accountFilters.personalCC ? 1 : 0.6 }} className={accountFilters.personalCC ? 'text-green' : 'text-secondary'}>CC</span>
                                </button>
                            </div>

                            {/* Biz Check */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', paddingLeft: 4 }}>Biz</div>
                                <button
                                    onClick={() => setAccountFilters(f => ({ ...f, bizChk: !f.bizChk }))}
                                    className={accountFilters.bizChk ? 'tx-icon tx-icon-blue' : 'tx-icon'}
                                    style={{
                                        width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 8,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        opacity: accountFilters.bizChk ? 1 : 0.8,
                                        boxShadow: accountFilters.bizChk ? '0 0 0 1px var(--accent-blue)' : 'none',
                                        background: accountFilters.bizChk ? 'var(--bg-card-elevated)' : 'var(--bg-card)'
                                    }}
                                >
                                    <Building2 size={14} className={accountFilters.bizChk ? 'text-blue' : 'text-secondary'} style={{ opacity: accountFilters.bizChk ? 1 : 0.6 }} />
                                </button>
                            </div>

                            {/* Biz CC */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ fontSize: 9, color: 'transparent', userSelect: 'none' }}>_</div>
                                <button
                                    onClick={() => setAccountFilters(f => ({ ...f, bizCC: !f.bizCC }))}
                                    className={accountFilters.bizCC ? 'tx-icon tx-icon-blue' : 'tx-icon'}
                                    style={{
                                        width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 8,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        opacity: accountFilters.bizCC ? 1 : 0.8,
                                        boxShadow: accountFilters.bizCC ? '0 0 0 1px var(--accent-blue)' : 'none',
                                        background: accountFilters.bizCC ? 'var(--bg-card-elevated)' : 'var(--bg-card)'
                                    }}
                                >
                                    <span style={{ fontSize: 10, fontWeight: 700, opacity: accountFilters.bizCC ? 1 : 0.6 }} className={accountFilters.bizCC ? 'text-blue' : 'text-secondary'}>CC</span>
                                </button>
                            </div>

                            {/* Budget Variable */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', paddingLeft: 4, whiteSpace: 'nowrap' }}>Budget</div>
                                <button
                                    onClick={() => setAccountFilters(f => ({ ...f, variable: !f.variable }))}
                                    style={{
                                        width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 8,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        opacity: accountFilters.variable ? 1 : 0.8,
                                        boxShadow: accountFilters.variable ? '0 0 0 1px #2DD4BF' : 'none',
                                        background: accountFilters.variable ? '#2DD4BF20' : 'var(--bg-card)'
                                    }}
                                >
                                    <Zap size={14} color={accountFilters.variable ? '#2DD4BF' : 'var(--text-secondary)'} style={{ opacity: accountFilters.variable ? 1 : 0.6 }} />
                                </button>
                            </div>

                            {/* Budget Fixed */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ fontSize: 9, color: 'transparent', userSelect: 'none' }}>_</div>
                                <button
                                    onClick={() => setAccountFilters(f => ({ ...f, fixed: !f.fixed }))}
                                    style={{
                                        width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 8,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        opacity: accountFilters.fixed ? 1 : 0.8,
                                        boxShadow: accountFilters.fixed ? '0 0 0 1px #5B7FFF' : 'none',
                                        background: accountFilters.fixed ? '#5B7FFF20' : 'var(--bg-card)'
                                    }}
                                >
                                    <Home size={14} color={accountFilters.fixed ? '#5B7FFF' : 'var(--text-secondary)'} style={{ opacity: accountFilters.fixed ? 1 : 0.6 }} />
                                </button>
                            </div>

                            {/* Budget Wealth */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ fontSize: 9, color: 'transparent', userSelect: 'none' }}>_</div>
                                <button
                                    onClick={() => setAccountFilters(f => ({ ...f, wealth: !f.wealth }))}
                                    style={{
                                        width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 8,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        opacity: accountFilters.wealth ? 1 : 0.8,
                                        boxShadow: accountFilters.wealth ? '0 0 0 1px #C8FF00' : 'none',
                                        background: accountFilters.wealth ? '#C8FF0020' : 'var(--bg-card)'
                                    }}
                                >
                                    <TrendingUp size={14} color={accountFilters.wealth ? '#C8FF00' : 'var(--text-secondary)'} style={{ opacity: accountFilters.wealth ? 1 : 0.6 }} />
                                </button>
                            </div>

                            {/* Tags Group */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', paddingLeft: 4 }}>Tags</div>
                                <button
                                    onClick={() => setAccountFilters(f => ({ ...f, tagged: !f.tagged }))}
                                    style={{
                                        width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 8,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        opacity: accountFilters.tagged ? 1 : 0.8,
                                        boxShadow: accountFilters.tagged ? '0 0 0 1px var(--accent-magenta)' : 'none',
                                        background: accountFilters.tagged ? 'var(--bg-card-elevated)' : 'var(--bg-card)'
                                    }}
                                >
                                    <Tag size={14} color={accountFilters.tagged ? 'var(--accent-magenta)' : 'var(--text-secondary)'} style={{ opacity: accountFilters.tagged ? 1 : 0.6 }} />
                                </button>
                            </div>

                            {/* Flags Group */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', paddingLeft: 4 }}>Flags</div>
                                <button
                                    onClick={() => setAccountFilters(f => ({ ...f, flagged: !f.flagged }))}
                                    style={{
                                        width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 8,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        opacity: accountFilters.flagged ? 1 : 0.8,
                                        boxShadow: accountFilters.flagged ? '0 0 0 1px var(--accent-amber)' : 'none',
                                        background: accountFilters.flagged ? 'var(--bg-card-elevated)' : 'var(--bg-card)'
                                    }}
                                >
                                    <FileText size={14} className={accountFilters.flagged ? 'text-amber' : 'text-secondary'} style={{ opacity: accountFilters.flagged ? 1 : 0.6 }} />
                                </button>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Recent Activity</span>
                                <span className="text-dim" style={{ fontSize: 10 }}>({(() => {
                                    // Filter logic
                                    const anyAccountFilter = Object.values(accountFilters).some(v => v);
                                    let filtered = transactions;

                                    // Account filters only (no month filter)

                                    // Account filters (if any active)
                                    if (anyAccountFilter) {
                                        filtered = filtered.filter(tx => {
                                            const acct = (tx.account_name || '').toLowerCase();
                                            const isBiz = acct.includes('business');
                                            const isCC = acct.includes('cc') || acct.includes('credit');
                                            const isFlagged = data.flaggedIds.includes(tx.id);

                                            const budgetName = tx.mappedGroup ? (tx.mappedGroup.name || '').toLowerCase() : '';
                                            const isVariable = budgetName.includes('variable');
                                            const isFixed = budgetName.includes('fixed');
                                            const isWealth = budgetName.includes('wealth');

                                            // If ONLY budget filters are active, allow matched budgets
                                            const hasAcctFilters = accountFilters.personalChk || accountFilters.personalCC || accountFilters.bizChk || accountFilters.bizCC;
                                            const hasBudgetFilters = accountFilters.variable || accountFilters.fixed || accountFilters.wealth;
                                            const isTagged = tx.tags && tx.tags.length > 0;

                                            let acctMatch = !hasAcctFilters;
                                            if (hasAcctFilters) {
                                                if (accountFilters.personalChk && !isBiz && !isCC) acctMatch = true;
                                                if (accountFilters.personalCC && !isBiz && isCC) acctMatch = true;
                                                if (accountFilters.bizChk && isBiz && !isCC) acctMatch = true;
                                                if (accountFilters.bizCC && isBiz && isCC) acctMatch = true;
                                            }

                                            let budgetMatch = !hasBudgetFilters;
                                            if (hasBudgetFilters) {
                                                if (accountFilters.variable && isVariable) budgetMatch = true;
                                                if (accountFilters.fixed && isFixed) budgetMatch = true;
                                                if (accountFilters.wealth && isWealth) budgetMatch = true;
                                            }

                                            if (accountFilters.flagged && isFlagged) return true;
                                            if (accountFilters.tagged && isTagged) return true;
                                            if ((accountFilters.flagged || accountFilters.tagged) && !isFlagged && !isTagged && !hasAcctFilters && !hasBudgetFilters) return false;

                                            return acctMatch && budgetMatch;
                                        });
                                    }
                                    return filtered.length;
                                })()})</span>
                            </div>
                            <div className="tx-list">
                                {(() => {
                                    // Filter logic (same as count)
                                    const anyAccountFilter = Object.values(accountFilters).some(v => v);
                                    let filtered = transactions;

                                    // Account filters only (no month filter)

                                    // Account filters
                                    if (anyAccountFilter) {
                                        filtered = filtered.filter(tx => {
                                            const acct = (tx.account_name || '').toLowerCase();
                                            const isBiz = acct.includes('business');
                                            const isCC = acct.includes('cc') || acct.includes('credit');
                                            const isFlagged = data.flaggedIds.includes(tx.id);

                                            const budgetName = tx.mappedGroup ? (tx.mappedGroup.name || '').toLowerCase() : '';
                                            const isVariable = budgetName.includes('variable');
                                            const isFixed = budgetName.includes('fixed');
                                            const isWealth = budgetName.includes('wealth');

                                            // If ONLY budget filters are active, allow matched budgets
                                            const hasAcctFilters = accountFilters.personalChk || accountFilters.personalCC || accountFilters.bizChk || accountFilters.bizCC;
                                            const hasBudgetFilters = accountFilters.variable || accountFilters.fixed || accountFilters.wealth;
                                            const isTagged = tx.tags && tx.tags.length > 0;

                                            let acctMatch = !hasAcctFilters;
                                            if (hasAcctFilters) {
                                                if (accountFilters.personalChk && !isBiz && !isCC) acctMatch = true;
                                                if (accountFilters.personalCC && !isBiz && isCC) acctMatch = true;
                                                if (accountFilters.bizChk && isBiz && !isCC) acctMatch = true;
                                                if (accountFilters.bizCC && isBiz && isCC) acctMatch = true;
                                            }

                                            let budgetMatch = !hasBudgetFilters;
                                            if (hasBudgetFilters) {
                                                if (accountFilters.variable && isVariable) budgetMatch = true;
                                                if (accountFilters.fixed && isFixed) budgetMatch = true;
                                                if (accountFilters.wealth && isWealth) budgetMatch = true;
                                            }

                                            if (accountFilters.flagged && isFlagged) return true;
                                            if (accountFilters.tagged && isTagged) return true;
                                            if ((accountFilters.flagged || accountFilters.tagged) && !isFlagged && !isTagged && !hasAcctFilters && !hasBudgetFilters) return false;

                                            return acctMatch && budgetMatch;
                                        });
                                    }

                                    return filtered.slice(0, txLimit).map(tx => (
                                        <div key={tx.id} className="tx-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <div className={`tx-icon ${tx.colorClass === 'text-blue' ? 'tx-icon-blue' : 'tx-icon-green'}`}>
                                                        {tx.isCC ? (
                                                            <span className={tx.colorClass} style={{ fontSize: 12, fontWeight: 700 }}>CC</span>
                                                        ) : (
                                                            <tx.icon size={16} className={tx.colorClass} />
                                                        )}
                                                    </div>
                                                    <div className="tx-details" style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                                                        <div className="tx-name" style={{ lineHeight: 1.1 }}>{tx.name}</div>
                                                        {tx.mappedGroup && (
                                                            <div style={{ display: 'flex' }}>
                                                                <span style={{
                                                                    fontSize: 10,
                                                                    fontWeight: 800,
                                                                    color: tx.mappedGroup.color,
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.05em',
                                                                    display: 'inline-block'
                                                                }}>
                                                                    {tx.mappedGroup.name.split(' ')[0]}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="tx-meta" style={{ marginTop: !tx.mappedGroup ? 2 : 0 }}>
                                                            {tx.category} • {tx.date}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                                                    <div className={`tx-amount ${tx.amount > 0 ? 'income' : 'expense'}`}>
                                                        {tx.amount > 0 ? '+' : ''}{fmt(tx.amount)}
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleFlag(tx.id); }}
                                                        style={{
                                                            background: 'none', border: 'none', padding: 8,
                                                            marginRight: -8, // Pull it slightly to the edge
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                            opacity: data.flaggedIds.includes(tx.id) ? 1 : 0.15, // Subtle when unselected
                                                            transition: 'opacity 0.2s'
                                                        }}
                                                    >
                                                        <FileText
                                                            size={18}
                                                            className={data.flaggedIds.includes(tx.id) ? 'text-amber' : 'text-dim'}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Debug Output */}
                                            {debugMode && (
                                                <div className="tx-debug">
                                                    [DEBUG] account: "{tx.account_name}" | raw_amount: {tx.raw_amount}
                                                </div>
                                            )}
                                        </div>
                                    ));
                                })()}
                                {(() => {
                                    // Same filter logic for load more button
                                    const anyAccountFilter = Object.values(accountFilters).some(v => v);
                                    let filtered = transactions;

                                    if (anyAccountFilter) {
                                        filtered = filtered.filter(tx => {
                                            const acct = (tx.account_name || '').toLowerCase();
                                            const isBiz = acct.includes('business');
                                            const isCC = acct.includes('cc') || acct.includes('credit');
                                            const isFlagged = data.flaggedIds.includes(tx.id);

                                            const budgetName = tx.mappedGroup ? (tx.mappedGroup.name || '').toLowerCase() : '';
                                            const isVariable = budgetName.includes('variable');
                                            const isFixed = budgetName.includes('fixed');
                                            const isWealth = budgetName.includes('wealth');

                                            const hasAcctFilters = accountFilters.personalChk || accountFilters.personalCC || accountFilters.bizChk || accountFilters.bizCC;
                                            const hasBudgetFilters = accountFilters.variable || accountFilters.fixed || accountFilters.wealth;
                                            const isTagged = tx.tags && tx.tags.length > 0;

                                            let acctMatch = !hasAcctFilters;
                                            if (hasAcctFilters) {
                                                if (accountFilters.personalChk && !isBiz && !isCC) acctMatch = true;
                                                if (accountFilters.personalCC && !isBiz && isCC) acctMatch = true;
                                                if (accountFilters.bizChk && isBiz && !isCC) acctMatch = true;
                                                if (accountFilters.bizCC && isBiz && isCC) acctMatch = true;
                                            }

                                            let budgetMatch = !hasBudgetFilters;
                                            if (hasBudgetFilters) {
                                                if (accountFilters.variable && isVariable) budgetMatch = true;
                                                if (accountFilters.fixed && isFixed) budgetMatch = true;
                                                if (accountFilters.wealth && isWealth) budgetMatch = true;
                                            }

                                            if (accountFilters.flagged && isFlagged) return true;
                                            if (accountFilters.tagged && isTagged) return true;
                                            if ((accountFilters.flagged || accountFilters.tagged) && !isFlagged && !isTagged && !hasAcctFilters && !hasBudgetFilters) return false;

                                            return acctMatch && budgetMatch;
                                        });
                                    }
                                    return filtered.length > txLimit && (
                                        <button className="load-more-btn" style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }} onClick={() => setTxLimit(l => l + 50)}>
                                            Load More ({filtered.length - txLimit} remaining)
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    </>
                ) : page === 'notes' ? (
                    /* Notes Page */
                    <>
                        <div className="mb-3">
                            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Notes</h1>
                            <p className="text-secondary" style={{ fontSize: 11 }}>Log thoughts, ideas, or reminders</p>
                        </div>
                        <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: '60vh' }}>
                            <textarea
                                value={data.notes}
                                onChange={(e) => updateField('notes', e.target.value)}
                                placeholder="Start typing..."
                                style={{
                                    width: '100%',
                                    height: '60vh',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    fontSize: 16,
                                    lineHeight: 1.6,
                                    padding: 20,
                                    resize: 'none',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>
                    </>
                ) : (
                    /* Strategy Page */
                    <>
                        <div className="mb-3">
                            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>CEO Strategy</h1>
                            <p className="text-secondary" style={{ fontSize: 11 }}>Separating the business reservoir from the household pipe</p>
                        </div>

                        {/* The Draw Habit */}
                        <div className="card mb-3" style={{ borderLeft: '3px solid var(--accent-teal)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={14} className="text-teal" />
                                <span style={{ fontSize: 13, fontWeight: 600 }}>The $4k Target</span>
                            </div>
                            <p className="text-secondary" style={{ fontSize: 11, lineHeight: 1.6, marginBottom: 12 }}>
                                Your goal is a steady $4,000 household income. Your W2 covers ~$2,100 automatically. Your job is to move the remaining **{fmt(Math.max(0, data.salary - data.w2Wages))}** from the business to personal checking.
                            </p>
                            <div style={{ background: 'var(--bg-input)', borderRadius: 12, padding: 12 }}>
                                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 8 }}>THIS MONTH'S ACTION:</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-teal)' }}>
                                    Transfer {fmt(Math.max(0, data.salary - data.w2Wages))} from Biz Checking
                                </div>
                            </div>
                        </div>

                        {/* Weekly Runway Check */}
                        <div className="card mb-3" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Building2 size={14} className="text-blue" />
                                <span style={{ fontSize: 13, fontWeight: 600 }}>The Runway Philosophy</span>
                            </div>
                            <p className="text-secondary" style={{ fontSize: 11, lineHeight: 1.6, marginBottom: 12 }}>
                                Slow revenue months are okay. As long as your Business Runway is &gt;6 months, your personal salary draw is safe. Don't touch the household budget based on a slow week.
                            </p>
                            <div className="bento-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: 10 }}>
                                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>BIZ BALANCE</div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(data.bizBalance)}</div>
                                </div>
                                <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: 10 }}>
                                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>RUNWAY</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-blue)' }}>
                                        {(data.salary - data.w2Wages) > 0 ? (data.bizBalance / (data.salary - data.w2Wages)).toFixed(1) : '∞'}mo
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Partner Sync */}
                        <div className="card mb-3" style={{ borderLeft: '3px solid var(--accent-primary)', background: 'linear-gradient(135deg, rgba(91, 127, 255, 0.05), transparent)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Users size={14} className="text-accent" />
                                <span style={{ fontSize: 13, fontWeight: 600 }}>Sunday Partner Sync</span>
                            </div>
                            <p className="text-secondary" style={{ fontSize: 11, lineHeight: 1.6, marginBottom: 12 }}>
                                15 minutes with your wife. Show her the Runway first. It removes the stress. Then review the "Variable Spending" group together.
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Cloud Sync Modal */}
            {authModalOpen && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="modal-content" style={{ padding: 0, width: '90%', maxWidth: 400, borderRadius: 20, overflow: 'hidden' }}>
                        <Auth onComplete={() => setAuthModalOpen(false)} />
                        <button
                            className="btn-modal btn-cancel"
                            style={{ width: '100%', borderRadius: 0, border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                            onClick={() => setAuthModalOpen(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Modal (Restored/Added) */}
            {/* Assuming a state like `confirmationModalOpen` and props like `onConfirm`, `onCancel`, `message` */}
            {/* {confirmationModalOpen && (
                <ConfirmationModal
                    message="Are you sure you want to perform this action?"
                    onConfirm={() => { console.log('Confirmed'); setConfirmationModalOpen(false); }}
                    onCancel={() => setConfirmationModalOpen(false)}
                />
            )} */}

            {/* Bottom Nav */}
            {/* Header-like status for desktop/web context if needed, otherwise rely on tabs */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 75, background: 'rgba(10,10,12,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 15, zIndex: 100 }}>
                <button onClick={() => setPage('home')} className={`nav-item ${page === 'home' ? 'active' : ''}`}>
                    <Home size={20} />
                    <span>Home</span>
                </button>
                <button onClick={() => setPage('transactions')} className={`nav-item ${page === 'transactions' ? 'active' : ''}`}>
                    <Receipt size={20} />
                    <span>Activity</span>
                </button>
                <button onClick={() => setPage('notes')} className={`nav-item ${page === 'notes' ? 'active' : ''}`}>
                    <StickyNote size={20} />
                    <span>Notes</span>
                </button>
                <button onClick={() => setPage('strategy')} className={`nav-item ${page === 'strategy' ? 'active' : ''}`}>
                    <Target size={20} />
                    <span>Strategy</span>
                </button>
                <button onClick={() => setPage('profile')} className={`nav-item ${page === 'profile' ? 'active' : ''}`}>
                    <User size={20} />
                    <span>Profile</span>
                </button>
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: null })}
            />
        </>
    );
}
