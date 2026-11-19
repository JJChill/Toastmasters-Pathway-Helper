import { describe, expect, it } from 'vitest'
import { normalizeNext } from '../../src/core/status'

describe('normalizeNext: the remembered "next" item may come from any earlier version', () => {
  it('upgrades the first version, which remembered a single title and no pick flag', () => {
    expect(normalizeNext({ level: 'Level 1', title: 'Level 1: Mastering Fundamentals' })).toEqual({
      level: 'Level 1',
      titles: ['Level 1: Mastering Fundamentals'],
      pick: false,
    })
  })

  it('keeps the current shape, including the pick flag', () => {
    expect(normalizeNext({ level: 'Level 3', titles: ['Electives'], pick: true })).toEqual({
      level: 'Level 3',
      titles: ['Electives'],
      pick: true,
    })
  })

  it('treats anything unusable as nothing next, instead of failing', () => {
    expect(normalizeNext(null)).toBeNull()
    expect(normalizeNext('Level 1')).toBeNull()
    expect(normalizeNext({ level: 'Level 1' })).toBeNull()
    expect(normalizeNext({ level: 'Level 1', titles: [] })).toBeNull()
    expect(normalizeNext({ titles: ['Electives'] })).toBeNull()
  })
})
