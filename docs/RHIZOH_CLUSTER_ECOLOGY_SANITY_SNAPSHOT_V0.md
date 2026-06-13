# Rhizoh Cluster Ecology — Sanity Snapshot (Phase 1 Lock)

**SPECFLOW:** `RESEARCH-ONLY` · Sprint 39 → Sprint 40 boundary  
**Status:** LOCKED for Phase 1 stabil release

This document freezes three behavioral contracts from Sprint 39 (Cluster Civilization).

## 1. Intent cluster max size

| Field | Value |
|-------|-------|
| Max intents | **64** (`RHIZOH_INTENT_CLUSTER_MAX_SIZE_V0`) |
| Eviction | Newest-first ingest; dedupe by `intentId`; overflow drops **oldest** rows |
| Entropy | **No** — not probabilistic |

**Code SSOT:** `apps/client/src/rhizoh/runtime/rhizohClusterEcologyLockV0.js`

## 2. Drift guard reconcile frequency

| Field | Value |
|-------|-------|
| Poll interval | **30_000 ms** fixed (`RHIZOH_CLUSTER_DRIFT_POLL_MS_V0`) |
| Deterministic | **Yes** — fixed `setInterval`, not adaptive |
| On-intent | Reconcile on `advanceClusterCivilizationFromIntentV0` when severity = `high` |
| Route hops | **Forbidden** — soft overlay resync / orphan clear only |

## 3. Dominant node selection

| Field | Value |
|-------|-------|
| Rule | **Frequency weight** (intent count per federation node) |
| NOT | Entropy, random, or LLM guess |
| Tiebreak | Lexicographic ascending node id (`broadcast` beats `studio` at equal count) |
| Node key | `overlayNode || targetNode` per cluster row |

**Function:** `selectDominantClusterNodeV0(nodeWeights)`

## Unlock policy

Changing any locked constant requires:

1. Update `rhizohClusterEcologyLockV0.js`
2. Update this document
3. Update `rhizohClusterEcologyLockV0.test.js` snapshot assertions
4. Explicit Phase 1 unlock note in PR
