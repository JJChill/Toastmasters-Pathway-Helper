export type MinimumByLevel = Record<string, { min: number; savedAt: number }>

/** Reads "Minimum of N Required Projects" from an Electives page. */
export const parseMinimumRequired = (pageText: string): number | null => {
  const match = pageText.match(/Minimum of (\d+) Required Projects?/i)
  return match?.[1] ? parseInt(match[1], 10) : null
}

/** The updated record, or null when nothing changed (so the caller need not save). */
export const recordMinimum = (existing: MinimumByLevel, level: string, min: number, now: number): MinimumByLevel | null => {
  if (existing[level]?.min === min) return null
  return { ...existing, [level]: { min, savedAt: now } }
}
