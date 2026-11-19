import { kindOf } from './classify'
import type {
  ElectivesByLevel,
  Kind,
  Next,
  OverviewLink,
  OverviewPlan,
  OverviewSection,
  PlannedLink,
  PlannedSection,
  Settled,
  State,
} from './types'

const NOTE_UNKNOWN_COUNT = 'Pick more electives (open this page once to see how many)'

interface Row extends PlannedLink {
  indented: boolean
}

type Unit =
  | { group: false; link: Row }
  | { group: true; chooser: Row; kids: Row[]; min: number; needPick: boolean; pendingKids: Row[] }

const settledState = (ariaLabel: string): Settled => {
  if (/incomplete/i.test(ariaLabel)) return 'todo'
  if (/complete/i.test(ariaLabel)) return 'done'
  return null
}

const toRow = (isLevel: boolean) => (link: OverviewLink): Row => ({
  title: link.title,
  kind: isLevel ? kindOf(link.title) : 'req',
  state: settledState(link.ariaLabel),
  note: '',
  indented: link.indented,
})

/** Group a level's rows into units: a single item, or an "Electives" chooser with the electives picked under it. */
const toUnits = (rows: Row[], min: number | undefined): Unit[] => {
  const units: Unit[] = []
  for (const row of rows) {
    const last = units[units.length - 1]
    if (row.kind === 'choose') {
      units.push({ group: true, chooser: row, kids: [], min: min ?? 0, needPick: false, pendingKids: [] })
    } else if (row.indented && last?.group) {
      last.kids.push(row)
    } else {
      units.push({ group: false, link: row })
    }
  }
  for (const unit of units) {
    if (!unit.group) continue
    // Need to pick more? Use the real required number when it has been read; otherwise trust the chooser's own status.
    unit.needPick = min ? unit.kids.length < min : unit.chooser.state === 'todo'
    unit.pendingKids = unit.kids.filter((kid) => kid.state === 'todo')
    unit.chooser.note = unit.needPick
      ? min
        ? `Pick ${min - unit.kids.length} more (${min} required)`
        : NOTE_UNKNOWN_COUNT
      : ''
  }
  return units
}

const isPending = (unit: Unit): boolean =>
  unit.group ? unit.pendingKids.length > 0 || unit.needPick : unit.link.kind === 'project' && unit.link.state === 'todo'

/**
 * Decide what is NEXT inside one level, mutating the rows' state/note. Rules:
 *  1. The first unfinished PROJECT in list order. For electives, EVERY picked-but-unfinished elective is next
 *     (we cannot tell which one is in progress); if none is waiting and more must be picked, the chooser is next.
 *  2. Only when every project is done, the checklist / completion items (listed first/last, finished after the projects).
 */
const chooseNext = (name: string, units: Unit[], rows: Row[]): Next | null => {
  const unit = units.find(isPending)
  if (unit) {
    if (!unit.group) {
      unit.link.state = 'next'
      return { level: name, titles: [unit.link.title], pick: false }
    }
    if (unit.pendingKids.length > 0) {
      for (const kid of unit.pendingKids) {
        kid.state = 'next'
        if (unit.pendingKids.length > 1) kid.note = 'Any one of these could be your next project'
      }
      return { level: name, titles: unit.pendingKids.map((kid) => kid.title), pick: false }
    }
    unit.chooser.state = 'next'
    return { level: name, titles: [unit.chooser.title], pick: true }
  }
  const remaining = rows.find((row) => row.state === 'todo')
  if (!remaining) return null
  remaining.state = 'next'
  return { level: name, titles: [remaining.title], pick: false }
}

const headerState = (isLevel: boolean, lmsDone: boolean, rows: Row[], incomplete: number): State | null => {
  if (isLevel) return lmsDone ? 'done' : 'todo'
  if (rows.length === 0) return null
  return incomplete > 0 ? 'todo' : 'done'
}

export const planOverview = (sections: OverviewSection[], electives: ElectivesByLevel): OverviewPlan => {
  const prepared = sections.map((section) => {
    const isLevel = /^level\s*\d+/i.test(section.name)
    const rows = section.links.map(toRow(isLevel))
    const units = toUnits(rows, electives[section.name]?.min)
    return { section, isLevel, rows, units }
  })

  // NEXT is in the first level (in order) that still has something to do.
  let next: Next | null = null
  for (const item of prepared) {
    next = chooseNext(item.section.name, item.units, item.rows)
    if (next) break
  }

  const items: Record<string, Settled> = {}
  const pickMore: Record<string, number> = {}
  const planned: PlannedSection[] = prepared.map(({ section, isLevel, rows, units }) => {
    const incomplete = rows.filter((row) => row.state === 'todo' || row.state === 'next').length
    for (const unit of units) {
      if (unit.group && unit.needPick) pickMore[section.name] = unit.min ? unit.min - unit.kids.length : -1
    }
    for (const row of rows) {
      items[`${section.name}|${row.title}`] = row.state === 'next' ? 'todo' : (row.state as Settled)
    }
    const headerKind: Kind = isLevel ? 'level' : 'req'
    return {
      name: section.name,
      isLevel,
      headerKind: headerKind as 'level' | 'req',
      headerState: headerState(isLevel, section.lmsDone, rows, incomplete),
      headerNote: section.lmsDone && incomplete > 0 ? `⚠ ${incomplete} item(s) still incomplete` : '',
      links: rows.map(({ title, kind, state, note }) => ({ title, kind, state, note })),
    }
  })

  return { sections: planned, saved: { items, next, pickMore } }
}
