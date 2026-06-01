# Rhizoh — CEOL v0 (Continuity Entry Orientation Layer) SSOT

**Status:** ACTIVE — first 5 seconds · entry choreography · no empty screen  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-01  
**Parents:** [`RHIZOH_PRODUCT_LANGUAGE_LAYER_V0.md`](RHIZOH_PRODUCT_LANGUAGE_LAYER_V0.md) · [`RHIZOH_FLOW_CONTINUITY_LAYER_V0.md`](RHIZOH_FLOW_CONTINUITY_LAYER_V0.md) · [`RHIZOH_CONTINUITY_SEAMLESS_ENTRY_V0.md`](RHIZOH_CONTINUITY_SEAMLESS_ENTRY_V0.md) · [`RHIZOH_T0_CONTINUITY_SURFACE_V0.md`](RHIZOH_T0_CONTINUITY_SURFACE_V0.md)

**Name:** **CEOL** = **Continuity Entry Orientation Layer**

**Binding sentence (locked):**

> **CEOL choreographs the first five seconds so continuity emerges before explanation — never an empty screen.**

**Guarantee (locked):**

> **No empty screen guarantee:** map · chat · field substrate visible from **t = 0**; rail layers emerge on timeline, not on user wait.

---

## 1. Role in the stack

| Layer | CEOL relationship |
|-------|-------------------|
| **PLL** | User *lives* entry — CEOL does not narrate tutorial |
| **FCL** | Supplies `first_continuity` vs `return_continuity` entry mode |
| **Seamless entry** | Silent anchor/PAL/surfaces — CEOL times *when* rail copy appears |
| **ARL** | After 5s, rhythm takes over (silence / direction) |

CEOL is **time choreography only** — not a new grammar axis.

---

## 2. Entry choreography states

| State id | Name | Purpose |
|----------|------|---------|
| `T0_READY` | Field alive | World + input substrate at 0ms |
| `ORIENTATION_EMERGE` | Where am I | Context strip + low ambient |
| `SOFT_INVITE` | What can I do | Kale kur · Anı ekle · Bağlan |
| `FLOW_THREAD` | Continuity thread | FCL orientation · since-last (return) |
| `PLAY_READY` | Open play | Full rail · ACL anchor · user acts |

Code: [`rhizohCeolV0.js`](../apps/client/src/rhizoh/runtime/rhizohCeolV0.js) · `resolveCeolChoreographyV0`.

---

## 3. First 5 seconds timeline (default · first-time)

| Time | State | Visible |
|------|-------|---------|
| **0–400ms** | `T0_READY` | Map/chat/world · no blank shell |
| **400–1200ms** | `ORIENTATION_EMERGE` | Context strip play-call |
| **1200–2800ms** | `SOFT_INVITE` | Soft affordances (non-dominant) |
| **2800–5000ms** | `FLOW_THREAD` | FCL lines (orientation) |
| **≥5000ms** | `PLAY_READY` | Full T0 rail + ACL |

**Soft continuity emergence rules:**

1. Never block interaction on choreography — input may focus anytime after `T0_READY`.  
2. No modal · no full-screen RTL · no “loading” copy.  
3. Each layer **fades in** (opacity), never pops tutorial text.  
4. Max one **pulse** on strip during 0–5s (`Continued` or return line).  
5. Cognition exposure (VCL/3D) follows **ARL** — CEOL does not force thought field on.

---

## 4. Return vs first-time

| | `first_continuity` | `return_continuity` |
|---|-------------------|---------------------|
| **Feel** | “Buradasın” | “Geri geldin” |
| **Timeline** | Full 5s ladder | Compressed ~3s |
| **0–400ms** | `T0_READY` | `T0_READY` + optional `Continued` pulse |
| **400–1000ms** | Orientation | Since-last visit line |
| **1000–2000ms** | Soft invite | Context strip |
| **2000–3000ms** | Flow thread | Flow thread + return affordance if drifted |
| **≥3000ms** | `PLAY_READY` | `PLAY_READY` |

Same **no empty screen** rule; return skips slow invite if `since_last` already orients.

---

## 5. Integration

| Piece | Role |
|-------|------|
| [`rhizohCeolV0.js`](../apps/client/src/rhizoh/runtime/rhizohCeolV0.js) | Timeline + `resolveCeolChoreographyV0` |
| [`continuitySeamlessEntryV0.js`](../apps/client/src/rhizoh/runtime/continuitySeamlessEntryV0.js) | Emits `rhizoh:ceol-start` on seamless open |
| `AppRhizoh528T0` | Mount clock · passes CEOL flags to rail |
| [`T0ContinuitySurfaceRailV0.jsx`](../apps/client/src/rhizoh/runtime/T0ContinuitySurfaceRailV0.jsx) | Respects `ceol` visibility flags |
| [`rhizohT0FirstMatchIdentityV0.js`](../apps/client/src/rhizoh/runtime/rhizohT0FirstMatchIdentityV0.js) | Prod identity: rail + CEOL + chat/map/studio only |

Production: `VITE_RHIZOH_T0_FIRST_MATCH=1` (`scripts/setup-rhizoh-t0-production.ps1`).

Event: `rhizoh:ceol-choreography`

---

## 6. Related guarantees (by reference)

| Doc | Guarantee |
|-----|-----------|
| [`RHIZOH_T0_CONTINUITY_SURFACE_V0.md`](RHIZOH_T0_CONTINUITY_SURFACE_V0.md) | Ready Flow, not Empty State |
| [`RHIZOH_CONTINUITY_SEAMLESS_ENTRY_V0.md`](RHIZOH_CONTINUITY_SEAMLESS_ENTRY_V0.md) | Seamless continuation |
| [`RHIZOH_FLOW_CONTINUITY_LAYER_V0.md`](RHIZOH_FLOW_CONTINUITY_LAYER_V0.md) | Entry resolver |

---

*CEOL v0 — the first five seconds are continuity, not onboarding.*
