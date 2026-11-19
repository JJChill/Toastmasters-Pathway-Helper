import { bannerFor, type Banner } from '../core/banners'
import { crumbKind, kindOf } from '../core/classify'
import { parseMinimumRequired } from '../core/electives'
import type { BreadcrumbInput } from '../core/location'
import type { PlannedWrapper, SidebarWrapperInput } from '../core/types'
import { mark, markRow, q, qa, setAttr, txt } from './dom'

const BREADCRUMB = 'nav[aria-label="breadcrumb"]'

/** The page has two breadcrumbs (mobile + desktop); style both. */
export function paintBreadcrumbs(): void {
  for (const crumb of qa(BREADCRUMB)) {
    qa('a', crumb).forEach((a, i) => setAttr(a, 'data-tm-crumb', crumbKind(i, txt(a))))
    setAttr(q('.unit-number', crumb), 'data-tm-crumb', 'step')
  }
}

/** What the "You are here" chips are built from. Null when there is no breadcrumb. */
export function readBreadcrumb(): BreadcrumbInput | null {
  const crumb = q(BREADCRUMB)
  if (!crumb) return null
  return {
    names: qa('a', crumb).slice(1).map(txt),
    lastItemText: txt(q('ol > li:last-child', crumb)),
    unitNumber: txt(q('.unit-number', crumb)),
  }
}

export const hasPathCards = (): boolean => !!q('.MuiCardActionArea-root')

/** On an Electives page: which level, and how many electives it requires. */
export function readElectivesRequirement(): { level: string; min: number } | null {
  const links = qa(BREADCRUMB + ' a')
  if (!links.some((a) => kindOf(txt(a)) === 'choose')) return null
  const level = txt(links[2])
  const text = (q<HTMLElement>('main') ?? document.body).innerText ?? ''
  const min = parseMinimumRequired(text)
  return level && min !== null ? { level, min } : null
}

/** Marks the path cards on the Base Camp home page. */
export function paintDashboard(): void {
  for (const button of qa('.MuiCardActionArea-root')) {
    const heading = q('h3', button)
    if (!heading) continue
    mark(heading, 'path', null)
    markRow(button.closest('.MuiPaper-root'), 'path', null)
  }
}

/* ---- sidebar ---- */

export const currentLevel = (): string => txt(q('.course-section-title'))

export function readSidebar(): { wrappers: SidebarWrapperInput[]; elements: Element[] } {
  const elements = qa('.nav-link-wrapper')
  const wrappers = elements.map((w) => ({
    title: txt(q('a.nav-link .nav-title', w)),
    steps: qa('a.subNav-link', w).map((s) => ({ title: txt(q('.nav-title', s)), srText: txt(q('.sr-only', s)) })),
  }))
  return { wrappers, elements }
}

export function paintSidebar(elements: Element[], plan: PlannedWrapper[]): void {
  qa('.course-overview .course-title').forEach((el) => mark(el, 'path', null))
  const level = q('.course-section-title')
  if (level) mark(level, 'level', null)

  elements.forEach((wrapper, i) => {
    const planned = plan[i]
    const titleEl = q('a.nav-link .nav-title', wrapper)
    if (!planned || !titleEl || !txt(titleEl)) return
    mark(titleEl, planned.kind, planned.state)
    markRow(wrapper, planned.kind, planned.state)
    qa('a.subNav-link', wrapper).forEach((step, j) => {
      const plannedStep = planned.steps[j]
      const title = q('.nav-title', step)
      if (!plannedStep) return
      setAttr(title, 'data-tm-note', plannedStep.note)
      mark(title, plannedStep.kind, plannedStep.state)
    })
  })
}

/* ---- banners above the embedded lesson ---- */

export const activeStepTitle = (): string => txt(q('a.subNav-link.active .nav-title'))

/** Index (in readSidebar's order) of the project the member is currently in, or -1. */
export const activeProjectIndex = (elements: Element[]): number => elements.findIndex((w) => !!q('a.subNav-link.active', w))

/** Index of the step the member is on, inside the project at `projectIndex`. */
export const activeStepIndex = (elements: Element[], projectIndex: number): number =>
  qa('a.subNav-link', elements[projectIndex]).findIndex((step) => step.classList.contains('active'))

/** Lessons live in a cross-origin iframe, so a note is placed just above it. */
function paintBox(id: string, banner: Banner | null): void {
  const wrapper = q('.unit-iframe-wrapper')
  const existing = document.getElementById(id)
  if (!wrapper || !banner) {
    existing?.remove()
    return
  }
  if (existing) {
    if (existing.parentNode === wrapper.parentNode && existing.dataset.tmText === banner.text) return
    existing.remove()
  }
  const box = document.createElement('div')
  box.id = id
  box.className = `tm-banner ${banner.cls}${id === 'tm-hint' ? ' tm-b-hint' : ''}`
  box.dataset.tmText = banner.text
  box.setAttribute('role', 'note')
  const chip = document.createElement('span')
  chip.className = 'tm-banner-chip'
  chip.textContent = banner.chip
  const body = document.createElement('span')
  body.textContent = banner.text
  box.append(chip, body)
  wrapper.parentNode?.insertBefore(box, wrapper)
}

export function paintStepBanner(hint: Banner | null): void {
  paintBox('tm-banner', q('.unit-iframe-wrapper') ? bannerFor(activeStepTitle(), currentLevel()) : null)
  paintBox('tm-hint', hint)
}
