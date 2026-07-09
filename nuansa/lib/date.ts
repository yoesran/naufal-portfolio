const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

/**
 * Split a `YYYY-MM-DD` contract value by hand rather than via `new Date(...)`:
 * parsing a date leans on the runtime's timezone, so the server and the browser
 * can disagree about which day it is and blow up hydration.
 */
export function splitDate(value?: string) {
  const [year, month, day] = (value ?? '').split('-')
  const monthName = MONTHS_ID[Number(month) - 1]
  if (!year || !monthName || !day) return null
  return { year, monthName, day }
}
