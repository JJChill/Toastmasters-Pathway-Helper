# Pathways Highlighter (Toastmasters Pathways helper)

A Chrome extension (Manifest V3) that colour-codes Toastmasters Base Camp so members can tell a Path from a
Level from a Project, and see what is NEXT. Plus a printable two-page A4 cheat sheet (`pathways-handout.html`) and a step-by-step guide with screenshots (`guide/pathways-guide.html`).

Vocabulary: `docs/GLOSSARY.md`. Use those terms verbatim. Behaviour in member language: `docs/specs/*.feature`.

## Layout (ports and adapters)

| Path | What | Rules |
|------|------|-------|
| `src/core/` | Pure decisions over plain data (what is NEXT, chip labels, banners, electives). | No `document`, `window`, `localStorage`, `chrome`, `Date.now()`. Time comes in as a parameter. TDD enforced. |
| `src/adapters/` | Thin glue: read the page into plain data, paint attributes, localStorage, legend panel, entry point. | No decisions here. If you are writing an `if` about *what the member should do*, it belongs in core. |
| `tests/` | Vitest, **node** environment (no jsdom) so a browser global leaking into core throws. | Real data from Base Camp is the fixture (Presentation Mastery L1, Visionary Communication L3). |
| `extension/` | `manifest.json`, `content.css`, and the **generated** `content.js`. | Never edit `content.js` by hand: `npm run build`. Keep this folder free of Node files (Chrome rejects `_`-prefixed ones). |

## Commands

- `npm test`: unit tests. `npm run typecheck`: app + a DOM-free check of `src/core`.
- `npm run build`: bundle `src/adapters/content-entry.ts` to `extension/content.js` (the path the manifest loads).
- `npm run spec`: spec↔test parity (every scenario in `docs/specs` claimed by a test in `tests/acceptance`).
- `npm run scope`: `probity-scope-report --strict`. Run after moving files or changing globs; no DEAD SCOPE allowed.
- `npm run check`: all of the above.

After a build, reload the extension at `chrome://extensions` (circular arrow), then reload Base Camp.

## Probity (enforced guardrails)

`probity.config.ts` + a PreToolUse hook in `.claude/settings.json` (via `probity-claude`) block, before they run:
production code in `src/core` without a failing test first, browser/vendor imports in core, internal-module mocks in
tests, and `git commit` without a green test run. The agent-skills plugin (`/spec`, `/plan`, `/build`, `/test`,
`/review`, `/ship`, `/probity-update`) is installed at project scope.

Keep the hook command anchored with `cd "$CLAUDE_PROJECT_DIR" &&`; a bare relative path fails non-blocking and
silently stops enforcing. Use `/probity-update` to upgrade rather than editing by hand.

The hook is only live for Claude Code (also Codex, Copilot CLI, Kiro). Other agents (Cursor, Gemini CLI,
Windsurf) get the skills but **no gates**: do not assume enforcement there.

## Things that bit us (keep these true)

- Saved state in the site's localStorage keeps its v1 key names and shapes: `tmHelper.status.<course>`
  (`items`, `next.titles`, `pickMore`), `tmHelper.electives.<course>`, `tmHelper.on`, `tmHelper.collapsed`. Added later: `tmHelper.clubSeries.<course>`
  (level → true once a Successful Club Series presentation is chosen; relayed by the lesson frame via `postMessage`).
- NEXT prefers the first unfinished *project*; the checklist/completion items are listed first/last but are
  finished after the projects. Every picked-but-unfinished elective is NEXT (we cannot tell which is in progress).
- Base Camp does not enforce the checklist boxes, so banners say "do all of it", never "it is blocked".
- Lessons and the checklist live in a cross-origin iframe (`basecamp.toastmasters.org/xblock/*`). The main script
  (`content.js`) can only put a banner above it. A second script, `src/adapters/lesson-frame-entry.ts` →
  `extension/lesson.js` (own `content_scripts` block, `all_frames`), runs *inside* the frame and marks the project
  Purpose and speech time (`src/core/assignment.ts`). Don't turn on `all_frames` for the main script.
- The frame's DOM is not reachable from the debugging tools (the page blocks it), so frame wording is verified by
  screenshot only. The Purpose/time fixtures come from Visionary Communication "Develop a Communication Plan".
- Specs in `docs/specs` are plain Gherkin, not run by a Gherkin runner. Each scenario is claimed by a Vitest test in
  `tests/acceptance/` via `// Covers: <spec>.feature :: Scenario: <title>`; `npm run spec` fails on an unclaimed
  scenario or a dangling tag. Change a scenario → change the test that claims it. Retrofitted specs were
  mutation-checked (each fails when its behaviour is broken).
- The cheat sheet and the guide use Base Camp's own words for anything on screen, verified on the live site:
  **Complete My Project** (button on the last step of every project, **Before You Move On**; replaced by "Your project is
  marked complete." once done), **Complete My Requirements** (bottom of **Checklist and Completion**), and **Submit** on
  **Level N Completion** / **Path Completion** (with a Club dropdown; greyed out, with a red banner, until the earlier work is
  complete). Re-check these on the site before changing them; they are different buttons in different places.
- Guide screenshots (`guide/img/`) are plain Base Camp, extension off. Mask personal details (member name, club name) before
  saving; the figure markers are percentages of the image, so re-taking a screenshot at a different scroll position means
  re-measuring its boxes. Never press the action buttons (Complete My Project/Requirements, Submit, Save & Email) while capturing:
  they change real progress.
