export const locales = ['fr', 'tr'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'fr'

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

// Next's typed-route params come in as plain `string`; the proxy guarantees
// only valid locale-prefixed paths ever reach a page, so this is a safe narrow.
export function toLocale(value: string): Locale {
  return isLocale(value) ? value : defaultLocale
}
