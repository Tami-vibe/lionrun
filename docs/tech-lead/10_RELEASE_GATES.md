# Release Gates and Decision Checklist

## Every pull request
- [ ] Requirement and acceptance criteria linked
- [ ] Scope limited; no unrelated files or dependencies
- [ ] Diff reviewed for correctness and secrets
- [ ] Lint/typecheck relevant tests run; failures disclosed
- [ ] Changed user flow manually or automatically verified
- [ ] Security/tenant boundary assessed
- [ ] Performance measured if affected
- [ ] Migration and rollback reviewed if relevant

## Before production
- [ ] Staging smoke test on actual build
- [ ] Two-tenant isolation tests for protected data paths
- [ ] Desktop/mobile editor + public rendering tested
- [ ] Site metadata, sitemap, 404 and canonical behavior tested
- [ ] Backups, monitoring, alerting, rollback ready
- [ ] Release owner approves evidence and known risks

## Escalation triggers
Data corruption; cross-tenant leakage; auth bypass; unbounded costs; unresolved production build failures; unexplained performance regressions; destructive migrations; missing rollback.

## Release decision
`GO` only when all applicable critical gates pass. Otherwise `NO-GO` with precise blocker and remediation.
