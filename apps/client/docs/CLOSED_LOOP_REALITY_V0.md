# Closed Loop Reality v0

**Tag:** `RESEARCH-ONLY` (conceptual loop; execution core stays frozen)  
**Purpose:** Name the **full loop** from user action to *next session* behavior, while making explicit which segments exist today and which are deliberately **not** implemented yet.

| Related | |
|---------|--|
| Observability & feedback order | [`OBSERVABILITY_FEEDBACK_SPIRAL_ROADMAP_V1.0.md`](./OBSERVABILITY_FEEDBACK_SPIRAL_ROADMAP_V1.0.md) |
| UI reaction binding | [`OBSERVATION_UI_REACTION_BINDING_LAYER_V0.md`](./OBSERVATION_UI_REACTION_BINDING_LAYER_V0.md) |
| Reaction weighting | [`OBSERVATION_UI_REACTION_WEIGHTING_LAYER_V0.md`](./OBSERVATION_UI_REACTION_WEIGHTING_LAYER_V0.md) |
| RCML felt model | [`RHIZOH_CANONICAL_MODEL_LAYER_MAP_V1.0.md`](./RHIZOH_CANONICAL_MODEL_LAYER_MAP_V1.0.md) |

---

## 0. Loop overview

```text
User Action
  → Observation
  → UI Reaction (HEL / UI)
  → Reaction Weighting
  → System Adjustment
  → Next-session Behaviour Change
```

**Today:**  
- ✔ **User Action → Observation** (local RCML state + early REAL pipeline spec).  
- ✔ **Observation → UI Reaction → Weighting** (HEL / pacing / continuity strip binding + optional intensity).  
- ⚠ **System Adjustment → Next-session Behaviour** is **not** a closed, automated adaptation loop yet — only manual, human-in-the-loop product changes.

---

## 1. Segments that exist today

| Segment | Current status | Where |
|---------|----------------|------|
| User Action → Observation | **Implemented.** Actions, entropy usage, world instance + coherence stored in RCML / browser storage; REAL observability pipeline v0 spec exists. | RCML / runtime modules; `OBSERVABILITY_FEEDBACK_SPIRAL_ROADMAP_V1.0.md` §1 |
| Observation → UI Reaction | **Implemented (v0).** Signals (FTUE drop, entropy tier, return visit) mapped to HEL / pacing / continuity strip. | `OBSERVATION_UI_REACTION_BINDING_LAYER_V0.md` |
| UI Reaction → Weighting | **Specified (v0).** Same reaction kind with different intensity (`[0,1]` per channel). | `OBSERVATION_UI_REACTION_WEIGHTING_LAYER_V0.md` |

**Crucial:** All three are **projection-only**; none of them can change authority, sealer behavior, or gateway truth.

---

## 2. Segments that do *not* exist yet (system adaptation)

| Segment | Status | Notes |
|---------|--------|-------|
| Reaction / Observation → System Adjustment | ❌ **Not implemented.** No automated tuning of RCML parameters, sealer thresholds, or authority posture from analytics. Any change must go through human review + code PR. |
| System Adjustment → Next-session Behaviour Change | ❌ **Not implemented as a loop.** Behaviour changes only via: new deploys, updated HEL / RCML code, or config changes that go through existing checklists. |

**Principle:** *Closed Loop Reality* at v0 is **documented as a concept**, but runtime only executes the **open half-loop** (up to weighted UI reaction).

---

## 3. Future v1.0 sketch (if ever pursued)

Any future **System Adjustment** layer must:

- Be driven by **explicit, schema-bound aggregates** (not ad-hoc metrics).  
- Live in a **spec + ops** track with strict READY/HOLD gates (similar to activation checklists).  
- Treat closed-loop adaptation as **research** until formal safety, legal, and authority-graph audits are in place.

Until then, this file serves as the **ceiling**: what “Closed Loop Reality” could mean, and where the current system **stops** today.

---

*v0 — concept-only loop; execution stops at weighted UI reaction.*

