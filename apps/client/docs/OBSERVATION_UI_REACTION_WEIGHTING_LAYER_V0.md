# Reaction Weighting Layer v0

**Tag:** `RESEARCH-ONLY` (v0 contract — same implementation posture as binding: `rhizoh/experience/*` only, no frozen `ghost/phase*.js`)  
**Purpose:** **Intensity scaling only** for UI reactions that are already in scope via [`OBSERVATION_UI_REACTION_BINDING_LAYER_V0.md`](./OBSERVATION_UI_REACTION_BINDING_LAYER_V0.md). **Not** a second decision pass; **not** “if weight high then do something else.”

| Related | |
|---------|--|
| What reacts (channel) | [`OBSERVATION_UI_REACTION_BINDING_LAYER_V0.md`](./OBSERVATION_UI_REACTION_BINDING_LAYER_V0.md) |
| Observation ≠ execution | [`docs/OBSERVATION_FABRIC_V1.md`](../../../docs/OBSERVATION_FABRIC_V1.md) |
| Cognitive load | [`docs/COGNITIVE_LOAD_LAYER_V0.md`](../../../docs/COGNITIVE_LOAD_LAYER_V0.md) |

---

## 0. Definitions

| Term | Meaning |
|------|---------|
| **Weight** | A **scalar in `[0, 1]`** (or fixed set of named tiers mapped to numbers) that **scales** how strongly a bound reaction is applied — e.g. “HEL soft mode at **0.30** vs **0.80**” = same *kind* of reaction, different *amplitude*. |
| **Reaction Weighting Layer** | Pure **scaling** applied **after** binding has selected reaction **families** (HEL, pacing, continuity strip). |
| **Decision** | **Out of scope:** choosing a different feature, route, authority mode, or data-plane action based on weight. |

---

## 1. Binding vs weighting (hard split)

| Layer | Answers |
|-------|---------|
| **Binding** | *Which* reaction families receive a delta for this snapshot? (HEL / pacing / strip) |
| **Weighting** | *How much* of each family’s delta is blended into the surface? (0…1 per channel or shared curve) |

**Example (user language):** FTUE drop → HEL **opens** (binding) → intensity **30% vs 80%** (weighting: copy depth, extra lines, motion envelope — same HEL “mode”, different strength).

---

## 2. v0 weight channels (illustrative)

Weights are **defaults for tuning** in one constants module; not constitutional thresholds.

| Channel | Typical use of `w ∈ [0, 1]` |
|---------|------------------------------|
| `helWeight01` | Secondary beats / closure lines visible fraction; animation emphasis; **not** a different FTUE story tree. |
| `pacingWeight01` | Scales transition delays and stagger vs baseline (ties to entropy fatigue path). |
| `continuityStripWeight01` | How many strip segments are “fully” vs “ghost” rendered; opacity / density of `memoryEcho` class lines. |

**Rule:** Weights **modulate** presentation of an already-selected reaction. They **must not** introduce a new branch like “if `helWeight01 > 0.7` then navigate to X.”

---

## 3. Pipeline position (conceptual)

```text
ObservationSnapshot
  → BindingLayer  → { which channels fire, base deltas }
  → WeightingLayer → { same channels, scaled deltas }
  → Composer / shell merge
```

- Weighting functions should be **monotonic** in each weight: higher weight = stronger same-direction reaction, holding binding fixed.  
- **No** side effects; **no** network; **no** persistence of weights as authority state (optional local UX tier cache is a product decision, not v0).

---

## 4. Anti-patterns

| Anti-pattern | Why |
|--------------|-----|
| Weight replaces binding (“only weight, no binding table”) | Collapses two concerns; you lose explicit “what reacts.” |
| Threshold on weight **selects** a different product path | That is **decision logic**, not intensity. |
| Random jitter on weight without spec | Breaks regression and accessibility expectations. |

---

## 5. Change policy

- **v0 → v0.1:** Add a channel row or rename tier → document in same PR as constant file.  
- **v1.0:** Vitest on `applyReactionWeightsV0(baseDelta, weights) → scaledDelta` monotonicity + clamp to `[0, 1]`.

---

*v0 — reaction intensity only; not decisions.*
