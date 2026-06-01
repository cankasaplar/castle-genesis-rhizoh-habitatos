# Rhizoh — Continuity Seamless Entry v0 (SSOT)

**Status:** ACTIVE — default E2-X session open  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-01  
**Parents:** [`RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md`](RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md) · [`RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md`](RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md)

---

## Locked principles

| Key | Sentence |
|-----|----------|
| **Uninterrupted play** | Rhizoh does not transition users. It maintains uninterrupted play. |
| **Phase boundary** | Transition is not a phase. It is a disappearance of phase boundary. |
| **Loading removed** | The system removes the feeling of loading — it does not load an experience. |

**Basketball:** Good teams do not run a set play for transition — they **read** the fast break. Rhizoh default entry = **recognition**, not ceremony.

---

## What the user must NOT feel

- Waiting for a pipeline  
- “System started” ritual  
- Empty screen → animation → ready  
- Visible open / anchor / continue steps  

## What the user SHOULD feel

> **“Buradaydım zaten.”** — only **Continued** (strip cue), then play.

---

## Behavior (silent)

On first session open (E2-X creative):

1. **Anchor restore** — background (`mergePalIntoAnchorContextV0`)  
2. **PAL update** — no overlay narrative  
3. **Surfaces** — map · studio · chat revealed without ceremony  
4. **UI** — already in ready state; optional ~480ms **Continued** on anchor strip only  

No overlay. No phased headlines. Micro-RTL remains for **in-play** pulses only.

Code: [`continuitySeamlessEntryV0.js`](../apps/client/src/rhizoh/runtime/continuitySeamlessEntryV0.js) · host: [`ExpressiveRealityTransitionHostV0.jsx`](../apps/client/src/rhizoh/runtime/ExpressiveRealityTransitionHostV0.jsx).

Event: `rhizoh:continuity-seamless-entry` · detail `{ continued: true }`.

---

## Basketball ↔ Rhizoh

| Basketball | Rhizoh |
|------------|--------|
| Fast break | Micro-RTL (in session) |
| Transition offense | Continuity engine |
| Trap defense | Recall trigger |
| Court awareness | L2 graph |
| Playmaking | Resolver |

**Entry:** not “set play” — **seamless continuation**.

---

## Opt-in visible paths (not default)

| Env | Path |
|-----|------|
| (default) | **Seamless** |
| `VITE_RHIZOH_VISIBLE_ENTRY_PIPELINE=1` | Deprecated CEC (3 visible steps) — [`RHIZOH_CONTINUITY_ENTRY_COMPRESSION_V0.md`](RHIZOH_CONTINUITY_ENTRY_COMPRESSION_V0.md) |
| `VITE_RHIZOH_RTL_FULL_CEREMONY=1` | Full 6-phase boot RTL |

---

## T0 alignment

Seamless entry satisfies macro tempo **without** empty restore. Default shell principles: [`RHIZOH_T0_CONTINUITY_SURFACE_V0.md`](RHIZOH_T0_CONTINUITY_SURFACE_V0.md) — map + chat always alive; soft affordances optional.

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_T0_CONTINUITY_SURFACE_V0.md`](RHIZOH_T0_CONTINUITY_SURFACE_V0.md) | T0 = Continuity Surface |
| [`RHIZOH_CONTINUITY_ENTRY_COMPRESSION_V0.md`](RHIZOH_CONTINUITY_ENTRY_COMPRESSION_V0.md) | **DEPRECATED** visible pipeline |
| [`RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md`](RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md) | RTL + Micro-RTL |

---

*Seamless entry v0 — continuation without transition.*
