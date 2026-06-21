# Rhizoh Tower Model v0 (4 + Behavior)

**Status:** DRAFT · `RESEARCH-ONLY`

---

## Towers

| Tower | Strength | Role |
|-------|----------|------|
| **Chess** | Very strong | Truth anchor — deterministic, never biased |
| **Map** | Strong | Attention field — spatial observation |
| **Behavior** | Emerging | Behavior sediment — visits · dwell · return rate |
| **Narrative** | Working | Meaning renderer — interpretation labels |
| **Meaning Resonance** | Emerging | Significance explainer — *why important over time* |

---

## Pipeline

```
Authority → Behavior → Attention → Meaning → Narrative → Knowledge Gateway
```

---

## Question shift

| Phase | Question | Module |
|-------|----------|--------|
| v0 | "What is WPRL?" | `knowledgeGateway.ask()` — definition mode |
| v1 | "Why is it important?" | `knowledgeGateway.askWhy()` — significance mode |

---

## Significance answer shape

```
Authority: WPRL Sports Arena exists.
Meaning: 67% of visitors returned; average dwell reached 4× other nodes.
Narrative: This node becomes more visible because visitors keep returning.
```

This is **not learning** — it is **explanation of observed behavior**.

Evidence sources: `behaviorSediment` + `attentionSediment` + `behavioralBiasLayer` + `meaningLedger` (read-only).

Honest zeros when behavioral sediment is insufficient — no hallucinated importance.

---

## Living Habitat → External LLMs

```
Living Habitat
      ↓
Knowledge Gateway (queriableByExternalLlm: true)
      ↓
ChatGPT / Claude / Gemini / custom models
```

---

## Related

- [`RHIZOH_BEHAVIOR_SEDIMENT_V0.md`](RHIZOH_BEHAVIOR_SEDIMENT_V0.md)
- [`RHIZOH_KNOWLEDGE_GATEWAY_V0.md`](RHIZOH_KNOWLEDGE_GATEWAY_V0.md)
- [`RHIZOH_MEANING_RESONANCE_SIGNIFICANCE_V0.md`](RHIZOH_MEANING_RESONANCE_SIGNIFICANCE_V0.md)
