import { describe, expect, it } from 'vitest'
import { parseAssignment, printNoteFor } from '../../src/core/assignment'
import { bannerFor, purposeHint } from '../../src/core/banners'
import { planOverview } from '../../src/core/overview-plan'
import { planSidebar } from '../../src/core/sidebar-plan'
import type { OverviewLink, OverviewSection } from '../../src/core/types'

// The member's side of the conversation, in the words of docs/specs/knowing-what-is-next.feature.
// "Looking at their path" is the Overview page as Base Camp shows it; the helper answers with chips.
const finished = (title: string, indented = false): OverviewLink => ({ title, ariaLabel: `${title} , Completed`, indented })
const unfinished = (title: string, indented = false): OverviewLink => ({ title, ariaLabel: `${title} , Incomplete`, indented })
const aLevel = (name: string, complete: boolean, links: OverviewLink[]): OverviewSection => ({ name, lmsDone: complete, links })

const looksAtTheirPath = (levels: OverviewSection[], electivesRequired: Record<string, { min: number }> = {}) => {
  const plan = planOverview(levels, electivesRequired)
  const row = (level: string, title: string) => {
    const found = plan.sections.find((section) => section.name === level)?.links.find((link) => link.title === title)
    if (!found) throw new Error(`"${title}" is not shown in ${level}`)
    return found
  }
  return {
    isShownAsNext: (level: string, title: string) => row(level, title).state === 'next',
    note: (level: string, title: string) => row(level, title).note,
    warningOn: (level: string) => plan.sections.find((section) => section.name === level)?.headerNote ?? '',
  }
}

const looksAtTheAssignment = (pageText: string) => parseAssignment(pageText)

describe('Knowing what to do next', () => {
  // Covers: knowing-what-is-next.feature :: Scenario: The first unfinished project is next
  it('shows the first unfinished project as next, not the checklist', () => {
    const level = aLevel('Level 4', false, [
      unfinished('Level 4: Building Skills'),
      unfinished('Communicate Change'),
      unfinished('Level 4 Completion'),
    ])

    const path = looksAtTheirPath([level])

    expect(path.isShownAsNext('Level 4', 'Communicate Change')).toBe(true)
    expect(path.isShownAsNext('Level 4', 'Level 4: Building Skills')).toBe(false)
  })

  // Covers: knowing-what-is-next.feature :: Scenario: Required items come next once every project is finished
  it('shows the checklist as next once every project is finished', () => {
    const level = aLevel('Level 1', false, [
      unfinished('Level 1: Mastering Fundamentals'),
      finished('Ice Breaker'),
      finished('Level 1 Completion'),
    ])

    const path = looksAtTheirPath([level])

    expect(path.isShownAsNext('Level 1', 'Level 1: Mastering Fundamentals')).toBe(true)
  })

  // Covers: knowing-what-is-next.feature :: Scenario: A level that looks complete still warns about unfinished items
  it('warns on a level marked complete that still has an unfinished item', () => {
    const level = aLevel('Level 1', true, [unfinished('Level 1: Mastering Fundamentals'), finished('Ice Breaker')])

    const path = looksAtTheirPath([level])

    expect(path.warningOn('Level 1')).toContain('1 item(s) still incomplete')
  })

  // Covers: knowing-what-is-next.feature :: Scenario: A member who has picked one of two required electives is asked to pick another
  it('asks a member who has picked one of two required electives to pick another', () => {
    const level = aLevel('Level 3', false, [
      unfinished('Level 3: Increasing Knowledge'),
      finished('Develop a Communication Plan'),
      unfinished('Electives'),
      finished('Using Descriptive Language', true),
      unfinished('Level 3 Completion'),
    ])

    const path = looksAtTheirPath([level], { 'Level 3': { min: 2 } })

    expect(path.isShownAsNext('Level 3', 'Electives')).toBe(true)
    expect(path.note('Level 3', 'Electives')).toBe('Pick 1 more (2 required)')
  })

  // Covers: knowing-what-is-next.feature :: Scenario: Every picked elective that is not finished is next
  it('shows every picked elective that is not finished as next', () => {
    const level = aLevel('Level 3', false, [
      unfinished('Level 3: Increasing Knowledge'),
      finished('Develop a Communication Plan'),
      unfinished('Electives'),
      unfinished('Using Descriptive Language', true),
      unfinished('Inspire Your Audience', true),
      unfinished('Level 3 Completion'),
    ])

    const path = looksAtTheirPath([level], { 'Level 3': { min: 2 } })

    for (const elective of ['Using Descriptive Language', 'Inspire Your Audience']) {
      expect(path.isShownAsNext('Level 3', elective)).toBe(true)
      expect(path.note('Level 3', elective)).toBe('Any one of these could be your next project')
    }
  })

  // Covers: knowing-what-is-next.feature :: Scenario: Enough electives picked means no more picking
  it('does not ask for more electives once enough are picked and finished', () => {
    const level = aLevel('Level 3', false, [
      unfinished('Level 3: Increasing Knowledge'),
      finished('Develop a Communication Plan'),
      unfinished('Electives'),
      finished('Using Descriptive Language', true),
      finished('Inspire Your Audience', true),
      unfinished('Level 3 Completion'),
    ])

    const path = looksAtTheirPath([level], { 'Level 3': { min: 2 } })

    expect(path.isShownAsNext('Level 3', 'Electives')).toBe(false)
  })

  // Covers: knowing-what-is-next.feature :: Scenario: The number of electives required is not yet known
  it('asks to pick more electives and to open the electives page when the number required is not yet known', () => {
    const level = aLevel('Level 4', false, [unfinished('Level 4: Building Skills'), unfinished('Electives'), unfinished('Level 4 Completion')])

    const path = looksAtTheirPath([level])

    expect(path.note('Level 4', 'Electives')).toBe('Pick more electives (open this page once to see how many)')
  })

  // Covers: knowing-what-is-next.feature :: Scenario: A step that belongs after the speech says so
  it('tells a member on "Complete Your Project" to do it after the speech and evaluation', () => {
    const guidance = bannerFor('Complete Your Project', 'Level 1')

    expect(guidance?.text).toContain('AFTER you have given your speech and received your evaluation')
  })

  // Covers: knowing-what-is-next.feature :: Scenario: The checklist guidance does not claim it is enforced
  it('tells a member on the checklist to complete every item, without claiming Base Camp enforces it', () => {
    const guidance = bannerFor('Checklist and Completion', 'Level 1')

    expect(guidance?.text).toContain('complete EVERY item on this checklist')
    expect(guidance?.text).not.toContain('The boxes are only your own tracker')
    expect(guidance?.text).not.toContain('Base Camp manager')
  })

  // Covers: knowing-what-is-next.feature :: Scenario: The requirements step points out the Successful Club Series
  it('tells a member on the requirements step that a Successful Club Series presentation is required, any time', () => {
    const guidance = bannerFor('Level 3 Requirements', 'Level 3: Increasing Knowledge')

    expect(guidance?.text).toContain('Successful Club Series')
    expect(guidance?.text).toContain('required to finish')
    expect(guidance?.text).toContain('any time')
  })

  // Covers: knowing-what-is-next.feature :: Scenario: The requirements step is not shown as done just because Base Camp says so
  it('does not show the requirements step as done when Base Camp marks it completed', () => {
    const [wrapper] = planSidebar({
      level: 'Level 3',
      wrappers: [{ title: 'Level 3: Increasing Knowledge', steps: [{ title: 'Level 3 Requirements', srText: 'project completed' }] }],
      saved: {},
    })

    expect(wrapper?.steps[0]?.state).not.toBe('done')
    expect(wrapper?.steps[0]?.note).toBe('Pick a Club Series presentation')
  })

  // Covers: knowing-what-is-next.feature :: Scenario: The project purpose is pointed out for the paper form
  it('picks out the purpose line of an assignment for the paper form', () => {
    const assignment = looksAtTheAssignment(
      'Your Assignment\nPurpose: The purpose of this project is to practice developing a communication plan.\n' +
        'Overview: Develop a communication plan for any event or situation.',
    )

    expect(assignment.purpose).toBe('The purpose of this project is to practice developing a communication plan.')
  })

  // Covers: knowing-what-is-next.feature :: Scenario: The speech time is pointed out
  it('shows the speech time as 5 to 7 minutes when the assignment asks for a 5- to 7-minute speech', () => {
    const assignment = looksAtTheAssignment('Overview: At a club meeting, present a 5- to 7-minute speech about your experience.')

    expect(assignment.time).toBe('5 to 7 minutes')
  })

  // Covers: knowing-what-is-next.feature :: Scenario: The speech time is pointed out
  it('recognises the other ways an assignment can word its speech time', () => {
    expect(looksAtTheAssignment('Give a 4 to 6 minute speech.').time).toBe('4 to 6 minutes')
    expect(looksAtTheAssignment('Give a 4–6 minute speech.').time).toBe('4 to 6 minutes')
    expect(looksAtTheAssignment('Your speech should be 8 to 10 minutes long.').time).toBe('8 to 10 minutes')
    expect(looksAtTheAssignment('Deliver a 10-minute speech.').time).toBe('10 minutes')
  })

  // Covers: knowing-what-is-next.feature :: Scenario: Nothing is claimed when the assignment gives no speech time
  it('shows no speech time when the assignment gives none', () => {
    const assignment = looksAtTheAssignment('Purpose: The purpose of this project is to practice listening.')

    expect(assignment.time).toBeNull()
  })

  // Covers: knowing-what-is-next.feature :: Scenario: A step of an unfinished project says where to find the purpose
  it('tells a member on another step of an unfinished project where the purpose and speech time are', () => {
    const hint = purposeHint({
      stepTitle: 'Complete Your Assignment',
      projectSteps: ['Introduction and Assignment', 'Create a Communication Plan', 'Complete Your Assignment'],
      projectIsDone: false,
    })

    expect(hint?.text).toContain('Introduction and Assignment')
    expect(hint?.text).toContain('purpose')
    expect(hint?.text).toContain('speech time')
  })

  // Covers: knowing-what-is-next.feature :: Scenario: A step of an unfinished project says where to find the purpose
  it('does not point at an Introduction and Assignment step the project does not have', () => {
    const hint = purposeHint({ stepTitle: 'Part 2', projectSteps: ['Part 1: Get Started', 'Part 2'], projectIsDone: false })

    expect(hint).toBeNull()
  })

  // Covers: knowing-what-is-next.feature :: Scenario: The Introduction and Assignment step does not point at itself
  it('does not point a member at the Introduction and Assignment step while they are on it', () => {
    const hint = purposeHint({
      stepTitle: 'Introduction and Assignment',
      projectSteps: ['Introduction and Assignment', 'Complete Your Assignment'],
      projectIsDone: false,
    })

    expect(hint).toBeNull()
  })

  // Covers: knowing-what-is-next.feature :: Scenario: A finished project does not say where to find the purpose
  it('does not say where to find the purpose once the project is finished', () => {
    const hint = purposeHint({
      stepTitle: 'Complete Your Assignment',
      projectSteps: ['Introduction and Assignment', 'Complete Your Assignment'],
      projectIsDone: true,
    })

    expect(hint).toBeNull()
  })

  // Covers: knowing-what-is-next.feature :: Scenario: The requirements step is shown as done once a Club Series presentation is picked
  it('shows the requirements step as done, with no note, once a Club Series presentation is picked', () => {
    const [wrapper] = planSidebar({
      level: 'Level 3',
      wrappers: [{ title: 'Level 3: Increasing Knowledge', steps: [{ title: 'Level 3 Requirements', srText: 'project completed' }] }],
      saved: {},
      clubSeriesPicked: true,
    })

    expect(wrapper?.steps[0]?.state).toBe('done')
    expect(wrapper?.steps[0]?.note).toBe('')
  })

  // Covers: knowing-what-is-next.feature :: Scenario: The Introduction and Assignment step is marked for the paper form
  it('marks the Introduction and Assignment step of an unfinished project for the paper form', () => {
    const [wrapper] = planSidebar({
      level: 'Level 4',
      wrappers: [
        {
          title: 'Communicate Change',
          steps: [
            { title: 'Introduction and Assignment', srText: 'project completed' },
            { title: 'Complete Your Project', srText: 'project not completed' },
          ],
        },
      ],
      saved: { items: { 'Level 4|Communicate Change': 'todo' } },
    })

    expect(wrapper?.steps[0]?.note).toContain('FOR YOUR PAPER FORM')
    expect(wrapper?.steps[1]?.note).toBe('')
  })

  // Covers: knowing-what-is-next.feature :: Scenario: A finished project's Introduction and Assignment step is not marked
  it('does not mark the Introduction and Assignment step of a finished project', () => {
    const [wrapper] = planSidebar({
      level: 'Level 3',
      wrappers: [{ title: 'Develop a Communication Plan', steps: [{ title: 'Introduction and Assignment', srText: 'project completed' }] }],
      saved: { items: { 'Level 3|Develop a Communication Plan': 'done' } },
    })

    expect(wrapper?.steps[0]?.note).toBe('')
  })

  // Covers: knowing-what-is-next.feature :: Scenario: The Evaluation Resource link says to print it for the evaluator
  it('says to print the Evaluation Resource for the evaluator, and nothing about the other resources', () => {
    expect(printNoteFor('Evaluation Resource')).toBe('Print this for your evaluator to use when you give your speech')
    expect(printNoteFor('Project Checklist')).toBeNull()
    expect(printNoteFor('Communicate Change Worksheet')).toBeNull()
  })

  // Covers: knowing-what-is-next.feature :: Scenario: The step with the Evaluation Resource is marked in the sidebar
  it('marks only the step that lists the Evaluation Resource, once the member has opened it', () => {
    const [wrapper] = planSidebar({
      level: 'Level 4',
      wrappers: [
        {
          title: 'Communicate Change',
          steps: [
            { title: 'Communicate Change', srText: 'project not completed' },
            { title: 'Introduction and Assignment', srText: 'project not completed' },
            { title: 'Communicate Change', srText: 'project not completed' },
          ],
        },
      ],
      saved: { items: { 'Level 4|Communicate Change': 'todo' } },
      evaluationResourceSteps: { 'Communicate Change': 0 },
    })

    expect(wrapper?.steps[0]?.note).toContain('Evaluation Resource')
    expect(wrapper?.steps[1]?.note).not.toContain('Evaluation Resource')
    expect(wrapper?.steps[2]?.note).toBe('')
  })

  // Covers: knowing-what-is-next.feature :: Scenario: The checklist guidance includes the Successful Club Series
  it('tells a member on the checklist to tick off the Successful Club Series presentation if the level lists one', () => {
    const guidance = bannerFor('Checklist and Completion', 'Level 3')

    expect(guidance?.text).toContain('Successful Club Series presentation, if your level lists one')
  })
})
