# Testing and Quality Strategy

## Testing pyramid
- Unit: schema validation, responsive override resolution, URL normalization, section transforms, undo/redo, permission policies.
- Component: inspector controls, icon picker, visibility, validation, keyboard and focus behavior.
- Integration: persistence, tenant access, publish/unpublish, page routing, form submissions, migrations.
- E2E: create site -> add page -> edit hero -> add CTA icon -> switch breakpoints -> preview -> publish -> load public page.

## Critical regression cases
- Desktop/tablet/mobile layouts; long text; missing images; empty buttons; invalid links; RTL and keyboard navigation.
- Refresh/reopen persistence; concurrent edits/conflicts; schema migrations; rollback; failed uploads.
- Unauthorized reads/writes between two tenants; public/private separation; XSS attempts.
- 404, legal pages, sitemap, robots directives, canonical URLs, redirects, and custom domain behavior.

## Rules
- Test behavior, not implementation details. Prefer deterministic fixtures, isolated test data, and stable selectors.
- Every fixed bug gets a regression test when feasible.
- Never delete failing tests or weaken assertions just to pass.
- Verify accessible names, focus order, contrast, and touch target usability.
- Run a production smoke test after deployment and verify monitoring; rollback on severe regressions.
