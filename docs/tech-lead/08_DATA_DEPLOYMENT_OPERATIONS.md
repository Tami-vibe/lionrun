# Data, Deployment, and Operations

- PostgreSQL with versioned migrations; review and test migrations on representative data before production.
- Prefer expand -> migrate -> contract for breaking schema changes. Back up and test restore before risky operations.
- Use transactional writes for consistency; enforce uniqueness and foreign keys where appropriate.
- Maintain separate dev/staging/production environments with least-privilege secrets and isolated data.
- CI: lint, typecheck, tests, build, dependency/security checks; block release on required failures.
- Use health checks, structured logs with correlation IDs, metrics, tracing where needed, and alerting on user-impacting failures.
- Publish atomically or with reversible versioned releases; keep last-known-good site version available.
- Make retries idempotent; set limits on AI spend, uploads, jobs, and public form traffic.
- Document incident response, restore process, release checklist, and rollback steps.
- Start with managed services and a modular monolith; scale from measured capacity, not hypothetical user counts.
