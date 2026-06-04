# Rhizoh Observable Reality Layer v0.1

**Status:** **SPEC ONLY** · **SPECFLOW:** `RESEARCH-ONLY`  
**Phase:** **1** — Minimal Working Visibility Surface (post-observation gate)  
**Parent:** [`RHIZOH_PRODUCT_BINDING_LAYER_V0.md`](RHIZOH_PRODUCT_BINDING_LAYER_V0.md) · [`RHIZOH_SNAPSHOT_FRAME_V0.1.md`](RHIZOH_SNAPSHOT_FRAME_V0.1.md)

> Phase 1 is **not control**. It is the first nervous system: **intent** (Cap Wheel) · **state** (Live Monitor) · **memory** (WAL Drawer).

**Gate:** Do not implement until Phase 0 observation closes (~2026-06-05). No SCR trigger · no routing · no WAL write.

---

## 0. Phase 1 complete result (target)

When all three surfaces ship read-only:

| Surface | Question answered |
|---------|-------------------|
| 🔵 **WAL Drawer** | *What did the system do?* |
| 🟢 **Live Monitor Panel** | *What state is the system in?* |
| 🟡 **Cap Wheel Intent Log** | *What does the user want?* |

**Architectural gain:** system becomes a **readable organism**, not a black box. Still **no** control · execution · routing.

---

## 1. WAL Drawer — Memory Timeline Surface

### Purpose

Make system memory visible for the first time.

### Runtime binds (read-only)

| Module | Key / API |
|--------|-----------|
| WAL ring | `window.__rhizoh.worldActionLog` · `rhizohWorldActionLogV0.js` |
| Persistence | `window.__rhizoh.worldWalPersistence` · `rhizohWorldWalPersistenceV0.js` |
| Replay preview | `replayWorldActionLogEntryV0()` · `rhizohWorldReplayV0.js` |
| Identity cross-check | `window.__rhizoh.worldIdentity` · `worldIdentityConsistency` |

### UI components (minimum)

**A. Episode Timeline List**

| Column | Source |
|--------|--------|
| `wal_id` | `entry.entry_id` |
| `timestamp` | `entry.atMs` |
| `source` | `scr` \| `studio` \| `voice` \| `system` (from `entry.channel` / meta) |
| `event_type` | `entry.event_type` or derived tag |

**B. Single Entry Inspector** (on row select)

- `event_type`
- `payload` (read-only JSON)
- `scr_tick` / `tick_seq`
- `coherence_id` (from `entry.t0_frame` or linked frame)
- `linked_identity_state` (from `worldIdentity` at entry time if stored)

**C. Replay Preview (READ ONLY)**

- Timeline scrub of “what happened” — visual restore via `replayWorldActionLogEntryV0`
- Scrub bar · **no write path**
- Banner: `REPLAY_PREVIEW` · exit via `clearWorldReplayModeV0()`

### Mount target

Extend **`RhizohProductSurfaceDrawerV0.jsx`** — new tab or expand **Memory** strip (organism `memory_organ` role). Do not create parallel drawer.

### Hard prohibitions

| Forbidden | Reason |
|-----------|--------|
| edit / delete / mutate WAL | PRODUCT does not own truth |
| trigger SCR from replay UI | Phase 2+ |
| append WAL from drawer | Binding layer only, Phase 2+ |

### Exit criterion

> *System memory is readable for the first time.*

---

## 2. Live Monitor Panel — Reality State Surface

### Purpose

Answer *“Is the system alive?”* in one glance.

### Runtime binds (read-only)

| Block | Primary source |
|-------|----------------|
| Unified state | `window.__rhizoh.liveMonitor` |
| Alias | `window.__rhizoh.deployStatus` (same object in browser) |
| Rhythm detail | `window.__rhizoh.organismRhythm` · `organismHeartbeat` |
| Presence | `presenceState` · `continuityFirstPaint` · `presenceFrame` |
| Co-presence | `window.__rhizoh.coPresence` |

Normalize browser vs Node `deployStatus` schema **before** panel ships (see binding layer §7).

### UI components (minimum)

**A. Unified State Block**

```
rhythm.ok
scr.tick_seq
organismRhythm.max_jitter_ms  (fallback: liveMonitor.rhythm.max_jitter_ms)
identity.drift_class
castle.projection_locked
pet.inhabited
```

**B. Health Indicators (3 groups)**

| Group | Fields |
|-------|--------|
| **System Health** | SCR OK · WAL chain OK · ICL status (`worldIdentityConsistency`) |
| **Reality Coherence** | drift · jitter · castle split risk |
| **Presence State** | coPresence · continuityFirstPaint.ok · presenceFrame.coherenceId |

**C. Anomaly Strip**

- `liveMonitor.anomalies[]` — scroll or chip row

### Mount target

- Dev/ops overlay or drawer **Profile / Runtime** tab augmentation
- Publish read model only — no toggles that mutate world state
- Optional: `window.__rhizoh.observableRealityPanel` snapshot for console parity

### Hard prohibitions

| Forbidden | Reason |
|-----------|--------|
| Emergency mode toggle from panel | Ops runbook only |
| Direct SCR/WAL writes | WORLD ownership |
| Fake green when ICL absent | Show `unknown` honestly |

### Exit criterion

> *“Is the system alive?” is answerable without opening 58 console keys.*

---

## 3. Cap Wheel — Intent Logging Surface

### Purpose

Make user intent traceable before any routing exists.

### Runtime binds (emit only)

| Action | Target |
|--------|--------|
| On every node/chip click | append to `window.__rhizoh.productBinding` ring (see binding layer §5) |
| Shape | `capWheel.intent = { node, timestamp, payload }` |
| Event | `rhizoh:product-binding-v0` with `mode: "INTENT"` |

**Existing behavior preserved:** chat prefill + `LISTENING` field state — do not remove in Phase 1.

### UI components (minimum)

**A. Intent Emit (single job)**

Log every Cap Wheel interaction with node id + optional payload (seed string, layer focus id).

**B. Intent History Feed**

| Field | Meaning |
|-------|---------|
| `node` | CREATE · LEARN · WORLD · ROBOTICS · … |
| `time` | ISO / relative |
| `frequency` | count per session |
| `last_active` | last click for node |

Collapsible panel or debug strip — not required on main world chrome for all users (cohort/ops flag OK).

**C. Passive Hint (NO ROUTING)**

- Display *what was selected*
- Do **not** imply *what happened* in world (no “opened studio” unless Phase 2 ROUTE)

### Wire point

`AppRhizoh528T0.jsx` — wrap existing `onSeedIntent` / `onFocusLayer` to call binding logger **before** prefill.

### Hard prohibitions

| Forbidden | Reason |
|-----------|--------|
| SCR trigger | Phase 2 |
| navigation routing | Phase 2 |
| studio execution | Phase 2 |
| whisper copy changes that promise navigation | Product honesty — separate copy pass |

### Exit criterion

> *“What does the user want?” is visible in intent feed.*

---

## 4. Phase 1 module sketch (future — not implemented)

```
apps/client/src/rhizoh/product/observable/
  rhizohWalMemoryTimelineSurfaceV0.jsx      # WAL Drawer UI
  rhizohLiveMonitorPanelV0.jsx                # Reality State Surface
  rhizohCapWheelIntentLogV0.js                # emit + ring buffer
  rhizohObservableRealityLayerV0.js           # orchestrator (read-only)
```

**Tests:** vitest for intent ring append · WAL list read model · liveMonitor normalize helper (no SCR mocks required).

---

## 5. Phase 1 vs Phase 2 boundary

| Phase 1 (this doc) | Phase 2 (later) |
|--------------------|-----------------|
| Read WAL | Query + filter engine |
| Replay preview | Replay with WAL provenance append |
| Log intent | Intent → SCR suggestion |
| Show liveMonitor | liveMonitor drives alerts |
| Show anomalies | Anomaly → binding actions |

---

## Related

- [`RHIZOH_SNAPSHOT_FRAME_V0.1.md`](RHIZOH_SNAPSHOT_FRAME_V0.1.md) — pre–Phase 1 prod snapshot
- [`RHIZOH_PROD_FLOW_V0.2.md`](RHIZOH_PROD_FLOW_V0.2.md) — First Living World Record
- [`RHIZOH_PRODUCT_BINDING_LAYER_V0.md`](RHIZOH_PRODUCT_BINDING_LAYER_V0.md) — Phases 0–5 · epistemic boundary
