const PKT_TIMEZONE = 'Asia/Karachi'

export const formatDatePKT = (value: string | Date | null | undefined): string => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', { timeZone: PKT_TIMEZONE }).format(d)
}
