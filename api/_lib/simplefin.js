export async function fetchSimpleFinData(accessUrl = process.env.SimpleFIN) {
    if (!accessUrl) throw new Error('SimpleFIN Access URL missing');

    const url = new URL(accessUrl);
    const authHeader = `Basic ${Buffer.from(`${url.username}:${url.password}`).toString('base64')}`;
    const cleanUrl = `${url.protocol}//${url.host}${url.pathname}/accounts?version=2`;
    const response = await fetch(cleanUrl, { headers: { Authorization: authHeader } });
    if (!response.ok) throw new Error(`SimpleFIN API error: ${response.status}`);

    const data = await response.json();
    const accounts = (data.accounts || []).map(account => {
        const availableBalance = Number(account['available-balance']);
        const currentBalance = Number(account.balance);

        return {
            ...account,
            id: String(account.id),
            name: account.name,
            // Use the amount that is actually available to spend. Some
            // institutions omit it, so fall back to the current balance.
            balance: Number.isFinite(availableBalance) ? availableBalance : currentBalance,
            current_balance: currentBalance,
            currency: account.currency,
            org_name: account.org?.name || 'Bank'
        };
    });

    const transactions = accounts.flatMap(account => (account.transactions || []).map(tx => ({
        ...tx,
        id: String(tx.id || `${account.id}-${tx.posted}-${tx.amount}-${tx.description || tx.payee || ''}`),
        account_id: account.id,
        account_name: account.name,
        amount: Number(tx.amount),
        payee: tx.payee || tx.description || 'Unknown',
        date: new Date(tx.posted * 1000).toISOString().split('T')[0]
    })));

    return { accounts, transactions, errors: data.errors || [] };
}

export async function persistTransactions(supabase, transactions, userId) {
    if (!userId || transactions.length === 0) return 0;

    const rows = transactions.map(tx => ({
        user_id: userId,
        provider: 'simplefin',
        external_id: tx.id,
        account_id: tx.account_id || null,
        account_name: tx.account_name || 'Unknown',
        posted_at: tx.date,
        payee: tx.payee || 'Unknown',
        amount: Number(tx.amount),
        currency: tx.currency || 'USD',
        category: tx.category || null,
        raw: tx,
        synced_at: new Date().toISOString()
    }));

    const { error } = await supabase
        .from('transactions')
        .upsert(rows, { onConflict: 'user_id,provider,external_id' });
    if (error) throw error;
    return rows.length;
}
