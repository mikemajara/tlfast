**Browser Extension for tldraw.com Enhancements – Brief PRD**

### 1. Product Overview
**Name**: tldraw Power Tools (or "tldraw Enhancer")
**Type**: Browser extension (Chrome + Firefox, using Manifest V3)
**Goal**: Provide quick wins for power users on the public **tldraw.com** without self-hosting or forking the full SDK. Add a command palette, tool/style presets, theming options, and accessibility tweaks by injecting UI and hooking into the existing tldraw editor instance.

**Scope**: Non-multiplayer focus. Layer on top of tldraw.com (no backend/sync changes). Use Tampermonkey-compatible userscript as fallback/MVP.

**Non-Goals**: Full UI replacement, multiplayer features, complex persistence (keep it lightweight), deep custom shapes.

### 2. Target Users & Use Cases
- Frequent tldraw.com users frustrated with repetitive tool/style switching (e.g., specific arrow configurations).
- Users wanting faster navigation (tools, colors, common actions).
- Accessibility-focused users or those preferring custom themes/keyboard-driven workflows.
- Indie hackers / designers who want quick customization without deploying their own instance.

**Key Pain Points Addressed**:
- Repetitive granular settings (arrow heads, styles, colors, etc.).
- No fast command access.
- Limited theming / visual customization.
- Basic accessibility gaps for keyboard/power users.

### 3. Core Features (MVP)

#### 1. Command Palette (⌘/Ctrl + K or configurable)
- Fuzzy search for:
  - Tools (select, draw, arrow, text, etc.).
  - Styles/actions (colors, dash styles, fills, opacity, arrow variants).
  - Common editor commands (undo, group, align, duplicate, export variants, toggle grid, etc.).
  - Custom user-defined actions/presets.
- Keyboard-navigable results with highlights.
- Recent commands / smart suggestions.
- Trigger from anywhere on tldraw.com (when editor is active).

#### 2. Saved Tool/Style Presets
- Quick-save current style combination (color + stroke + dash + arrow style/head + size + fill, etc.).
- Named presets (e.g., "Thick Dashed Arrow – Blue", "UI Wireframe Pen").
- Quick-switch via palette, toolbar button, or hotkeys (e.g., ⌘1, ⌘2).
- Global + per-document presets (localStorage).
- One-click "Apply to Selection" or "Set as Default for Next Shapes".

#### 3. Theming & Styles
- Quick theme switcher (light/dark + 3-4 custom presets like high-contrast, Solarized-inspired, dark pro).
- Inject CSS variables to override tldraw UI (toolbar, panels, canvas background).
- Option to persist theme choice.

#### 4. Accessibility & Keyboard Improvements
- Enhanced keyboard shortcuts (extend existing ones).
- Better focus indicators / visible labels toggle.
- Quick accessibility mode toggle (enlarged UI, reduced motion enforcement).
- Optional screen reader friendly announcements or tooltips.

#### 5. UI Integration
- Floating minimal toolbar/palette trigger button (toggleable).
- Optional side panel for presets/themes.
- Non-intrusive: respects tldraw.com updates as much as possible.

### 4. Technical Approach (MVP)
- **Manifest V3 Extension** with:
  - Content script injected on `https://www.tldraw.com/*` (and subpaths).
  - Access tldraw's global `editor` instance (common pattern on the site).
  - Use `MutationObserver` / event listeners to detect editor readiness.
- **Storage**: `chrome.storage.local` for presets/themes/settings.
- **UI**: React (bundled) or vanilla + lightweight components (e.g., CmdK-style list).
- **Fallback**: Tampermonkey userscript for rapid testing.
- **Permissions**: `storage`, `activeTab`, host permissions for tldraw.com.

**Risks / Limitations**:
- Brittle if tldraw.com changes internal APIs (mitigate with defensive checks + graceful fallback).
- No deep persistence across tldraw updates.
- Rate limits or conflicts with tldraw's own UI.

### 5. Success Metrics & Roadmap
- **MVP Success**: Command palette + 2-3 presets work reliably; < 1 week to basic prototype.
- **Phase 2**: More presets, export/import, better theming, settings page.
- **Phase 3 (optional)**: Self-host mode sync or advanced a11y.

### 6. Technical Discoveries

**Editor API availability:**
- `window.editor` is exposed on tldraw.com with all expected methods: `setCurrentTool`, `getSelectedShapeIds`, `undo`, `redo`, `setStyleForNextShapes`, `setStyleForSelectedShapes`, `updateInstanceState`, `getInstanceState`, `duplicateShapes`, `deleteShapes`, `groupShapes`, `ungroupShapes`, `selectAll`, `selectNone`, `zoomIn`, `zoomOut`, `zoomToFit`, `zoomToSelection`.

**Style API:**
- `editor.setStyleForNextShapes(style, value)` sets default style for next shapes.
- `editor.setStyleForSelectedShapes(style, value)` sets style on selected shapes.
- Geo shape sub-type (rectangle, ellipse, triangle, etc.) is set via a style object, not as a separate tool. The style object is not directly on `window` but can be found via `editor.getSharedStyles()` iteration or by ID.
- `editor.setCurrentTool('geo')` activates the geo tool; the shape type is determined by the current geo style.

**Extension architecture:**
- Vite + React + TypeScript content script bundle.
- React 18 bundled explicitly (no dependency on host page React version).
- Command palette mounted as fixed overlay on `document.body`.
- Fuzzy search on label + id with substring and character containment matching.

### 7. Next Steps
1. ✅ Scaffold MV3 extension with Vite + React (done).
2. ✅ Prototype command palette with core commands (done).
3. Test on tldraw.com with unpacked extension.
4. Iterate on command coverage based on user feedback.
5. Add style/color presets (Phase 2).
6. Add theming (Phase 2).
