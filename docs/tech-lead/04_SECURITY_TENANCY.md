# Security and Multi-Tenant Isolation Rules

- Threat-model entry points: editor, publishing, custom domains, uploads, forms, webhooks, billing, AI generation, and admin routes.
- Enforce authentication and authorization on the server for every protected operation; UI visibility is not security.
- Scope every tenant-owned resource read/write to the authenticated tenant; test cross-tenant access attempts.
- Validate untrusted input at boundaries with schemas; encode output and sanitize allowed rich content. Prevent XSS in page content, HTML embeds, and published templates.
- Protect mutations against CSRF where applicable; use secure cookies/session settings, rate limits, and abuse controls.
- Store secrets only server-side; never put tokens or private data in client bundles, logs, generated websites, or prompts.
- For uploads: check type, size, authorization, storage access, and dangerous formats; never trust extensions alone.
- For URL fetchers and AI tools: prevent SSRF, restrict allowed destinations, enforce timeouts and budgets, and treat generated content as untrusted.
- Use parameterized database queries and least-privilege credentials; avoid raw SQL without review.
- Keep dependency scanning and patching routine; avoid introducing packages without need.
- Back up data, test restoration, audit privileged actions, and document incident response.
- Review privacy, retention, consent, and deletion obligations before collecting customer/visitor data.
- Never claim 'secure' based solely on lint/build success. Require targeted security tests and review.
