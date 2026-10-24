export function safeHref(value: string) {
    const v = value.trim();
    return /^(https?:\/\/|mailto:|tel:|#|\/)(?!\/)/i.test(v) ? v : "#contact";
}
