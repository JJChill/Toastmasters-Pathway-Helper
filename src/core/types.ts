/** What kind of thing a title is. Drives the colour and the chip text. */
export type Kind = 'path' | 'level' | 'project' | 'req' | 'step' | 'after' | 'choose'

/** Progress shown on a chip. `next` is derived by us; Base Camp only knows done / not done. */
export type State = 'done' | 'todo' | 'next'

/** What Base Camp itself reports for an item (null = it says nothing). */
export type Settled = 'done' | 'todo' | null

/** One row on a path's Overview page, as read from the page. */
export interface OverviewLink {
  title: string
  /** Base Camp's accessible label, e.g. "Ice Breaker , Completed" or "… , Incomplete, Last visited". */
  ariaLabel: string
  /** A chosen elective is drawn indented under the "Electives" row. */
  indented: boolean
}

/** One level (or the "Path Completion" section) on the Overview page. */
export interface OverviewSection {
  name: string
  /** Base Camp shows its own green check on the level. */
  lmsDone: boolean
  links: OverviewLink[]
}

/** The item(s) we tell the member to do next. */
export interface Next {
  level: string
  titles: string[]
  /** True when the next step is to pick more electives rather than do a project. */
  pick: boolean
}

/** What the Overview remembers so other pages (sidebar, legend) can reuse it. */
export interface SavedStatus {
  /** "Level 3|Electives" → what Base Camp says. */
  items: Record<string, Settled>
  next: Next | null
  /** level → how many more electives to pick (-1 = more are needed but the count is unknown). */
  pickMore: Record<string, number>
}

/** Electives required per level, read from each Electives page. */
export type ElectivesByLevel = Record<string, { min: number }>

export interface PlannedLink {
  title: string
  kind: Kind
  state: State | null
  note: string
}

export interface PlannedSection {
  name: string
  isLevel: boolean
  headerKind: 'level' | 'req'
  headerState: State | null
  headerNote: string
  links: PlannedLink[]
}

export interface OverviewPlan {
  sections: PlannedSection[]
  saved: SavedStatus
}

export interface SidebarStepInput {
  title: string
  /** Base Camp's hidden screen-reader text, e.g. "project completed". */
  srText: string
}
export interface SidebarWrapperInput {
  title: string
  steps: SidebarStepInput[]
}
export interface PlannedStep {
  kind: 'step' | 'after'
  state: Settled
  note: string
}
export interface PlannedWrapper {
  kind: Kind
  state: State | null
  steps: PlannedStep[]
}
