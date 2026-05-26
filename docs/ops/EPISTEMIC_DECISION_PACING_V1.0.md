# Epistemic Decision Pacing Layer (EDPL) v1.0

Post-DPUB: **operator tempo** and **temporary_static_posture_windows** — operational terms only (no psychology vocabulary).

---

## Authority hierarchy (locked)

| Layer | Role | Authority |
|-------|------|-----------|
| **GCL / Core** | Immutable structural physics | Full constraint |
| **DPUB** | Unfiltered reality flow | Full raw data publish |
| **EDPL** | Time and tempo bender | Timing + bounded window control only |
| **Human** | Selective receiver | Ops maintenance in EDPL micro-windows only |

EDPL **never** passes `execution_approval`. `deploy_agent` and `apply_narrative_suggested_action` remain **ACRL-blocked** on every export.

---

## A) Operator pacing control

| Field | Meaning |
|-------|---------|
| `queue_saturation_index` | 0–1 operational load on decision queue |
| `operator_processing_latency` | nominal \| moderate \| high \| elevated |
| `pacing_frequency_limit` | maxDecisionBundlesPerHour, requireRawIngressEvery |

**Invariant:** `pacing_never_hides_uncertainty`

No terms: fatigue, burnout, panic, yorgunluk.

---

## B) temporary_static_posture_windows

**Not** certainty zones. **Not** truth production.

Sealed name: `temporary_static_posture_windows` — short **local ops hold** windows (e.g. `maintain_current_posture`, `audit_gcl_rollout_pairing`, `observe_and_verify_raw`).

Each window:

- `grantsExecutionApproval: false`
- `rawUncertaintyStreamRemainsOpen: true`
- `doesNotMean` includes `certainty_or_truth_zone`

Excluded: `deploy_agent`, `apply_narrative_suggested_action`

---

## CI / export validation

```bash
npm run ci:epistemic-decision-pacing-gate
```

Gate asserts:

- `epistemicDecisionPacing` present
- `executionBoundaries.valid`
- Forbidden actions never `OK` in ACRL matrix
- No EDPL window for deploy / apply_narrative
- `grantsExecutionApproval === false`

---

**ETCL** implemented: `docs/ops/EPISTEMIC_TEMPORAL_COHERENCE_V1.0.md`

---

*EDPL v1.0 — after DPUB; operational pacing + posture windows only.*
