# Rhizoh Cross-Space Causal Fusion v0

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — unified epistemic update across causal spaces.

**Prerequisites:** [`RHIZOH_CROSS_SPACE_REC_RECONCILIATION_V0.md`](RHIZOH_CROSS_SPACE_REC_RECONCILIATION_V0.md) · [`RHIZOH_MULTI_ARENA_SCHEDULER_V0.md`](RHIZOH_MULTI_ARENA_SCHEDULER_V0.md) · [`RHIZOH_COGNITIVE_UX_LAYER_V1.md`](RHIZOH_COGNITIVE_UX_LAYER_V1.md)

**Code:** `apps/client/src/rhizoh/runtime/crossSpaceCausalFusionV0.js`

---

## 0. SSOT sentence

> **REC made realities interact; Causal Fusion makes them compose into a unified epistemic update.**

```text
chess drift (geometry / SC+REC)
  +
sports entropy (ENTROPY_DRIFT + stochastic)
  +
CUX perception (overlay densities)
        ↓
fuseCrossSpaceEpistemicV0()
        ↓
unified_epistemic_observation
```

**Invariant:** fusion **never** commits CubeState or execution.

---

## 1. Problem (after PR #211)

| Gap | Symptom |
|-----|---------|
| No fusion layer | Lanes exist but no composed update |
| `realitiesInteract: false` in prod | Only chess baseline reconcile, no lane ingest |
| CUX isolated | Perception not in epistemic vector |

---

## 2. Fusion lanes

| Lane | Source | Space |
|------|--------|-------|
| `chess_drift` | `RHIZOH_DRIFT_CUBE_EVENT` / `ingestChessDriftLane` | `chess.causal.space` |
| `sports_entropy` | REC sports slice / `ingestSportsEntropyLane` | `sports.causal.space` |
| `cux_perception` | `ingestCuxPerceptionLane` | `cux.perception.overlay` |

Weights shift with scheduler `primarySpaceId` (chess 0.55 vs sports 0.4 when sports primary).

---

## 3. Epistemic update contract

```javascript
epistemicUpdate: {
  updateKind: "unified_epistemic_observation",
  fusedShares: { SC, REC, QUOTA, SIG, ENTROPY_DRIFT, PERCEPTION },
  laneContributions: { chess, sports, cux },
  crossCouplings: [...],      // from REC interference
  realitiesIntegrated: boolean,
  confidence01: number,
  cubeStateCommit: false
}
```

---

## 4. Event chain

```text
sports ingest → scheduler tick → REC reconcile → CROSS_SPACE_REC_EVENT → fusion
geometry drift cube → ingestChessDriftLane → fusion
```

Event: `rhizoh:cross-space-fusion-v0`

---

## 5. DevTools

```javascript
window.__rhizoh.fuseCrossSpaceEpistemic()
window.__rhizoh.crossSpaceFusion()

// Manual lane inject (prod debug)
window.__rhizoh.ingestChessDriftLane({ z: 0.5 })
window.__rhizoh.ingestSportsEntropyLane({ entropy01: 0.7 })
window.__rhizoh.ingestCuxPerceptionLane({ perception01: 0.6, categoryShares: { SC: 0.2 } })
window.__rhizoh.ingestSportsEvent({ eventType: "score_delta", delta: 2 })
```

---

## 6. Maturity

| Level | Status |
|-------|--------|
| L3a Cross-space REC | ✔ |
| L3b Causal fusion | ✔ this module |
| L3c Resource contention guard | ✔ [`RHIZOH_CROSS_SPACE_RESOURCE_CONTENTION_GUARD_V0.md`](RHIZOH_CROSS_SPACE_RESOURCE_CONTENTION_GUARD_V0.md) |
| L3d Ledger / seal | ❌ phase gate |

---

## 7. Prod expectation

After deploy, empty lanes → `realitiesIntegrated: false` until:

1. Chess cluster emits geometry drift, **or**
2. Sports event ingested via DevTools / ticker bridge, **or**
3. CUX perception lane manually injected

This is correct — fusion reflects **observed** cross-space signal, not synthetic merge.
