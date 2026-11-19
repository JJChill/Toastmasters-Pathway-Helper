export interface Assignment {
  /** The sentence members copy onto their paper form. */
  purpose: string | null
  /** How long the speech should be, in words, e.g. "5 to 7 minutes". */
  time: string | null
}

/** What to tell a member about a resource link in a project step, or null when there is nothing to say. */
export const printNoteFor = (linkText: string): string | null =>
  /evaluation resource/i.test(linkText) ? 'Print this for your evaluator to use when you give your speech' : null

/** Reads a project's "Your Assignment" text. */
export const parseAssignment = (pageText: string): Assignment => {
  const purpose = /purpose:\s*(.+)/i.exec(pageText)?.[1]?.trim() ?? null
  // "5- to 7-minute", "4 to 6 minute", "4–6 minute", "8 to 10 minutes", or a single "10-minute".
  const range = /(\d+)\s*-?\s*(?:to|-|–|—)\s*(\d+)\s*-?\s*minute/i.exec(pageText)
  const single = /(\d+)\s*-?\s*minute/i.exec(pageText)
  const time = range ? `${range[1]} to ${range[2]} minutes` : single ? `${single[1]} minutes` : null
  return { purpose, time }
}
