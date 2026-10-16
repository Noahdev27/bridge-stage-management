export function daysUntil(date: Date | string, from: Date = new Date()): number {
  const target = new Date(date);
  const startOfToday = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfTarget.getTime() - startOfToday.getTime()) / msPerDay);
}

export function isStartDateAlert(
  status: string,
  startDate: Date | string,
  alertDays: number,
  from: Date = new Date()
): boolean {
  if (status !== "PENDING") return false;
  return daysUntil(startDate, from) <= alertDays;
}
