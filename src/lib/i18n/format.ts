import type { Locale } from './config'

const intlLocaleMap: Record<Locale, string> = {
  fr: 'fr-FR',
  tr: 'tr-TR',
}

export function interpolate(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match))
}

export function plural(
  dict: Record<string, string>,
  count: number,
  baseKey: string,
  vars: Record<string, string | number> = {}
): string {
  const key = count === 1 ? `${baseKey}_one` : `${baseKey}_other`
  return interpolate(dict[key] ?? '', { count, ...vars })
}

export function formatDate(locale: Locale, iso: string, options?: Intl.DateTimeFormatOptions) {
  const d = new Date(iso)
  return d.toLocaleDateString(intlLocaleMap[locale], options ?? { day: 'numeric', month: 'short' })
}

export function formatTime(locale: Locale, iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString(intlLocaleMap[locale], { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(locale: Locale, iso: string, dateOptions?: Intl.DateTimeFormatOptions) {
  return `${formatDate(locale, iso, dateOptions)} · ${formatTime(locale, iso)}`
}

export function formatCurrency(locale: Locale, amountInCents: number, currency: string) {
  return new Intl.NumberFormat(intlLocaleMap[locale], {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amountInCents / 100)
}

export function formatNumber(locale: Locale, n: number) {
  return n.toLocaleString(intlLocaleMap[locale])
}
