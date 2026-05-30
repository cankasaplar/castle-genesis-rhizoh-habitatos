# Action Semantic Governance Layer (ASGL) v1.0

**Gap closed:** Epistemic integrity without **unified action semantics** → multi-domain silent failure class.

**Question:** Not “what *can* be done?” — **what should be done, under which conditions, in which domain?**

---

## Three planes (current system reading)

| Plane | Role |
|-------|------|
| **Control** | GCL, rollout, lifecycle, lease, safety — physical reality control |
| **Intelligence** | Propagation, misread, trust/mythology, validation — interpretation engine |
| **World** | SpiralMMO, robotics — reality experienced |

ASL = Research + World application. **ASGL** = action meaning across all three.

---

## Closed-loop epistemic organism

```
Propagation → narrative → trust/mythology → governance read → sim/world → observation → (repeat)
```

Documented in `epistemicFeedbackLoop` on export. **Not** a classic stateless AI app.

### Residual risks (monitored, not CPU/Redis)

| ID | Risk | Mitigation |
|----|------|------------|
| **A** | Epistemic drift amplification | RAW-first, divergence flags, ASGL signoff |
| **B** | Simulation–reality blending | `coordinationSim` + mythology fork alerts |
| **C** | Authority collapse (DERIVED as truth) | `can_execute: false`, `non_binding`, human decision owner |

---

## Global action ontology

Same `actionId`, **different meaning per domain**:

| actionId | Robotics | SpiralMMO | Governance |
|----------|----------|-----------|------------|
| `deploy_agent` | robot activation | NPC spawn | workload scaling signal |
| `reduce_burst_concurrency` | motion rate limit | spawn cap | rollout/burst limit |
| `apply_narrative_suggested_action` | **prohibited** | **prohibited** | **prohibited** |

Permissions: `prohibited`, `audit_only`, `narrative_hypothesis_only`, `human_signoff_required`, `sensor_verified_only`, `policy_signal_only`.

---

## Cross-domain risk scoring

`scoreCrossDomainActionRiskV0(actionId)` — detects **semantic drift** when one verb means different things without explicit mapping (`silentFailureClass: multi_domain_action_semantic_drift`).

Narrative `suggestedActions` → `evaluatedSuggestedActions` with per-domain resolution.

---

## Export

`buildUnifiedStateNarrativeV0()` → `actionSemanticGovernance`

```bash
npm run ops:state-narrative
```

Module: `actionSemanticGovernanceLayerV0.js`

---

## Engineering summary

Rhizoh separates **reality → interpretation → simulation → action** at engineering depth. ASGL is the **semantic** link; **ACRL** (`ACTION_CONTEXT_RESOLUTION_V1.0.md`) binds *when* each meaning is execution-valid.

---

*ASGL v1.0 — on top of ASL + cultural-risk stack. ACRL v0 closes action overloading / intent drift.*
