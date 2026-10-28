# Reconstruction architecture and budget

## Proposed 2,500-line allocation (acceptance target, not an achieved count)

| Module | Lines | Responsibility |
| --- | ---: | --- |
| Canonical contract and defaults | 400 | All 16 sections, layout/field descriptors, starter data, saved shape |
| Workspace model | 250 | Migration, validation, identity, menus, service sync, history, persistence |
| Media | 350 | IndexedDB, validation, library, rendering, playback and consent |
| Website rendering | 300 | Shared layout patterns, chrome, sections, responsive behavior |
| Editor | 600 | Shared fields, inspector, collections, pages, settings, canvas/navigation |
| Export | 250 | ZIP, document projection, media/fonts and HTML/WordPress adapters |
| CSS | 300 | Tokens, product UI, section patterns, responsive and motion rules |
| Next.js/configuration | 50 | Entry points, layout, build/lint configuration |
| **Total** | **2,500** | No application logic in tests, docs, generated output or data files |

This allocation is a design hypothesis. Each replacement must fit its allocation *and* pass its feature contract before removing the reference implementation. Exceeding the allocation is a failed target, never grounds for deleting functionality or compressing code.

## Replacement boundary

Start with the canonical layout and field schema and the inspector engine. Section-specific layout components are replaced by data plus one renderer. Numeric bounds, defaults, choices, visibility conditions and persisted keys belong to the schema; form primitives render them without knowledge of section types. Keep migrations and public views operational while switching editor consumers to the replacement. Preserve the two user-modified files byte-for-byte.

Subsequent boundaries are workspace/persistence, media, section rendering, export and CSS. Retain a module until a replacement has equivalent behavior and verification; unconverted modules count in the application budget. No excluded compatibility tree is allowed in the final application.

## Counting

Count physical lines (including blank/comment lines) of application-owned `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.css`, `.mts`, and `.cts`, including root executable configuration. Exclude dependencies, Git/Next output, generated `next-env.d.ts`, TypeScript build info, tests, documentation and non-runtime audit tooling. Count protected user files even when unused. Report all modules; never present only replacement-module lines as the application count.
