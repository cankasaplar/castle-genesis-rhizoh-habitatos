# Rhizoh Reply Schema Evolution Governance v1

**Tag:** `CORE-ELIGIBLE` (registry + simulation) · **Policy owner:** founder / ops + CI  
**Control plane:** [`RHIZOH_CONTROL_PLANE_V1.md`](RHIZOH_CONTROL_PLANE_V1.md)  
**Code:** [`rhizohReplySchemaRegistryV1.js`](../apps/gateway/src/rhizohReplySchemaRegistryV1.js) · [`rhizohReplySchemaLifecycleV1.js`](../apps/gateway/src/rhizohReplySchemaLifecycleV1.js)  
**Runtime law:** [`RHIZOH_REPLY_NORMALIZATION_LAYER_V1.md`](RHIZOH_REPLY_NORMALIZATION_LAYER_V1.md)

## Remaining frontier

Technical dual-parsing is closed. The open surface is **schema evolution governance**.

| Question | v1 policy |
|----------|-----------|
| **v1 → v2 geçiş nasıl olur?** | Coordinated release: registry bump → gateway deploy → client projection update → optional cohort pin lift. Never client-first. |
| **Breaking change kim onaylar?** | Gateway registry PR + gateway tests green + activation checklist sign-off. |
| **Legacy ne zaman retire edilir?** | `deprecated` for ≥1 release cycle → then `retired`. Retired schemas → `retired_requested`, drift `breaking`. |

## Lifecycle state machine

```
planned ──(approve)──► current ──(deprecate)──► deprecated ──(retire)──► retired
```

| State | Served? | Negotiation | Drift |
|-------|---------|-------------|-------|
| `current` | ✔ | matched | ok / informative |
| `deprecated` | ✔ legacy | legacy_compat | legacy_only |
| `retired` | ✗ | retired_requested | breaking |
| `planned` | ✗ (sim only) | unsupported_requested | — |

## v1 → v2 protocol

1. Add v2 entry with `lifecycle: "planned"` and new `requiredFields`.
2. Run `simulateReplySchemaEvolutionV1(bodies, v2)` until `wouldBreak: false`.
3. Optional cohort pin: stress users stay on v1 via gateway cohort map.
4. Promote: v2 → `current`, v1 → `deprecated` (single deploy).
5. Retire v1 when telemetry shows zero v1 preference.

## Breaking change approval

| Gate | Enforcer |
|------|----------|
| Registry edit | Code review + `npm run test -w apps/gateway` |
| Required field change | Simulation harness |
| `retired` promotion | Ops note + activation checklist |
| Client | Projection-only pass-through |

**Forbidden:** client-side negotiation, client-side retire/break decisions.

## Cohort pinning (future spec)

Gateway-owned: `{ cohortId → pinnedSchemaId }`. Client sends `context.cohortId` passively.

## Contract simulation

`simulateReplySchemaEvolutionV1(body, targetSchemaId)` — gateway/CI/ops only.

Answers: *"Would this body break under schema X?"*

Not attached to live turns by default.

## Cohort pin mapping (routing layer)

**Gateway SSOT:** [`rhizohCohortSchemaMapV1.js`](../apps/gateway/src/rhizohCohortSchemaMapV1.js)  
**Client:** [`rhizohCohortPinClientV0.js`](../apps/client/src/rhizoh/runtime/rhizohCohortPinClientV0.js) — sends `context.cohortId` only

```js
resolveSchemaForRequestV1({ cohortId }) // → pinned schema ?? currentSchemaV1()
```

| Cohort | Pinned schema | Render |
|--------|---------------|--------|
| `cohort_alpha` / `cohort_beta` | v1 | v1 |
| `cohort_canary` | `v2_shadow` | v1 body (observation only) |

**Three control points:**

| Layer | Controls |
|-------|----------|
| CI gate | Whether deploy is allowed |
| Gateway | Which schema runs / negotiates |
| Cohort | Which reality slice a user sees |
| Client | ❌ no schema control |

Runtime audit (client): `window.__CASTLE_SCHEMA_RUNTIME_AUDIT__`

> CI controls **whether**; Gateway controls **reality**; Cohort controls **which reality you see**.

## CI simulation gate (policy enforcement)

**Script:** `npm run ci:reply-schema-simulation-gate`  
**Runner:** [`runReplySchemaSimulationGateV1.mjs`](../apps/gateway/src/ops/runReplySchemaSimulationGateV1.mjs)  
**Golden suite:** [`replySchemaGoldenSuiteV1.json`](../apps/gateway/fixtures/replySchemaGoldenSuiteV1.json)

| Mode | Behavior |
|------|----------|
| Default | Golden + live `attachReplySchemaContractV1` probes **must pass** current schema |
| `--strict-future` | Shadow v2 breaks also fail build (pre-promotion) |

> Cohort routing controls **where**; CI simulation gate controls **whether** a schema may ship.

Wired in: `.github/workflows/ci-enforcement.yml` · `stabilization:validate-client-boundaries-quick`

## Maturity

| Level | Status |
|-------|--------|
| 5 Epistemic pipeline | ✔ |
| 6 Contract-governed meaning | ✔ |
| **7 Schema evolution governance** | **✔ lifecycle + CI gate + cohort routing** |
| 8 Cohort auto-migration | Future |

> **Schema changes are gateway policy events, not client releases.**
