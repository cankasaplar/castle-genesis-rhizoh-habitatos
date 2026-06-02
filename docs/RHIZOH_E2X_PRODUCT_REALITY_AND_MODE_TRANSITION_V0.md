# Rhizoh — E2-X product reality & Reality Transition Layer (RTL) v0.1

**Status:** ACTIVE — product SSOT (not execution)  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-01  
**Parents:** [`RHIZOH_SURFACE_LAYER_OPERATING_MODEL_V0.md`](RHIZOH_SURFACE_LAYER_OPERATING_MODEL_V0.md) · [`apps/client/docs/DEPLOY_MATRIX_V1.0.md`](../apps/client/docs/DEPLOY_MATRIX_V1.0.md) · [`RHIZOH_ACADEMIC_OBSERVATORY_LAYER_V0.md`](RHIZOH_ACADEMIC_OBSERVATORY_LAYER_V0.md)

**Binding sentence (locked):**

> **Rhizoh is not a system that loads. It is a system that re-enters continuity.**

**One-line:** E2-X = **experience state**. Boot RTL = fast break; **Micro-RTL** = off-ball movement during use; **emotional anchor** = persistent place reference.

**Continuity engine (locked):**

> **Rhizoh is a continuity engine built on semantic gravity seeds and real-time perceptual transitions.**

**Four layers (locked):** L1 memory graph · L2 anchor gravity · RTL temporal perception · E2-X surfaces — see [`RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md`](RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md).

**Uninterrupted play (locked):**

> **Rhizoh does not transition users. It maintains uninterrupted play.**

**Default session open:** [`RHIZOH_CONTINUITY_SEAMLESS_ENTRY_V0.md`](RHIZOH_CONTINUITY_SEAMLESS_ENTRY_V0.md) — no visible boot pipeline; user feels **Continued**, not “loading”.

**T0 shell (life principle):** [`RHIZOH_T0_CONTINUITY_SURFACE_V0.md`](RHIZOH_T0_CONTINUITY_SURFACE_V0.md) — **Ready Flow, not Empty State**; restoration never returns to a blank screen.

**World layout hierarchy (deploy SSOT):** [`RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md`](RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md) — WORLD = main stage (swarm · wheel · voice · chat · drawers · map sub-layer); T0 = overlay only.

**T0 cognitive grammar (architecture SSOT):** [`RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md`](RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md) — STATE · INTENT · FIELD · TRANSITION; build order **meaning → language → behavior → UI → surface**.

**Semantic evolution (policy):** [`RHIZOH_GRAMMAR_CONSTITUTION_SYSTEM_V0.md`](RHIZOH_GRAMMAR_CONSTITUTION_SYSTEM_V0.md) — RGCS / CSES; language grows in **meaning space**, not rule space.

---

## 1. Product diagnosis (locked)

| Symptom | Cause |
|---------|--------|
| Same URL, different binary | Mode invisible until RTL |
| Engine strong, chat feels same | Missing **interaction feedback loop** |
| Paper works, world does not return | Externalize ✔ · re-internalize weak |

> **People feel the transition, not the engine.**

| Wrong | Right |
|-------|-------|
| E2-X = feature set | E2-X = **experience state** |
| Map = UI | Map = **spatial memory** (anchor system) |
| RTL = entry only | RTL = entry + **micro re-entry** |

---

## 2. Basketball map (founder)

| Court | Rhizoh |
|-------|--------|
| Fast break | Boot RTL (entry ceremony) |
| Half-court offense | L1/L2 + PAL engine |
| Spacing | E2-X surfaces |
| **Off-ball movement** | **Micro-RTL** (screen, cut, reposition) |

---

## 3. Boot RTL (macro)

| Module | Role |
|--------|------|
| [`expressiveRealityTransitionV0.js`](../apps/client/src/rhizoh/runtime/expressiveRealityTransitionV0.js) | Plan + phased runner |
| [`ExpressiveRealityTransitionHostV0.jsx`](../apps/client/src/rhizoh/runtime/ExpressiveRealityTransitionHostV0.jsx) | Boot + micro orchestration |
| [`ExpressiveRealityTransitionOverlayV0.jsx`](../apps/client/src/rhizoh/runtime/ExpressiveRealityTransitionOverlayV0.jsx) | Full-screen ceremony |

Phases (full ceremony, opt-in): `entry_moment` → `pal_anchor` → `map_reveal` → `studio_reveal` → `chat_resume` — set `VITE_RHIZOH_RTL_FULL_CEREMONY=1`.

**Default entry (seamless):** [`RHIZOH_CONTINUITY_SEAMLESS_ENTRY_V0.md`](RHIZOH_CONTINUITY_SEAMLESS_ENTRY_V0.md) — silent continuation; strip may show **Continued** only.

---

## 4. Micro-RTL (interaction loop) ✔

**Gap that was open:** RTL strong at entry, weak during use.

| Event | Kind | Duration |
|-------|------|----------|
| LLM turn / projection | `message_arrive` / `map_pin_change` | 260–360ms |
| Memory recall | `memory_recall` | ~340ms |
| REAL_MAP transition | `map_surface_open` | ~300ms |
| Surface reveal chat | `chat_return` | ~260ms |
| Thread switch (API) | `thread_switch` | ~320ms |
| Story shift (API) | `story_shift` | ~400ms |

Module: [`expressiveRealityMicroTransitionV0.js`](../apps/client/src/rhizoh/runtime/expressiveRealityMicroTransitionV0.js)  
Event: `rhizoh:rtl-micro` · UI: corner **mini PAL flicker** (non-blocking).

Debounce: min **180ms** between micro pulses.

---

## 5. Persistent emotional anchor ✔

**“Ankara Castle” is not entry-only** — it is the reference point for every important event.

| Piece | Role |
|-------|------|
| [`ExpressiveRealityEmotionalAnchorStripV0.jsx`](../apps/client/src/rhizoh/runtime/ExpressiveRealityEmotionalAnchorStripV0.jsx) | Top-left strip after boot |
| `rhizoh.rtl.emotional_anchor.v0` | Session persistence |
| `rhizoh:emotional-anchor` | Strip refresh on each event |

Paper export = **externalize** mind. PAL anchor = **internalize** place on every micro pulse.

---

## 6. Paper ↔ RTL symmetry

| Direction | Mechanism |
|-----------|-----------|
| Out | AOL / `academic:export-paper` |
| In | PAL + micro-RTL re-entry |

---

## 7. Status

| Item | Status |
|------|--------|
| Boot RTL (full ceremony, opt-in) | ✔ `VITE_RHIZOH_RTL_FULL_CEREMONY=1` |
| Continuity seamless entry (default) | ✔ [`continuitySeamlessEntryV0.js`](../apps/client/src/rhizoh/runtime/continuitySeamlessEntryV0.js) |
| Visible entry pipeline (deprecated) | CEC · `VITE_RHIZOH_VISIBLE_ENTRY_PIPELINE=1` |
| Micro-RTL | ✔ |
| Emotional anchor strip | ✔ |
| Orchestrator → micro-RTL (`thread_switch`, `story_shift`) | ✔ via [`rhizohConversationRtlBridgeV0.js`](../apps/client/src/rhizoh/product/rhizohConversationRtlBridgeV0.js) |
| Anchor System v0 (seed / user / cohort) | ✔ [`RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md`](RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md) — *emerge*, not center |
| Server cohort flip without redeploy | Backlog |
| Cesium flyTo bound to anchor only | Backlog |
| Anchor balance / drift monitor (ops) | ✔ [`anchorDriftMonitorV0.js`](../apps/client/src/rhizoh/runtime/anchorDriftMonitorV0.js) |

---

## 8. Copy spine (Turkish)

1. *Sistem yüklenmez — sürekliliğe yeniden girersin.*
2. *Her önemli olay aynı yere referans verir.*
3. *Harita UI değil; hafıza çapası.*

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_PROJECTION_ACTIVATION_LAYER_V0.md`](RHIZOH_PROJECTION_ACTIVATION_LAYER_V0.md) | map_pin thresholds |
| [`RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md`](RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md) | Origin seed + user + cohort anchors |
| [`RHIZOH_MULTILINGUAL_BRIDGE_V0.md`](RHIZOH_MULTILINGUAL_BRIDGE_V0.md) | 48+ locales · en↔es bridge · turn pulses |
| [`RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md`](RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md) | T0 interaction grammar |
| [`RHIZOH_GRAMMAR_CONSTITUTION_SYSTEM_V0.md`](RHIZOH_GRAMMAR_CONSTITUTION_SYSTEM_V0.md) | RGCS · sealed dictionary |
| [`RHIZOH_PRODUCT_LANGUAGE_LAYER_V0.md`](RHIZOH_PRODUCT_LANGUAGE_LAYER_V0.md) | PLL · continuity-first product OS |
| [`RHIZOH_EXPERIENCE_GRAMMAR_STABILIZATION_V0.md`](RHIZOH_EXPERIENCE_GRAMMAR_STABILIZATION_V0.md) | Five-layer freeze policy |
| [`RHIZOH_CEOL_V0.md`](RHIZOH_CEOL_V0.md) | CEOL · first 5s entry choreography |
| [`RHIZOH_FLOW_CONTINUITY_LAYER_V0.md`](RHIZOH_FLOW_CONTINUITY_LAYER_V0.md) | FCL v0 · entry · drift · return |
| [`RHIZOH_ATTENTION_RHYTHM_LAYER_V0.md`](RHIZOH_ATTENTION_RHYTHM_LAYER_V0.md) | Silence · direction · cognition pulse |
| [`RHIZOH_ACTION_COHERENCE_LAYER_V0.md`](RHIZOH_ACTION_COHERENCE_LAYER_V0.md) | Next Action Anchor · overload guard |
| [`RHIZOH_THINKING_MODEL_V0.md`](RHIZOH_THINKING_MODEL_V0.md) | Thinking exposure · state transitions |
| [`RHIZOH_HONEST_COGNITION_SURFACE_V0.md`](RHIZOH_HONEST_COGNITION_SURFACE_V0.md) | Ambient light · 3D thought field toggle |
| [`RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md`](RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md) | VCL · cognitive field deformation |
| [`RHIZOH_ACADEMIC_OBSERVATORY_LAYER_V0.md`](RHIZOH_ACADEMIC_OBSERVATORY_LAYER_V0.md) | Observation export |

---

*RTL v0.1 — re-enters continuity.*
