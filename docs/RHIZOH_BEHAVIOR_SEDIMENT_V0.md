# Rhizoh Behavior Sediment v0 — Plane E

**Status:** DRAFT · `RESEARCH-ONLY`

---

## Purpose

Persist **behavioral traces** so significance answers emerge from lived habitat evidence — not authority records alone.

```
Authority
   ↓
Behavior          ← Plane E (this module)
   ↓
Attention
   ↓
Meaning
   ↓
Narrative
   ↓
Knowledge Gateway
```

---

## Entity record shape

```json
{
  "entity": "wprl_sports_arena",
  "visits": 182,
  "avgDwellTime": 231000,
  "returnRate": 0.67,
  "sessionDepth": 4.2
}
```

- `avgDwellTime` — milliseconds
- `returnRate` — fraction of sessions with repeat visits
- `sessionDepth` — average unique entities per session when this node appears

---

## API

```javascript
window.__rhizoh.observe({
  type: "map_enter",
  target: "wprl_sports_arena",
  meta: { surface: "map", dwellMs: 180000 }
});

window.__rhizoh.behaviorSediment.refresh();
window.__rhizoh.behaviorSediment.snapshot();
window.__rhizoh.behaviorSediment.evidence("wprl_sports_arena");

window.__rhizoh.knowledgeGateway.askWhy({
  question: "Why is WPRL Sports Arena important?",
  locale: "en"
});
```

**Refresh order (recommended):**

```javascript
window.__rhizoh.behaviorSediment.refresh();
window.__rhizoh.attentionSediment.refresh();
window.__rhizoh.knowledgeGateway.askWhy({ question: "...", locale: "en" });
```

---

## Honest zeros

When `significanceScore: 0` and `behaviorSufficient: false`, the system is **not** hallucinating importance — it correctly reports insufficient behavioral sediment.

---

## Bias evolution

| Flag | Meaning |
|------|---------|
| `behaviorBias: true` | Visibility from repeated human behavior |
| `truthBias: false` | Does not claim correctness |
| `biasNotLearning: true` | No identity or causal learning |

---

## Locked constraints

- `learns: false`
- `influencesAuthority: false`
- `influencesTruthClaims: false`
- `influencesCausalGraph: false`
- consume-only refresh — no `observe()` amplification

---

## Related

- [`RHIZOH_FOUR_TOWER_MODEL_V0.md`](RHIZOH_FOUR_TOWER_MODEL_V0.md)
- [`RHIZOH_MEANING_RESONANCE_SIGNIFICANCE_V0.md`](RHIZOH_MEANING_RESONANCE_SIGNIFICANCE_V0.md)
- [`RHIZOH_KNOWLEDGE_GATEWAY_V0.md`](RHIZOH_KNOWLEDGE_GATEWAY_V0.md)
