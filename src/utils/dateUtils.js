/**
 * Computes the effective date (which month a transaction counts toward).
 * Income on/after `lateIncomeStartDay` rolls forward to the 1st of next month,
 * but only when `lateIncomeShift` is enabled and the transaction is Income.
 */
export function computeEffectiveDate(date, type, { lateIncomeShift, lateIncomeStartDay }) {
  if (type !== 'Income' || !lateIncomeShift) return date;

  const d = new Date(date + 'T00:00:00');
  if (d.getDate() < lateIncomeStartDay) return date;

  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return toISODate(next);
}

export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export function getYear(isoDate) {
  return Number(isoDate.slice(0, 4));
}

export function getMonth(isoDate) {
  return Number(isoDate.slice(5, 7));
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function periodCompletionPercent(year, month) {
  const now = new Date();
  if (year !== now.getFullYear() || month !== now.getMonth() + 1) {
    const isPast = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
    return isPast ? 100 : 0;
  }
  return Math.round((now.getDate() / daysInMonth(year, month)) * 100);
}
