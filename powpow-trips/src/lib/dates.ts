const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Parse YYYY-MM-DD as a local date (not UTC) so days never shift by timezone. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isValidISODate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return toISODate(parseISODate(iso)) === iso;
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Number of calendar days in the trip, inclusive. */
export function tripLength(startDate: string, endDate: string): number {
  const ms = parseISODate(endDate).getTime() - parseISODate(startDate).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export function formatShort(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatLong(iso: string): string {
  const d = parseISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatRange(startDate: string, endDate: string): string {
  const s = parseISODate(startDate);
  const e = parseISODate(endDate);
  if (startDate === endDate) return formatLong(startDate);
  const sameYear = s.getFullYear() === e.getFullYear();
  const start = `${s.getDate()} ${MONTHS[s.getMonth()]}${sameYear ? '' : ` ${s.getFullYear()}`}`;
  return `${start} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

export type TripStatus = 'upcoming' | 'ongoing' | 'past';

export function tripStatus(startDate: string, endDate: string, today = todayISO()): TripStatus {
  if (today < startDate) return 'upcoming';
  if (today > endDate) return 'past';
  return 'ongoing';
}

export function daysUntil(iso: string, today = todayISO()): number {
  return Math.round((parseISODate(iso).getTime() - parseISODate(today).getTime()) / 86_400_000);
}
