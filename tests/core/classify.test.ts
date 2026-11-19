import { describe, expect, it } from 'vitest'
import { crumbKind, isAfterSpeech, kindOf, labelFor } from '../../src/core/classify'

describe('kindOf: what kind of thing is this title?', () => {
  it.each([
    ['Level 1: Mastering Fundamentals', 'req'],
    ['Level 3: Increasing Knowledge', 'req'],
    ['Level 2 Completion', 'req'],
    ['Path Completion', 'req'],
    ['Reflect on Your Path', 'req'],
    ['Electives', 'choose'],
    ['Elective', 'choose'],
    ['Ice Breaker', 'project'],
    ['Using Descriptive Language', 'project'],
    ['Communicate Change', 'project'],
  ])('%s is %s', (title, kind) => {
    expect(kindOf(title)).toBe(kind)
  })
})

describe('labelFor: the chip text', () => {
  it('shows only the kind when there is no status', () => {
    expect(labelFor('path', null)).toBe('PATH')
  })
  it('adds the status after a dot', () => {
    expect(labelFor('project', 'done')).toBe('PROJECT · ✔ DONE')
    expect(labelFor('project', 'todo')).toBe('PROJECT · TO DO')
    expect(labelFor('choose', 'next')).toBe('PICK ELECTIVES · ★ NEXT')
    expect(labelFor('after', 'todo')).toBe('AFTER SPEECH · TO DO')
  })
})

describe('isAfterSpeech', () => {
  it('matches the "Complete Your Project" step but not "Complete Your Assignment"', () => {
    expect(isAfterSpeech('Complete Your Project')).toBe(true)
    expect(isAfterSpeech('complete your project')).toBe(true)
    expect(isAfterSpeech('Complete Your Assignment')).toBe(false)
  })
})

describe('crumbKind: breadcrumb is Home / Path / Level / Project', () => {
  it('leaves Home alone and colours path, level, then project-or-required', () => {
    expect(crumbKind(0, 'Home')).toBeNull()
    expect(crumbKind(1, 'Presentation Mastery')).toBe('path')
    expect(crumbKind(2, 'Level 1')).toBe('level')
    expect(crumbKind(3, 'Ice Breaker')).toBe('project')
    expect(crumbKind(3, 'Level 1: Mastering Fundamentals')).toBe('req')
    expect(crumbKind(3, 'Electives')).toBe('choose')
  })
})
