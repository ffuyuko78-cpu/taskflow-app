// Japanese holidays 2025-2027 (YYYY-MM-DD)
const JAPANESE_HOLIDAYS = new Set([
  // 2025
  '2025-01-01','2025-01-13','2025-02-11','2025-02-23','2025-02-24',
  '2025-03-20','2025-04-29','2025-05-03','2025-05-04','2025-05-05','2025-05-06',
  '2025-07-21','2025-08-11','2025-09-15','2025-09-23','2025-10-13',
  '2025-11-03','2025-11-23','2025-11-24','2025-12-23',
  // 2026
  '2026-01-01','2026-01-12','2026-02-11','2026-02-23',
  '2026-03-20','2026-04-29','2026-05-03','2026-05-04','2026-05-05','2026-05-06',
  '2026-07-20','2026-08-11','2026-09-21','2026-09-22','2026-09-23','2026-10-12',
  '2026-11-03','2026-11-23',
  // 2027
  '2027-01-01','2027-01-11','2027-02-11','2027-02-23',
  '2027-03-20','2027-04-29','2027-05-03','2027-05-04','2027-05-05',
  '2027-07-19','2027-08-11','2027-09-20','2027-09-23','2027-10-11',
  '2027-11-03','2027-11-23',
]);

export const WEEKDAY_JA = ['日', '月', '火', '水', '木', '金', '土'];

export function parseDateStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayStr() {
  return toDateStr(new Date());
}

export function getDateColor(dateStr) {
  const d = parseDateStr(dateStr);
  const dow = d.getDay(); // 0=Sun, 6=Sat
  if (JAPANESE_HOLIDAYS.has(dateStr) || dow === 0) return 'red';
  if (dow === 6) return 'blue';
  return 'default';
}

export function formatDisplayDate(dateStr) {
  const d = parseDateStr(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dow = WEEKDAY_JA[d.getDay()];
  return { month: m, day, dow };
}

export function addDays(dateStr, n) {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}
