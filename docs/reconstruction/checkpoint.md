# Reconstruction checkpoint: acceptance is not met

## Result

This is an implemented and tested **schema/inspector reconstruction checkpoint**, not the requested complete reconstruction. The 2,500-line gate remains failing. No claim is made that this is the smallest possible complete implementation or that the budget has been proved incompatible with full feature preservation.

The reference contained 9,993 application lines, plus 37 lines of executable root configuration: **10,030** under the complete counting rule. The checkpoint contains **9,684** lines, including configuration, blank lines and comments. Nothing was moved into an excluded runtime file, generated artifact, dependency or document to lower the count.

| Architectural module | Physical lines |
| --- | ---: |
| Editor TypeScript/TSX | 4,526 |
| Site contracts, model and rendering | 2,380 |
| All application CSS | 1,745 |
| Media TypeScript/TSX | 517 |
| Next.js entry points | 324 |
| Export | 119 |
| Executable configuration | 37 |
| Source audit utility | 36 |
| **Total** | **9,684** |

Reproduce with `node scripts/application-lines.mjs`. The counter includes public runtime scripts and every utility script, including the audit utility itself. A fixture test checks those inclusions. Tests, documentation, dependencies, build output and generated `next-env.d.ts` are excluded.

## Original versus replacement boundary

Before: a layout-ID table, a separate copy-slot contract table, separate labeled layout arrays, five specialized appearance inspector modules, hand-written scalar controls, and separate layout-thumbnail components. Layout defaults and visible inspector controls could drift apart.

After: one canonical layout descriptor table covers all **16 section types / 39 persisted layouts**. A scalar appearance schema supplies saved property keys, control kinds, defaults, allowed options, numeric bounds, units, groups, conditional visibility and page scope. Stateless primitives interpret it. One inspector engine supplies shared groups and the genuinely specialized geometry operations (grid columns and two-column balance). Thumbnail rectangles describe arrangement previews without per-layout component modules. The five old appearance modules and their shared-props layer were removed.

An explicit layout reset now takes precedence over automatically calculated layout defaults; a regression test verifies reset widths, column count and content overrides. Ordinary layout switches preserve authored values. Conditional controls hide without clearing saved settings.

The active replacement contract, primitives and inspector engine occupy **585** lines. That is not the whole application. It is evidence about this implemented boundary, not a mathematical lower bound or evidence that the entire product fits the proposed allocation.

## Product extraction

- `feature-contract.md` maps every section and cross-cutting behavior, including migration, failed-load protection, media/privacy, service-page synchronization, menus, exports, keyboard behavior and responsive requirements.
- `control-inventory.md` records **522 baseline control declarations**, their labels/bindings, and reference source locations. Repeated collection controls apply to every item.
- `/tmp/lionrun-reconstruction-reference` retains the baseline reference for this session; commit `70329412` is the durable committed reference.

## Verification evidence

- Complete suite: **187 tests, 186 pass, 1 fails**. The sole failure is the strengthened, complete-application 2,500-line acceptance gate. All 177 original non-budget tests still pass.
- New coverage exercises canonical layout identities, every schema choice callback and its scalar type, bounded slider callbacks, save/load round trips, explicit false, conditional controls, public rendering for all 39 layouts, non-mutating render behavior, and explicit reset overrides.
- TypeScript: `npx tsc --noEmit` passes.
- Lint: zero errors; seven existing warnings remain (five unused values in the protected default inspector, two native image warnings).
- Knip: passes.
- Production build: passes.
- Runtime import scan: 78 TypeScript/TSX modules, zero runtime cycles. Type-only edges were excluded from cycle detection.
- Browser: checked on the isolated `localhost:3101` origin, using the production build. Gallery layout switching, keyboard scale change to 1.1×, Still hiding speed/pause controls, Undo restoring Loop, Redo restoring Still, and the 390px mobile canvas were observed. This does not establish complete responsive or accessibility coverage.

## Protected work

Both pre-existing user-modified files remain byte-for-byte unchanged and must remain outside this checkpoint's commit:

- `src/app/editor/inspectors/default.tsx`: SHA-256 `8f4aff28803640b65a42efb84c32cfa20e7d54189185e56e0687a661e5c6fcf6`
- `src/app/editor/services-content.tsx`: SHA-256 `1c7c377836300b4dac8187725ea86a03896f75f39667d77d36c9d0d2f5a03c8b`

Only `refactor/reconstruct-2500-lines` was edited. No deployment, merge, main change or recovery-branch change was performed.

## Outstanding acceptance gaps

- **7,184 lines over budget.** The proposed allocation has not been realized.
- Workspace/persistence, media, public rendering, remaining editor interactions, export and most CSS still retain the existing architecture. Full demolition/reconstruction is incomplete.
- All 39 layouts render under automated checks, but every control/interaction has not been exercised in a browser. Existing tests provide partial evidence, not a complete acceptance audit.
- Full WCAG 2.2 AA (including contrast/target sizes/focus across every flow), assistive technology behavior, real-device responsive behavior, privacy/security review, and installation in an actual WordPress environment remain unverified. No certification or compliance guarantee is implied.

Phase status: A extracted; B allocation documented but unachieved; C partially implemented; D regression coverage passing for the implemented boundary; E failing the line gate and incomplete manual coverage; F checkpoint only. The full mission remains incomplete.
