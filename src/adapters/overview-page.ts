import type { OverviewPlan, OverviewSection } from '../core/types'
import { mark, markRow, q, qa, setAttr, txt } from './dom'

export interface OverviewPageSection {
  data: OverviewSection
  root: Element
  header: Element
  anchors: HTMLAnchorElement[]
}

let expandedOnce = false

/** Opens every level once so all projects are visible. (Only changes what is displayed, never your progress.) */
function expandAllOnce(): void {
  if (expandedOnce) return
  const button = qa<HTMLButtonElement>('button').find((b) => /^\s*expand all\s*$/i.test(b.textContent ?? ''))
  if (button) {
    expandedOnce = true
    button.click()
  }
}

const isIndented = (li: Element | null): boolean => {
  const first = li?.firstElementChild
  return !!first && parseFloat(getComputedStyle(first).marginLeft) > 0
}

/** Reads the path Overview page (levels and their projects). Null when this is not an Overview. */
export function readOverviewPage(): OverviewPageSection[] | null {
  const roots = qa('.pgn_collapsible').filter((c) => q('.collapsible-trigger h3', c))
  if (roots.length === 0) return null
  expandAllOnce()
  return roots.map((root) => {
    const header = q('.collapsible-trigger h3', root) as Element
    const anchors = qa<HTMLAnchorElement>('.collapsible-body li a', root)
    return {
      root,
      header,
      anchors,
      data: {
        name: txt(header),
        lmsDone: !!q('.course-section-serial.completed', root),
        links: anchors.map((a) => ({
          title: txt(a),
          ariaLabel: a.getAttribute('aria-label') ?? '',
          indented: isIndented(a.closest('li')),
        })),
      },
    }
  })
}

export function paintOverview(page: OverviewPageSection[], plan: OverviewPlan): void {
  page.forEach((pageSection, i) => {
    const planned = plan.sections[i]
    if (!planned) return
    mark(pageSection.header, planned.headerKind, planned.headerState)
    markRow(pageSection.root, planned.headerKind, null)
    setAttr(pageSection.header, 'data-tm-note', planned.headerNote)
    pageSection.anchors.forEach((a, j) => {
      const link = planned.links[j]
      if (!link) return
      mark(a, link.kind, link.state)
      setAttr(a, 'data-tm-note', link.note)
      markRow(a.closest('li'), link.kind, link.state)
    })
  })
}
