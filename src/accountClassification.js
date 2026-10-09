// Match known account suffixes so Chase's display-name wording does not
// determine which transaction filter an account belongs to.
export function classifyAccount(name = '') {
    const suffix = name.match(/\((\d{4})\)\s*$/)?.[1];
    if (['6711', '7891'].includes(suffix)) return { isBiz: true, isCC: true };
    if (['1125', '6381'].includes(suffix)) return { isBiz: false, isCC: true };
    if (['6390', '8695', '3259'].includes(suffix)) return { isBiz: true, isCC: false };
    if (suffix === '2439') return { isBiz: false, isCC: false };
    return {
        isBiz: /business|\bbus\b/i.test(name),
        isCC: /credit|\bcc\b|freedom/i.test(name)
    };
}
