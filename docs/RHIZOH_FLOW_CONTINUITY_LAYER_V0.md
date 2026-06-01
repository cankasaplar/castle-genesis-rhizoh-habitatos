# Rhizoh — Flow Continuity Layer (FCL) v0 (SSOT)

**Status:** ACTIVE — entry · drift · return · since-last-visit  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-01  
**Parents:** [`RHIZOH_PRODUCT_LANGUAGE_LAYER_V0.md`](RHIZOH_PRODUCT_LANGUAGE_LAYER_V0.md) · [`RHIZOH_ATTENTION_RHYTHM_LAYER_V0.md`](RHIZOH_ATTENTION_RHYTHM_LAYER_V0.md) · [`RHIZOH_T0_CONTINUITY_SURFACE_V0.md`](RHIZOH_T0_CONTINUITY_SURFACE_V0.md) · [`RHIZOH_CONTINUITY_SEAMLESS_ENTRY_V0.md`](RHIZOH_CONTINUITY_SEAMLESS_ENTRY_V0.md)

**Binding sentence (locked):**

> **Rhizoh remembers where play began, where it continues, and when you may return without ceremony.**

**Product binding (locked):**

> **Rhizoh is a continuity-first cognitive operating system for human interaction with evolving digital environments.**

---

## 1. Five-layer experience stack

| # | Layer | Question |
|---|-------|----------|
| 1 | Cognition (VCL) | How does it think? |
| 2 | Action (ACL) | What can I do? |
| 3 | Rhythm (ARL) | When does it show? |
| 4 | Stability | How much load? |
| 5 | **Continuity (FCL)** | Where from · where to · what changed? |

**PLL:** how the user **lives** the stack — see [`RHIZOH_PRODUCT_LANGUAGE_LAYER_V0.md`](RHIZOH_PRODUCT_LANGUAGE_LAYER_V0.md).

**Stabilization:** [`RHIZOH_EXPERIENCE_GRAMMAR_STABILIZATION_V0.md`](RHIZOH_EXPERIENCE_GRAMMAR_STABILIZATION_V0.md) — no new layers without constitution bump.

---

## 2. FCL v0 modules

| Module | Function |
|--------|----------|
| `resolveEntryContinuityV0` | **Entry state resolver** — `first_continuity` · `return_continuity` · `same_session` |
| `generateSinceLastVisitV0` | **What changed since last visit** (localStorage snapshot) |
| `resolveFlowDriftV0` | **Drift tracker** — wanted intent/surface vs current |
| `buildReturnContinuityV0` | **Return state builder** — continued state, not reset |
| `recordFlowContinuityStepV0` | Session thread + drift step log |
| `resolveFlowContinuityV0` | Unified payload for T0 rail |
| `snapshotLastVisitV0` | Persist last surface/intent on tab hide |

---

## 3. First-time user (invisible onboarding)

| Fear | FCL + T0 |
|------|----------|
| “What is this?” | `orientation_line` · continuity surface |
| “What do I do?” | ACL + soft affordances |
| “Where do I start?” | `first_continuity` entry mode |

**Model:** continuity → entry → continuation (not onboarding wizard).

---

## 4. Return without ceremony

- Cross-session: `return_continuity` + `since_last_visit_line`
- Same session: `can_return` + resume prior surface
- **Not** a blank reset — `continued_not_reset: true`

---

## 5. Integration

| Piece | Role |
|-------|------|
| [`rhizohFlowContinuityV0.js`](../apps/client/src/rhizoh/runtime/rhizohFlowContinuityV0.js) | All resolvers |
| [`RhizohFlowContinuityStripV0.jsx`](../apps/client/src/rhizoh/runtime/RhizohFlowContinuityStripV0.jsx) | T0 rail |
| [`rhizohGrammarBridgeV0.js`](../apps/client/src/rhizoh/runtime/rhizohGrammarBridgeV0.js) | `recordFlowIntentV0` on grammar |
| [`RHIZOH_CEOL_V0.md`](RHIZOH_CEOL_V0.md) | First 5s entry choreography |

Event: `rhizoh:flow-continuity`

---

*FCL v0 — time flows through the field.*
