import type { MinimumByLevel } from '../core/electives'
import { normalizeNext } from '../core/status'
import type { Next, SavedStatus } from '../core/types'

/**
 * Everything is kept in the site's own localStorage. The key names and shapes are unchanged since v1 so
 * progress remembered by an earlier install keeps working.
 */
const safeGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const safeSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable: carry on without remembering */
  }
}
const readJson = <T>(key: string, fallback: T): T => {
  try {
    return JSON.parse(safeGet(key) ?? '') as T
  } catch {
    return fallback
  }
}

export interface RememberedStatus extends Partial<SavedStatus> {
  next?: Next | null
}

export const loadStatus = (course: string): RememberedStatus => {
  const saved = readJson<RememberedStatus | null>(`tmHelper.status.${course}`, null) ?? {}
  // An older version remembered `next` in a different shape; never let that break the page.
  return { ...saved, next: normalizeNext(saved.next) }
}

export const saveStatus = (course: string, status: SavedStatus, now: number): void =>
  safeSet(`tmHelper.status.${course}`, JSON.stringify({ ...status, savedAt: now }))

export const loadElectives = (course: string): MinimumByLevel => readJson<MinimumByLevel>(`tmHelper.electives.${course}`, {})

export const saveElectives = (course: string, value: MinimumByLevel): void => safeSet(`tmHelper.electives.${course}`, JSON.stringify(value))

/** Levels where the member has chosen a Successful Club Series presentation (told to us by the lesson frame). */
export const isClubSeriesPicked = (course: string, level: string): boolean =>
  readJson<Record<string, boolean>>(`tmHelper.clubSeries.${course}`, {})[level] === true

export const saveClubSeriesPicked = (course: string, level: string): void =>
  safeSet(`tmHelper.clubSeries.${course}`, JSON.stringify({ ...readJson<Record<string, boolean>>(`tmHelper.clubSeries.${course}`, {}), [level]: true }))

/** Level → project → index of the step that lists the Evaluation Resource (told to us by the lesson frame). */
type EvaluationSteps = Record<string, Record<string, number>>
export const loadEvaluationResourceSteps = (course: string, level: string): Record<string, number> =>
  readJson<EvaluationSteps>(`tmHelper.evaluationResource.${course}`, {})[level] ?? {}

export const saveEvaluationResourceStep = (course: string, level: string, project: string, stepIndex: number): void => {
  const all = readJson<EvaluationSteps>(`tmHelper.evaluationResource.${course}`, {})
  safeSet(`tmHelper.evaluationResource.${course}`, JSON.stringify({ ...all, [level]: { ...all[level], [project]: stepIndex } }))
}

export const isHighlightOn = (): boolean => safeGet('tmHelper.on') !== '0'
export const saveHighlightOn = (on: boolean): void => safeSet('tmHelper.on', on ? '1' : '0')
export const isLegendCollapsed = (): boolean => safeGet('tmHelper.collapsed') === '1'
export const saveLegendCollapsed = (collapsed: boolean): void => safeSet('tmHelper.collapsed', collapsed ? '1' : '0')
