import { isAfterSpeech } from './classify'

export interface Banner {
  chip: string
  /** CSS modifier: 'tm-b-req' or 'tm-b-after'. */
  cls: string
  text: string
}

export interface PurposeHintInput {
  stepTitle: string
  /** Titles of every step in the project the member is in. */
  projectSteps: string[]
  projectIsDone: boolean
}

const INTRO_STEP = /^introduction and assignment$/i

export const purposeHint = ({ stepTitle, projectSteps, projectIsDone }: PurposeHintInput): Banner | null => {
  if (projectIsDone || INTRO_STEP.test(stepTitle.trim())) return null
  if (!projectSteps.some((step) => INTRO_STEP.test(step.trim()))) return null
  return {
    chip: 'FOR YOUR PAPER FORM',
    cls: 'tm-b-req',
    text: 'Need the project purpose or the speech time? Both are on the “Introduction and Assignment” step of this project.',
  }
}

/**
 * Guidance shown above an embedded lesson. Wording is deliberate: Base Camp does NOT enforce the checklist
 * boxes (the "Complete My Requirements" button works with every box empty), so we say "do all of it"
 * rather than claiming the level is blocked.
 */
export const bannerFor = (stepTitle: string, levelTitle: string): Banner | null => {
  if (/checklist and completion/i.test(stepTitle)) {
    const level = levelTitle || 'this level'
    return {
      chip: 'REQUIRED',
      cls: 'tm-b-req',
      text:
        `REQUIRED before ${level} is finished: complete EVERY item on this checklist (including your Successful Club Series presentation, if your level lists one), then scroll to the bottom and press “Complete My Requirements”.`,
    }
  }
  if (/^level\s*\d+\s*requirements$/i.test(stepTitle.trim())) {
    return {
      chip: 'ALSO REQUIRED',
      cls: 'tm-b-req',
      text:
        'This page lists what the level needs besides its projects. If it shows a Successful Club Series, ' +
        'choosing and giving one of those presentations is required to finish the level. ' +
        'You can do it any time, so it is your next step once every project is finished. Tick it off on the Checklist step that follows.',
    }
  }
  if (isAfterSpeech(stepTitle)) {
    return {
      chip: 'AFTER YOUR SPEECH',
      cls: 'tm-b-after',
      text:
        'Do this step AFTER you have given your speech and received your evaluation. Not before. ' +
        'This is where you record what you learned (Know / Wonder / Learned) and log your speech (title, date, club, evaluator). ' +
        'Tip: “Save & Email” notifies your evaluator, so only use it when you are ready.',
    }
  }
  return null
}
