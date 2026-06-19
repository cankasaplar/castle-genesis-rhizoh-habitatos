# Rhizoh Admission Arbitration Layer v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`

**Prerequisites:** [`RHIZOH_CROSS_SPACE_STABILIZATION_LAYER_V0.md`](RHIZOH_CROSS_SPACE_STABILIZATION_LAYER_V0.md) · [`RHIZOH_EXECUTION_PHASE_SYNCHRONIZER_V0.md`](RHIZOH_EXECUTION_PHASE_SYNCHRONIZER_V0.md)

**Code:** `apps/client/src/rhizoh/runtime/admissionArbitrationLayerV1.js`

---

## 0. SSOT sentence

> **Rhizoh is a phase-locked cross-space epistemic fusion runtime without reality mutation permission.**

**fusion ≠ authority**

---

## 1. Authority model (explicit rejection)

| Model | Status |
|-------|--------|
| Fusion output writer | **forbidden** |
| Probabilistic filter | **forbidden** |
| Human-only gate | **elevation path only** |
| **Deterministic policy arbitration** | **active** |

Admission grants **inference eligibility only** — never auto reality mutation.

---

## 2. Verdicts

| Verdict | Meaning |
|---------|---------|
| `inference_eligible` | Stabilized field readable downstream (inference-only) |
| `hold` | No downstream inference flow |
| `human_attestation_required` | Reality mutation path — never auto from fusion |

---

## 3. Pipeline

```
Fusion → Stabilization (advisory) → Admission Arbitration (verdict) → inference surface
```

`realityMutationPermitted` is **always false** on auto path.

---

## 4. DevTools

```javascript
window.__rhizoh.arbitrateAdmission()
window.__rhizoh.admissionArbitration()
window.__rhizoh.requestHumanAdmissionAttestation()  // pending only, no auto-admit
```

---

## 5. Boot

Cold boot with no lane signal → `hold` + `cold_boot_no_signal` (expected).

Boot log: `boot.admission_arbitration`

---

## 6. Maturity

| Level | Status |
|-------|--------|
| L3e Execution phase sync | ✔ |
| L3f **Admission arbitration** | ✔ this module |
| L3g Ledger / seal | ❌ phase gate |
