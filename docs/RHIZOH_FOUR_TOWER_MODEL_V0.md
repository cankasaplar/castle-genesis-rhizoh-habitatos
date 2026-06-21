# Rhizoh Four-Tower Model v0

**Status:** DRAFT · `RESEARCH-ONLY`

---

## Towers

| Tower | Strength | Role |
|-------|----------|------|
| **Chess** | Very strong | Truth anchor — deterministic, never biased |
| **Map** | Strong | Attention field — spatial observation |
| **Narrative** | Working | Meaning renderer — interpretation labels |
| **Meaning Resonance** | Emerging | Significance explainer — *why important over time* |

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
Meaning: Observers repeatedly return to this arena.
Narrative: This arena appears to function as a recurring attention anchor.
```

This is **not learning** — it is **explanation of observed behavior**.

Evidence sources: `attentionSediment` + `behavioralBiasLayer` + `meaningLedger` (read-only).

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

- [`RHIZOH_KNOWLEDGE_GATEWAY_V0.md`](RHIZOH_KNOWLEDGE_GATEWAY_V0.md)
- [`RHIZOH_MEANING_RESONANCE_SIGNIFICANCE_V0.md`](RHIZOH_MEANING_RESONANCE_SIGNIFICANCE_V0.md)
