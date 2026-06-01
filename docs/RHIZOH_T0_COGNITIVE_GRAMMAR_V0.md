# Rhizoh — T0 Cognitive Grammar v0 (SSOT)

**Status:** ACTIVE — product architecture SSOT  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-01  
**Parents:** [`RHIZOH_T0_CONTINUITY_SURFACE_V0.md`](RHIZOH_T0_CONTINUITY_SURFACE_V0.md) · [`RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md`](RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md) · [`RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md`](RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md) · [`RHIZOH_GRAMMAR_CONSTITUTION_SYSTEM_V0.md`](RHIZOH_GRAMMAR_CONSTITUTION_SYSTEM_V0.md)

**Binding sentence (locked):**

> **Rhizoh OS T0 is a cognitive grammar system that translates intent into shared perceptual fields through continuous state transitions.**

**Product triple (locked):**

> **Rhizoh is cognition exposure + action coherence + continuity stabilizer** — see [`RHIZOH_ACTION_COHERENCE_LAYER_V0.md`](RHIZOH_ACTION_COHERENCE_LAYER_V0.md) · rhythm: [`RHIZOH_ATTENTION_RHYTHM_LAYER_V0.md`](RHIZOH_ATTENTION_RHYTHM_LAYER_V0.md) · flow: [`RHIZOH_FLOW_CONTINUITY_LAYER_V0.md`](RHIZOH_FLOW_CONTINUITY_LAYER_V0.md).

**Stack priority (locked — build order):**

| ❌ Wrong order | ✅ Right order |
|---------------|----------------|
| UI → feature → behavior → meaning | **meaning → language → behavior → UI → surface** |

**What Rhizoh is (locked):**

> Rhizoh is **not** a UI framework. It is a **perception + language + state OS**. UI is the outer projection only.

**OS formula (locked):**

> **Rhizoh OS = state + intent + field + transition grammar**

---

## 1. Three pillars already fixed

| Pillar | Role | Primary modules / docs |
|--------|------|-------------------------|
| **1. Cognitive language (VCL)** | Deformation · intent field · anchor gravity | [`RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md`](RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md) · `rhizohVisualCognitiveLanguageV0.js` |
| **2. Continuity OS (T0)** | Context strip · intent chips · surface states | [`RHIZOH_T0_CONTINUITY_SURFACE_V0.md`](RHIZOH_T0_CONTINUITY_SURFACE_V0.md) · `t0ContextStripV0.js` |
| **3. Transition system (RTL)** | Entry · re-entry · PAL restore | [`RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md`](RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md) · `expressiveRealityTransitionV0.js` · `continuitySeamlessEntryV0.js` |

---

## 2. T0 role — Interaction Grammar Layer

T0 answers four questions without tutorial chrome:

| Question | Grammar axis | Surface signal |
|----------|--------------|----------------|
| Where am I? | **STATE** | Context strip · anchor · continuity |
| What am I doing? | **INTENT** | Keşfet · Üret · Bağlan · İzle |
| How does the system feel? | **FIELD** | Density · deformation · tension (VCL) |
| What changed? | **TRANSITION** | Entry · micro-RTL · PAL restore |

Code contract: [`rhizohT0CognitiveGrammarV0.js`](../apps/client/src/rhizoh/runtime/rhizohT0CognitiveGrammarV0.js).

---

## 3. T0 Cognitive Grammar v0 — four axes

### 3.1 STATE — “şu an neredeyim?”

| Element | Role |
|---------|------|
| **Context strip** | Play-call line (e.g. Keşif · Dünya açık) |
| **Anchor** | Gravity reference — seed / user / cohort |
| **Continuity** | Session re-entry; never empty restore |

Modules: `t0ContextStripV0.js` · [`RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md`](RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md).

### 3.2 INTENT — “ne yapıyorum?”

| Intent | Id |
|--------|-----|
| Keşfet | `explore` |
| Üret | `produce` |
| Bağlan | `connect` |
| İzle | `observe` |

Intent drives **grammar**, not a feature flag list.

### 3.3 FIELD — “sistem nasıl hissediliyor?”

| Signal | Source |
|--------|--------|
| **Density** | Collective / cognition composer |
| **Deformation** | Intent → geometry (VCL) |
| **Tension** | Salience + field state + anchor |

VCL is the **shared visual dialect** of the field axis.

### 3.4 TRANSITION — “ne değişti?”

| Kind | Mechanism |
|------|-----------|
| **Entry** | Seamless continuity (default) · full RTL (opt-in) |
| **Micro-RTL** | Turn · thread · map · memory pulses |
| **PAL restore** | Anchor re-internalize on each salient event |

---

## 4. Perception chain (locked)

```
intent
  ↓
field deformation        ← VCL
  ↓
anchor shift             ← L2 gravity
  ↓
surface change           ← T0 / E2-X projection
  ↓
user perception
```

**Design rule:** UI and features may change; **grammar axes do not**.

---

## 5. Basketball — game language, not playbook

| Court concept | Grammar |
|---------------|---------|
| **Game rules** | Constitution (STATE · INTENT · FIELD · TRANSITION) — immutable |
| **Playbook** | Dictionary (studio, map, continuity, PAL, …) — grows, sealed |
| **Game reading** | Meaning variations — context-bound reconfiguration |
| Fast break | Intent shift |
| Transition | Field deformation |
| Half-court | Structured grammar (T0 strip + intents) |
| Spacing | Attention distribution (field, not hover) |

---

## 6. Projection rule (why “the rest is easy”)

When grammar is stable, surfaces are **projections only**:

| Surface | Projection of |
|---------|----------------|
| Mobile | Same grammar · smaller field |
| Studio | `produce` intent · surface expansion |
| Map | Spatial field visualization |
| Spiral | Higher-order grammar (future) |

**Defer until grammar is felt:** mobile polish · feature sprawl · studio/spiral depth without T0 grammar.

---

## 7. Product insight (locked)

> Rhizoh is not designing UI. It is **making thought portable** through a shared cognitive grammar.

**Portable thought** = same intent + field + transition semantics across surfaces and locales ([`RHIZOH_MULTILINGUAL_BRIDGE_V0.md`](RHIZOH_MULTILINGUAL_BRIDGE_V0.md)).

---

## 8. Living language boundary

Grammar **grows in meaning space**, not rule space — see [`RHIZOH_GRAMMAR_CONSTITUTION_SYSTEM_V0.md`](RHIZOH_GRAMMAR_CONSTITUTION_SYSTEM_V0.md) (RGCS / CSES).

> **Rhizoh language evolves in meaning space, not in rule space.**

---

## 9. Implementation map

| Module | Role |
|--------|------|
| [`rhizohT0CognitiveGrammarV0.js`](../apps/client/src/rhizoh/runtime/rhizohT0CognitiveGrammarV0.js) | Grammar axes · priority stack · binding sentences |
| [`rhizohGrammarConstitutionV0.js`](../apps/client/src/rhizoh/runtime/rhizohGrammarConstitutionV0.js) | Constitution · dictionary seal · utterance → grammar (v0) |
| [`t0ContextStripV0.js`](../apps/client/src/rhizoh/runtime/t0ContextStripV0.js) | STATE + INTENT projection |
| [`rhizohVisualCognitiveLanguageV0.js`](../apps/client/src/rhizoh/runtime/rhizohVisualCognitiveLanguageV0.js) | FIELD projection |
| [`continuitySeamlessEntryV0.js`](../apps/client/src/rhizoh/runtime/continuitySeamlessEntryV0.js) | TRANSITION entry default |

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_THINKING_MODEL_V0.md`](RHIZOH_THINKING_MODEL_V0.md) | Cognition exposure · thinking phases |
| [`RHIZOH_HONEST_COGNITION_SURFACE_V0.md`](RHIZOH_HONEST_COGNITION_SURFACE_V0.md) | Honest Baseline UI v0 |
| [`RHIZOH_GRAMMAR_CONSTITUTION_SYSTEM_V0.md`](RHIZOH_GRAMMAR_CONSTITUTION_SYSTEM_V0.md) | Constitution · dictionary · evolution rules |
| [`RHIZOH_UI_INTENT_ATLAS_V0.md`](RHIZOH_UI_INTENT_ATLAS_V0.md) | Intent registry seed (Phase 2 compiler dictionary) |

---

*T0 Cognitive Grammar v0 — meaning first; UI last.*
