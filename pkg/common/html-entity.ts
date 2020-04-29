export const encodeHtmlEntities = (raw: string): string => {
    const pairs: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }
    return raw.replace(/[&<>"']/g, (matched) => pairs[matched])
}
