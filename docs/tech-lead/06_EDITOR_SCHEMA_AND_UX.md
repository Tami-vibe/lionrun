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
