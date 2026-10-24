export function safeHref(value: string) {
    const v = value.trim();
    if (/^https?:\/\//i.test(v)) {
        try {
            const url = new URL(v);
            if (url.username || url.password || (url.protocol !== "http:" && url.protocol !== "https:")) return "#contact";
            return v;
        } catch {
            return "#contact";
        }
    }
    return /^(mailto:|tel:|#|\/)(?!\/)/i.test(v) ? v : "#contact";
}
