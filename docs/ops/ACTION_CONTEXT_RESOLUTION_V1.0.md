# Action Context Resolution Layer (ACRL) v1.0

**Gap after ASGL:** Semantic correctness without **context binding** → silent failure class #1: *semantic correctness + contextual invalidity*.

| Layer | Question |
|-------|----------|
| **ASGL** | What does `actionId` *mean* per domain? |
| **ACRL** | Is it valid **in this and only this** context? |

---

## Action overloading risk

Same verb (`deploy_agent`) is a correct multi-domain alias in ASGL. Risk: domain boundary slips → **intent drift**.

ACRL adds **hard eligibility**, not hints:

| actionId | Robotics | SpiralMMO | Governance |
|----------|----------|-----------|------------|
| `deploy_agent` | OK *iff* sensor-verified + tenant-bound | **BLOCKED** (ops context) | **REVIEW_REQUIRED** |

---

## Components

| Component | Role |
|-----------|------|
| `contextFingerprint` | Stable hash of plane, active domain, sim/mythology, GCL, robotics eligibility |
| `executionEligibilityMatrix` | Per action × domain → `ok` \| `blocked` \| `review_required` \| `audit_only` |
| `domainCollision` | >1 `ok` on high/critical risk actions |
| `intentContextMismatch` | High-priority suggestion invalid in active context |
| `asglGclBinding` | Governance signals blocked when GCL unhealthy / rollout hot |

---

## Robotics

- **ASGL** → semantic correctness (“what deploy means”)
- **ACRL** → actuation correctness (“not the wrong moment”)

`roboticsActuationCorrectness` on export documents this split.

---

## Export

`buildUnifiedStateNarrativeV0()` → `actionContextResolution` (requires `actionSemanticGovernance` on same object).

```bash
npm run ci:action-context-gate
```

Module: `actionContextResolutionLayerV0.js`

---

## Maturity stack

| Layer | Status |
|-------|--------|
| Control (GCL) | production-grade |
| Intelligence (ASL) | research-grade |
| World | simulation-grade |
| ASGL | advanced semantic compiler |
| **ACRL** | v0 execution validity compiler |

---

**ECL** (`EPISTEMIC_COHERENCE_V1.0.md`) binds ASGL+ACRL+GCL+World into one operator decision surface (context fragmentation mitigation).

---

*ACRL v1.0 — complements ASGL; closes action overloading / intent drift.*
