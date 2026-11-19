/*
 * Pathways Highlighter: content script entry (composition root).
 *
 * Read-only: it only adds data-* attributes and a legend panel. It never changes your progress and never
 * sends data anywhere. (It does click the Overview's "Expand all" so every level is visible.) What it
 * remembers lives in this site's own localStorage.
 *
 * All decisions are made in src/core (pure, unit-tested); this file only wires the page to them.
 */
import { purposeHint } from '../core/banners'
import { recordMinimum } from '../core/electives'
import { nextUpText, whereParts } from '../core/location'
import { planOverview } from '../core/overview-plan'
import { planSidebar } from '../core/sidebar-plan'
import {
  activeProjectIndex,
  activeStepIndex,
  activeStepTitle,
  currentLevel,
  hasPathCards,
  paintBreadcrumbs,
  paintDashboard,
  paintSidebar,
  paintStepBanner,
  readBreadcrumb,
  readElectivesRequirement,
  readSidebar,
} from './course-page'
import { courseId } from './dom'
import { buildLegend, syncToggle, updateLegend } from './legend'
import { paintOverview, readOverviewPage } from './overview-page'
import {
  isClubSeriesPicked,
  loadEvaluationResourceSteps,
  saveEvaluationResourceStep,
  isHighlightOn,
  loadElectives,
  loadStatus,
  saveClubSeriesPicked,
  saveElectives,
  saveHighlightOn,
  saveStatus,
} from './storage'

declare global {
  interface Window {
    __tmHelperLoaded?: boolean
  }
}

const root = document.documentElement

const setHighlight = (on: boolean): void => {
  saveHighlightOn(on)
  root.classList.toggle('tm-on', on)
  syncToggle(on)
}

function applyOverview(): void {
  const page = readOverviewPage()
  if (!page) return
  const course = courseId()
  const plan = planOverview(
    page.map((section) => section.data),
    loadElectives(course),
  )
  paintOverview(page, plan)
  saveStatus(course, plan.saved, Date.now())
}

function rememberElectivesRequirement(course: string): void {
  const requirement = readElectivesRequirement()
  if (!requirement) return
  const updated = recordMinimum(loadElectives(course), requirement.level, requirement.min, Date.now())
  if (updated) saveElectives(course, updated)
}

function applyCourse(): void {
  const course = courseId()
  paintBreadcrumbs()
  rememberElectivesRequirement(course)
  const { wrappers, elements } = readSidebar()
  const plan = planSidebar({
    level: currentLevel(),
    wrappers,
    saved: loadStatus(course),
    clubSeriesPicked: isClubSeriesPicked(course, currentLevel()),
    evaluationResourceSteps: loadEvaluationResourceSteps(course, currentLevel()),
  })
  paintSidebar(elements, plan)
  const at = activeProjectIndex(elements)
  const inProject = plan[at]?.kind === 'project'
  paintStepBanner(
    inProject
      ? purposeHint({
          stepTitle: activeStepTitle(),
          projectSteps: wrappers[at]?.steps.map((step) => step.title) ?? [],
          projectIsDone: plan[at]?.state === 'done',
        })
      : null,
  )
}

function applyLegend(): void {
  buildLegend(() => root.classList.contains('tm-on'), setHighlight)
  updateLegend(whereParts({ breadcrumb: readBreadcrumb(), hasPathCards: hasPathCards() }), nextUpText(loadStatus(courseId()).next))
}

function apply(): void {
  try {
    paintDashboard()
    applyOverview()
    applyCourse()
    applyLegend()
  } catch (error) {
    console.warn('[Pathways Highlighter]', error)
  }
}

function start(): void {
  if (window.__tmHelperLoaded) return
  window.__tmHelperLoaded = true

  root.classList.toggle('tm-on', isHighlightOn())
  apply()

  // The site is a single-page app: re-apply when it re-renders (ignoring our own legend panel).
  let timer: ReturnType<typeof setTimeout> | undefined
  new MutationObserver((mutations) => {
    if (mutations.every((m) => (m.target as Element).closest?.('#tm-legend'))) return
    clearTimeout(timer)
    timer = setTimeout(apply, 250)
  }).observe(document.body, { childList: true, subtree: true })
  setInterval(apply, 3000)

  // The lesson frame (lesson-frame-entry.ts) tells us when a Successful Club Series presentation is chosen.
  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://basecamp.toastmasters.org') return
    const data = event.data as { tmHelper?: string; picked?: boolean } | null
    if (data?.tmHelper === 'clubSeries' && data.picked === true) {
      saveClubSeriesPicked(courseId(), currentLevel())
      apply()
    } else if (data?.tmHelper === 'evaluationResource') {
      const { wrappers, elements } = readSidebar()
      const project = activeProjectIndex(elements)
      const step = activeStepIndex(elements, project)
      const title = wrappers[project]?.title
      if (title && step >= 0) saveEvaluationResourceStep(courseId(), currentLevel(), title, step)
      apply()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.altKey && event.code === 'KeyH' && !event.ctrlKey && !event.metaKey) {
      event.preventDefault()
      setHighlight(!root.classList.contains('tm-on'))
    }
  })
}

start()
