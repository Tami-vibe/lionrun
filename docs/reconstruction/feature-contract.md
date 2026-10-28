# Business Builder reconstruction contract

Reference: `70329412e8e5ce86733002efb262e0d4e8d4d1ba`, plus the two pre-existing working-tree files. The reference snapshot is in `/tmp/lionrun-reconstruction-reference`; Git retains the committed reference. This document describes required behavior, not permission to omit behaviors absent from a test.

## Website sections

Every persisted section type, layout ID, property, and authored value must round-trip. Switching layout hides unsupported slots without deleting content. Blank-only starter seeding must remain idempotent. Headline semantics are h1 for Hero and h2 for other titled sections; Header, Footer, and gallery-only layouts have no headline.

| Type | Persisted layouts | Content and behavior |
| --- | --- | --- |
| header | standard, pill, rounded | Named menus; root and child destinations; page identity; menu assignment; brand and logo; sticky, overlay and background; up to two buttons, placement, icons and destinations; accessible mobile navigation; active link tracking. Shared across pages. |
| hero | split, center, image, short, story | Introduction, title, subtext, optional body; two CTAs; up to three highlights and icons; rating visibility, score/count/destination; up to three background media; separate Story video and button/length; business-number items; height, text alignment, darkness and business details. |
| logos | Scrolling row, Still row, Heading and slider | Message; add/replace/remove logos; names and destinations; four-row progressive editor; individual removal undo; heading visibility, motion, hover/focus pause, monochrome and bounded slot scaling; slider navigation. |
| services | Icon cards, Photo cards, Price list | Introduction, side note or action label; stable item identities; title, description, price, icon, media and destination; progressive list; duplication, visibility and item removal undo; selection-to-canvas synchronization; automatic service pages and All services catalog; Home preview caps; independent catalog layout. |
| proof | Text and photo, Promise band, Photo and reasons | Message, three promises, media sequence; photo statistics, three avatar names/photos, extra-person count; up to six reasons with icon/title/body; button and text link. Stacked/split arrangement; balanced and precise widths; media side, alignment, button count; spacing/layout reset. |
| about | Story and photos, Photos only, Sliding gallery | Message when supported; gallery items, caption, group and media; filtering, item editing/removal/undo; one/two featured Story images; gallery grid 1–4 columns and rows; boxed/full width, 1–2× scale, motion/speed/pause; proportional frames and reduced motion. |
| pains | Photo cards, One message | Message, promise, concerns with title/description/tag/icon and optional photo; CTAs; item add/remove. |
| solutions | Numbered steps, Before and after | Message; 3–5 steps with title/description/icon/photo and responsive columns; or two independently editable before/after media, labels and three facts. |
| trust | Big numbers, Numbers and certifications, Signals | Message, values/labels/notes, icons and supported media; Signals capped at three; optional background, side, fit, focal point, color, directional fade/width/strength/darkness. |
| reviews | Review cards, One large quote, Carousel | Quote, name, service, date, source, details, stars and avatar; excerpt expansion, carousel steps; full/excerpt text, full/initial names, avatar shape/visibility, card surface/padding, metadata visibility and column widths. |
| quote | Photo beside the form | Message, note, button label, consent; up to 12 editable fields with label, text/email/tel/textarea type and required flag; optional media. Demo validates locally; never transmits or stores visitor submissions. |
| faq | Accordion, Two columns | Message, independently expandable questions/answers; add/remove questions; CTAs and responsive columns. |
| promo | Offer band | Message, price/previous price, end date, badge, offer details, CTAs and background image/video/sequence. |
| contact | Details and map | Message, local address/phone/email/hours overrides; shared Business settings updates all pages; CTAs; map media supports image/video, not slideshow. |
| closing | Quiet, Full color | Message, optional separate wide image/video/sequence, CTAs and typography. |
| footer | columns, minimal; footer.layout standard/hours/social/stack/bottom | Shared columns with text/hours/link identities/custom labels, copyright, separate wide media; inherited/custom/absent logo; motto and socials; editable real office hours and closed/online states; layout/alignment/order/gaps; hover shape/padding; per-role typography; no guessed public office hours/socials. |

## Editor and website contracts

- Selection: section list, canvas and inspector share the same ID. Header/Page/Footer edit regions isolate chrome, preserve per-region scroll, and keep saved sticky behavior. Add, duplicate, delete and visibility enforce 80 sections; shared header/footer cannot duplicate. Section order follows the catalog's fixed product order.
- History: undo/redo restores content, media and layout; continuous edits in one focused field form one history step; new edits invalidate redo; capped history. Collection removal undo inserts the removed item without overwriting later edits.
- Pages: Home, service, offer, story and empty starters; cap 30; names, stable safe unique slugs, per-page SEO; breadcrumb ancestry; top/bottom/nested/no menu placement; five root links; named-menu parent/child movement, duplication and placement; removed pages cannot retain stale projected links.
- Settings: draft and save/cancel Business details, Website brand, and Profile; display-only account/AI usage hints remain honest about missing connections. Brand preview must not apply until Save. Four font pairs, corner/line tokens, theme, accent and eyebrow style propagate through shared Home values.
- Canvas: iframe isolation; desktop/tablet/mobile widths; fit and explicit zoom; resizing must not override explicit zoom. Pointer/keyboard column resizing bounds widths and preserves 100% total. Preview uses real page/hash navigation and browser back/forward.
- Standard controls: linked labels, bounded numeric inputs and ranges, clear/reset to theme defaults, disabled-state explanations, accessible icon picking, destinations for pages/sections/web/phone/email, and retained invalid legacy values until the user changes them.

## Media, persistence and export

- Media library: IndexedDB `business-builder-media` v1 `assets`; stable `media:<id>` references; images 10 MB, videos 100 MB, captions 1 MB, total quota 250 MB. Validate signatures, extension and MIME; sanitize SVG with strict tags/attributes; reject entity/active/external references. Preserve quota, kind filters, usage labels, per-asset metadata, object URL cleanup and safe deletion only when unused.
- Accepted media: JPEG, PNG, WebP, AVIF, SVG, MP4, MOV, WebM, WebVTT; safe public paths, raster data URLs and credential-free HTTPS; direct-media links reject arbitrary webpages. Third-party embeds use provider/ID allowlists and consent before loading; no tracking by default.
- Every media item retains source, kind, alt/title/description/date, poster, captions/language, fit/ratio/zoom/focal coordinates, autoplay/mute/controls/click behavior, loop/once/restart playback, mobile same/poster/hide and consent. Sequences share editor/export advance rules; preserve timing, end-of-video advancement, fade, starting index, autoplay, repeat, pause, reduced-motion, visibility and focus handling.
- Storage: keep `business-builder-workspace-v2`, schema 2/3, active page and all unrelated pages. Migrate legacy `business-builder-demo-v1`; retain unknown authored fields through migration; schema backup and pre-recovery copy are write-once. Failed loads preserve raw saved data and one unreadable copy and block overwriting. Autosave waits 250 ms; other-tab changes keep current edits.
- Export: project JSON backup plus complete multi-page HTML ZIP or WordPress theme ZIP; package local uploads, captions and same-origin fonts; preserve external references manifest; safe page paths and escaped text/attributes/PHP URLs; strip editor chrome without stripping public semantics. Shared runtime implements media, menus, carousels, gallery filtering, FAQ, demo validation and scroll controls. WordPress guards direct access, allowlists page templates, retains existing page content, and creates pages only on theme activation. No deployment or merge.

## Accessibility and security acceptance

Keep semantic headings/landmarks, descriptive media, keyboard menus, radio/switch/button state, focus return, form labels/errors, reduced motion and privacy consent. Check responsive widths and target sizes. Automated tests do not establish full WCAG 2.2 AA, security, privacy or WordPress production compliance; those need explicit manual/runtime evidence. Never represent a demo form or disconnected account integration as connected.

## Verification and dependencies

Existing 178 tests are baseline evidence, including 177 passing behavior/structure checks and a failing 9,500-line ceiling. Source-text assertions are implementation constraints only where they protect actual behavior; replace obsolete assertions with rendering/interaction checks, never weaker coverage. Required gates: complete tests, TypeScript, ESLint, Knip, production build, exact source count, plus browser checks for affected interactions.

Data flow: canonical contracts/layout schema → stateless fields → inspector engine → editor composition. Public section views must not depend on editor/sidebar modules. Media validation/playback and export share behavior. Shared Home chrome and service-page synchronization depend on stable persisted page/section/item identities.
