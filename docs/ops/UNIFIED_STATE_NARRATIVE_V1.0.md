# Unified State Narrative v1.0

**Status:** IMPLEMENTED · **Code:** `unifiedStateNarrativeV0.js`  
**Contract:** Interpretation only — **no execution**

---

## Problem

Over-instrumentation drift: GCL, rollout, lifecycle, load-test classifier each tell a partial truth. Operators need **one story**, not four dashboards.

---

## Pipeline

```
GCL + Rollout + Lifecycle + LoadTest analysis
        ↓
  compressToSystemStateV0()
        ↓
  interpretSystemStateV0()  (narrative + suggested actions, non-executable)
```

---

## SystemState vector

```json
{
  "health": "stable | stressed | degraded",
  "pressure": "low | medium | high",
  "risk": "none | saturation | leak | drift",
  "confidence": 0.0
}
```

---

## API

| Surface | Usage |
|---------|--------|
| `GET /rhizoh/ops/hardening/status` | Includes `unifiedState` (compressed) |
| CLI | `npm run ops:state-narrative` |

**Export:** `docs/exports/ops/unified_state_narrative_LATEST.json`

---

## State layers + governance (v1)

| Layer | Field | Meaning |
|-------|-------|---------|
| RAW | `stateLayers.raw` | What happened (measurements) |
| DERIVED | `stateLayers.derived` | What we understand (non-binding) |
| POLICY | `stateLayers.policy` | What system **cannot** do |

`interpretationSafetyContract` — see `INTERPRETATION_SAFETY_CONTRACT_V1.0.md`.

`governance.narrativeIsNotDecisionLayer: true` — prevents meta-truth authority drift.

## Narrative validation (anti-overtrust)

See `NARRATIVE_VALIDATION_V1.0.md`. Every narrative export includes:

- `validation.confidenceDecomposition` — source agreement breakdown  
- `validation.uncertainty.tags` — projection bias, sim uncertainty, etc.  
- `validation.divergence` — narrative vs raw metrics flags  

Prefer `systemState.confidenceTrustworthy` over `confidenceHeadline`.

## Suggested actions

`interpretation.suggestedActions[]` — `executable: false` always. Human or policy engine may act; gateway does not.

---

## Relation to other layers

| Layer | Role |
|-------|------|
| GCL | Financial truth input |
| Rollout + Lifecycle | Execution truth input |
| Load test analysis | Stress truth input |
| **Unified narrative** | **Single interpretation output** |
| B3 HTTP RL | Optimization (later) |

---

*Unified state narrative v1.0 — interpretation compression, not automation.*
