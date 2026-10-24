# TASK 004 — targeted repair patch (NOT release-complete)

Source: TASK 003 patch. Only src/app/page.tsx and src/app/globals.css are replaced.

Implemented in this patch:
- Device selector alignment, no surrounding outline or text
- Collapsible, independently scrollable section sidebar
- Section navigation scrolls the canvas to the selected section
- Contact button icon alignment and stronger fallback section styles
- Hero YouTube/Vimeo share-link embed mode; direct HTTPS image mode
- Upload PNG/JPEG/WebP/GIF under 4MB; session-only reusable media buttons
- Hero alt-text field, basic homepage SEO title and description inputs
- Separate preview tab at /?preview=1, reusing browser-local site configuration
- Export button honestly labeled Export JSON

NOT IMPLEMENTED OR VERIFIED:
- Production media library/storage, arbitrary video hosting, direct video upload
- SEO metadata wiring to Next.js server metadata, sitemap/schema generation
- Standalone static HTML export, WordPress theme export, deployment
- Browser interaction or screenshot-based visual verification
- Compliance certification

The 2,000-line budget is met for the patched files by physical line count, but CSS and JSX are highly compressed; physical lines are not a sound maintainability metric.

Install from project directory after moving extracted task004-patch folder into the project with Finder:

  cp src/app/page.tsx src/app/page.tsx.task003.bak
  cp src/app/globals.css src/app/globals.css.task003.bak
  cp task004-patch/src/app/page.tsx src/app/page.tsx
  cp task004-patch/src/app/globals.css src/app/globals.css
  npx tsc --noEmit && npm run lint && npm run build

If any check fails, restore from .task003.bak files and send exact output.
