export function pad2(n: number) {
    return String(n).padStart(2, "0");
}

export function toISODate(d: Date) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseISODate(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function startOfWeekMonday(d: Date) {
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

export function addDays(d: Date, days: number) {
    const x = new Date(d);
    x.setDate(d.getDate() + days);
    return x;
}

export function isFutureDateISO(iso: string) {
    if (!iso) return false;
    const d = parseISODate(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d.getTime() > today.getTime();
}

export function isTodayISO(iso: string) {
    if (!iso) return false;
    const d = parseISODate(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d.getTime() === today.getTime();
}

export function calcAge(dobISO: string, now = new Date()) {
    if (!dobISO) return null;
    const dob = parseISODate(dobISO);
    if (Number.isNaN(dob.getTime())) return null;
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
}
