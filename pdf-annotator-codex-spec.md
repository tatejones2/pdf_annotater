# PDF Annotator — Codex Build Specification

## 1. Project Summary

Build a free, polished, browser-based PDF annotation website using **React**, **TypeScript**, and **Vite**. The application should feel simple enough for a first-time user while still being dependable and well-structured enough for regular use.

The visual direction is **mid-century modern**: warm neutrals, muted accent colors, geometric shapes, restrained shadows, rounded-but-not-overly-soft corners, and clear typography. The interface should be clean, organized, responsive, accessible, and fast.

The initial version must be a **fully client-side static application** that can be hosted for free on **GitHub Pages**. A user's PDF should not be uploaded to a server. PDF loading, annotation, persistence, and export should happen locally in the browser.

Working project name: **Paperwood**. Keep the name easy to replace from a single configuration file.

---

## 2. Primary Product Goal

Create the easiest possible workflow for someone who wants to:

1. Open a PDF from their computer.
2. Read and navigate the document.
3. Add useful annotations.
4. Edit, move, resize, or delete those annotations.
5. Save their work locally.
6. Export a new annotated PDF.

A user should understand the core interface without a tutorial.

---

## 3. Product Principles

### 3.1 Local-first privacy

- Never upload a PDF or its annotations to a server in the initial release.
- Clearly state near the upload area: **“Your document stays on this device.”**
- Avoid analytics that capture document names, document content, annotation text, or file metadata.
- Do not require an account.

### 3.2 Simple before powerful

- Keep the primary toolbar compact.
- Hide advanced controls until they are relevant.
- Use recognizable icons with visible labels or accessible tooltips.
- Avoid modal-heavy workflows.
- Provide sensible defaults for colors, line width, font size, and opacity.

### 3.3 Non-destructive editing

- Keep annotations in a separate application data model while editing.
- Do not permanently flatten annotations into the source file until export.
- Support undo and redo.
- Preserve the original PDF bytes in memory or IndexedDB for the active project.

### 3.4 Static-host compatible

- The application must work on GitHub Pages without a backend.
- Do not depend on server-side rendering, API routes, server storage, authentication, or environment secrets.
- Avoid routing patterns that break when a user refreshes a nested URL on GitHub Pages.

---

## 4. Scope

## 4.1 MVP features

Implement all of the following:

### File handling

- Drag-and-drop PDF upload.
- Standard file picker.
- PDF-only validation.
- Friendly unsupported-file and corrupted-file messages.
- Configurable maximum recommended file size, initially 50 MB.
- Display filename, page count, and file size after loading.
- “Close document” action with an unsaved-changes warning.
- “Open another PDF” action.

### PDF viewing

- Render every page using PDF.js.
- Scroll-based continuous page view.
- Page thumbnails in a collapsible left sidebar.
- Current page indicator.
- Previous-page and next-page controls.
- Jump to page.
- Zoom in, zoom out, fit width, fit page, and reset zoom.
- Keyboard shortcuts for navigation and zoom.
- Text selection when the select tool is active.
- Preserve clickable PDF links when practical.
- Loading progress for larger PDFs.

### Annotation tools

Implement these annotation types:

1. **Select / Pan**
   - Select an annotation.
   - Move it.
   - Resize it when applicable.
   - Pan the page while zoomed.

2. **Text note**
   - Place editable text directly on the page.
   - Change font size, text color, background color, and alignment.
   - Support multiline text.

3. **Sticky note**
   - Place a compact note marker.
   - Open a small editor popover or side panel for its content.
   - Show an indicator when the note contains text.

4. **Highlight**
   - Highlight selected PDF text when text geometry is available.
   - Provide a rectangular freeform highlight fallback.
   - Support color and opacity.

5. **Underline**
   - Underline selected PDF text.
   - Store one or more line segments for wrapped selections.

6. **Freehand pen**
   - Draw smooth strokes with pointer, mouse, or touch.
   - Support color, width, and opacity.
   - Simplify stroke points without visibly damaging the drawing.

7. **Shape**
   - Rectangle.
   - Ellipse.
   - Line.
   - Arrow.
   - Support stroke color, fill color, line width, and opacity.

8. **Eraser / delete**
   - Delete a selected annotation.
   - Optionally allow stroke erasing later; object deletion is sufficient for MVP.

### Editing behavior

- Bounding box and handles for selected resizable annotations.
- Escape clears selection or cancels the active drawing operation.
- Delete and Backspace remove the selected annotation unless the user is editing text.
- Copy and paste selected annotations.
- Duplicate selected annotation.
- Bring forward, send backward, bring to front, and send to back.
- Lock and unlock annotation.
- Undo and redo with at least 100 history entries.
- Dirty-state tracking.

### Annotation organization

- Right sidebar with an annotation list.
- Filter by type, page, and color.
- Clicking a list item navigates to and selects the annotation.
- Allow editing note content from the sidebar.
- Show total annotation count.

### Persistence

- Autosave the active project to IndexedDB.
- Save original PDF bytes, document metadata, annotations, and last-view state.
- Restore the most recent project after a refresh, but ask before reopening it.
- Provide “Save project” and “Load project” using a portable JSON-based project file.
- Use a custom extension such as `.paperwood.json`, while keeping the contents valid JSON.
- Include a schema version in every saved project.

### Export

- Export a new PDF with annotations flattened onto the pages.
- Preserve the original page dimensions and orientation.
- Draw supported annotation types using `pdf-lib`.
- Embed text with a standard font first; optionally embed a bundled open-source font later.
- Convert browser coordinates to PDF coordinates correctly.
- Preserve annotation opacity and approximate styling.
- Download as `<original-name>-annotated.pdf`.
- Show export progress and a success toast.
- Warn that exported annotations are flattened and may not remain independently editable in other PDF applications.

### General UX

- Responsive desktop and tablet layout.
- Usable mobile layout for viewing and light annotation, though desktop is the primary target.
- Light theme for MVP.
- Toast notifications.
- Confirmation dialogs only for destructive actions.
- Empty states, loading states, and error states.
- Visible keyboard focus.
- Tooltips for icon-only controls.
- First-use compact help panel with keyboard shortcuts.

---

## 4.2 Explicitly out of scope for MVP

Do not build these unless all MVP acceptance criteria are complete:

- User accounts.
- Cloud storage.
- Real-time collaboration.
- Shared links.
- Backend APIs.
- Digital signatures or certificate-based signing.
- OCR.
- PDF page editing, reordering, merging, splitting, or deleting.
- Form creation.
- Redaction with legal-grade content removal.
- Comments with threaded replies.
- Mobile native applications.
- Paid plans.
- AI features.

Leave clean extension points for future features, but do not over-engineer them.

---

## 5. Recommended Technology Stack

Use current stable versions that are mutually compatible at implementation time.

### Core

- React
- TypeScript with strict mode
- Vite
- npm

### PDF

- `pdfjs-dist` for loading and rendering PDF pages, text layers, and link/annotation layers.
- `pdf-lib` for generating the exported annotated PDF.

### State and persistence

- Zustand for editor/application state.
- Immer middleware or immutable update patterns for history-safe mutations.
- Dexie for IndexedDB persistence.

### Interaction and geometry

Preferred approach:

- Render each PDF page to a PDF.js canvas.
- Add a positioned HTML/SVG annotation overlay above each page.
- Use SVG for shapes, highlights, underlines, and freehand paths.
- Use absolutely positioned HTML elements for editable text and sticky-note UI.
- Use pointer events rather than separate mouse and touch implementations.

Possible helper libraries:

- `react-rnd` for movable/resizable HTML annotations, if its behavior remains reliable under zoom.
- `perfect-freehand` for smoothing pen strokes.
- `nanoid` for stable annotation IDs.
- `zod` for validating imported project files.

Avoid a large canvas framework unless it materially simplifies coordinate handling. If using Fabric.js or Konva, document why it is preferable and verify that text selection, PDF text layers, accessibility, zoom, export, and multi-page rendering remain maintainable.

### UI

- CSS Modules or a well-organized global CSS token system.
- Lucide React icons.
- Radix UI primitives for accessible popovers, dialogs, dropdown menus, tabs, sliders, and tooltips.
- Do not use a visually opinionated component library that fights the mid-century design.

### Testing and quality

- Vitest
- React Testing Library
- Playwright
- ESLint
- Prettier
- TypeScript type checking

---

## 6. Technical Architecture

## 6.1 Layer model

Each PDF page should be represented by stacked layers inside a relatively positioned page container:

```text
PageContainer
├── PDF canvas layer
├── PDF text layer
├── PDF link/native annotation layer
├── App annotation SVG layer
├── App annotation HTML layer
└── Interaction/selection handles layer
```

Suggested stacking rules:

- PDF canvas: bottom.
- PDF text and native link layers: above canvas.
- User-created annotations: above PDF layers.
- Selection handles and active editing UI: top.

The active tool decides which layer receives pointer events. For example:

- Select-text mode enables pointer events on the PDF text layer.
- Pen mode disables text selection and captures pointer movement in the annotation layer.
- Select-annotation mode gives existing annotations pointer events.

## 6.2 Coordinate system

This is one of the most important implementation details.

Store annotation geometry in **normalized, page-relative coordinates**, independent of rendered zoom and device pixel ratio.

Example:

```ts
type NormalizedPoint = {
  x: number; // 0 to 1 relative to page width
  y: number; // 0 to 1 relative to page height, measured from top
};

type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
```

Rules:

- Never store screen pixels as the canonical annotation geometry.
- Convert pointer coordinates from the current DOM page rectangle into normalized coordinates.
- Render by multiplying normalized coordinates by the current page CSS width and height.
- During PDF export, convert normalized top-left browser coordinates to PDF points and invert the Y axis.
- Store line widths and font sizes in a page-relative or PDF-point-compatible form so they scale consistently.
- Add unit tests for coordinate conversion across portrait pages, landscape pages, rotated pages, and different zoom values.

## 6.3 Document model

```ts
type PdfProject = {
  schemaVersion: number;
  id: string;
  name: string;
  originalFileName: string;
  createdAt: string;
  updatedAt: string;
  pdfFingerprint?: string;
  pdfByteLength: number;
  annotations: Annotation[];
  viewState: ViewState;
};
```

Store PDF bytes separately in IndexedDB when useful to avoid repeatedly serializing a large byte array inside the project object.

## 6.4 Annotation model

Use a discriminated union.

```ts
type AnnotationBase = {
  id: string;
  pageIndex: number;
  type: AnnotationType;
  createdAt: string;
  updatedAt: string;
  zIndex: number;
  locked: boolean;
  author?: string;
};

type TextAnnotation = AnnotationBase & {
  type: 'text';
  rect: NormalizedRect;
  text: string;
  fontSize: number;
  color: string;
  backgroundColor: string | null;
  opacity: number;
  textAlign: 'left' | 'center' | 'right';
};

type StickyNoteAnnotation = AnnotationBase & {
  type: 'sticky-note';
  point: NormalizedPoint;
  text: string;
  color: string;
};

type HighlightAnnotation = AnnotationBase & {
  type: 'highlight';
  rects: NormalizedRect[];
  color: string;
  opacity: number;
};

type UnderlineAnnotation = AnnotationBase & {
  type: 'underline';
  segments: Array<{
    start: NormalizedPoint;
    end: NormalizedPoint;
  }>;
  color: string;
  width: number;
};

type PenAnnotation = AnnotationBase & {
  type: 'pen';
  points: NormalizedPoint[];
  color: string;
  width: number;
  opacity: number;
};

type ShapeAnnotation = AnnotationBase & {
  type: 'rectangle' | 'ellipse' | 'line' | 'arrow';
  rect: NormalizedRect;
  start?: NormalizedPoint;
  end?: NormalizedPoint;
  strokeColor: string;
  fillColor: string | null;
  strokeWidth: number;
  opacity: number;
};
```

Create type guards and schema validation for every annotation type.

## 6.5 State separation

Separate state into clear domains:

- `documentStore`
  - PDF bytes
  - PDF.js document instance
  - page metadata
  - load state

- `annotationStore`
  - annotations
  - selection
  - clipboard
  - history
  - dirty state

- `editorStore`
  - active tool
  - active style settings
  - zoom mode and zoom value
  - sidebar visibility
  - current page

- `persistenceService`
  - IndexedDB reads and writes
  - autosave
  - project import and export

Do not place PDF.js objects or non-serializable browser objects inside persisted state.

## 6.6 Undo and redo

Use command-based history or snapshots of the annotation state.

Requirements:

- Group a drag or resize gesture into one history entry, not hundreds.
- Group a freehand stroke into one entry.
- Group continuous text typing with a short debounce.
- Clear redo history after a new mutation.
- Do not store PDF bytes in undo history.
- Keep a configurable maximum of 100 history entries.

## 6.7 Autosave

- Debounce writes approximately 750–1500 ms after meaningful changes.
- Show a subtle status: `Saving…`, `Saved locally`, or `Save failed`.
- Save annotation data and view state separately from high-frequency ephemeral interactions.
- Flush pending saves before page unload when possible.
- Do not claim data is permanently safe; browser storage can be cleared.

## 6.8 Large-document performance

- Lazy-render pages near the viewport using `IntersectionObserver`.
- Unmount or reduce expensive page layers far outside the viewport while retaining layout placeholders.
- Limit simultaneous PDF page render jobs.
- Cancel obsolete render tasks when zoom changes.
- Cache thumbnails separately at a lower resolution.
- Avoid re-rendering every annotation when only one changes.
- Memoize annotations by page.
- Use requestAnimationFrame for drag, resize, and pen preview updates.
- Consider a Web Worker for heavy export work only if it offers a measurable benefit and does not complicate GitHub Pages asset paths.

---

## 7. Information Architecture and Layout

## 7.1 Welcome screen

Create a focused landing/upload screen, not a marketing-heavy homepage.

Content:

- Small brand mark and product name.
- Heading: **“Annotate PDFs, right in your browser.”**
- Supporting sentence: **“Highlight, draw, add notes, and export—without uploading your document.”**
- Large drag-and-drop upload card.
- “Choose PDF” button.
- Privacy statement.
- A compact list of supported tools.
- Link to privacy/about information in the footer.

The upload card should also respond to clicking anywhere within it.

## 7.2 Editor shell

Desktop layout:

```text
┌──────────────────────────────────────────────────────────┐
│ Top bar: brand | filename | save state | export | menu   │
├─────────────┬──────────────────────────────┬─────────────┤
│ Thumbnail   │ Floating/compact tool bar    │ Annotation  │
│ sidebar     │                              │ sidebar     │
│             │ PDF page workspace           │             │
│             │                              │             │
└─────────────┴──────────────────────────────┴─────────────┘
```

### Top bar

- Brand mark.
- Truncated filename with full name in tooltip.
- Save-state indicator.
- Undo and redo.
- Export button as the strongest action.
- Overflow menu for open, close, project import/export, shortcuts, and about.

### Tool toolbar

Prefer a vertical toolbar on desktop and a bottom toolbar on small screens.

Order:

1. Select/pan
2. Highlight
3. Underline
4. Text
5. Sticky note
6. Pen
7. Shape menu
8. Delete

When a tool is selected, show a compact contextual properties bar with only relevant settings.

### Left sidebar

- Thumbnails.
- Page number under each thumbnail.
- Current page highlight.
- Collapsible.

### Right sidebar

Tabs:

- Annotations
- Properties

The properties tab should update based on current selection. Avoid showing a large empty inspector when nothing is selected.

### Workspace

- Warm, low-contrast background.
- Center pages with ample space between them.
- Subtle page shadow.
- Never let decorative UI obscure document content.

---

## 8. Mid-Century Modern Visual System

The design should feel inspired by mid-century print, furniture, and editorial design without becoming a novelty theme.

## 8.1 Color tokens

Use CSS custom properties. Suggested starting palette:

```css
:root {
  --color-canvas: #ede7dc;
  --color-surface: #f8f3e9;
  --color-surface-raised: #fffaf1;
  --color-ink: #25231f;
  --color-ink-muted: #6f695f;
  --color-border: #cfc5b5;
  --color-teal: #2f6f68;
  --color-orange: #c86b3c;
  --color-mustard: #d0a43c;
  --color-olive: #737b4c;
  --color-red: #a94b43;
  --color-focus: #2f6f68;
  --color-danger: #a33f38;
}
```

Requirements:

- Verify WCAG contrast for text and interactive states.
- Accent colors should appear intentionally, not all at once.
- Use teal as the primary action color.
- Use orange or mustard sparingly for active tools and highlights.

## 8.2 Typography

Use a clean geometric sans-serif with a dependable system fallback.

Suggested:

```css
font-family: "Avenir Next", "Futura", "Century Gothic", Inter, system-ui, sans-serif;
```

Do not require paid fonts. Do not load unnecessary third-party font resources. A bundled open-source font is optional, but a system-first stack is preferable for privacy and performance.

## 8.3 Shape language

- Border radii: primarily 8–14 px.
- Buttons: slightly rounded, not pill-shaped by default.
- Use occasional circles, arches, and simple geometric accents on the welcome screen.
- Keep the editor itself utilitarian and calm.
- Use 1 px borders and restrained shadows.
- Avoid glassmorphism, gradients everywhere, excessive blur, or neon effects.

## 8.4 Motion

- 120–200 ms transitions.
- Use motion to communicate state, not decorate.
- Respect `prefers-reduced-motion`.
- Avoid animations on PDF pages during active annotation.

---

## 9. Accessibility Requirements

Target WCAG 2.2 AA where practical.

- Full keyboard navigation for primary controls.
- Semantic buttons, menus, dialogs, and tabs.
- Every icon-only button must have an accessible name.
- Visible focus states.
- Do not communicate tool state using color alone.
- Maintain sufficient target size for touch controls.
- Use `aria-live` for save and export status.
- Trap focus in modal dialogs and restore it on close.
- Ensure tooltips are not the only source of essential information.
- Preserve PDF text selection and screen-reader-accessible text layer where PDF.js supports it.
- Include a keyboard-shortcuts dialog.

Suggested shortcuts:

| Action | Shortcut |
|---|---|
| Select tool | `V` |
| Hand/pan tool | `H` or hold `Space` |
| Highlight | `1` |
| Underline | `2` |
| Text | `T` |
| Sticky note | `N` |
| Pen | `P` |
| Shape | `S` |
| Delete selected | `Delete` / `Backspace` |
| Undo | `Cmd/Ctrl + Z` |
| Redo | `Cmd/Ctrl + Shift + Z` |
| Copy | `Cmd/Ctrl + C` |
| Paste | `Cmd/Ctrl + V` |
| Zoom in | `Cmd/Ctrl + +` |
| Zoom out | `Cmd/Ctrl + -` |
| Fit width | `W` |
| Escape current action | `Escape` |

Do not trigger single-key shortcuts while the user is typing in an input, textarea, or contenteditable element.

---

## 10. Error Handling

Create human-readable error states for:

- Non-PDF upload.
- Encrypted/password-protected PDF.
- Corrupt PDF.
- PDF.js load failure.
- Unsupported annotation export edge case.
- IndexedDB unavailable or quota exceeded.
- Invalid imported project file.
- Project schema newer than the app supports.
- Browser download blocked.
- Export failure.

Log technical details to the console in development, but show concise, helpful messages to users.

Never discard the current annotation state because export fails.

---

## 11. Security and Privacy

- Process documents locally.
- Do not use `dangerouslySetInnerHTML` for annotation text.
- Validate imported project JSON with Zod.
- Treat imported filenames and note text as untrusted strings.
- Avoid remote scripts.
- Add a restrictive Content Security Policy where GitHub Pages constraints allow it, preferably using a meta tag for the static site.
- Do not place API keys or secrets in the repository or Vite environment variables.
- Keep dependencies minimal and actively maintained.
- Enable Dependabot for npm and GitHub Actions.
- Add CodeQL only if it adds value without creating noisy maintenance burden.

---

## 12. Suggested Repository Structure

```text
paperwood/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── deploy-pages.yml
│   └── dependabot.yml
├── public/
│   ├── favicon.svg
│   └── site.webmanifest
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   └── config.ts
│   ├── components/
│   │   ├── common/
│   │   ├── editor/
│   │   ├── sidebars/
│   │   ├── toolbar/
│   │   └── welcome/
│   ├── features/
│   │   ├── annotations/
│   │   │   ├── components/
│   │   │   ├── model/
│   │   │   ├── renderers/
│   │   │   ├── tools/
│   │   │   └── export/
│   │   ├── document/
│   │   ├── history/
│   │   ├── persistence/
│   │   └── viewer/
│   ├── hooks/
│   ├── lib/
│   │   ├── pdfjs.ts
│   │   ├── coordinates.ts
│   │   ├── files.ts
│   │   └── validation.ts
│   ├── stores/
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   └── utilities.css
│   ├── test/
│   ├── types/
│   ├── main.tsx
│   └── vite-env.d.ts
├── tests/
│   └── e2e/
├── .editorconfig
├── .gitignore
├── .prettierignore
├── .prettierrc
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

Use feature-oriented organization. Do not create one giant editor component.

---

## 13. GitHub Pages Configuration

GitHub Pages hosts static files under one of two common URL shapes:

- User/organization site: `https://<user>.github.io/`
- Project site: `https://<user>.github.io/<repository>/`

The Vite base path must work for the project-site case.

## 13.1 Vite configuration

Use an environment-aware base path. Assume the repository name is available from GitHub Actions and use `/` locally.

Example:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS
    ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''}/`
    : '/',
  build: {
    sourcemap: true,
  },
});
```

Alternatively, place the repository slug in a clearly documented config value. Avoid requiring the developer to edit multiple files when renaming the repository.

## 13.2 Routing

The editor does not need multiple browser routes for MVP. Prefer a single-page state machine over React Router.

If routing is added later:

- Prefer `HashRouter` on GitHub Pages, or
- Add a carefully tested 404 fallback strategy.

Do not ship `BrowserRouter` with nested routes that fail on direct refresh.

## 13.3 PDF.js worker path

Configure the PDF.js worker using a Vite-compatible import rather than a hard-coded CDN URL.

Example pattern:

```ts
import { GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorker;
```

Verify the exact import path against the installed `pdfjs-dist` version.

---

## 14. GitHub Actions

Create two workflows:

1. CI for pull requests and pushes.
2. Deployment to GitHub Pages from `main`.

Pin action versions to current maintained major versions. Prefer official GitHub actions.

## 14.1 CI workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Unit tests
        run: npm run test:run

      - name: Build
        run: npm run build
```

If the current maintained `setup-node` major has advanced, use that maintained major consistently.

## 14.2 GitHub Pages deployment workflow

Create `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    runs-on: ubuntu-latest
    needs: build

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Before finalizing, compare version tags with current official Vite and GitHub Pages documentation. Do not switch to a third-party Pages deploy action unless the official flow is unavailable.

## 14.3 Required repository setting

Document this manual setup in the README:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main` or manually run the deploy workflow.

## 14.4 Dependabot

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    groups:
      production-dependencies:
        dependency-type: production
      development-dependencies:
        dependency-type: development

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: monthly
```

---

## 15. Package Scripts

Include at least:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

Do not use `vite preview` as the production hosting mechanism. It is only for local previewing.

---

## 16. Testing Strategy

## 16.1 Unit tests

Prioritize pure logic:

- DOM-to-normalized coordinate conversion.
- Normalized-to-PDF coordinate conversion.
- Rotation handling.
- Annotation schema validation.
- Annotation reducer/store mutations.
- Undo and redo grouping.
- Z-index ordering.
- Filename sanitization.
- Project migration.
- Export style conversion.

## 16.2 Component tests

- Upload dropzone states.
- Toolbar selected state.
- Contextual property controls.
- Annotation sidebar filtering.
- Confirmation dialogs.
- Keyboard shortcut suppression while typing.
- Accessible names and focus behavior.

## 16.3 End-to-end tests

Use a small public-domain or generated fixture PDF committed under a test-fixtures folder.

Required scenarios:

1. Open a PDF and render page 1.
2. Add a text annotation.
3. Move and resize it.
4. Undo and redo.
5. Add a pen stroke.
6. Refresh and restore autosaved annotations.
7. Export an annotated PDF.
8. Import a saved project.
9. Navigate using thumbnails.
10. Verify the app loads from a non-root base path similar to GitHub Pages.

## 16.4 Manual browser checks

Test current stable versions of:

- Chrome.
- Firefox.
- Safari.
- Edge.

Also test:

- macOS trackpad zoom behavior.
- Touch input on a tablet-sized viewport.
- Large PDF around the recommended size limit.
- Landscape and rotated pages.
- Browser storage disabled or full.

---

## 17. Export Implementation Notes

Use `pdf-lib` to load a copy of the original PDF bytes and draw each annotation onto its associated page.

For each page:

1. Get PDF page width and height in PDF points.
2. Resolve page rotation.
3. Convert normalized annotation coordinates to page coordinates.
4. Convert from top-left browser origin to bottom-left PDF origin.
5. Draw annotations in `zIndex` order.

Suggested mappings:

- Text → `drawText`, with line wrapping computed in advance.
- Highlight → filled rectangles with opacity.
- Underline → lines.
- Pen → line segments or SVG path where supported.
- Rectangle → `drawRectangle`.
- Ellipse → `drawEllipse`.
- Line → `drawLine`.
- Arrow → line plus calculated arrowhead lines.
- Sticky note → small icon plus optional flattened note callout. For MVP, draw a compact note badge and place note text in a nearby bounded box when exporting.

Be explicit in the UI that sticky-note behavior in the exported PDF is flattened rather than preserved as a native interactive PDF comment.

Add export fixture tests that reopen the generated PDF and verify:

- Page count is unchanged.
- Page dimensions are unchanged.
- Output bytes are non-empty.
- Expected drawing operators or embedded text exist where practical.

Visual snapshot comparison is optional because PDF rendering can differ slightly across environments.

---

## 18. Development Phases

Codex should implement the app in incremental, reviewable phases. Keep the app runnable after each phase.

### Phase 1 — Foundation

- Create Vite React TypeScript app.
- Add linting, formatting, tests, and strict TypeScript.
- Create design tokens and base components.
- Add CI and Pages deployment.
- Build welcome/upload screen.

Exit criteria:

- CI passes.
- Blank application deploys successfully to GitHub Pages.
- Upload UI is accessible and responsive.

### Phase 2 — PDF viewer

- Load local PDF bytes.
- Configure PDF.js worker.
- Render pages lazily.
- Add text and link layers.
- Add thumbnails, page navigation, and zoom controls.

Exit criteria:

- Multi-page PDFs render correctly.
- Page navigation and zoom work.
- No server requests contain PDF content.

### Phase 3 — Annotation foundation

- Implement normalized coordinate utilities.
- Create annotation types and store.
- Add selection, deletion, z-order, and history.
- Build SVG/HTML overlay system.

Exit criteria:

- An annotation remains aligned through zoom changes.
- Undo and redo work.

### Phase 4 — Core tools

- Text.
- Sticky note.
- Highlight.
- Underline.
- Pen.
- Shapes.
- Properties UI.

Exit criteria:

- Every MVP annotation type can be created, selected, edited, and deleted.

### Phase 5 — Persistence

- IndexedDB project storage.
- Autosave.
- Restore prompt.
- Portable project import/export.
- Schema validation and migrations.

Exit criteria:

- Refresh does not lose saved work.
- Invalid project files fail safely.

### Phase 6 — PDF export

- Flatten annotations using pdf-lib.
- Handle coordinate and rotation edge cases.
- Export progress and error handling.

Exit criteria:

- Exported PDF opens in major PDF readers.
- Annotation placement closely matches the editor.

### Phase 7 — Hardening

- E2E tests.
- Accessibility pass.
- Performance profiling.
- Browser testing.
- Documentation.

Exit criteria:

- All acceptance criteria pass.
- GitHub Pages deployment is documented and repeatable.

---

## 19. Acceptance Criteria

The MVP is complete only when all of these are true:

### Privacy and hosting

- The app can be deployed as a static GitHub Pages site.
- No backend is required.
- PDFs remain local to the browser.
- No document content is sent to analytics or external APIs.

### Viewing

- A user can open a valid PDF using drag-and-drop or a file picker.
- Multi-page documents render correctly.
- A user can navigate by scroll, controls, page number, and thumbnails.
- Zoom and fit modes work without misaligning annotations.

### Annotation

- A user can create every MVP annotation type.
- A user can select, edit, move, resize where applicable, reorder, lock, duplicate, and delete annotations.
- Undo and redo work for all meaningful annotation changes.
- Annotation placement remains stable after zooming and refreshing.

### Persistence

- Autosave stores the project locally.
- A saved project can be restored after refresh.
- A project can be exported and imported as a validated project file.

### Export

- The app exports a valid annotated PDF.
- The page count and page dimensions match the source PDF.
- Annotation positions are visually consistent with the editor.
- Export failure does not destroy editor state.

### Quality

- CI passes linting, type checking, tests, and build.
- The app works under a GitHub Pages repository base path.
- There are no obvious keyboard traps.
- All icon buttons have accessible names.
- The layout is usable at 1280 px, 768 px, and 390 px viewport widths.
- Core workflows work in Chrome, Firefox, Safari, and Edge.

---

## 20. README Requirements

Generate a useful README containing:

- Project overview.
- Feature summary.
- Privacy/local-first explanation.
- Screenshots placeholder section.
- Tech stack.
- Local development instructions.
- Test commands.
- Production build instructions.
- GitHub Pages setup steps.
- Explanation of the Vite base path.
- PDF.js worker configuration notes.
- Known limitations.
- Browser support.
- Contributing guide.
- License section.

Recommended license: MIT, unless a dependency or future business goal requires something else.

---

## 21. Codex Working Instructions

Follow these implementation rules:

1. Start by creating a short implementation checklist in the repository.
2. Inspect installed package APIs instead of assuming older examples still apply.
3. Use strict TypeScript and avoid `any` except at unavoidable library boundaries.
4. Keep each component focused.
5. Put coordinate conversion and annotation transformations in pure tested functions.
6. Do not introduce a backend.
7. Do not add authentication.
8. Do not add AI features.
9. Do not send PDF bytes to any remote service.
10. Do not use placeholder implementations for export while marking the feature complete.
11. Keep the application runnable after each major change.
12. Run lint, type checking, unit tests, and build before finishing each phase.
13. Add concise comments only where the reasoning is non-obvious.
14. Prefer platform APIs and small dependencies.
15. Document any deviation from this specification in the README or an architecture decision record.
16. Use accessible Radix primitives or native semantic HTML instead of recreating complex widgets poorly.
17. Test GitHub Pages base-path behavior before declaring deployment complete.
18. Do not commit example PDFs that have licensing or privacy concerns.

---

## 22. Future Extension Points

Do not implement these now, but avoid blocking them:

- Optional cloud sync.
- Shared review links.
- Collaborative comments.
- Native PDF annotations rather than flattened output.
- Signature workflows.
- OCR.
- Redaction.
- Page reordering and merging.
- PWA/offline install support.
- Additional export formats.
- AI summaries or document Q&A.

Keep the annotation schema versioned and migration-friendly so future annotation types can be added without breaking saved projects.

---

## 23. Definition of Done for Codex

Before reporting completion, Codex must:

- Install dependencies from a clean clone using `npm ci`.
- Pass `npm run lint`.
- Pass `npm run typecheck`.
- Pass `npm run test:run`.
- Pass `npm run build`.
- Pass the critical Playwright workflow.
- Verify the built app under a repository-style base path.
- Confirm that the GitHub Actions YAML is syntactically valid.
- Confirm that no secret or API key is required.
- Confirm through browser network inspection that opening and annotating a PDF does not upload its contents.
- List any known limitations honestly in the README.

---

## 24. Authoritative Implementation References

Use these sources to verify current integration details during implementation:

- Vite static deployment guide: https://vite.dev/guide/static-deploy.html
- GitHub Pages custom workflow documentation: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- GitHub Pages publishing-source documentation: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- PDF.js getting started: https://mozilla.github.io/pdf.js/getting_started/
- pdf-lib documentation: https://pdf-lib.js.org/

Dependency APIs and GitHub Action major versions can change. Codex should confirm the current official documentation before locking versions, while retaining the architecture and behavior specified here.
