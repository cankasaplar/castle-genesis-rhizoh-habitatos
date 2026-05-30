# Observation → UI Reaction Binding Layer v0

**Tag:** `RESEARCH-ONLY` (v0 contract — implementation may land in `rhizoh/experience/*` as `CORE-ELIGIBLE` without touching frozen `ghost/phase*.js`)  
**Purpose:** Name a **thin, versioned mapping** from *observed* signals to *surface reactions* (HEL, pacing, continuity strip). **Not** decision logic for execution, trust, or substrate.

| Related | |
|---------|--|
| Observation ≠ execution | [`docs/OBSERVATION_FABRIC_V1.md`](../../../docs/OBSERVATION_FABRIC_V1.md) |
| Pipeline + feedback order | [`OBSERVABILITY_FEEDBACK_SPIRAL_ROADMAP_V1.0.md`](./OBSERVABILITY_FEEDBACK_SPIRAL_ROADMAP_V1.0.md) |
| Composer today (merge point) | `rhizohLivingWorldEntryOrchestratorV0.js` · `livingWorldEntryHumanLayerV0.js` · `RhizohLivingContinuityStrip.jsx` |
| Cognitive load (research) | [`docs/COGNITIVE_LOAD_LAYER_V0.md`](../../../docs/COGNITIVE_LOAD_LAYER_V0.md) |
| **Intensity only** (after binding) | [`OBSERVATION_UI_REACTION_WEIGHTING_LAYER_V0.md`](./OBSERVATION_UI_REACTION_WEIGHTING_LAYER_V0.md) |

---

## 0. Definitions

| Term | Meaning |
|------|---------|
| **Observation signal** | A **read-only** scalar or enum derived from RCML / HEL state / (later) consented analytics aggregate — **never** a WAL write reason. |
| **UI reaction** | A change in **copy**, **layout density**, **motion timing**, or **disclosure order** on the Castle-first entry shell. |
| **Reaction binding** | A declared **pair** `(signal → reaction family)` with **tunable parameters** (curves, thresholds in a constants module). **Not** a nested policy engine. |
| **Reaction weighting** | **Separate SSOT:** scales *how strong* a bound reaction is (`[0,1]` per channel, e.g. HEL at 30% vs 80% intensity). Binding picks *what*; weighting picks *how much*. |
| **Decision logic** | **Out of scope:** anything that chooses seal outcome, gateway auth, authority profile, or merges execution graphs. |

---

## 1. What this layer is / is not

| This layer **is** | This layer **is not** |
|---------------------|------------------------|
| A **mapping table** + optional interpolation (e.g. pacing factor vs entropy bucket) | Business rules that “decide” user fate |
| **Deterministic given inputs** for UI regression tests | Probabilistic “AI decides UI” without spec |
| Safe to refactor into `mapObservationToUiReactionV0(snapshot) → UiReactionDelta` | A second runtime that overrides `VITE_CASTLE_AUTHORITY_PROFILE` or sealer |

---

## 2. v0 binding table (illustrative — parameters are tunable, not law)

Signals are **coarse**; reactions are **soft**. Numbers below are **placeholders** until wired to a single constants file.

| Observation signal (source) | UI reaction family | v0 intent |
|----------------------------|--------------------|-----------|
| **FTUE drop** (last step id + `ftue.drop` from observability pipeline, or local-only proxy before pipeline exists) | **HEL state** | Softer / shorter beats; optional “pick up here” strip; **no** new mandatory steps. |
| **Entropy budget low** (`worldState.driftCalibration.entropyRemaining`, fatigue tier from `perceptualEntropyEconomyV0` path) | **UI pacing** | Longer transitions, fewer simultaneous micro-animations, delay before secondary disclosure — align with cognitive load doc. |
| **Return visit** (`returning` + cross-session anchor from `crossSessionWorldCoherenceV0` / orchestrator) | **Continuity strip** | Richer strip: `memoryEcho`, `crossSessionEcho`, stronger “why here” — **wider** information band without new authority claims. |

**Rule:** Reactions may **omit** or **fade** content; they must **not** invent live world facts or gateway-backed claims.

---

## 3. Binding shape (implementation sketch — not mandatory in v0)

When implemented, prefer **one pure mapper** consumed by the orchestrator or shell:

```text
ObservationSnapshot (read-only projection)
  → UiReactionDelta { helMode, pacing01, continuityStripDensity }
  → ReactionWeightingLayer (optional) → same delta shape, scaled intensities — see OBSERVATION_UI_REACTION_WEIGHTING_LAYER_V0.md
  → existing composer merges delta into model (no new side channel to WAL)
```

- **No** network calls inside the mapper.  
- **No** writes to `sessionStorage` / `localStorage` except through existing RCML persistence APIs, if any reaction persists UX tier.

---

## 4. Anti-patterns

| Anti-pattern | Why |
|--------------|-----|
| “If FTUE drop then reduce `VITE_*` security” | Collapses observation into **execution** |
| Hard-coded 40-line `if/else` tree in JSX | This is **decision sprawl**, not binding |
| Binding reads raw analytics payloads without schema version | Drift + privacy failure |

---

## 5. Change policy

- **v0 → v0.1:** Add or remove one row in §2 + document parameter file path.  
- **v1.0:** Requires JSON schema for `ObservationSnapshot` slice used by UI + at least one Vitest contract on mapper output shape.

---

*v0 — reaction binding SSOT; not decision logic.*
