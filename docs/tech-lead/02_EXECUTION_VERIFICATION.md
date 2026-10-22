# No-Guessing Execution and Verification Protocol

## Before coding
- Inspect relevant files, tests, dependency versions, runtime configuration, git diff, and existing docs.
- Reproduce reported behavior. If reproduction is impossible, label hypotheses clearly.
- Record expected inputs, outputs, edge cases, failure modes, and acceptance tests.
- For uncertain library behavior, inspect installed types/docs or write a minimal proof; do not rely on memory alone.

## During coding
- One coherent change at a time; inspect the diff and run the narrowest relevant test.
- Preserve existing contracts. Avoid unrelated refactors and opportunistic dependency upgrades.
- When a check fails, identify whether failure existed in baseline before attributing cause.
- Stop after two unsuccessful attempts at the same issue: document evidence, change diagnostic approach, or ask for direction. Do not loop.

## Required gates
1. Format/lint for touched files.
2. Type-check (TypeScript strict mode).
3. Unit/component tests for changed logic.
4. Integration tests for changed API, database, auth, or publishing paths.
5. Production build when runtime/build behavior changes.
6. Browser E2E checks for affected editor flows, including desktop/mobile.
7. Security/tenant-isolation checks when data access or permissions change.
8. Performance comparison when changes affect rendering, bundles, queries, or asset delivery.

Use repository-defined scripts; never invent passing results. If a gate does not exist, report the gap and propose the smallest addition.

## Evidence log format
`Claim | Evidence (command/test/browser action) | Result | Environment | Confidence | Follow-up`

## Stop and escalate
Stop on unexplained data loss, tenant leak, auth bypass, repeated non-reproducible behavior, destructive migration, significant regression, or unclear high-impact requirement.
