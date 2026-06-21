# Rhizoh Meaning Resonance Significance v0

**Status:** DRAFT · `RESEARCH-ONLY` · fourth tower

---

## Purpose

Answer **"Why is it important?"** from habitat records — not founder opinion.

Combines:
- `behaviorSediment` — visits · dwell · return rate (primary significance evidence)
- `attentionSediment` — repeat attention patterns
- `behavioralBiasLayer` — visibility weight
- `meaningLedger` — co-occurrence traces
- `crossTowerBiasCoupler` — Map↔Narrative stability

---

## API

```javascript
window.__rhizoh.behaviorSediment.refresh();
window.__rhizoh.attentionSediment.refresh();

window.__rhizoh.knowledgeGateway.askWhy({
  question: "Why is WPRL Sports Arena important?",
  entityId: "wprl_sports_arena",
  locale: "en"
});

window.__rhizoh.meaningResonanceSignificance.resolve({
  entityId: "wprl_sports_arena",
  locale: "tr"
});
```

---

## Locked constraints

- `isLearning: false`
- `behaviorBias: true`
- `truthBias: false`
- `explainsObservedBehavior: true`
- `influencesCausalGraph: false`
- `habitatBiasOnly: true`

---

## Related

- [`RHIZOH_BEHAVIOR_SEDIMENT_V0.md`](RHIZOH_BEHAVIOR_SEDIMENT_V0.md)
- [`RHIZOH_FOUR_TOWER_MODEL_V0.md`](RHIZOH_FOUR_TOWER_MODEL_V0.md)
