# Rhizoh — Honest Cognition Surface v0 (SSOT)

**Status:** ACTIVE — first Honest Baseline UI for grammar + thinking exposure  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-01  
**Parents:** [`RHIZOH_THINKING_MODEL_V0.md`](RHIZOH_THINKING_MODEL_V0.md) · [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](RHIZOH_HONEST_BASELINE_CHARTER_V1.md) · [`RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md`](RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md)

**Principle (locked):** Start **outside the feature frame** — viewport-level light and color that respond to thinking phase; optional **3D thought field** for those who want to watch Rhizoh think (not mandatory, not performative).

---

## 1. Two layers (v0)

| Layer | Default | Role |
|-------|---------|------|
| **Ambient cognition** | On (subtle) | Full-viewport gradient shift · `pointer-events: none` |
| **3D thought field** | Off (toggle) | Expanded liquid-crystal field · CSS 3D · follows `rhizohFieldState` |

Session keys: `rhizoh.honest.cognition_ambient.v0` · `rhizoh.honest.thought_field.v0`

---

## 2. What we avoid (Honest Baseline)

| ❌ | ✅ |
|----|-----|
| Fake chain-of-thought text | Phase label + field motion |
| Spectator “AI show” | Opt-in depth |
| Hover-local gimmicks | Global ambient + field |
| Color without geometry | VCL geometry + ambient hue |

---

## 3. UI placement

| Component | Position |
|-----------|----------|
| `RhizohHonestCognitionAmbientV0` | `fixed inset-0` · z below HUD · above world |
| `RhizohThoughtField3DV0` | Center-lower when toggle on |
| `RhizohCognitionExposureBarV0` | Above T0 rail · toggle + phase chip |
| `RhizohCognitiveFieldV0` | Ambient chip (always when ambient on) |

---

## 4. Wiring

- **Grammar:** `applyGrammarFromUtteranceV0` in command path before `INTERPRETING`
- **Thinking:** `resolveThinkingExposureV0(rhizohFieldState)` drives ambient + 3D
- **ACL:** [`RHIZOH_ACTION_COHERENCE_LAYER_V0.md`](RHIZOH_ACTION_COHERENCE_LAYER_V0.md) — exposure budget · Next Action Anchor
- **ARL:** [`RHIZOH_ATTENTION_RHYTHM_LAYER_V0.md`](RHIZOH_ATTENTION_RHYTHM_LAYER_V0.md) — `resolveAttentionRhythmV0` gates ambient · phase chip · anchor emphasis
- **Events:** `rhizoh:thinking-exposure` · `rhizoh:grammar-resolution` · `rhizoh:next-action-anchor`

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_THINKING_MODEL_V0.md`](RHIZOH_THINKING_MODEL_V0.md) | Phase map |
| [`RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md`](RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md) | Grammar axes |

---

*Honest Cognition Surface v0 — simple light first; depth is opt-in.*
