export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDateStringOffset(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function getDaysDifferenceFromToday(dateStr: string): number {
  const target = parseLocalDate(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatFriendlyDate(dateStr: string): string {
  const diff = getDaysDifferenceFromToday(dateStr);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatLongDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatIsoTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hrs}h` : `${hrs}h ${rem}m`;
}

export function formatHoursDecimal(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

export function getGreetingByHour(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatCountdownLabel(dateStr: string): { label: string; tone: 'overdue' | 'soon' | 'normal' } {
  const diff = getDaysDifferenceFromToday(dateStr);
  if (diff < 0) {
    return { label: `${Math.abs(diff)}d ago`, tone: 'overdue' };
  }
  if (diff === 0) {
    return { label: 'Today', tone: 'soon' };
  }
  if (diff === 1) {
    return { label: 'Tomorrow', tone: 'soon' };
  }
  if (diff <= 5) {
    return { label: `In ${diff} days`, tone: 'soon' };
  }
  return { label: `In ${diff} days`, tone: 'normal' };
}
