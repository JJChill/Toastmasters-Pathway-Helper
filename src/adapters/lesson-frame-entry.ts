/*
 * Pathways Highlighter: lesson frame entry.
 *
 * Base Camp shows each lesson inside an iframe (basecamp.toastmasters.org/xblock/...). The main script can't
 * look inside it, so this small second script runs in that frame. Read-only: it adds one note above the
 * "Purpose" line of a project's assignment and highlights that line. Nothing leaves the browser.
 *
 * What is the purpose / speech time is decided in src/core/assignment.ts; this file only reads and paints.
 */
import { parseAssignment, printNoteFor } from '../core/assignment'

const BOX_ID = 'tm-assignment'

const purposeParagraph = (): HTMLElement | null =>
  Array.from(document.querySelectorAll<HTMLElement>('p, li, div')).find(
    (el) => /^\s*purpose:/i.test(el.innerText ?? '') && !el.querySelector('p, li, div'),
  ) ?? null

function paint(): void {
  if (document.getElementById(BOX_ID)) return
  const paragraph = purposeParagraph()
  if (!paragraph) return
  const { purpose, time } = parseAssignment(document.body.innerText ?? '')
  if (!purpose) return

  paragraph.classList.add('tm-purpose-line')
  const box = document.createElement('div')
  box.id = BOX_ID
  box.setAttribute('role', 'note')
  const chip = document.createElement('span')
  chip.className = 'tm-assignment-chip'
  chip.textContent = 'FOR YOUR PAPER FORM'
  const lines = document.createElement('span')
  lines.textContent = time ? `Purpose: the line below. Speech time: ${time}.` : 'Purpose: the line below.'
  box.append(chip, lines)
  paragraph.parentNode?.insertBefore(box, paragraph)
}

/** Marks the Evaluation Resource link, and tells the main page which step lists it (it can't see inside this frame). */
function paintResources(): void {
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a')) {
    const note = printNoteFor(link.textContent ?? '')
    if (!note || link.dataset.tmPrint) continue
    link.dataset.tmPrint = '1'
    const chip = document.createElement('span')
    chip.className = 'tm-print-chip'
    chip.textContent = `🖨 ${note}`
    link.insertAdjacentElement('afterend', chip)
    if (window.parent !== window) window.parent.postMessage({ tmHelper: 'evaluationResource' }, 'https://apps.basecamp.toastmasters.org')
  }
}

/** Tell the main page when a Successful Club Series presentation is chosen (it can't see inside this frame). */
function reportClubSeries(): void {
  if (window.parent === window) return
  if (!/successful club series/i.test(document.body.innerText ?? '')) return
  if (!document.querySelector('input[type="radio"]:checked')) return
  window.parent.postMessage({ tmHelper: 'clubSeries', picked: true }, 'https://apps.basecamp.toastmasters.org')
}

let timer: ReturnType<typeof setTimeout> | undefined
new MutationObserver(() => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    paint()
    paintResources()
    reportClubSeries()
  }, 250)
}).observe(document.documentElement, { childList: true, subtree: true })
paint()
paintResources()
reportClubSeries()
document.addEventListener('change', reportClubSeries)
