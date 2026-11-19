import { KIND_LABELS } from '../core/classify'
import type { WherePart } from '../core/location'
import type { Kind } from '../core/types'
import { isLegendCollapsed, saveLegendCollapsed } from './storage'

/** Same colours as content.css. */
const COLORS: Record<Kind, string> = {
  path: '#6a2c91',
  level: '#0b5fa5',
  project: '#b45309',
  req: '#b3123f',
  step: '#4b5563',
  after: '#0f766e',
  choose: '#b45309',
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}

const swatch = (kind: Kind, text?: string): HTMLSpanElement => {
  const s = el('span', 'tm-sw', text ?? KIND_LABELS[kind])
  s.style.background = COLORS[kind]
  return s
}

const legendRow = (kind: Kind, description: string): HTMLDivElement => {
  const row = el('div', 'tm-row')
  row.append(swatch(kind), el('span', 'tm-d', description))
  return row
}

let panel: HTMLElement | null = null
let lastWhere = ''

export function buildLegend(isOn: () => boolean, onToggle: (on: boolean) => void): void {
  if (panel || !document.body) return
  const root = el('div')
  root.id = 'tm-legend'
  if (isLegendCollapsed()) root.classList.add('tm-collapsed')

  const head = el('button', 'tm-head')
  head.type = 'button'
  head.append(el('span', undefined, 'Pathways Highlighter'), el('span', 'tm-chev'))
  const reflectState = (): void => {
    const open = !root.classList.contains('tm-collapsed')
    head.setAttribute('aria-expanded', String(open))
    head.title = open ? 'Click to minimise' : 'Click to open'
  }
  reflectState()
  head.addEventListener('click', () => {
    root.classList.toggle('tm-collapsed')
    saveLegendCollapsed(root.classList.contains('tm-collapsed'))
    reflectState()
  })

  const body = el('div', 'tm-body')
  const where = el('div', 'tm-where')
  where.id = 'tm-where'
  const nextBox = el('div', 'tm-next')
  nextBox.id = 'tm-nextbox'
  nextBox.style.display = 'none'

  const toggleLabel = el('label', 'tm-toggle')
  const checkbox = el('input')
  checkbox.type = 'checkbox'
  checkbox.id = 'tm-toggle'
  checkbox.checked = isOn()
  checkbox.addEventListener('change', () => onToggle(checkbox.checked))
  toggleLabel.append(checkbox, el('span', undefined, 'Highlights on '), el('small', undefined, '(Alt+H)'))

  body.append(
    el('h4', undefined, 'You are here'),
    where,
    nextBox,
    el('h4', undefined, 'Colour key'),
    legendRow('path', 'The whole program, e.g. Presentation Mastery.'),
    legendRow('level', 'A stage inside a path. Levels 1–5.'),
    legendRow('project', 'A speech/assignment you do in your club.'),
    legendRow('req', 'Checklist, requirements & completion items. Easy to miss – needed to finish the level!'),
    legendRow('step', 'A page inside a project.'),
    legendRow('after', 'Fill in only AFTER you have given your speech and been evaluated.'),
    el('h4', undefined, 'Status'),
    el('div', undefined, '✔ DONE · TO DO · ★ NEXT (first thing not yet complete)'),
    toggleLabel,
  )
  root.append(head, body)
  document.body.appendChild(root)
  panel = root
}

/** Keeps the checkbox in step with the keyboard shortcut. */
export function syncToggle(on: boolean): void {
  const checkbox = document.getElementById('tm-toggle') as HTMLInputElement | null
  if (checkbox) checkbox.checked = on
}

export function updateLegend(parts: WherePart[], nextText: string | null): void {
  if (!panel) return
  const where = document.getElementById('tm-where')
  const key = JSON.stringify(parts)
  if (where && key !== lastWhere) {
    lastWhere = key
    where.replaceChildren()
    if (parts.length === 0) where.appendChild(el('small', undefined, 'Open a Path to see where you are.'))
    parts.forEach(([kind, text], i) => {
      if (i) where.appendChild(document.createTextNode('›'))
      where.appendChild(swatch(kind, text))
    })
  }
  const nextBox = document.getElementById('tm-nextbox')
  if (!nextBox) return
  if (nextText) {
    if (nextBox.textContent !== nextText) nextBox.textContent = nextText
    nextBox.style.display = ''
  } else {
    nextBox.style.display = 'none'
  }
}
