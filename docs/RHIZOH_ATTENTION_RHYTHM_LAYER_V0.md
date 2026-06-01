# Rhizoh — Attention Rhythm Layer (ARL) v0 (SSOT)

**Status:** ACTIVE — when to show cognition, direction, or silence  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-01  
**Parents:** [`RHIZOH_ACTION_COHERENCE_LAYER_V0.md`](RHIZOH_ACTION_COHERENCE_LAYER_V0.md) · [`RHIZOH_THINKING_MODEL_V0.md`](RHIZOH_THINKING_MODEL_V0.md) · [`RHIZOH_HONEST_COGNITION_SURFACE_V0.md`](RHIZOH_HONEST_COGNITION_SURFACE_V0.md) · [`RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md`](RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md)

**Binding sentence (locked):**

> **Rhizoh carries meaning in silence, direction in play, and cognition only in rhythm.**

**Product class (locked):** Rhizoh is a **behavioral field OS** — not an interface system.

---

## 1. Cognitive UX triangle (working stack)

| Vertex | Layer | Role |
|--------|-------|------|
| **Cognition** | VCL · 3D field · thinking phases | Visible thinking |
| **Action** | ACL · Next Action Anchor · intent gravity | “What can I do?” |
| **Stability** | Exposure budget · ambient clamp · phase hiding | Over-exposure guard |

ARL schedules **which vertex leads** at each moment.

**Flow thread (next evolution):** [`RHIZOH_FLOW_CONTINUITY_LAYER_V0.md`](RHIZOH_FLOW_CONTINUITY_LAYER_V0.md) — origin · continue · rhythm · return.

---

## 2. Rhythm phases (v0)

| Phase | When | Cognition | Direction (ACL) | Silence |
|-------|------|-----------|-----------------|---------|
| `silence` | IDLE · sustained rest | Minimal ambient | Quiet anchor | **Lead** |
| `direction` | IDLE · active play | Low | Normal anchor | Background |
| `cognition_pulse` | LISTENING → SPEAKING busy | Budgeted VCL | Hold-direction anchor | Off |
| `stabilize_quiet` | ~2.5s after busy ends | Damped | Normal anchor | **Brief** |

**Product insight:** Rhizoh speaks in geometry when thinking; carries meaning in **silence** when still.

---

## 3. Failure modes ARL prevents

| Too much | Risk | ARL response |
|----------|------|----------------|
| Cognition always on | Noise · spectator | Pulse only when `busy` |
| ACL always loud | Direction pressure · no exploration | `quiet` anchor in `silence` |
| Stability always clamping | Sterile · lifeless | Rhythm restores `direction` in play |

**Balance (locked):** System **gives direction** but does **not play the game** for the user.

---

## 4. Basketball mapping

| Court | Rhizoh |
|-------|--------|
| Fast break / transition | Thinking pulse + micro-RTL |
| Spacing | VCL field |
| Next play | Next Action Anchor |
| **Dead ball / breath** | **ARL silence** — no coach voice, field feel only |

Player plays by **field feel**, not constant coach narration.

---

## 5. Integration

| Module | Role |
|--------|------|
| [`rhizohAttentionRhythmV0.js`](../apps/client/src/rhizoh/runtime/rhizohAttentionRhythmV0.js) | `resolveAttentionRhythmV0` |
| [`rhizohActionCoherenceV0.js`](../apps/client/src/rhizoh/runtime/rhizohActionCoherenceV0.js) | Budget input · anchor |
| T0 shell | Ambient scale · phase chip · anchor emphasis |

Event: `rhizoh:attention-rhythm`

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_ACTION_COHERENCE_LAYER_V0.md`](RHIZOH_ACTION_COHERENCE_LAYER_V0.md) | ACL |
| [`RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md`](RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md) | VCL |

---

*ARL v0 — the system knows when to be quiet.*
