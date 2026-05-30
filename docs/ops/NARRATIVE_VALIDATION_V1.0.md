# Narrative Validation v1.0 (Anti-Overtrust)

**Status:** IMPLEMENTED · **Code:** `narrativeValidationV0.js`  
**Wired into:** `buildUnifiedStateNarrativeV0()` → `validation` block

**Contract:** Validation only — no execution.

---

## Three guards (your spec)

### (1) Confidence decomposition

Not one opaque number:

```json
{
  "confidenceDecomposition": {
    "composite": {
      "headlineConfidence": 0.95,
      "trustworthy": 0.72,
      "overtrustGap": 0.23,
      "overtrustRisk": "high",
      "recommendation": "prefer_trustworthy_over_headline"
    },
    "sources": {
      "gcl": { "score": 0.85, "agreesWithNarrative": true, ... },
      "rollout": { ... },
      "lifecycle": { ... },
      "loadTest": { ... }
    },
    "agreement": {
      "alignedSources": 2,
      "totalSources": 4,
      "agreementRatio": 0.5,
      "dissenting": ["rollout"]
    }
  }
}
```

Use **`confidenceTrustworthy`** / **`confidenceAdjusted`** for decisions — not headline alone.

### (2) Uncertainty injection (systemic)

Tags such as:

| ID | Meaning |
|----|---------|
| `projection_bias` | Load-test story while live metrics calm |
| `sim_coordination_uncertainty` | Coordination sim active |
| `low_source_agreement` | Sources disagree with narrative |
| `over_compression_risk` | Headline confidence > agreement |

Labels are **systemic humility**, not user error.

### (3) Narrative vs raw divergence

```json
{
  "divergence": {
    "divergenceScore": 0.55,
    "validated": false,
    "flags": [{ "id": "narrative_metrics_mismatch", ... }],
    "antiOvertrust": {
      "metricsRightStoryWrong": true,
      "guidance": "Treat narrative as hypothesis; verify raw metrics"
    }
  }
}
```

Detects: **“metrics right, story wrong”** — e.g. saturation narrative + idle live rollout.

---

## CLI / export

```bash
npm run ops:state-narrative
```

`unified_state_narrative_LATEST.json` includes full `validation` object.

`GET /rhizoh/ops/hardening/status` → `unifiedState.validation` (compressed ids).

---

## Trust postures

| Posture | When |
|---------|------|
| `narrative_trusted_with_caveats` | validated + low overtrust |
| `narrative_hypothesis_only` | divergence flags or low agreement |

---

*Narrative validation v1.0 — compression without overtrust.*
