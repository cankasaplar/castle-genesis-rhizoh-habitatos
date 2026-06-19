# Rhizoh Cross-Space Resource Contention Guard v0

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`

**Prerequisites:** [`RHIZOH_CROSS_SPACE_CAUSAL_FUSION_V0.md`](RHIZOH_CROSS_SPACE_CAUSAL_FUSION_V0.md) · [`RHIZOH_MULTI_ARENA_SCHEDULER_V0.md`](RHIZOH_MULTI_ARENA_SCHEDULER_V0.md)

**Code:** `apps/client/src/rhizoh/runtime/crossSpaceResourceContentionGuardV0.js`

---

## 0. SSOT sentence

> **Fusion synthesizes a unified field — the resource guard prevents epistemic overload and preserves lane separability for audit.**

New problem after #213:

> "How reliable is the fusion result?"

Without guard: fusion can **amplify noise** when chess cluster + sports burst + CUX compete.

---

## 1. Problems addressed

| Risk | Guard response |
|------|----------------|
| Loss of separability | `laneAudit` with raw lane snapshots on every fusion/defer |
| Debugging in fused field only | `laneContributions.*.rawShares` + `laneAudit` |
| REC → fusion input blur | REC stays reconcile; guard gates synthesis only |
| Noise amplification | `guardFusionAdmission` defers when overloaded |

---

## 2. Budget envelopes

| Slot | Budget |
|------|--------|
| Chess compute | 0.55 |
| Sports burst | 0.25 |
| CUX perception | 0.08 |
| Fusion synthesis | 0.07 |
| Headroom | 0.05 |

---

## 3. Fusion reliability

```javascript
fusionReliability: {
  reliability01,
  noiseRisk,
  separabilityPreserved: true,
  fusionTrustClass: "trusted_synthesis" | "degraded_synthesis"
}
```

Deferred fusion returns `schema: ...deferred` with `laneAudit` intact — lanes never erased.

---

## 4. DevTools

```javascript
window.__rhizoh.crossSpaceResourceGuard()
window.__rhizoh.assessCrossSpaceResourceLoad()
window.__rhizoh.guardFusionAdmission()

// Fusion with reliability
const f = window.__rhizoh.fuseCrossSpaceEpistemic()
f.laneAudit        // per-space raw
f.fusionReliability
```

---

## 5. Maturity

| Level | Status |
|-------|--------|
| L3b Causal fusion | ✔ |
| L3c **Resource contention guard** | ✔ this module |
| L3d Ledger / seal | ❌ phase gate |
