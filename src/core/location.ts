import { crumbKind } from './classify'
import type { Kind, Next } from './types'

export interface BreadcrumbInput {
  /** Text of every breadcrumb link after "Home". */
  names: string[]
  /** Text of the last breadcrumb item (the path name on an Overview, where it is not a link). */
  lastItemText: string
  /** e.g. "3 of 14" (empty when the page has none). */
  unitNumber: string
}

export type WherePart = [Kind, string]

/** The "You are here" chips. */
export const whereParts = ({ breadcrumb, hasPathCards }: { breadcrumb: BreadcrumbInput | null; hasPathCards: boolean }): WherePart[] => {
  const parts: WherePart[] = []
  if (breadcrumb) {
    if (breadcrumb.names.length === 0 && breadcrumb.lastItemText) parts.push(['path', breadcrumb.lastItemText])
    breadcrumb.names.forEach((name, i) => {
      // names exclude Home, so index 0 here is the path.
      parts.push([crumbKind(i + 1, name) ?? 'project', name])
    })
    if (breadcrumb.unitNumber) parts.push(['step', `Step ${breadcrumb.unitNumber}`])
  } else if (hasPathCards) {
    parts.push(['path', 'Pick a Path to open'])
  }
  return parts
}

/** The "Next up" line, or null when there is nothing to show. */
export const nextUpText = (next: Next | null | undefined): string | null => {
  if (!next) return null
  const what =
    next.titles.length > 1 ? `any one of: ${next.titles.join(' · ')}` : `${next.titles[0] ?? ''}${next.pick ? ' (pick another elective)' : ''}`
  return `★ Next up: ${next.level} › ${what} (from your last Overview visit)`
}
