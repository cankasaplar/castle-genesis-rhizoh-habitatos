# Rhizoh Cross-Tower Bias Coupler v0

**Status:** DRAFT · `RESEARCH-ONLY`

---

## Role

Synchronizes **Map bias ↔ Narrative bias** while **Chess anchor stays fixed**.

Produces `meaningStability` — coherent "meaning feel" without learning or causal write.

---

## Pipeline

```
sediment → behavioralBiasLayer → crossTowerBiasCoupler.couple()
```

| Tower | Coupler reads | Coupler writes |
|-------|---------------|----------------|
| Map | `visibilityWeight`, dominant pin | Nothing |
| Narrative | `influencedSalience`, dominant entity | Nothing |
| Chess | `anchorLocked` (fixed) | Nothing |

---

## API

```javascript
window.__rhizoh.attentionSediment.refresh();
window.__rhizoh.crossTowerBiasCoupler.couple({ locale: "tr" });
// → { couplingStrength, meaningStability, biasNotLearning: true }
```

---

## Locked rules

- `learns: false` · `isLearning: false`
- `influencesCausalGraph: false` · `influencesIdentity: false`
- `influencesChessEngine: false`
- `biasNotLearning: true`

---

## Related

- [`RHIZOH_BEHAVIORAL_INFLUENCE_LAYER_V0.md`](RHIZOH_BEHAVIORAL_INFLUENCE_LAYER_V0.md)
