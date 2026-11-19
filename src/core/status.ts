import type { Next } from './types'

const isText = (value: unknown): value is string => typeof value === 'string' && value !== ''

/** Reads the remembered "next" item, whichever version of the helper wrote it. */
export const normalizeNext = (raw: unknown): Next | null => {
  if (typeof raw !== 'object' || raw === null) return null
  const saved = raw as { level?: unknown; title?: unknown; titles?: unknown; pick?: unknown }
  if (!isText(saved.level)) return null
  const titles = Array.isArray(saved.titles) ? saved.titles.filter(isText) : isText(saved.title) ? [saved.title] : []
  if (titles.length === 0) return null
  return { level: saved.level, titles, pick: saved.pick === true }
}
