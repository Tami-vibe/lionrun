# Performance Engineering Rules

## Measure first
- Record baseline, test device/browser, network conditions, build mode, dataset size, cache state, and repeat count.
- Use production builds for representative benchmarks; distinguish lab metrics from real-user monitoring.
- Profile before optimizing; target the measured bottleneck, then rerun the same test.

## Initial targets (provisional; validate against product needs)
- Public pages at p75 real-user traffic: LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1.
- Public-page JS: aim for minimal hydration; track compressed transferred JS by template rather than pretending one universal cap fits all.
- Editor: responsive interactions and no noticeable typing lag; measure input latency on representative low-end devices and complex pages.
- APIs: track p50/p95/p99 latency, error rate, DB time, queue lag, and throughput; set endpoint-specific SLOs after baselining.

## Design rules
- Separate public rendering from editor dependencies.
- Lazy-load heavy editing controls and optional panels; avoid loading every icon and template eagerly.
- Use optimized images, responsive sizes, lazy loading below the fold, and correct hero-image priority.
- Avoid unnecessary rerenders; keep state local, memoize only where profiling proves benefit.
- Paginate lists, index real query patterns, avoid N+1 queries, bound payloads and concurrency.
- Cache only with explicit keys, invalidation, tenant isolation, and freshness expectations.
- Budget background work and add retries, backoff, idempotency, and dead-letter handling as needed.

## Source size
The 2,000-line aggregate application budget is obsolete. It described an early subset of files and is not a passing condition. Report physical lines under `src/app` and test lines separately. Do not claim compliance with the retired aggregate cap.

## Report
Baseline vs changed metric, same conditions, sample count, profiler trace if available, and tradeoffs. Never report invented gains.
