import 'server-only'
import type { Locale } from './config'
import type fr from '@/dictionaries/fr.json'

const dictionaries = {
  fr: () => import('@/dictionaries/fr.json').then(m => m.default),
  tr: () => import('@/dictionaries/tr.json').then(m => m.default),
}

export type Dictionary = typeof fr

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]()
}
