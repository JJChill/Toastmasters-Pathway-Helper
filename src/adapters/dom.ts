import { labelFor } from '../core/classify'
import type { Kind, State } from '../core/types'

export const txt = (el: Element | null | undefined): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim()

export const q = <T extends Element = Element>(selector: string, ctx: ParentNode = document): T | null => ctx.querySelector<T>(selector)

export const qa = <T extends Element = Element>(selector: string, ctx: ParentNode = document): T[] => Array.from(ctx.querySelectorAll<T>(selector))

/** Sets or clears an attribute, touching the DOM only when the value changes (avoids feeding our own observer). */
export function setAttr(el: Element | null | undefined, name: string, value: string | null | undefined): void {
  if (!el) return
  if (value === null || value === undefined || value === '') {
    if (el.hasAttribute(name)) el.removeAttribute(name)
  } else if (el.getAttribute(name) !== value) {
    el.setAttribute(name, value)
  }
}

/** Puts the coloured chip (kind + status) in front of an element's text. */
export function mark(el: Element | null | undefined, kind: Kind, state: State | null): void {
  setAttr(el, 'data-tm', kind)
  setAttr(el, 'data-tm-label', labelFor(kind, state))
  setAttr(el, 'data-tm-s', state ?? '')
}

/** Colours the row (left edge) and highlights it when it is NEXT. */
export function markRow(el: Element | null | undefined, kind: Kind, state: State | null): void {
  setAttr(el, 'data-tm-row', kind)
  setAttr(el, 'data-tm-state', state === 'next' ? 'next' : '')
}

/** e.g. "course-v1:Toastmasters+8704+08_18_2023" (empty when not on a course page). */
export function courseId(): string {
  try {
    return decodeURIComponent(location.pathname).match(/course-v1:[^/]+/)?.[0] ?? ''
  } catch {
    return ''
  }
}
