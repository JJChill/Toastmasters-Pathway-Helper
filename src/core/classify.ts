import type { Kind, State } from './types'

export const KIND_LABELS: Record<Kind, string> = {
  path: 'PATH',
  level: 'LEVEL',
  project: 'PROJECT',
  req: 'REQUIRED',
  step: 'STEP',
  after: 'AFTER SPEECH',
  choose: 'PICK ELECTIVES',
}

const STATE_LABELS: Record<State, string> = {
  done: '✔ DONE',
  todo: 'TO DO',
  next: '★ NEXT',
}

/** "Level 1: Mastering Fundamentals" is the requirements/checklist item; "… Completion" are wrap-up items. */
const isRequired = (title: string): boolean =>
  /^level\s*\d+\s*:/i.test(title) || /completion\s*$/i.test(title) || /^reflect on your path/i.test(title)

const isChooser = (title: string): boolean => /^electives?$/i.test(title)

export const kindOf = (title: string): Kind => (isRequired(title) ? 'req' : isChooser(title) ? 'choose' : 'project')

/** The "Complete Your Project" step is filled in after the speech has been given and evaluated. */
export const isAfterSpeech = (title: string): boolean => /^complete your project/i.test(title)

export const labelFor = (kind: Kind, state: State | null): string =>
  state ? `${KIND_LABELS[kind]} · ${STATE_LABELS[state]}` : KIND_LABELS[kind]

/** Breadcrumb is Home / Path / Level / Project: Home is left alone, the rest are coloured. */
export const crumbKind = (index: number, text: string): Kind | null => {
  if (index === 1) return 'path'
  if (index === 2) return 'level'
  if (index >= 3) return kindOf(text)
  return null
}
