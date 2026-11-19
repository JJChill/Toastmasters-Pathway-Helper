# Toastmasters Pathways Helper

- `extension/`: **Pathways Highlighter**, a Chrome (Manifest V3) extension for Base Camp.
  Colours PATH (purple), LEVEL (blue), PROJECT (orange), REQUIRED checklist/completion items (crimson),
  STEP (grey), AFTER SPEECH (teal); badges DONE / TO DO / ★ NEXT; a "You are here" box; Alt+H toggles it.
- `pathways-handout.html`: printable two-page A4 cheat sheet (File → Print → Save as PDF, A4, background graphics on).
- `guide/pathways-guide.html`: the step-by-step companion (A4, about 11 pages): glossary, then one section per
  situation (new, before a speech, after a speech, finishing a level, finishing a path, lost), each with annotated
  screenshots of the real Base Camp site in `guide/img/`. Print it the same way.
- `src/`, `tests/`: the source (TypeScript) the extension is built from. See `CLAUDE.md`.

## Install the extension (no Node needed)
1. Open `chrome://extensions`, turn on **Developer mode**.
2. **Load unpacked** → choose the `extension` folder.
3. Open Base Camp. Visit a path's **Overview** once so ★ NEXT can be worked out (it auto-clicks "Expand all").
   Open each level's **Electives** page once so it can read how many electives the level requires.

Read-only: it only adds colours/labels. Progress info is kept in the site's own localStorage; nothing is sent anywhere.

## Develop
```bash
npm install
npm run check      # typecheck + tests + build + probity scope report
```
Rebuild with `npm run build` after changing `src/`; then reload the extension at `chrome://extensions`.
