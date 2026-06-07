# Regime Distance Metric v0

**Status:** RESEARCH-ONLY  
**Tag:** `RESEARCH-ONLY` per [`SPECFLOW_MARKERS.md`](../../SPECFLOW_MARKERS.md)

**Not:** `baselineDriftIndex` değil. Baseline'lar arası statik sapma değil — **regime checkpoint'ler arası davranış rejimi farkı**.

---

## Problem

| Metrik | Ne ölçer | Ne ölçmez |
|--------|----------|-----------|
| `baselineDriftIndex` | Integrity rolling mean sapması | Rejim geçiş şiddeti |
| `regimeDistanceMetric` | Checkpoint A → B **regime shift intensity** | Tek tick noise |

---

## Girdi

İki `regime_checkpoint` snapshot'ı (JSON veya observability freeze):

- `ledByState` / `explorationIntegrity.ledBy`
- `explorationIntegrityScore`
- `inboxTransitionVerified` + inbox lifecycle phase
- `topologyOwnership.writeCount` + `invariantHeld`
- `stabilityClass` (ör. `oscillatory_stable`)
- `softInboxCoupling` (boolean regime flag)

Baseline JSON **girdi olmamalı** — sadece checkpoint ↔ checkpoint.

---

## Çıktı (`RegimeDistanceV0`)

```json
{
  "schema": "castle.regime_distance.v0",
  "distance": 0.0,
  "intensity": "low | medium | high",
  "components": {
    "ledByShift": 0.0,
    "integrityGap": 0.0,
    "inboxPhaseGap": 0.0,
    "couplingRegimeGap": 0.0,
    "invariantStressGap": 0.0
  },
  "interpretation": "regime_shift_intensity — not drift magnitude"
}
```

`distance` ∈ [0, 1] — bileşenlerin ağırlıklı toplamı.

---

## Bileşenler (v0 ağırlıklar)

| Bileşen | Ağırlık | Tanım |
|---------|---------|-------|
| `ledByShift` | 0.28 | octo ↔ mixed ↔ rhizoh ordinal mesafe |
| `integrityGap` | 0.22 | \|integrity_A − integrity_B\| |
| `inboxPhaseGap` | 0.22 | forming vs closure lifecycle mesafesi |
| `couplingRegimeGap` | 0.14 | soft vs passive coupling farkı |
| `invariantStressGap` | 0.14 | writeCount yoğunluğu + agentWriteAttempts |

---

## Kullanım (ileride)

```javascript
import { computeRegimeDistanceMetricV0 } from "./regimeDistanceMetricV0.js";

const d = computeRegimeDistanceMetricV0(checkpointA, checkpointB);
// checkpoint chain: sprint-e-0 → sprint-e-1 → fox-species-0
```

Observability'ye eklenebilir: `regimeDistanceFromLastCheckpoint` (son arşivlenen checkpoint'e göre).

---

## Related

- [`companion-observation-sprint-e-regime-verified-checkpoint-v0.json`](sprint-e/companion-observation-sprint-e-regime-verified-checkpoint-v0.json)
- [`RHIZOH_DGCS_MULTI_INSTANCE_COGNITION_V0.md`](../../RHIZOH_DGCS_MULTI_INSTANCE_COGNITION_V0.md)
