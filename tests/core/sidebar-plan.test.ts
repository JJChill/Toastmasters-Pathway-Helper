import { describe, expect, it } from 'vitest'
import { planSidebar } from '../../src/core/sidebar-plan'
import type { SavedStatus } from '../../src/core/types'

const saved = (over: Partial<SavedStatus> = {}): Partial<SavedStatus> => ({ items: {}, next: null, pickMore: {}, ...over })

describe('planSidebar', () => {
  it('colours each project by kind and takes its status from what the Overview remembered', () => {
    const plan = planSidebar({
      level: 'Level 1',
      wrappers: [
        { title: 'Level 1: Mastering Fundamentals', steps: [] },
        { title: 'Ice Breaker', steps: [] },
        { title: 'Level 1 Completion', steps: [] },
      ],
      saved: saved({ items: { 'Level 1|Ice Breaker': 'done', 'Level 1|Level 1: Mastering Fundamentals': 'todo' } }),
    })
    expect(plan.map((w) => [w.kind, w.state])).toEqual([
      ['req', 'todo'],
      ['project', 'done'],
      ['req', null],
    ])
  })

  it('marks every remembered next title as next', () => {
    const plan = planSidebar({
      level: 'Level 3',
      wrappers: [{ title: 'Connect with Storytelling', steps: [] }, { title: 'Active Listening', steps: [] }, { title: 'Electives', steps: [] }],
      saved: saved({ next: { level: 'Level 3', titles: ['Connect with Storytelling', 'Active Listening'], pick: false } }),
    })
    expect(plan.map((w) => w.state)).toEqual(['next', 'next', null])
  })

  it('ignores a next item that belongs to a different level', () => {
    const plan = planSidebar({
      level: 'Level 2',
      wrappers: [{ title: 'Electives', steps: [] }],
      saved: saved({ next: { level: 'Level 3', titles: ['Electives'], pick: true } }),
    })
    expect(plan[0]?.state).toBeNull()
  })

  it('reads each step\'s completion from Base Camp\'s hidden text', () => {
    const plan = planSidebar({
      level: 'Level 1',
      wrappers: [
        {
          title: 'Ice Breaker',
          steps: [
            { title: 'Part 1: Get Started', srText: 'project completed' },
            { title: 'Complete Your Assignment', srText: 'project not completed' },
            { title: 'Mystery', srText: '' },
          ],
        },
      ],
      saved: saved(),
    })
    expect(plan[0]?.steps.map((s) => s.state)).toEqual(['done', 'todo', null])
  })

  it('gives "Complete Your Project" its own after-speech kind', () => {
    const plan = planSidebar({
      level: 'Level 1',
      wrappers: [{ title: 'Ice Breaker', steps: [{ title: 'Complete Your Project', srText: 'project not completed' }, { title: 'Part 1', srText: '' }] }],
      saved: saved(),
    })
    expect(plan[0]?.steps.map((s) => s.kind)).toEqual(['after', 'step'])
  })

  it('overrides Base Camp\'s "completed" on the Electives Selection step while electives are still needed', () => {
    const plan = planSidebar({
      level: 'Level 3',
      wrappers: [{ title: 'Electives', steps: [{ title: 'Selection', srText: 'project completed' }] }],
      saved: saved({ pickMore: { 'Level 3': 1 } }),
    })
    expect(plan[0]?.steps[0]).toMatchObject({ state: 'todo', note: 'Pick 1 more elective' })
  })

  it('words the note for several, and for an unknown number', () => {
    const base = { level: 'Level 3', wrappers: [{ title: 'Electives', steps: [{ title: 'Selection', srText: 'project completed' }] }] }
    expect(planSidebar({ ...base, saved: saved({ pickMore: { 'Level 3': 2 } }) })[0]?.steps[0]?.note).toBe('Pick 2 more electives')
    expect(planSidebar({ ...base, saved: saved({ pickMore: { 'Level 3': -1 } }) })[0]?.steps[0]?.note).toBe('Pick more electives')
  })

  it('trusts Base Camp again once nothing more needs picking', () => {
    const plan = planSidebar({
      level: 'Level 3',
      wrappers: [{ title: 'Electives', steps: [{ title: 'Selection', srText: 'project completed' }] }],
      saved: saved({ pickMore: {} }),
    })
    expect(plan[0]?.steps[0]).toMatchObject({ state: 'done', note: '' })
  })

  it('copes with nothing remembered yet', () => {
    const plan = planSidebar({ level: 'Level 1', wrappers: [{ title: 'Ice Breaker', steps: [] }], saved: {} })
    expect(plan[0]?.state).toBeNull()
  })
})
