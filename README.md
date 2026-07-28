# Paperwood

Paperwood is a private, local-first PDF annotation app. Open a document, highlight or underline passages, add text and sticky notes, draw freehand, add shapes, and export a flattened annotated PDF—all without uploading the source document.

## Features

- Local drag-and-drop PDF loading with friendly validation
- Multi-page PDF.js rendering, thumbnails, page controls, and zoom
- Text, sticky note, highlight, underline, pen, rectangle, ellipse, line, and arrow tools
- Selection, movement, deletion, locking, duplication, z-ordering, undo, and redo
- IndexedDB autosave and refresh recovery
- Validated portable `.paperwood.json` project files
- Client-side PDF export with `pdf-lib`
- Responsive, keyboard-accessible mid-century interface

## Privacy

PDF bytes and annotation text stay in the browser. Paperwood has no backend, account system, analytics, or remote document storage. Browser storage can still be cleared, so export a project file for important work.

## Screenshots

Add final product screenshots here after deployment.

## Stack

React, strict TypeScript, Vite, PDF.js, pdf-lib, Zustand, Dexie, Zod, Lucide, Vitest, and Playwright.

Paperwood bundles the Caveat handwriting typeface for its Signature text style. Caveat is distributed under the SIL Open Font License 1.1; its license is included at `src/assets/fonts/Caveat-OFL.txt`.

## Development

Requires Node 22 and npm.

```bash
npm install
npm run dev
```

Validation:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

`npm run preview` serves the production build locally; it is not a production server.

## GitHub Pages

The Vite base path is `/` locally. In GitHub Actions it is derived from `GITHUB_REPOSITORY`, so repository project sites such as `https://user.github.io/repository/` load assets correctly.

1. In GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions**.
3. Push to `main` or manually run **Deploy to GitHub Pages**.

The PDF.js worker is bundled through Vite with `?url`; no worker or document content is loaded from a CDN.

## Known limitations

- Exported annotations are flattened, not native editable PDF comments.
- Sticky notes export as visible page content.
- Text selection geometry and native PDF links are not yet recreated as separate PDF.js layers.
- Desktop and tablet are the primary editing targets; mobile supports viewing and lighter annotation.
- Complex rotated-page export should be visually reviewed.

## Browser support

Current stable Chrome, Firefox, Safari, and Edge.

## Contributing

Keep the app client-only, preserve normalized page-relative geometry, add tests for pure transformation logic, and run all validation commands before opening a pull request.

## License

MIT
