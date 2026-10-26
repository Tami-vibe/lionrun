# Zero-Friction HUD Editor and Site Model

## Core interaction
- Click visible element -> select it -> show relevant controls; double-click text for inline editing.
- No modal for routine edits; expose basic controls first and advanced settings progressively.
- All changes preview immediately; provide clear undo/redo and per-property reset.
- Support keyboard, touch, focus states, and accessible labels. Never rely on icons alone without accessible names/tooltips.

## Schema contracts
- Site -> pages -> sections -> elements; each has stable IDs and schema versions.
- Reusable section types: header, hero, services/products, benefits, proof/testimonials, gallery, FAQ, CTA, contact, map, footer.
- Each element declares editable props, defaults, validation, responsive overrides, and allowed actions.
- CTA model: label, URL/action type, target, rel, optional icon ID, icon placement, accessible name, analytics ID.
- Icon picker: searchable curated set, preview, optional none, stable icon IDs; avoid arbitrary untrusted SVG injection.
- Header/footer variants share content models so switching variants preserves data.
- Support separate pages, legal pages, sitemap and 404, with navigation and routing validation.

## Responsive defaults
- Mobile-first layouts, fluid type/spacing, constrained content width, responsive images, safe wrapping, and tested breakpoints.
- Overrides inherit from base values and are clearly marked; no silent per-device duplication.
- Published output must remain usable without editor code.

## UX acceptance test
A first-time user can change headline, replace image, add a button icon, change header, preview mobile, and undo without reading documentation. Observe real users; do not claim 'zero learning curve' without usability testing.

## Approved Editor Shell & Inspector Specification (Locked)

### 1. Approved Design Artifacts & Screenshots
- Top bar and canvas layout: `docs/review-shots/updated-redesign.png`
- Header inspector (Shared): `docs/review-shots/header_inspector_verified.png`
- Hero inspector (Standard): `docs/review-shots/hero_inspector_verified.png`

### 2. Shared Tokens
- **Editor Blue**: `#2563EB` (accent color for active tab underlines, radio/choice borders, focused inputs, toggle switches, and row highlights).
- **Active Row / Pill Tint**: `#e8f1fe` / `#eff6ff`.
- **Borders & Dividers**: `1px solid var(--p-line)` (`#e4e5ec`).
- **Typography**: `var(--editor-font)` (`ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`).
  - Section Index: `11px`, `600`, letter-spacing `0.05em`, uppercase, `#64748b`.
  - Section Title: `16px`, `600`, `#26272e`.
  - Group Header: `14px`, `600`, `#26272e`.
  - Field Labels: `13px`, `500`, `#3f4454`.
  - Helper / Hint: `12px` - `13px`, `#3f4454`.

### 3. Interaction & Structure Rules
- **Back Navigation**: Plain text button `← All sections` without card borders or outlines.
- **Section Identity**: `SECTION 0X` uppercase numbering, section icon, title, and a neutral rounded `.shared-badge` pill (`Shared`) strictly for Header and Footer with helper `"Changes appear on every page."`.
- **Section Actions**: Visibility toggle (Eye/EyeOff) and 3-dot dropdown menu are square 28px × 28px buttons with 16px icon sizes, aligned to the right.
- **Content / Style Tabs**: Flat tabs; active tab receives blue `#2563EB` text with a 2px bottom border indicator sitting on a neutral divider.
- **Accordion Groups**: Borderless flat rows separated by thin gray dividers (`1px solid var(--p-line)`). No heavy card boxes.
- **Group Headers**: Semantic left Lucide icon (16px), title, optional subtitle, real data count badge (`<span className="group-count">`), and right chevron (`ChevronDown` when expanded, `ChevronRight` when collapsed).
- **Expanded Groups**: Inputs and fields appear directly underneath the group header without nested card containers.
- **Standardized Inputs**: Full-width stacked inputs (38px height, 8px radius, `8px 12px` padding, `#2563EB` focus ring) and textareas (min-height 80px with vertical resize preserved).
- **Toggle Switches**: Label on left, smooth pill switch on right (`#2563EB` when checked), with helper text support.
- **Pinned Layout**: Header (`.paneltop`) and footer (`.panelbottom`) remain pinned; middle `.panelbody` scrolls smoothly.

### 4. Style Lock
Shared shell and inspector styles in `src/app/studio.css`, `src/app/editor/shell.tsx`, and `src/app/editor/content-browser.tsx` are locked to ensure uniform consistency across all 16 section tabs. Future section updates must reuse these shared components and rules. Any modification to the shell architecture requires explicit review; bug and accessibility fixes remain allowed.

