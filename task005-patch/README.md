TASK 005 — EXPORT DROPDOWN PROTOTYPE (NOT RELEASE VERIFIED)

Copy src/app/page.tsx and src/app/globals.css to your existing business-builder project, after backing up the originals.

Adds HTML ZIP, WordPress classic theme ZIP and JSON export options. No packages added.

Verification in provided Linux environment:
- TypeScript: PASS (tsc --noEmit)
- ESLint: PASS (npm run lint)
- Next.js build: BLOCKED (missing Linux SWC binary; existing node_modules installed for macOS)
- Browser interaction, visual quality, ZIP deployment, WordPress installation: NOT VERIFIED
- Physical source lines: page.tsx 274; globals.css 12. These compressed lines are not a maintainable LOC metric.

Known limitations:
- The exported HTML captures the currently rendered DOM and CSS. Some external media may remain remotely hosted because cross-origin downloads can be blocked.
- Quote forms are not connected to a backend. Do not publish as a working lead capture form.
- WordPress export is a static classic theme prototype, not a fully integrated WordPress theme. Test on staging; do not deploy to production.
- Export CSS is currently collected from the app stylesheet and may include editor styles.
- This patch does not complete the visual redesign or universal schema refactor.
