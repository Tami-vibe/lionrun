# Architecture Rules

- Keep a modular monolith until measured scale or team boundaries justify splitting services.
- Maintain clear boundaries: **editor UI**, **site schema**, **renderer**, **persistence**, **publishing**, **business logic**, **infrastructure adapters**.
- The published website renderer must not depend on editor-only packages or state.
- Define a versioned, typed, validated schema for pages, sections, elements, styles, actions, and responsive overrides. Validate at trust boundaries, not only in TypeScript.
- Use one reusable HUD property inspector driven by typed element/section definitions; avoid a separate editor implementation for every section.
- Keep domain behavior independent from React components where practical. Prefer pure transformations and explicit interfaces.
- Preserve data ownership and tenant boundaries in every query, mutation, cache key, and asset reference.
- Avoid circular dependencies, hidden globals, duplicate sources of truth, and unbounded configuration options.
- Prefer simple server-rendered published pages; ship editor JavaScript only to editor routes.
- Make migrations backward compatible where possible; define schema version migration before shipping breaking changes.
- Introduce a dependency only after documenting what problem it solves, bundle/runtime cost, maintenance risk, and why built-ins are insufficient.
- Keep configuration and features discoverable; use a short architecture decision record for consequential changes.
