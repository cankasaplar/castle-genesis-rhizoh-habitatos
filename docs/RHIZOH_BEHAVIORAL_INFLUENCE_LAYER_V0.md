# Rhizoh Behavioral Influence Layer v0

**Status:** DRAFT · `RESEARCH-ONLY` · PATH B habitat threshold

---

## What this unlocks

| Before (Stage 2) | After (habitat threshold) |
|------------------|---------------------------|
| `temporalSediment.influencesSelection: false` | `influencesSelection: true` |
| Memory exists as observation | Memory exists as **soft influence** |
| Stateless renderer | Sediment-aware ranking bias |

**Not:** learning · causal write · identity drift · agent behavior.

---

## Pipeline

```
observerTrace (passive)
  → attentionSediment.refresh()
  → behavioralInfluence.resolve()
  → narrative.resolve()  [ranking uses influencedSalience]
  → mapAttention weights (UI hints only)
```

Sediment **detects**. Behavioral layer **modulates**. Causal/Chess engine **unchanged**.

---

## Soft influence formula

```
behaviorWeight = f(frequency, salienceDecay, clusterDensity, chessAnchor, crossLensBoost)
finalAttentionScore = baseSalience × mapWeight × chessAnchor × behaviorWeight
```

Capped at `MAX_BEHAVIOR_WEIGHT_V0` (1.35).

---

## Hard constraints

| Allowed | Forbidden |
|---------|-----------|
| Narrative ranking bias | `causalGraph` write |
| Map visibility hint (read-only) | Identity update |
| Chess anchor scalar (1.05 max) | Learning loop |
| Cross-lens weak confirmation | `observe()` during pass |

---

## Browser API

```javascript
window.__rhizoh.attentionSediment.refresh();
window.__rhizoh.behavioralInfluence.resolve();
window.__rhizoh.behavioralInfluence.mapWeights();

const n = window.__rhizoh.narrativePlane.resolve({ locale: "tr" });
// n.temporalSediment.influencesSelection === true (when sediment refreshed)
// n.behavioralInfluence.softInfluenceOnly === true
```

Disable for paper-only mode:

```javascript
window.__rhizoh.narrativeProjectionEngine.resolve({ behavioralInfluence: false });
```

---

## Paper vs Habitat

- **Paper:** `behavioralInfluence: false` → PATH A stateless
- **Habitat:** sediment refresh + influence on → PATH B soft adaptive

Paper reads habitat output; never shapes it.

---

## Related

- [`RHIZOH_ATTENTION_SEDIMENTATION_V0.md`](RHIZOH_ATTENTION_SEDIMENTATION_V0.md)
- [`RHIZOH_MEANING_RESONANCE_LEDGER_V0.md`](RHIZOH_MEANING_RESONANCE_LEDGER_V0.md)
