# Approved editor fixes

Implemented on the existing review branch after approval of Images 2–9. Native dropdown appearance (Image 1) is unchanged.

| Reference | Implemented behavior |
| --- | --- |
| Image 2: contrast | Current/suggested samples use the actual button text. Apply suggested colors updates that button in the website preview, saves the overrides, exports them as inline styles, and supports Undo. Keep current colors does not mutate data. Use website button colors clears the override. |
| Image 2: destinations | Destination offers Page on my website, Section on this page and Website address, alongside existing Call/Email. Page selection stores a stable page reference in the existing href field; page names/addresses may change without breaking the reference. The existing preview and export routing resolve it. |
| Image 3: Back | Both task Back controls use the same arrow icon. Only the immediate-parent task Back is shown on nested image screens; All sections remains the section-level return. |
| Images 4 and 6: uploads | Shared MediaUpload is used by collections, the main image journey, the generic photo manager, the library picker and library management. It supports primary upload, library selection, links, dropping/pasting, loading, focus, disabled and status states as applicable. Owner-specific acceptance rules and counts are retained. |
| Image 4: saved overflow | Existing media over the add limit remain untouched and the message explains that they are preserved. Replace selected file remains available when adding is blocked. |
| Image 5: thumbnails | One outer tile and one selected outline; no inner button/frame borders. Image/video media fill the thumbnail width and height. Logo images retain contain sizing. |
| Image 7: title and icons | Section titles stay on one line. The concern icon picker renders outside the clipping scroll container. Badge icon changes the icon inside the short-tag badge. |
| Images 8 and 9: media manager | Common upload controls replace the native file input entrance. Source, metadata, storage and playback remain in disclosures. Library records separate name/metadata from actions, expose full names with tooltips, show thumbnails and explain deletion restrictions. Video cover action appears only for video/social contexts. |
| Responsive behavior | Inspector tasks use a full-height editor/preview switch on phones. Undo, device controls and overflow remain reachable. |

## Verification

- 156 automated tests pass, including new regressions for stable page references across rename/address changes, real button color rendering/validation, concern badge icon rendering and uploader constraints.
- Browser: the contrast comparison displayed two real samples; applying changed the website button's inline colors; Undo removed the override.
- Browser: choosing Collision repair set the actual website button's page target and live-preview URL to that page's ID.
- Browser: concern icon picker opened visibly; selecting Shield produced a shield SVG inside the “The hassle” badge.
- Browser: uploaded ac-service.jpg through the new shared device-upload control, confirmed it appeared in the collection and undid the addition.
- Browser: imported a second image through the shared link form in Why choose us, verified two full-width thumbnails with 0px inner borders, then undid the addition.
- Browser: library record has filename, metadata and actions on separate responsive rows. At 390px the section title measured 20px high (one line), with no horizontal page overflow.
- Existing browser-local workspace format and saved media remain supported. No changes to native select/dropdown styling.

Original discovery captures remain as the first review's history. The new approved-fix captures show the current implementation. Usability with first-time users is still untested.

## Story media follow-up

Confirmed causes: the task panel, the Hero slideshow and the advanced collection editor had independent selections. The slideshow could advance during editing, and selecting a task thumbnail did not save the first visible slide. Story also has a separate `story` media field, which was absent from the main media task. Saved video covers could depict a different scene from the actual clip.

Implemented in the existing editor:

- Background selection is shared by the task and canvas and saved through the existing workspace update/history path. Slideshow advancement pauses during editing; visitor playback keeps its saved settings.
- Story exposes Background and Story video. Applying a Story clip updates only `content.story`; the background collection stays intact. Other layouts expose their background media without Story-only controls.
- Thumbnail buttons have no inset padding or border, fill their space and use one subtle selection underline. The video task preview has playback controls and shows the clip itself. Covers remain saved and editable through advanced options.
- Short action labels replace explanatory action subtitles. Context remains visible; guidance appears with the relevant task. Draft replacement/framing/description applies explicitly, Cancel leaves saved media alone, and Undo clears temporary focus so the saved selection is shown.
- The selected draft keeps its original target even if a canvas thumbnail is clicked while editing.

Verification: 159 automated tests passed, including new rendering checks for held editor selection, visitor autoplay settings, separate Story media, saved selection and layout-specific controls. TypeScript passed. Lint reports no errors and two existing image-element warnings. Production build passed. Live Chrome checks covered sidebar-to-canvas selection, canvas-to-sidebar selection, persistence after reload, Cancel, applying a Story clip, all four backgrounds retained, Undo, and desktop/tablet/mobile controls. Test Story content was undone and the original first background restored. These are engineering and interface checks, not evidence from usability sessions with first-time users.

Screenshots: [desktop](hero-media-live.png), [tablet](hero-media-tablet.png), [mobile actions](hero-media-mobile.png).

## Approved Header and compact media implementation

Implemented the reviewed Media and Header direction in existing components, without adding a package or a second editor system.

- Choose media uses a compact upload area, followed by Use a link and Your uploads. The existing acceptance rules, library, file/link callbacks and draft Apply/Cancel path remain connected. A selected replacement becomes a small file summary with Change and Use photo/Use video; no disabled Apply action is shown initially. The uploader shows truthful busy feedback rather than a fabricated progress percentage.
- Header uses focused task screens and one shared-page note. Menu rows are flat, title/metadata gaps are tight, decorative handles are gone, nested labels can wrap, placement is shown once, and the permanent nesting example is removed.
- Menu actions render in one fixed portal above the sidebar. Popups use compact labels/icons, red destructive actions, outside-click/Escape/Tab dismissal, arrow-key navigation, viewport-aware positioning and restored trigger focus.
- Mouse/pen dragging reorders links, promotes them or nests them under a root. The insertion indicator and destination hint show the proposed result; a parent moves with its sublinks. Escape cancels. Alt plus arrow keys provide keyboard movement. Touch users retain scrolling and can use the edit screen’s Show under and Position controls.
- Movement preserves IDs, page references and destinations. It rejects cycles, unsupported depth, nesting a group with children and additional top-level links beyond the existing five-link Header limit. Existing over-limit items are retained. Footer nesting is blocked because the existing Footer projection supports root links.
- Editing existing link text and menu names uses the existing live update/history path. New links are drafts until Add link. Duplicate remaps copied parent IDs; deletion explains when sublinks are included and uses the existing Undo.

Two binding/rendering corrections were needed beyond the eight planned UI/model files: settings.ts preserves custom named-menu labels when binding pages on reload, and site/sections/menu.tsx displays those labels instead of forcing page names. menu-model.ts projects page destinations with the existing stable /?page=<id> format, so renamed page addresses retain their links. Saved data shapes and the visitor navigation structure are unchanged.

Live checks: dragging Repairs to the main level and back under Services; moving Services with its children via keyboard; Undo; live menu rename and navigation-label editing; selecting a page destination; duplicating and deleting with recovery; Header placement; invalid media links; valid file-link Apply and Undo; library selection and Cancel; desktop, tablet and mobile layouts. Test edits were undone. The existing Repairs and Maintenance entries had no assigned website-page ID and pointed at #services; the editor now shows Choose a page rather than guessing their intended destinations.

Automated checks: 167 tests passed, including movement, invalid moves, duplication, projection, stable page references, custom labels and UI regressions. TypeScript and production build passed; lint has no errors and two existing image-element warnings. Usability with first-time users remains untested. Physical touch dragging was not implemented: touch uses the native movement controls described above.

Screenshots: [Header overview](header-overview-compact.png), [menu actions](header-menu-actions.png), [Main menu](header-main-menu.png), [mobile Main menu](header-main-menu-mobile.png), [media chooser](media-chooser-compact.png), [mobile media chooser](media-chooser-mobile.png).

## Footer implementation — 28 October 2026

The approved Footer interface is implemented in the existing editor. Content and Style use
one Footer component and the existing update/undo/save path. No dependencies were added.

- Layout thumbnails: Standard, Business hours, Logo & social links, Centered brand, Bottom row only.
- Presets preserve stored columns, schedules, account links, logo and text when hidden.
- Brand: Header logo/custom image/none, editable motto, alignment, item order and spacing.
- Social media: add any named account URL, edit it, remove it and undo removal.
  Recognized names use simple marks; other platforms use accessible labels and initials.
- Columns: editable titles, text, link labels/destinations, or structured weekly office hours.
  No guessed schedule is published until an open day is chosen. Online businesses hide hours.
- Link chooser: Footer menu, Header menu, all website pages, current-page sections, external URL.
  Page identity remains separate from a custom display name. Missing pages are flagged.
- Bottom row: legacy text stays editable; new links are real links, not parsed legal text.
- Typography: titles, text/links, motto, bottom row and hours have independent settings.
  Font, size, weight, line height, tracking, alignment, case and relevant row/item spacing work.
- Hover: compact Header-matching shapes or text-only contrast feedback, with keyboard focus.
- Editor text and button labels are 12px, including editor dialogs and popover menus.
  Website typography is separate. Bottom-row website text defaults to 12px at every width.
- The existing wide Footer image and media importer remain available independently of the logo.
- Library usage scanning includes the custom logo. No second persistence store was introduced.

### Verification

178 automated tests pass, including 11 new Footer cases covering legacy data, validation,
page references/custom names, menu synchronization, media usage, schedules, layouts and contrast.
TypeScript and production Webpack build pass. The sandbox build could not fetch existing Google
Fonts; the same production build succeeded with network access. Lint has zero errors and two
pre-existing image warnings. New Footer TypeScript files have no lines longer than 100 characters.
The source-size guard is 9,500 lines (from 8,600) for the added interface and model; its long-line
density limit remains unchanged.

Browser tasks checked in the actual editor: choose Business hours, enable weekdays, inspect
closed days, choose a website page without leaving Footer, save a custom label, add a custom
social account, select a logo from the existing library, change motto size/alignment, and choose
the stacked layout. Verified 12px editor button text and tablet/mobile website preview layouts.
Verification screenshots show temporary QA content. All 13 test edits were undone; original
Footer content was confirmed after reload. No media assets were uploaded or deleted during QA.
Usability with first-time users remains untested.

Screenshots: footer-business-live.png, footer-mobile-live.png, footer-typography-live.png.
