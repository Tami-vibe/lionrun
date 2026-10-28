TASK 001 Baseline Audit
Current Architecture Metrics
Source files scanned under src/app: 89
Total size across those files:
9,921 lines
803,809 characters
803,962 bytes
Folder breakdown:
editor: 42 files
site: 33 files
media: 8 files
export: 2 files
root app files: layout.tsx, page.tsx, globals.css, studio.css
Top files by line count:

src/app/studio.css - 816 lines, 101,140 chars
src/app/site/site.css - 603 lines, 58,552 chars
src/app/editor/fields.tsx - 601 lines, 29,444 chars
src/app/site/blocks.ts - 371 lines, 47,231 chars
src/app/editor/content-browser.tsx - 357 lines, 45,230 chars
src/app/editor/footer-editor.tsx - 303 lines, 16,916 chars
src/app/page.tsx - 281 lines, 33,187 chars
src/app/editor/services-content.tsx - 229 lines, 8,119 chars
src/app/editor/hero-media.tsx - 228 lines, 19,280 chars
src/app/site/layout-contract.ts - 221 lines, 12,221 chars
Dependency and Circular-Import Report
Current baseline verification is much better than the original graph, but the site model layer is still structurally unhealthy.

npx madge --circular --extensions ts,tsx src/app reports 8 circular dependencies:

site/blocks.ts > site/footer-model.ts
site/footer-model.ts > site/link-projection.ts > site/settings.ts
site/blocks.ts > site/footer-model.ts > site/link-projection.ts > site/settings.ts > site/layout-contract.ts
site/settings.ts > site/layout-contract.ts
site/blocks.ts > site/footer-model.ts > site/link-projection.ts > site/settings.ts > site/menu-model.ts
site/link-projection.ts > site/settings.ts > site/menu-model.ts
site/settings.ts > site/menu-model.ts
site/blocks.ts > site/service-model.ts
What this means against the 5-layer blueprint:

Layer 4 section views are now much closer to compliant. The earlier site/sections/index.tsx cycle is no longer the main problem.
Layer 5 is still leaking downward and sideways. site/blocks.ts remains the central hub and is still directly involved in the remaining cycle knot.
Layer 2 is not yet truly one-way. site/settings.ts, site/link-projection.ts, site/menu-model.ts, and site/layout-contract.ts are still mutually entangled.
Layer 1 is not clean enough yet. site/layout-contract.ts still participates in runtime/helper behavior instead of being a pure contract-only file.
Current fan-in / fan-out hotspots from an import scan:

Highest outgoing dependencies:

src/app/page.tsx - 20
src/app/editor/content-browser.tsx - 18
src/app/editor/fields.tsx - 14
src/app/editor/footer-editor.tsx - 12
src/app/editor/main-image-journey.tsx - 11
src/app/editor/services-content.tsx - 11
src/app/editor/hero-media.tsx - 11
src/app/editor/inspectors/default.tsx - 11
src/app/site/blocks.ts - 10
src/app/editor/section-editor.tsx - 10
Highest incoming dependencies:

src/app/site/blocks.ts - 36
src/app/site/settings.ts - 27
src/app/media/model.ts - 21
src/app/media/library.tsx - 20
src/app/editor/components/fields.tsx - 13
src/app/site/hero-collection.ts - 12
src/app/editor/fields.tsx - 10
src/app/site/catalog.ts - 10
src/app/site/sections/types.ts - 9
src/app/media/store.ts - 9
Code Waste Classification
SAFE
No proven unused exports remain in the current baseline. npx knip --reporter json returned no issues after the earlier cleanup work.

REVIEW
These are the highest-value remaining cleanup candidates, but they are refactor/split opportunities rather than proven deletions:

src/app/site/blocks.ts
Still the biggest hub, still part of multiple cycles, and still far too much orchestration for one file.

src/app/site/settings.ts
Still acts like a bridge between contract and engine responsibilities.

src/app/site/layout-contract.ts
Not pure enough yet; it is still participating in runtime/helper behavior instead of staying contract-only.

src/app/site/footer-model.ts
Part of the remaining cycle knot and still coupled to menu/settings projection behavior.

src/app/site/menu-model.ts
Still tied into the same knot via shared projection and link resolution.

src/app/site/link-projection.ts
Good idea, but it is still trapped inside the settings/menu cycle and needs a cleaner boundary.

src/app/site/service-model.ts
Small but still points back into the main hub.

src/app/editor/fields.tsx
Large orchestrator/hub with 14 outgoing dependencies.

src/app/editor/content-browser.tsx
Very large and highly connected; likely too much state and composition in one place.

src/app/editor/footer-editor.tsx
Large composite panel with a lot of local wiring.

src/app/editor/section-editor.tsx
Still a wide orchestrator, even if it is intended to be a hub.

src/app/editor/inspectors/default.tsx
High fan-out and repetitive control wiring.

src/app/editor/hero-media.tsx
Large composite view/panel.

src/app/editor/services-content.tsx
Large composite view/panel.

src/app/editor/main-image-journey.tsx
Large composite view/panel.

src/app/editor/about-content.tsx
Large composite view/panel.

src/app/editor/logos-content.tsx
Large composite view/panel.

src/app/editor/inspectors/proof.tsx
Large inspector with repeated control patterns.

src/app/site/preview.tsx
Still part of the site-level orchestration path.

src/app/studio.css and src/app/site/site.css
The two largest stylesheets; no proven dead CSS yet, but they are the strongest consolidation review candidates.

KEEP
These are now broadly aligned with the desired layer shape and should be preserved as-is unless later work proves a need to split them further:

src/app/site/sections/types.ts
src/app/site/sections/*.tsx view modules
src/app/editor/inspectors/*.tsx view modules
src/app/editor/components/fields.tsx as the low-level primitive layer
src/app/site/columns.tsx as a reusable primitive/helper
src/app/media/library.tsx including MediaLibraryFixture, which is test-only and still used
Recommended Migration Order
Break the site model knot first.
Split site/layout-contract.ts into pure contracts vs engine helpers, and stop site/settings.ts from importing anything that loops back into it.

Collapse the blocks.ts hub next.
Move pure definitions and engine helpers downward, leaving blocks.ts as a much thinner orchestrator.

Normalize menu-model.ts, footer-model.ts, and service-model.ts into one-way L2 utilities.
They should consume contracts and utilities, not feed the hub.

Keep the section/inspector layer strict.
The earlier SectionProps extraction was the right move. Preserve that direction and avoid any future import back to site/sections/index.tsx or editor/fields.tsx.

Only after the graph is flat, consolidate the big composite panels.
Files like content-browser.tsx, footer-editor.tsx, hero-media.tsx, and the inspector modules can then be simplified with much lower risk.

Baseline Verification Results
npm run build ✅ passes
npx knip --reporter json ✅ no issues
madge circular-import scan ✅ still reports 8 cycles, all centered on the site model knot above
If this baseline looks right, approve it and I’ll treat it as the reference point for TASK 002.