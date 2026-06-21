# Rhizoh Identity Manifest v0 (Phase 1 — read-only projection)

**SPECFLOW:** `RESEARCH-ONLY` — interpretation layer; no execution authority; no frozen `phase*.js` edits.

## Problem statement

Rhizoh simulates world events (chess cluster, causal graph, replay) but does not yet write actor identity into the event SSOT pipeline. The identity **container** exists (`identityLifecycle` state); the **event pipeline** is wired only to voice/LLM turn paths.

Phase 1 adds a **derived projection** — not event routing activation.

## Architecture (ETSS-1 aligned)

```
ECG (causalMap) ──read──► identityManifest.project()
                              │
epi_id_* (optional) ──────────┘  derived handle, not SSOT
```

| Layer | Phase 1 | Phase 2 (future) |
|-------|---------|------------------|
| World (chess, causal, replay) | Read via causalMap | Same |
| Identity container | Read lifecycle snapshot | Same |
| Identity event pipeline | **Not activated** | Controlled `appendIdentityEventV0` triggers |

**Forbidden in Phase 1:** `appendIdentityEventV0`, `touchIdentityLifecycleV0`, `bindTurnIdentityV0` from world/chess paths.

## Output schema

`castle.rhizoh.identity_manifest_projection.v0` · `phase: read_only_v0`

| Field | Meaning |
|-------|---------|
| `subjectId` | `epi_id_*` from epistemic audit stack, or `unbound` |
| `constitutionalAnchor` | Honest Baseline charter ref + Observation ≠ Execution |
| `causalSummary` | Node/edge counts, domain transitions, chess anchors |
| `epistemicSubject` | Optional derived epistemic identity snapshot |
| `identityPipeline` | Event log / turn counts + wiring note |
| `continuityVerdict` | Always `read_only_projection` (not SSOT verdict) |
| `interpretationOnly` | `true` |

## Console API

```javascript
window.__rhizoh.identityManifest.project()
window.__rhizoh.identityManifest.last()
window.__rhizoh.identityManifest.refresh()
```

Boot mount: `mountIdentityManifestConsoleV0()` in domain nervous system.

## Public surface (LLM + external readers)

| Artifact | URL |
|----------|-----|
| Public identity JSON | https://rhizoh.com/.well-known/rhizoh-identity.json |
| Causal snapshot (summary) | https://rhizoh.com/.well-known/rhizoh-causal-snapshot.json |
| System overview | https://rhizoh.com/rhizoh/system-overview.md |
| Protocol v0 | https://rhizoh.com/rhizoh/protocol-v0.md |

Live `epi_id_*` may differ per audit run; public JSON carries **bootstrap reference** only.

## Related

- [`RHIZOH_EPISTEMIC_IDENTITY_CONTINUITY_V0.1.md`](RHIZOH_EPISTEMIC_IDENTITY_CONTINUITY_V0.1.md)
- [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md)
- [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](RHIZOH_HONEST_BASELINE_CHARTER_V1.md)
- Runtime: `apps/client/src/rhizoh/runtime/identityManifestProjectionV0.js`
