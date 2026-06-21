# Rhizoh Knowledge Gateway v0

**Status:** DRAFT · `RESEARCH-ONLY` · queryable habitat knowledge

---

## Problem

The habitat already produces knowledge layers. What was missing: a **queryable interface** so invitees (or their LLMs) can ask the habitat directly — not the founder.

---

## Pipeline

```
User Question
      ↓
Knowledge Gateway
      ↓
Authority Ledger (read-only, highest)
      ↓
Meaning Ledger (interpretation label)
      ↓
Narrative Renderer (narration label)
      ↓
Answer (+ provenance)
```

**Observer trace:** aggregated count only — never exposed raw.

---

## Layer authority

| Layer | User-facing | Authority |
|-------|-------------|-----------|
| Authority Ledger | Yes | Highest |
| Meaning Ledger | Yes (`interpretation`) | Medium |
| Narrative | Yes (`narration`) | Low |
| Observer Trace | **No** | Raw — internal only |

---

## Bias policy

| Bad bias (blocked) | Habitat bias (allowed) |
|--------------------|------------------------|
| Change chess truth | Salience amplification |
| Mutate authority ledger | Visibility / ranking shift |
| Identity drift | Narrative emphasis |

`badBiasBlocked: true` · `habitatBiasOnly: true`

---

## Browser API

```javascript
// What is it?
window.__rhizoh.knowledgeGateway.ask({
  question: "What is WPRL Sports Arena?",
  locale: "en"
});

// Why is it important? (fourth tower)
window.__rhizoh.knowledgeGateway.askWhy({
  question: "Why is WPRL Sports Arena important?",
  locale: "en"
});
```

External LLM flow: fetch JSON answer → cite `provenance` + `layers` → never treat narrative as causal truth.

---

## Example answer fields

```json
{
  "answer": {
    "authorityStatus": "verified_node",
    "narrativeStatus": "active",
    "meaningResonance": "medium",
    "habitatBiasOnly": true
  },
  "separationHolds": true,
  "queriableByExternalLlm": true
}
```

---

## Related

- [`RHIZOH_BEHAVIORAL_INFLUENCE_LAYER_V0.md`](RHIZOH_BEHAVIORAL_INFLUENCE_LAYER_V0.md)
- [`RHIZOH_EPISTEMIC_SEPARATION_PROOF_V0.md`](RHIZOH_EPISTEMIC_SEPARATION_PROOF_V0.md)
- [`RHIZOH_AUTHORITY_LEDGER_SEAL_PIPELINE_V1.md`](RHIZOH_AUTHORITY_LEDGER_SEAL_PIPELINE_V1.md)
