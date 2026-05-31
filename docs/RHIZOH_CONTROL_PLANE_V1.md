# Rhizoh Control Plane v1

**Tag:** `CORE-ELIGIBLE` · **Status:** SSOT (ops + architecture)  
**Related:** [`RHIZOH_REPLY_NORMALIZATION_LAYER_V1.md`](RHIZOH_REPLY_NORMALIZATION_LAYER_V1.md) · [`RHIZOH_REPLY_SCHEMA_EVOLUTION_GOVERNANCE_V1.md`](RHIZOH_REPLY_SCHEMA_EVOLUTION_GOVERNANCE_V1.md)

## Architectural law

> **CI decides possibility. Gateway decides reality. Cohort decides experience.**

> **Client cannot create meaning, only display meaning.**

Client is the surface of reality — not a decision maker.

## Four layers

| # | Layer | Question | Mechanism |
|---|--------|----------|-----------|
| 1 | **CI** | Deploy edilebilir mi? | `ci:reply-schema-simulation-gate` — golden suite + live attach probes + optional `--strict-future` |
| 2 | **Gateway** | Hangi schema çalışır? | `resolveSchemaForRequestV1({ cohortId })` → `replySchemaVersion` + negotiation + drift |
| 3 | **Cohort** | Hangi gerçekliği görürsün? | `COHORT_SCHEMA_MAP_V1` — v1 · v2_shadow · future fork |
| 4 | **Client** | Ne gösterilir? | Render only: `reply` + envelope + metadata |

## Runtime stack

```
[CI]        approve / reject deploy
     ↓
[Gateway]   schema + negotiation + drift
     ↓
[Cohort]    perception fork (routing)
     ↓
[Client]    render-only projection
```

## v2_shadow (observational fork)

**Not an execution fork.**

| | v2_shadow |
|---|-----------|
| Schema body | Unchanged (v1 served) |
| Reply | Unchanged |
| UI | Unaffected |
| What runs | Drift measurement + future compatibility observation |

Negotiation: `status: cohort_shadow`, `observationOnly: true`, drift: `informative`.

The system can **simulate the future without running it**.

## Client invariants (locked)

- No schema selection
- No reply re-extract (`?? text / message / content` forbidden — CI grep)
- No fallback chains
- Passive: `context.cohortId` only
- Dev probe: `window.__CASTLE_SCHEMA_RUNTIME_AUDIT__`

## What this is

Not a UI framework · not a chat app · not an "LLM app".

**Policy-driven runtime architecture.**

## Maturity

| Level | Status |
|-------|--------|
| Epistemic pipeline | ✔ |
| Contract-governed meaning | ✔ |
| CI enforcement | ✔ |
| Cohort routing | ✔ |
| Auto-migration | Future |

## Horizon (not required now)

1. Runtime schema comparison dashboard (cohort A vs B reply diff)
2. v2 dual-run shadow (same request → v1 + v2 parse compare)
3. Semantic drift trendline

## Session outcome

UI was not patched — **reality was layered.**
