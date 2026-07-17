# Backlog Memory

## Decisions
- **Extension directly**, not userscript MVP. Chrome only for now.
- **Bundled React 18** via Vite, not vanilla JS. Keeps components reusable for theming/presets later.
- **Palette-only MVP** first. Presets and theming in Phase 2.
- Hotkey: `⌘/Ctrl + K` (no collision on tldraw.com).

## Blockers
- None currently. `window.editor` confirmed available with full API.
- Style constants (`GeoShapeGeoStyle`, `DefaultColorStyle`) are not directly on `window` but accessible via `editor.getSharedStyles()` or by probing. Our `findStyle()` helper handles this defensively.

## Project Conventions
- Source in `src/`, build to `dist/`.
- `src/commands/index.ts` is the source of truth for all command definitions.
- Fuzzy search: substring match + character containment (not Levenshtein).
- All command actions receive `(editor: any)` — no type safety on tldraw's API yet.

## Gotchas
- **Geo shape type ambiguity:** `setCurrentTool('geo')` doesn't specify rectangle vs ellipse. The shape type is controlled by a style prop. We set the style before switching the tool. If the style object isn't found, the tool still activates — user just gets the default geo shape.
- **React bundling:** We bundle React into `content.js` to avoid version conflicts with tldraw.com's React. Bundle size is ~148KB / 47KB gzipped.
- **Extension loading:** Chrome requires `chrome://extensions` → Developer mode → Load unpacked → select `dist/` folder. Must rebuild after each code change.
