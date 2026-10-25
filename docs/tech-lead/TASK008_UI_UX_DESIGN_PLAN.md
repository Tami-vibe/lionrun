# Technical UI/UX and frontend design plan

Status: proposed design plan. No application code changed in this milestone.

## 1. Objective and scope

Make the published site feel like a coherent, credible automotive business rather than a sequence of generic generated blocks. Use reference image 2 for visual hierarchy, photography, density and pacing. Retain editable schemas, reusable industry themes, responsive behavior, media controls and exports.

Primary visitor: a vehicle owner looking for a trustworthy repair shop, often on a phone after an accident. Primary action: request an estimate; secondary action: call the workshop. The editor serves a different user: a business owner assembling and updating the site. Keep the light editing workspace visually separate from the dark website theme.

This plan covers the whole published page and the editor controls needed to maintain its design. Implementation is a later milestone. No new packages, generated imagery, runtime changes, or deployment are included here.

## 2. Diagnosis: evidence versus interpretation

Observed in image 1:
- Hero headline breaks into a narrow, tall stack despite abundant horizontal space.
- Large gaps surround small supporting text; several sections feel empty rather than deliberate.
- The same engine photo is reused for workshop, concerns, quotation and promotion roles. A machinery close-up does not establish the people, premises or repair process.
- Repeated centered headings, small uppercase labels, outlined cards and alternating dark bands produce a predictable rhythm.
- Placeholder guidance is visible as visitor copy, including review, credentials and promotion instructions.
- A single review occupies a layout intended for several; multiple generic CTAs repeat without adding useful information.

Observed in source:
- `studio.css` constrains `.hero h1` to `12ch`; other headings use broad shared rules.
- `ExtraSection` presents several different content types through the same item/title/description abstraction.
- `globals.css` and `studio.css` both define renderer styles, including device classes, container queries, `!important` overrides and positional section backgrounds.
- The full MediaManager appears before the selected section's content fields.
- The renderer, editor state and ZIP assembly remain concentrated in `page.tsx`; exports collect document styles and clone the rendered preview.

Inferred design consequence: insufficient section-specific composition, content and art direction cause the generated appearance. Adding a UI kit alone will not correct it.

Reference image 2 contributes stronger heading proportions, coherent workshop imagery, denser useful information, varied compositions and convincing evidence. Its dealer-style hero copy, unverifiable review counts/certifications, repeated card patterns and multiple accent colors should not be copied automatically. Screenshot dimensions differ, so compare proportions and rendered viewport layouts, not raw image pixels.

## 3. Agreed direction for the proposed implementation

Voice: capable, precise, reassuring. Visual direction: the dark automotive workshop reference, with photography and practical repair information carrying the identity.

A visitor should understand what the shop does, see evidence that it can do the work, and find a clear next action. Sections share typography, alignments, surfaces and component behavior; each section uses a composition appropriate to its content.

Use reference 2 as the named visual anchor. Its direction is sufficiently clear that new image-generation direction probes are unnecessary for this planning milestone. The next design artifact should be a code-native composition proof of hero, services and workshop at desktop/mobile sizes, before building the entire page.

## 4. Shared visual system

These are proposed implementation starting values, subject to checking against actual content and contrast.

| Role | Proposed specification |
| --- | --- |
| Content width | Main container 1160–1200px maximum; compact copy/form container 760–880px. Assign named container variants rather than ad hoc widths. |
| Grid | 12 columns on wide containers; 24–32px gutters; stack or reduce columns when content no longer fits. Grid supports composition, not mandatory 12-column markup everywhere. |
| Outer gutters | Fluid 20–48px; at least 16px on narrow screens. |
| Spacing | Shared 4/8/12/16/24/32/48/64/96 scale. Large section gaps roughly 80–112px desktop, 48–64px mobile; compact evidence strips roughly 24–40px. |
| Display type | Candidate: self-hosted Manrope variable, with system fallback. Confirm using real heading specimens before adopting; the exact reference font is unverified. Use one deliberate family initially. |
| Hero heading | Approximately 52–72px desktop, 36–44px mobile; line-height 1.04–1.12. Desktop copy measure roughly 18–22ch, tuned to the actual heading. Aim for 2–3 lines, without clipping or forced desktop breaks on mobile. |
| Section heading | Approximately 36–48px desktop, 28–36px mobile; choose a compact or feature heading variant. |
| Body | 16–18px at normal browser zoom; line-height 1.55–1.7; supporting text generally at least 14px. Small labels never carry essential information. |
| Surfaces | Three named charcoal levels: page, quiet section, raised element. Use explicit section surface tokens, not `nth-of-type`, so hiding/reordering a section does not change its neighbors. |
| Text | Soft near-white primary; readable slate secondary; contrast measured on actual backgrounds. |
| Accent | One violet brand accent for actions/selection. Green for genuine availability/success; amber for rating information; red only for meaningful warnings. No arbitrary accent per section. |
| Geometry | Shared 12–16px media/card radii; a consistent compact control radius; pill shape reserved for selected CTA/tag roles. Subtle borders; no decorative frame around every paragraph. |
| Buttons | Primary filled, secondary quiet/outlined, tertiary text link. Shared heights around 44–48px, consistent icon spacing and visible hover/focus/disabled states. |
| Motion | Short 150–220ms state transitions; no scroll hijacking or default entrance choreography. Respect reduced motion. |

Use relative units and clamp for published headings/spacing. Keep editor labels and controls on a stable rem scale. A 50% editor canvas is intentionally visually smaller; assess website readability at 100% in the standalone preview too.

## 5. Page narrative and section specifications

Proposed flow: orient → services → people/facility → repair evidence/process → reassurance → request estimate → practical details.

| Existing section | Visitor purpose and proposed composition | Content/interaction requirements |
| --- | --- | --- |
| Header | Compact aligned navigation, clear brand and one contact action. Approximately 72–80px desktop. | Mobile menu with real navigation; keyboard support; sticky behavior only if it does not obscure content; anchor offset if sticky. |
| Hero | One compelling image with human/workshop context, controlled crop and localized readability overlay. Broad text block, two actions, small verified reassurance if available. Rough starting height 600–720px desktop, content-led on mobile. | Collision-repair promise rather than generic mobility copy. Preserve media framing/video settings. Rating badge only with real source/count. Avoid an arbitrary full-viewport height or pure image aspect ratio determining the entire text section. |
| Partner logos | A compact brand/credential strip that visually connects hero to services. | Only actual relationships/permissions; clearly label serviced makes versus approved partnerships. Hide if no real assets. Wrap on small screens. |
| Services | Compact heading and a balanced 3-column service grid. A service card is appropriate here because these are peer choices. | Use 6–9 real priority services on the homepage if supplied; 3 looks intentional if only 3 are offered. Additional services belong behind a working directory/expansion. No filler to reproduce the reference's count. Descriptions and meaningful icons share geometry. |
| Why choose us | A workshop image plus specific practices/credentials in a 5/7 or 6/6 split. | Show actual inspection, estimating, warranty or repair standards. Replace abstract slogans with concrete evidence. |
| About & gallery | Continue the workshop story with people, premises and varied details; a compact story lead and a curated gallery. Visually group with the preceding section instead of repeating another large centered heading. | 4–8 distinct useful photos if available. Captions, alt text and mobile-friendly browsing. Filters only when enough real categories justify them. Preserve stable legacy section IDs when grouping. |
| Customer concerns | Optional compact concern-to-resolution explanation. Use three concise rows or image stories only if the content merits them. | Each concern must have a specific answer. Avoid fear-led filler and repeated stock images. Can be disabled without disrupting the page. |
| Our process / solutions | A short 3–4 step sequence paired with one completed repair story. A before/after composition is the flagship option when genuine paired photographs exist. | Real case facts. Comparison slider supports keyboard/range control and a side-by-side alternative; otherwise use a single case image. No simulated before/after evidence. |
| Trust signals | A short evidence strip directly after process/case work. | Verified metrics with sources or dates where appropriate. If metrics are unavailable, use factual warranty/process statements. No invented totals or mandatory large numbers. |
| Reviews | Three authentic attributed reviews when available, with source link and consistent baseline. | A single review gets a full-width featured quote, not one cell of a three-column grid. Empty collection hides on published site; editor shows a setup state. |
| Quote request | The primary conversion section: credible assessment photograph beside a focused form. Strong heading, minimal fields, full-width submit, visible next-step explanation. | Name + one contact route + repair details; photo upload only after a real secure submission service exists. Validation, sending, failure and success states are part of the production contract. Do not promise a 24-hour response unless confirmed. |
| FAQ | A compact 4/8 split: short introduction/contact option at left, questions at right. | Real concerns such as insurer choice, estimates, timing, courtesy vehicles and paint matching. Keyboard-operable disclosures; no unnecessary fixed heights. |
| Promotion | Optional full-bleed image-led offer that changes the page's pace. | Actual service, price, conditions and expiry. Hide when unconfigured or expired; no placeholder promotion card. |
| Contact | Practical address, opening hours, phone/contact route beside a map preview. | Map loads on intent/consent, with an accessible address and external directions link available without loading an embed. No mandatory map API dependency for the prototype. |
| Closing CTA | A concise last invitation after contact details; a deliberate accent surface or quiet brand panel. | Same estimate action as elsewhere. Avoid introducing a competing promise or another long form. |
| Footer | Useful navigation, business/legal details and contact information on the same grid. | Only working destinations. Do not publish dead Privacy/Terms text as if legal pages exist. Avoid repeating every CTA. |

The schema supports all sections; the default published page should show only sections with useful content. Hiding incomplete sections is part of the design, not a failure to fill the template.

## 6. Photography and content brief

Plan an asset set before adjusting card CSS:
- Hero: one credible human/workshop/vehicle scene, with desktop and mobile focal-point review.
- Facility story: a real wide workshop photograph; one technician/work image.
- Gallery: distinct images of diagnosis, bodywork, refinishing, equipment and handoff, selected for useful variety.
- Case study: matched before/after images, or one honest completed-repair photograph.
- Quote: a portrait-oriented assessment/inspection scene.
- Promotion: a service-specific image only when an actual offer exists.

Use consistent color temperature and contrast. Do not reuse the engine photograph across unrelated stories. Prefer owner-supplied/licensed business photographs. Any stock or generated image must be representative and must not imply a real team, certification or customer result. Reference screenshot assets require source files and usage rights before adoption.

Write final copy alongside layout. Remove visible setup instructions from published output. Missing proof, reviews or offers produce editor guidance and a hidden/appropriate published state rather than fabricated content.

## 7. Editor UX needed to protect design quality

1. Selecting Hero first exposes headline, supporting copy and primary action. Media controls follow or open when selecting the hero's media itself.
2. Expose the shared Media Library in one predictable workspace panel. Keep the selected placement's basic source/alt/framing controls close to its preview; place playback, provider/privacy and advanced metadata in disclosures.
3. Bind media to named roles: `hero.background`, `about.facility`, `gallery.items`, `caseStudy.before/after`, `quote.image`. Remove the default behavior of attaching an arbitrary full-width block above any selected section's content.
4. Show theme-wide typography, color and spacing in Theme. Section controls choose named layout/density/surface variants; advanced local overrides are progressive and explicitly marked.
5. Preserve zoom and width controls, but clearly distinguish canvas magnification from website container width. Device presets remain shortcuts for testing, not separate layout engines.
6. Add usable card/item operations: add, remove, reorder, duplicate and edit, with keyboard alternatives. Use stable IDs; preserve undo/redo and show unsaved/storage failures honestly.
7. Offer explicit Copy/Media/Layout tabs or selection-aware controls, not a large generic inspector preceding the property the user clicked.
8. Preview hides editor badges, debugging UI, selection outlines and setup instructions. Publishing/preflight identifies missing contact destinations, broken assets, unconfigured forms and unverifiable optional sections.

## 8. Frontend architecture and schema

Keep the existing Next.js/React/TypeScript application. Implement boundaries with small modules rather than introducing a large framework:

- `site/schema.ts`: versioned site/section contracts, stable IDs, defaults, runtime validation and migration.
- `site/tokens.css`: colors, type, spacing, containers, surfaces and component tokens; CSS cascade ownership is explicit.
- `site/sections/`: renderer components organized by content purpose, sharing small elements such as SectionHeading, Button, ServiceCard and MediaPlacement.
- `site/render.tsx`: section registry and ordering; presentation derives from validated content/theme values, not editor state.
- `editor/`: selection, inspector, history and Theme/Library panels.
- `media/`: retain storage and validation; separate reusable media rendering/settings from the editor manager. Exported/published renderers must not import MediaManager or editor state.
- `export/`: use the same renderer and renderer-only stylesheet. Replace collecting the entire editor document's styles with a dedicated output bundle; preserve packaged files, consent behavior and metadata.

Proposed model shape: `Site(schemaVersion, theme, orderedSections)`; a section contains `id`, `type`, `enabled`, validated content, named media slots and a small presentation config such as `layout`, `surface`, `density`, `headingAlignment`. Repeated items have stable IDs. Industry presets supply appropriate defaults/content/media roles rather than forks of the renderer.

Do not persist arbitrary CSS, raw HTML, arbitrary iframe markup or unvalidated class strings. Preserve current saved text, asset IDs, media settings and section anchors through an explicit migration; export a recoverable configuration before migration. Switching themes/variants must never erase content.

A UI kit is a support decision: Radix/shadcn may later help editor dialogs, menus, tabs and focus handling; Lucide may standardize icons. Neither defines the published website's art direction. No dependency installation is required to approve this plan; evaluate a specific interaction need, bundle cost and maintenance before adding one.

## 9. Responsive and accessible behavior

- Use a named page container for page-wide queries and local card/gallery containers for composition; avoid nesting containers accidentally and changing cqw typography scope.
- At wide containers use a 12-column composition; services use 3 columns, then 2, then 1 as content requires. Collapse editorial splits when either column falls below a readable width.
- Use one container-based rule system. Remove overlapping `.frame-mobile`/`.frame-tablet` layout rules; identical content widths should render identically inside and outside editor presets.
- Test 320, 390, 650, 768, 1024, 1280 and 1440px, plus widths immediately around transitions. Verify actual standalone output, not just scaled editor screenshots.
- Check long business names, headings twice the expected length, variable service/review counts, missing imagery and portrait video. Content must expand naturally without clipping or brittle fixed heights.
- Target WCAG 2.2 AA: measured text/control contrast, visible keyboard focus, semantic headings, meaningful names and approximately 44px touch targets. Test text zoom at 200% and reflow at 400%/320 CSS px.
- No hover-only controls. Mobile navigation, gallery interactions, form errors and comparisons work by keyboard/touch. Reduced motion and media privacy defaults remain in force.

## 10. Delivery sequence with review gates

1. **Content and asset inventory:** identify real versus placeholder content, assign imagery roles and list genuine evidence. Capture existing screenshots and functional baselines; do not erase saved configurations.
2. **Design proof:** hero + services + workshop composition at desktop/mobile, using real representative copy/media. Review typography, crop, spacing and the transition between sections as one composition. Stop before full-page implementation if this proof misses reference 2's direction.
3. **Foundations and migration:** consolidate styles/tokens, define the section contracts and migrate existing saved data. Keep the app functional throughout.
4. **Upper narrative:** implement the approved hero/services/story/gallery compositions and their selection-aware inspector controls.
5. **Evidence and conversion:** implement process/case work, trust/review states, quote and FAQ. Verify real actions and missing-content behavior.
6. **Practical close:** promotion conditions, contact/map fallback, closing action and footer. Check the whole-page rhythm and remove redundant sections.
7. **Exports and QA:** verify dedicated render output, saved media/framing, HTML ZIP, WordPress assets, keyboard/mobile flows and performance. Perform WordPress staging installation before claiming compatibility is verified.

Each milestone must stay independently reviewable. Do not solve a style defect by adding another late override stylesheet.

## 11. Acceptance criteria and evidence

Design acceptance:
- The page has a coherent font, container alignment, surface and button system.
- Hero heading avoids the current narrow stacked treatment at normal desktop widths; mobile reflows without forced desktop line breaks.
- Section composition visibly alternates between useful grids, image/text stories, compact evidence and conversion areas, rather than repeating one universal template.
- No unrelated repeated stock photographs, empty grid cells, debug badges or visible authoring instructions in published output.
- Every image has a planned role; every visible CTA has a meaningful destination; optional content is handled intentionally.

Technical acceptance:
- Same-width editor and published output match for layout, type, media fit/crop and mobile rules.
- Existing editing, undo/redo, browser persistence, media security and exports continue to work after migration.
- Lint, TypeScript, existing media tests and the working production build pass. Add focused tests for migration, section validation, content-count layouts and changed interactions.
- Compare screenshots at matched viewport widths and 100% browser zoom. Check the complete page and the three-section design proof; build success alone is not visual evidence.
- Target Core Web Vitals: LCP ≤2.5s, CLS ≤0.1 and INP ≤200ms at the 75th percentile when field data exists. Before launch, record controlled mobile lab measurements and image/font/bundle costs; do not claim field compliance from Lighthouse alone.
- The 2,000-line aggregate application budget is obsolete. It came from an early file subset and is not a current gate. Count application source as physical lines under `src/app` and report tests separately. Do not claim compliance with the retired aggregate cap, and do not minify source to change a count. Historical milestone reports keep their original measurements.

## 12. Open dependencies, assumptions and current verification

Assumed direction: image 2's dark workshop presentation, violet primary action, genuine collision-repair content and estimate-first UX. No unresolved choice prevents this plan from being reviewed.

Actual workshop assets, valid business claims, reviews, service inventory and offer terms are not supplied as production content. Until provided, use clearly identified representative assets in the design proof and hide unsupported claims in published output. A real form backend and map/provider integrations remain separate functional work where not already available.

Planning outcome: completed; implementation not started. Only this Markdown plan was added. Source inspection and supplied-image comparison informed the diagnosis. No new application tests, browser changes, performance measurements or deployment were performed for this planning-only milestone. Existing checks in earlier milestone reports remain historical evidence, not a new verification claim.
