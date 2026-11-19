import { isAfterSpeech, kindOf } from './classify'
import type { PlannedStep, PlannedWrapper, SavedStatus, SidebarWrapperInput, State } from './types'

interface SidebarInput {
  level: string
  wrappers: SidebarWrapperInput[]
  saved: Partial<SavedStatus>
  /** The member has chosen a Successful Club Series presentation for this level. */
  clubSeriesPicked?: boolean
  /** Project title → index of the step that lists the Evaluation Resource (learned when the member opened it). */
  evaluationResourceSteps?: Record<string, number>
}

const REQUIREMENTS_STEP = /^level\s*\d+\s*requirements$/i
const INTRO_STEP = /^introduction and assignment$/i
const NOTE_PRINT_EVALUATION = 'PRINT the Evaluation Resource for your evaluator'
const NOTE_PAPER_FORM = 'FOR YOUR PAPER FORM: purpose & speech time'
const NOTE_REQUIREMENTS = 'Pick a Club Series presentation'

const pickNote =(need: number): string => {
  if (!need) return ''
  if (need < 0) return 'Pick more electives'
  return `Pick ${need} more elective${need > 1 ? 's' : ''}`
}

export const planSidebar = ({ level, wrappers, saved, clubSeriesPicked, evaluationResourceSteps }: SidebarInput): PlannedWrapper[] =>
  wrappers.map((wrapper) => {
    const kind = kindOf(wrapper.title)

    let state: State | null = saved.items?.[`${level}|${wrapper.title}`] ?? null
    if (saved.next && saved.next.level === level && saved.next.titles.includes(wrapper.title)) state = 'next'

    // Base Camp can show the elective "Selection" step as complete before enough electives are picked.
    // Trust the real requirement (read from the Electives page / Overview) over that flag.
    const need = kind === 'choose' ? (saved.pickMore?.[level] ?? 0) : 0

    const steps: PlannedStep[] = wrapper.steps.map((step, index) => {
      let settled: PlannedStep['state'] = /not completed/i.test(step.srText) ? 'todo' : /completed/i.test(step.srText) ? 'done' : null
      let note = pickNote(need)
      if (need) settled = 'todo'
      // Base Camp marks the requirements page complete once it is viewed; it cannot know about the Successful Club Series.
      if (REQUIREMENTS_STEP.test(step.title.trim())) {
        settled = clubSeriesPicked ? 'done' : null
        note = clubSeriesPicked ? '' : NOTE_REQUIREMENTS
      }
      if (kind === 'project' && state !== 'done' && INTRO_STEP.test(step.title.trim())) note = NOTE_PAPER_FORM
      if (evaluationResourceSteps?.[wrapper.title] === index) note = NOTE_PRINT_EVALUATION
      return { kind: isAfterSpeech(step.title) ? 'after' : 'step', state: settled, note }
    })

    return { kind, state, steps }
  })
