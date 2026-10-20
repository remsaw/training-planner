/**
 * Date and time helper utilities for Training Resource Planner
 */

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // inclusive
}

export function formatDuration(startDateStr: string, endDateStr: string): string {
  const days = calculateDaysBetween(startDateStr, endDateStr);
  if (days <= 0) return 'Invalid duration';
  return days === 1 ? '1 Day' : `${days} Days`;
}

export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatDateRange(startDateStr: string, endDateStr: string): string {
  if (!startDateStr || !endDateStr) return '';
  if (startDateStr === endDateStr) {
    return formatFriendlyDate(startDateStr);
  }
  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return `${start.getDate()}–${end.getDate()} ${startMonth} ${startYear}`;
    }
    return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth} ${startYear}`;
  }
  return `${formatShortDate(startDateStr)} ${startYear} – ${formatShortDate(endDateStr)} ${endYear}`;
}

export function getDatesInRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  let current = startDateStr;
  while (current <= endDateStr) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

export function getWeekDays(referenceDate: Date): { date: Date; dateStr: string; dayName: string; dayNumber: number; isWeekend: boolean }[] {
  const current = new Date(referenceDate);
  // Normalize to Monday of that week
  const day = current.getDay();
  // In JS: 0 is Sun, 1 is Mon... 6 is Sat.
  // We want Monday as index 0
  const diffToMonday = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diffToMonday);

  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(current);
    d.setDate(current.getDate() + i);
    const dayOfWeek = d.getDay();
    week.push({
      date: d,
      dateStr: formatDate(d),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }
  return week;
}

export function getMonthDays(year: number, month: number): { date: Date; dateStr: string; dayNumber: number; isCurrentMonth: boolean; isWeekend: boolean }[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Find Monday of first week
  const startDay = firstDayOfMonth.getDay();
  const diffToStartMonday = startDay === 0 ? -6 : 1 - startDay;
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(firstDayOfMonth.getDate() + diffToStartMonday);

  // Find Sunday of last week
  const endDay = lastDayOfMonth.getDay();
  const diffToEndSunday = endDay === 0 ? 0 : 7 - endDay;
  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(lastDayOfMonth.getDate() + diffToEndSunday);

  const days = [];
  const curr = new Date(startDate);
  while (curr <= endDate) {
    const d = new Date(curr);
    const dayOfWeek = d.getDay();
    days.push({
      date: d,
      dateStr: formatDate(d),
      dayNumber: d.getDate(),
      isCurrentMonth: d.getMonth() === month,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
    curr.setDate(curr.getDate() + 1);
  }
  return days;
}

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isDateWithin(dateStr: string, startDateStr: string, endDateStr: string): boolean {
  return dateStr >= startDateStr && dateStr <= endDateStr;
}
