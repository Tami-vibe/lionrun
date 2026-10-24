# TASK 003 — Unverified browser patch

This is a source patch for the existing TASK 002 Next.js project. Do NOT replace the project root, AGENTS.md, docs, or package files.

Changes: device SVG icons and canvas-width responsive CSS; Contact secondary CTA connected to live canvas; editable additional homepage sections (logos, about, concerns, process, trust, reviews, quote, FAQ, promotion, closing CTA); generic item editor; preserves local configuration and undo/redo.

LIMITATIONS: Not a production publishing engine. The quote form is deliberately a demo without a backend; no lead data is transmitted. Placeholder reviews and partner names are not verified and must not be published as real claims. Image upload, map integration, legal pages, accessibility audit, browser automation, and SEO publishing remain unimplemented. The editor UI is an incremental improvement, not a final premium redesign.

Local verification in the tool environment: TypeScript and ESLint passed. Production build BLOCKED because the required Linux Next.js SWC binary was absent and npmjs.org DNS failed. No browser interaction tests executed. Your Mac must run npm run build and browser tests.

To install: from your project root, first back up src/app/page.tsx and src/app/globals.css, then copy these two patch files to src/app/. Run npx tsc --noEmit, npm run lint, npm run build, and test each section on localhost. Do not mark complete until checks and manual browser interactions pass.
