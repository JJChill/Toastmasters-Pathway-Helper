/**
 * Probity config for the Pathways Highlighter.
 *
 * Layout this config assumes (see CLAUDE.md):
 *   src/core/      pure decisions, no browser APIs      -> boundary + TDD enforced
 *   src/adapters/  thin glue to the page / storage      -> TDD not enforced (no unit tests; verified in the browser)
 *   tests/         vitest, node environment             -> the only test seam
 *   extension/     generated bundle + manifest + CSS    -> never edited by hand, never gated
 */
import { fileURLToPath } from 'node:url'
import { claudeJudge, probityConfig } from '@jjchill/probity-rules'
import { jsRuleEntries } from '@jjchill/probity-rules/presets/js'

export default probityConfig({
  rules: jsRuleEntries({
    // Domain logic only. Adapters touch document/localStorage by design and must NOT match.
    coreGlobs: ['src/core/**'],

    // The TDD gate costs an AI call per matching write, so scope it to the code that is unit-tested.
    tddGlobs: ['src/core/**', 'tests/**'],

    // No internal mocking in tests: the only seam is a port (core takes plain data, adapters are not mocked).
    mockGlobs: ['tests/**'],

    // Specs are written in member language (docs/specs); tests/acceptance claims each scenario (`npm run spec`).
    specGlobs: ['docs/specs/**/*.feature'],
    fixedWaitGlobs: [],

    // Costs an AI call per write; the adapters are small and verified in a real browser instead.
    drivingAdapterGlobs: [],

    // Domain vocabulary (ubiquitous-language skill).
    glossaryPath: fileURLToPath(new URL('./docs/GLOSSARY.md', import.meta.url)),

    // `npm test` and `npx vitest run` both count; vitest prints "Test Files  N passed" when green.
    commitCommand: /^\s*(npm\s+(run\s+)?test|npx\s+vitest(\s+run)?|vitest(\s+run)?)\b/,

    // Generated output and the printable handout are not source.
    excludeGlobs: ['extension/content.js', 'extension/lesson.js', 'pathways-handout.html', 'spikes/**', '**/build/**'],
  }),
  // The installed Claude Code judges, not a copy bundled with Probity's Agent SDK.
  ai: claudeJudge(),
})
