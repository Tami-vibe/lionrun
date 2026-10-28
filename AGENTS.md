<!-- BEGIN:nextjs-agent-rules -->
# Codex Agent Rules: Architecture Redesign Specs

## 1. Strict Module Layout Validation
- Data Pipeline Direction: Contract (`layout-contract.ts`) ➔ Primitives (`fields.tsx`) ➔ Inspector Engine (`section-editor.tsx`) ➔ View Layer.
- Eliminate circular loops. View components are strictly prohibited from importing editor/sidebar modules.

## 2. Refactoring Targets
- Consolidate structural layouts from `about-style.tsx`, `services-style.tsx`, `proof-style.tsx`, and `logos-style.tsx` into a single, cohesive schema module: `src/app/editor/section-editor.tsx`.
- Centralize standard inputs, selectors, and sliders into a reusable stateless primitives file: `src/app/editor/components/fields.tsx`.

## 3. Automation Verification Gate
- Run `npm run build` and `npx knip` to verify zero broken imports or structural regressions.


<!-- END:nextjs-agent-rules -->
