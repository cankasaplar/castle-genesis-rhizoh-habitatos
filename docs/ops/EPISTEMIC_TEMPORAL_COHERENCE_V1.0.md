# Epistemic Temporal Coherence Layer (ETCL) v1.0

**Problem after EDPL:** `temporal_consistency_risk` — decisions slowed and locally stabilized, but how do decisions across time merge without contradiction?

---

## Required invariants

### (1) Temporal alignment invariant

```
decision(t) must reference state(t) only
```

Human decision packet health/GCL labels must match the export `state(t)` anchor (narrative fingerprint, gatheredAt).

### (2) Cross-window contradiction guard

```
state(t1) cannot override state(t2) unless reconciled
```

Multiple `temporary_static_posture_windows` with active cross-layer contradictions → `reconciliation_required`. Override blocked (`grantsExecutionApproval` false, uncertainty stream stays open).

### (3) Delayed truth rule

```
uncertainty cannot be resolved by time passage alone
```

Posture window TTL must not close the uncertainty envelope or resolve `certaintyCap`.

---

## Export

`buildUnifiedStateNarrativeV0()` → `epistemicTemporalCoherence`

```bash
npm run ci:epistemic-temporal-coherence-gate
```

Module: `epistemicTemporalCoherenceLayerV0.js`

Stack: … → EDPL → **ETCL** → human (reconcile when guard active)

---

**RDOL** (`REALITY_DRIFT_OBSERVER_V1.0.md`) — above ETCL; models misapprehension shapes (reality / propagation / robotics drift).

---

*ETCL v1.0 — temporal coherence without time-as-truth.*
