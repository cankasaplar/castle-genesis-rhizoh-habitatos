# Rhizoh — Thinking Model v0 (SSOT)

**Status:** ACTIVE — cognition exposure (not hidden LLM theater)  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-01  
**Parents:** [`RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md`](RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md) · [`RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md`](RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md) · [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](RHIZOH_HONEST_BASELINE_CHARTER_V1.md) · [`RHIZOH_HONEST_COGNITION_SURFACE_V0.md`](RHIZOH_HONEST_COGNITION_SURFACE_V0.md)

**Binding sentence (locked):**

> **Rhizoh exposes cognition as a visible, navigable transition field rather than a hidden computational process.**

**Philosophy (locked):**

> Rhizoh is a **cognition exposure system**, not an information system. The LLM is a **transient motor**; Rhizoh is **state transition + perception field + language grammar**.

---

## 1. Founder observation (locked)

| Surface read | Actual structure |
|--------------|------------------|
| “Model answers” | Model **changes state** |
| Knowledge depot | **Thought-flow system** |
| What does it know? | **How does it transition?** |

**Three layers most products stop at layer 1:**

| Layer | Content |
|-------|---------|
| 1. Data | Tokens, facts |
| 2. Reasoning | Internal representation (opaque) |
| 3. **State transition** | Context → field → anchor → surface (**Rhizoh product layer**) |

---

## 2. LLM thinking — simplified phases (exposure map)

Not chain-of-thought text — **product-visible phases** mapped to `rhizohFieldState`:

| Phase | Id | Typical field state | User-visible signal |
|-------|-----|---------------------|---------------------|
| Context intake | `context_intake` | `LISTENING` | Cool ambient · user distortion up |
| Internal representation | `internal_representation` | `INTERPRETING` | Grammar apply · tension rise |
| Probability field | `probability_field` | `GENERATING` | Field density · 3D orbits (opt-in) |
| Selection | `selection` | `EXECUTING` | Directive / surface apply |
| Stabilize output | `stabilize_output` | `SPEAKING` | Warm stabilize · TTS |
| Rest | `rest` | `IDLE` · `DEGRADED` | Low ambient |

Code: [`rhizohThinkingModelV0.js`](../apps/client/src/rhizoh/runtime/rhizohThinkingModelV0.js).

---

## 3. Rhizoh chain (grammar + thinking)

```
input → intent (grammar)
intent → field deformation (VCL)
field → anchor shift (L2)
anchor → continuity update (PAL / session)
continuity → surface change (T0 / E2-X)
```

**Rhizoh does not “produce answers” as the product core** — it makes the **transition field** navigable (Honest Baseline: no hidden probability theater).

---

## 4. Honest Baseline alignment

| Charter commitment | Thinking exposure |
|--------------------|-------------------|
| Non-cheating world | No fake “reasoning paragraphs” — **phase + field** only |
| Continuity-first | Transitions preserve anchor + session |
| Observation ≠ execution | Exposure is **interpretation layer**; gateway remains authority |

See [`RHIZOH_HONEST_COGNITION_SURFACE_V0.md`](RHIZOH_HONEST_COGNITION_SURFACE_V0.md) for v0 UI: ambient light + optional 3D thought field toggle.

**Overload guard + navigation:** [`RHIZOH_ACTION_COHERENCE_LAYER_V0.md`](RHIZOH_ACTION_COHERENCE_LAYER_V0.md) — Next Action Anchor always visible; exposure budget when thought field + busy.

---

## 5. Integration map

| Module | Role |
|--------|------|
| `rhizohThinkingModelV0.js` | Phase resolve · ambient hues |
| `rhizohHonestCognitionSurfaceV0.js` | Toggle persistence |
| `RhizohHonestCognitionAmbientV0.jsx` | Viewport light/color (always subtle when on) |
| `RhizohThoughtField3DV0.jsx` | Opt-in 3D thought field |
| `rhizohGrammarBridgeV0.js` | Utterance → intent/surface before LLM |
| `rhizohVisualCognitiveLanguageV0.js` | Field deformation from phase + state |

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_GRAMMAR_CONSTITUTION_SYSTEM_V0.md`](RHIZOH_GRAMMAR_CONSTITUTION_SYSTEM_V0.md) | Meaning-space evolution |
| [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](RHIZOH_HONEST_BASELINE_CHARTER_V1.md) | Founder constitution |

---

*Thinking Model v0 — expose transitions, not hidden computation.*
