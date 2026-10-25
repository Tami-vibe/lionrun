# Premium editor — implementation reference

This package is a design and integration model, not a drop-in replacement for the application.
Target: Next.js App Router, React, TypeScript, existing custom studio.css, lucide-react.

## Start here

1. Open premium-editor-preview.html in a browser. It contains the complete interactive visual prototype shown in the conversation. Lucide loads from a pinned CDN; an internet connection is needed for icons only. Image data is embedded.
2. Read react/EditorShell.tsx for the integration boundary. It has no persistence model and never creates a second draft. Implement EditorAdapter using existing store selectors and actions.
3. Merge premium-editor.css into the existing styling system. Scope the root to #premium-studio, or rename that selector consistently. CSS is visual-reference code, not a new design-system dependency.
4. Use the existing section controls inside renderInspector. Reorganize them; do not replace their behavior with the prototype's simplified renderers.

## Preserve the application contract

- Preserve site.blocks, page records, schema 3 and business-builder-workspace-v2 exactly.
- Do not copy the prototype storage key, seed content or localStorage logic into production.
- One selected section and one source of draft truth. Page, canvas and inspector selection use stable IDs.
- Header/Footer content remains shared. Their visibility semantics must follow the actual store.
- Theme and accent are PAGE-level. Header/Footer show a Shared label.
- Keep fixed catalog ordering. No section drag/reorder control. Existing saves sort catalog order.
- Retain 80-block and 30-page limits; preserve existing count semantics for the block cap.
- Top navigation maximum 5 links. Keep placement choices: top, bottom, under-menu-button.
- Duplicate is disabled for Header/Footer. Preserve actual deletion confirmation behavior.
- Reset current page only. Preserve brand, theme, other pages and uploads through existing action.
- Business-profile saves currently overwrite Contact details. Do not quietly change this behavior during the shell refactor; explain it in the UI. Any explicit-sync redesign is a separate approved behavior change.
- Existing autosave, recovery, undo/redo and export remain authoritative.
- Hidden sections stay visible in the editor's navigation and absent from published output.

## Navigation

One panel has location state: pages / sections / inspector / page settings / business / create page / add section.
Location and open groups are UI-only state. They must not become a replacement draft schema.
Canvas selection opens the selected section. Breadcrumbs return without clearing content or changing visibility.
Keep all 16 section types in the catalog. New pages use their actual block list; do not seed every page with all 16 types.

## Inspector structure

Content groups follow objects, not generic technical categories:
- Message: eyebrow, headline, description; contextual text appearance.
- Buttons: wording, action, destination, icon, icon position, supported visibility and appearance.
- Repeated items: each service/review/logo/question/form field owns its own content and media.
- Media: background, story video and gallery are separately named destinations.
- Appearance: section-specific layouts, grid controls only where applicable, typography and spacing.

Preserve ALL audited controls. Not every section has every control. Hide incompatible controls; retain content when layouts change. A control must either change the canvas or explain why it cannot apply.

## Exact inventory to retain

Header: menu name, up to 5 links, look, sticky, overlay, background, 0–2 extra buttons, logo. No invented padding or icon control.
Hero: eyebrow/headline/description; 3 trust facts with icons; story icons/stats/button/rating/image label; five layouts; height/alignment/darkness/padding; primary/secondary buttons; layout-specific secondary visibility; main file/slides/story video/bottom slides.
Partner logos: label/headline/description; names and media per logo; scrolling/still/heading-slider layouts; columns for Still row.
Services: intro/link wording/photo note; per-item title/description/price/page/icon/media; Icon cards/Photo cards/Price list; photo darkness/arrow style.
Why choose us: three layouts; promises/caption; stats/avatars/more-people count; up to six icon reasons; two links/photo.
About/gallery: Story and photos/Photos only; per-item title/description/caption/group/media; filtering groups.
Customer concerns: Photo cards/One message; promise; title/description/tag/icon per item; photo media/columns; one button.
Our process: 3–5 numbered photo steps OR before/after labels, 3 facts, 2 images.
Trust signals: Big numbers/Numbers and certifications/Signals; label/value/note; Signals photo side/fit/position/color/fade/darkness.
Reviews: name/quote/service/date/source/details/stars/photo; Featured/Grid/Carousel/Auto; text length/avatars/names/card face/padding/show toggles.
Quote: note/form wording/consent; up to 12 typed fields and required flags; side image. Inputs remain inert in EDIT mode.
FAQ: question/answer pairs; Accordion/Two columns; one button. Existing arrow rendering is not an icon picker.
Promotion: price/old price/end date/badge/details/2 buttons/background image.
Contact: address/phone/email/hours/2 buttons/map image; existing Account overwrite behavior.
Final CTA: Quiet/Full color; 2 columns; 1 button; optional image.
Footer: column headings/text/links/copyright; Columns/Minimal; optional image; shared scope.

## Prototype limitations — do not ship these as product behavior

The HTML is a plain JavaScript visual model with simplified data and canvas renderers, not the existing application.
Many non-Hero layout/style fields are rendered but do not have full layout fidelity in the simplified preview. Header/Footer deletion in the visual hides them rather than performing the real deletion. Reset uses demonstration starter content. Menu placement limits and the duplicate block cap need the real store guards. The business profile uses an explicit sync demonstration. Device previews are approximate widths, not your responsive validation suite. Video encoding and AI generation are not implemented. Local image persistence is limited to small demonstration data URLs. Do not adopt these shortcuts.

## Integration and validation

Keep localStorage/IndexedDB persistence in the current workspace store. Group undo history by committed editing action; do not snapshot every keystroke as the HTML model does. Ensure one autosave per transaction rather than an additional writer in the new shell.

Use actual existing project versions. No framework upgrade is needed. Use the installed lucide-react package; remove any unused imports during integration. React source assumes the app supplies the adapter; it is a reference shell, not a runnable standalone app.

Required checks: existing lint/typecheck/build; meaningful existing persistence and undo tests; page switching/hidden sections/shared Header/Footer/item edits; export strips editor-only UI. Verify at 1100/768/390, keyboard navigation/focus, contrast, reduced motion, long labels, empty media, storage errors, page and block caps.

Keep the audited defects open until repaired and retested. A visual redesign does not fix the Hero saved video plan, false spacing values, Services truncation, ignored layout controls/icons, Auto review layout, or Final CTA fill bug.

The under-2,000-line aggregate application budget is obsolete. Measure `src/app` physical lines and test lines separately, and do not claim compliance with that retired cap. This reference bundle is not an additional app to merge wholesale.

## Verification performed on this package

- Prototype JavaScript syntax checked with Node.
- Controller smoke check exercised 16 section types in both views, navigation, item/headline updates, isolated persistence and undo/redo using a minimal DOM stub.
- This is not a real browser layout or accessibility test.
- React shell has not been typechecked against your repository; React/TypeScript/Lucide dependencies are unavailable in this workspace.
