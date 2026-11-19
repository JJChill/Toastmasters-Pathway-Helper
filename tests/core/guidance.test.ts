import { describe, expect, it } from 'vitest'
import { bannerFor } from '../../src/core/banners'
import { parseMinimumRequired, recordMinimum } from '../../src/core/electives'
import { nextUpText, whereParts } from '../../src/core/location'

describe('bannerFor: guidance above a lesson', () => {
  it('tells members the checklist is theirs to complete in full, without claiming Base Camp enforces it', () => {
    const banner = bannerFor('Checklist and Completion', 'Level 1')
    expect(banner?.chip).toBe('REQUIRED')
    expect(banner?.text).toContain('REQUIRED before Level 1 is finished')
    expect(banner?.text).toContain('Complete My Requirements')
    expect(banner?.text).not.toContain('blocked')
  })

  it('falls back to "this level" when the level is unknown', () => {
    expect(bannerFor('Checklist and Completion', '')?.text).toContain('before this level is finished')
  })

  it('says "Complete Your Project" belongs AFTER the speech and evaluation', () => {
    const banner = bannerFor('Complete Your Project', 'Level 1')
    expect(banner?.chip).toBe('AFTER YOUR SPEECH')
    expect(banner?.text).toContain('AFTER you have given your speech and received your evaluation')
    expect(banner?.text).toContain('Save & Email')
  })

  it('shows nothing on other steps', () => {
    expect(bannerFor('Part 1: Get Started', 'Level 1')).toBeNull()
    expect(bannerFor('Complete Your Assignment', 'Level 1')).toBeNull()
  })
})

describe('parseMinimumRequired', () => {
  it('reads the number from the Electives page text', () => {
    expect(parseMinimumRequired('Select...\nMinimum of 2 Required Projects\n1 of 2 Completed')).toBe(2)
    expect(parseMinimumRequired('Minimum of 1 Required Project')).toBe(1)
  })
  it('returns null when the text is not there', () => {
    expect(parseMinimumRequired('Choose your electives')).toBeNull()
  })
})

describe('recordMinimum', () => {
  it('adds a level and stamps the time it was read', () => {
    expect(recordMinimum({}, 'Level 3', 2, 100)).toEqual({ 'Level 3': { min: 2, savedAt: 100 } })
  })
  it('returns null when nothing changed, so nothing needs saving', () => {
    expect(recordMinimum({ 'Level 3': { min: 2, savedAt: 1 } }, 'Level 3', 2, 100)).toBeNull()
  })
  it('updates when the required number changed', () => {
    expect(recordMinimum({ 'Level 3': { min: 2, savedAt: 1 } }, 'Level 3', 3, 100)).toEqual({ 'Level 3': { min: 3, savedAt: 100 } })
  })
})

describe('whereParts: the "You are here" chips', () => {
  it('shows path › level › project › step on a lesson page', () => {
    expect(
      whereParts({ breadcrumb: { names: ['Presentation Mastery', 'Level 1', 'Ice Breaker'], lastItemText: '', unitNumber: '3 of 14' }, hasPathCards: false }),
    ).toEqual([
      ['path', 'Presentation Mastery'],
      ['level', 'Level 1'],
      ['project', 'Ice Breaker'],
      ['step', 'Step 3 of 14'],
    ])
  })
  it('marks a checklist as required in the trail', () => {
    const parts = whereParts({ breadcrumb: { names: ['Presentation Mastery', 'Level 1', 'Level 1: Mastering Fundamentals'], lastItemText: '', unitNumber: '2 of 2' }, hasPathCards: false })
    expect(parts[2]).toEqual(['req', 'Level 1: Mastering Fundamentals'])
  })
  it('uses the last breadcrumb item as the path on an Overview (breadcrumb has only Home as a link)', () => {
    expect(whereParts({ breadcrumb: { names: [], lastItemText: 'Visionary Communication', unitNumber: '' }, hasPathCards: false })).toEqual([['path', 'Visionary Communication']])
  })
  it('invites you to open a path on the home page', () => {
    expect(whereParts({ breadcrumb: null, hasPathCards: true })).toEqual([['path', 'Pick a Path to open']])
  })
  it('is empty when there is nothing to show', () => {
    expect(whereParts({ breadcrumb: null, hasPathCards: false })).toEqual([])
  })
})

describe('nextUpText', () => {
  it('is null with nothing to show', () => {
    expect(nextUpText(null)).toBeNull()
    expect(nextUpText(undefined)).toBeNull()
  })
  it('names a single next item', () => {
    expect(nextUpText({ level: 'Level 1', titles: ['Ice Breaker'], pick: false })).toBe('★ Next up: Level 1 › Ice Breaker (from your last Overview visit)')
  })
  it('says "pick another elective" for the chooser', () => {
    expect(nextUpText({ level: 'Level 3', titles: ['Electives'], pick: true })).toBe(
      '★ Next up: Level 3 › Electives (pick another elective) (from your last Overview visit)',
    )
  })
  it('lists several electives as "any one of"', () => {
    expect(nextUpText({ level: 'Level 3', titles: ['A', 'B'], pick: false })).toBe('★ Next up: Level 3 › any one of: A · B (from your last Overview visit)')
  })
})
