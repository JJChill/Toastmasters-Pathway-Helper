import { describe, expect, it } from 'vitest'
import { planOverview } from '../../src/core/overview-plan'
import type { OverviewLink, OverviewSection } from '../../src/core/types'

const done = (title: string, indented = false): OverviewLink => ({ title, ariaLabel: `${title} , Completed`, indented })
const todo = (title: string, indented = false): OverviewLink => ({ title, ariaLabel: `${title} , Incomplete`, indented })
const level = (name: string, lmsDone: boolean, links: OverviewLink[]): OverviewSection => ({ name, lmsDone, links })

const section = (plan: ReturnType<typeof planOverview>, name: string) => {
  const found = plan.sections.find((s) => s.name === name)
  if (!found) throw new Error(`no section ${name}`)
  return found
}
const link = (plan: ReturnType<typeof planOverview>, sec: string, title: string) => {
  const found = section(plan, sec).links.find((l) => l.title === title)
  if (!found) throw new Error(`no link ${title}`)
  return found
}

// Real data: Presentation Mastery. Every project is done but the Level 1 checklist is not.
const presentationMastery = [
  level('Level 1', true, [
    todo('Level 1: Mastering Fundamentals'),
    done('Ice Breaker'),
    done('Writing a Speech with Purpose'),
    done('Introduction to Vocal Variety and Body Language'),
    done('Evaluation and Feedback'),
    done('Level 1 Completion'),
  ]),
  level('Level 2', true, [done('Level 2: Learning Your Style'), done('Understanding Your Leadership Style'), done('Level 2 Completion')]),
]

// Real data: Visionary Communication, Level 3. One elective chosen (indented) and finished; two are required.
const visionaryLevel3 = (extra: OverviewLink[] = []) => [
  level('Level 1', true, [done('Level 1: Mastering Fundamentals'), done('Ice Breaker'), done('Level 1 Completion')]),
  level('Level 3', false, [
    todo('Level 3: Increasing Knowledge'),
    done('Develop a Communication Plan'),
    todo('Electives'),
    done('Using Descriptive Language', true),
    ...extra,
    todo('Level 3 Completion'),
  ]),
]

describe('planOverview: classic single-project levels', () => {
  it('points at the Level 1 checklist when every project is done (and warns the level looks complete)', () => {
    const plan = planOverview(presentationMastery, {})
    expect(plan.saved.next).toEqual({ level: 'Level 1', titles: ['Level 1: Mastering Fundamentals'], pick: false })
    const l1 = section(plan, 'Level 1')
    expect(l1.headerState).toBe('done')
    expect(l1.headerNote).toBe('⚠ 1 item(s) still incomplete')
    expect(link(plan, 'Level 1', 'Level 1: Mastering Fundamentals')).toMatchObject({ kind: 'req', state: 'next' })
    expect(link(plan, 'Level 1', 'Ice Breaker')).toMatchObject({ kind: 'project', state: 'done' })
  })

  it('prefers the first unfinished PROJECT over the checklist, even though the checklist is listed first', () => {
    const plan = planOverview(
      [level('Level 4', false, [todo('Level 4: Building Skills'), todo('Communicate Change'), todo('Level 4 Completion')])],
      {},
    )
    expect(plan.saved.next).toEqual({ level: 'Level 4', titles: ['Communicate Change'], pick: false })
    expect(link(plan, 'Level 4', 'Level 4: Building Skills').state).toBe('todo')
  })

  it('skips levels that are completely done', () => {
    const plan = planOverview(
      [level('Level 1', true, [done('Ice Breaker')]), level('Level 2', false, [todo('Understanding Your Leadership Style')])],
      {},
    )
    expect(plan.saved.next?.level).toBe('Level 2')
  })

  it('has no next item when everything is done', () => {
    const plan = planOverview([level('Level 1', true, [done('Ice Breaker')])], {})
    expect(plan.saved.next).toBeNull()
    expect(section(plan, 'Level 1').headerNote).toBe('')
  })

  it('marks a non-level section (Path Completion) as required and complete only when all its items are', () => {
    const plan = planOverview(
      [level('Path Completion', false, [done('Reflect on Your Path'), todo('Path Completion')])],
      {},
    )
    const s = section(plan, 'Path Completion')
    expect(s.headerKind).toBe('req')
    expect(s.headerState).toBe('todo')
    expect(link(plan, 'Path Completion', 'Reflect on Your Path').kind).toBe('req')
  })
})

describe('planOverview: electives (Visionary Communication, Level 3)', () => {
  it('says "pick another" when you have chosen 1 of 2 required and finished it', () => {
    const plan = planOverview(visionaryLevel3(), { 'Level 3': { min: 2 } })
    expect(plan.saved.next).toEqual({ level: 'Level 3', titles: ['Electives'], pick: true })
    expect(link(plan, 'Level 3', 'Electives')).toMatchObject({ kind: 'choose', state: 'next', note: 'Pick 1 more (2 required)' })
    expect(plan.saved.pickMore).toEqual({ 'Level 3': 1 })
  })

  it('does not call the checklist next while an elective still has to be picked', () => {
    const plan = planOverview(visionaryLevel3(), { 'Level 3': { min: 2 } })
    expect(link(plan, 'Level 3', 'Level 3: Increasing Knowledge').state).toBe('todo')
    expect(link(plan, 'Level 3', 'Level 3 Completion').state).toBe('todo')
  })

  it('falls back to the chooser\'s own status when the required number has not been read yet', () => {
    const plan = planOverview(visionaryLevel3(), {})
    expect(link(plan, 'Level 3', 'Electives')).toMatchObject({
      state: 'next',
      note: 'Pick more electives (open this page once to see how many)',
    })
    expect(plan.saved.pickMore).toEqual({ 'Level 3': -1 })
  })

  it('makes a picked-but-unfinished elective next instead of the chooser', () => {
    const plan = planOverview(visionaryLevel3([todo('Connect with Storytelling', true)]), { 'Level 3': { min: 2 } })
    expect(plan.saved.next).toEqual({ level: 'Level 3', titles: ['Connect with Storytelling'], pick: false })
    expect(link(plan, 'Level 3', 'Connect with Storytelling').state).toBe('next')
    expect(link(plan, 'Level 3', 'Electives').state).toBe('todo')
  })

  it('makes EVERY picked-but-unfinished elective next, since we cannot tell which one is in progress', () => {
    const plan = planOverview(
      visionaryLevel3([todo('Connect with Storytelling', true), todo('Active Listening', true)]),
      { 'Level 3': { min: 2 } },
    )
    expect(plan.saved.next?.titles).toEqual(['Connect with Storytelling', 'Active Listening'])
    expect(link(plan, 'Level 3', 'Connect with Storytelling')).toMatchObject({
      state: 'next',
      note: 'Any one of these could be your next project',
    })
    expect(link(plan, 'Level 3', 'Active Listening').state).toBe('next')
  })

  it('does not ask for more electives once the required number is chosen', () => {
    const plan = planOverview(
      [
        level('Level 3', false, [
          done('Develop a Communication Plan'),
          done('Electives'),
          done('Using Descriptive Language', true),
          done('Connect with Storytelling', true),
          todo('Level 3 Completion'),
        ]),
      ],
      { 'Level 3': { min: 2 } },
    )
    expect(plan.saved.pickMore).toEqual({})
    expect(plan.saved.next).toEqual({ level: 'Level 3', titles: ['Level 3 Completion'], pick: false })
  })

  it('puts a regular unfinished project ahead of the electives when it is listed first', () => {
    const plan = planOverview(
      [level('Level 3', false, [todo('Develop a Communication Plan'), todo('Electives')])],
      { 'Level 3': { min: 2 } },
    )
    expect(plan.saved.next?.titles).toEqual(['Develop a Communication Plan'])
  })

  it('Level 4 with an unread requirement: first project is next, chooser carries the fallback note', () => {
    const plan = planOverview(
      [level('Level 4', false, [todo('Level 4: Building Skills'), todo('Communicate Change'), todo('Electives'), todo('Level 4 Completion')])],
      {},
    )
    expect(plan.saved.next?.titles).toEqual(['Communicate Change'])
    expect(link(plan, 'Level 4', 'Electives').note).toBe('Pick more electives (open this page once to see how many)')
  })
})

describe('planOverview: what is remembered for the sidebar', () => {
  it('stores each item as done/todo keyed by "level|title", with the next item stored as todo', () => {
    const plan = planOverview(presentationMastery, {})
    expect(plan.saved.items['Level 1|Ice Breaker']).toBe('done')
    expect(plan.saved.items['Level 1|Level 1: Mastering Fundamentals']).toBe('todo')
  })

  it('stores null for an item with no status information', () => {
    const plan = planOverview([level('Path Completion', false, [{ title: 'Path Completion', ariaLabel: '', indented: false }])], {})
    expect(plan.saved.items['Path Completion|Path Completion']).toBeNull()
  })
})
