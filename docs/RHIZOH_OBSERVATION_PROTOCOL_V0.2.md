# Rhizoh Observation Protocol v0.2

**Status:** **ACTIVE** · **SPECFLOW:** ops SSOT  
**Phase:** **0** — Observation (presence-only measurement)  
**Parent:** [`RHIZOH_PROD_FLOW_V0.2.md`](RHIZOH_PROD_FLOW_V0.2.md) · [`RHIZOH_SNAPSHOT_FRAME_V0.1.md`](RHIZOH_SNAPSHOT_FRAME_V0.1.md)

> Phase 0 measures **existence**, not **behavior**. Do not test features, voice, or UI interaction — listen to the system's breath.

**Phase 1 gate:** [`RHIZOH_OBSERVABLE_REALITY_LAYER_V0.1.md`](RHIZOH_OBSERVABLE_REALITY_LAYER_V0.1.md) — opens only after Phase 0 stability criteria below.

---

## 1. Strategy validation (locked)

| Do | Do not |
|----|--------|
| Runtime snapshot only | Feature tests |
| Console observation | Voice trials |
| Passive presence | UI interaction that mutates state |
| Log gateway / rhythm patterns | Deploy or code changes |

**Why:** In Phase 0 the system is measured by **being alive**, not by **responding correctly** to product stimuli. Interaction can perturb rhythm, WAL, and gateway correlation.

**One line:** *You are not running the system — you are listening to its breathing.*

---

## 2. Observation rhythm

**Cadence:** every **2–3 hours** (or after gateway offline event · session reopen · ~24h idle).

Each cycle captures **three snapshot groups** then one **full merge**:

### Snapshot A — Core state

```javascript
window.__rhizoh?.organismRhythm
window.__rhizoh?.liveMonitor
window.__rhizoh?.deployStatus
```

### Snapshot B — Memory state

```javascript
window.__rhizoh?.worldActionLog
window.__rhizoh?.worldWalPersistence
window.__rhizoh?.worldEpisode
window.__rhizoh?.worldIdentity
```

### Snapshot C — Interaction health (passive keys only — do not invoke)

```javascript
window.__rhizoh?.presenceFrame
window.__rhizoh?.coPresence
window.__rhizoh?.voiceAdapter      // exists check only — do not speak
window.__rhizoh?.inputAdapters     // exists check only
```

Then run **Full Snapshot v2** (§3) and append to observation log in [`RHIZOH_SNAPSHOT_FRAME_V0.1.md`](RHIZOH_SNAPSHOT_FRAME_V0.1.md) if criteria change or on daily summary.

---

## 3. Full Snapshot v2 (single command)

Run at every observation cycle. Stores result on `window.__rhizoh_snapshot_v2`.

```javascript
window.__rhizoh_snapshot_v2 = (() => {
  const r = window.__rhizoh || {};
  const g = (p) => p.split(".").reduce((o, k) => (o ? o[k] : undefined), r);

  const snap = Object.freeze({
    t: Date.now(),
    iso: new Date().toISOString(),

    core: Object.freeze({
      rhythm: g("organismRhythm"),
      live: g("liveMonitor"),
      deploy: g("deployStatus")
    }),

    memory: Object.freeze({
      wal: g("worldWalPersistence"),
      log: g("worldActionLog"),
      episode: g("worldEpisode"),
      identity: g("worldIdentity"),
      entry_count: g("worldActionLog.entries")?.length ?? null
    }),

    interaction: Object.freeze({
      voice_registered: !!r.voiceAdapter,
      input_registered: !!r.inputAdapters,
      presence: g("presenceFrame"),
      copresence: g("coPresence")
    }),

    health: Object.freeze({
      rhythm_ok: g("organismRhythm.ok"),
      jitter_ms: g("organismRhythm.max_jitter_ms"),
      scr_tick: g("liveMonitor.scr.tick_seq"),
      identity_structural: g("liveMonitor.identity.structural"),
      identity_break: g("liveMonitor.identity.identity_break"),
      castle_split: g("liveMonitor.castle.castle_surface_split"),
      fork_risk: g("liveMonitor.castle.fork_risk")
    }),

    phase0: Object.freeze({ observation: true }),
    phase1_ui: Object.freeze({
      wal_timeline: false,
      live_monitor_panel: false,
      cap_intent_log: false
    })
  });

  console.log("🧪 RHIZOH OBSERVATION SNAPSHOT v0.2");
  console.table(snap.health);
  return snap;
})();
```

**Compare cycles:** save `scr_tick`, `jitter_ms`, `entry_count` deltas — not absolute values alone.

---

## 4. What we are looking for

### 🟢 Normal

| Signal | Expected |
|--------|----------|
| `scr_tick` | **Increasing** across cycles (session alive) |
| `identity` | Stable · `identity_break` false · `structural` false |
| `fork_risk` | false |
| `castle_split` | false |

### 🟡 Noise but acceptable

| Signal | Context |
|--------|---------|
| `app.gateway.offline` → reconnect | Render cold start · log timestamp |
| `rhythm_ok: false` | OK if jitter stable and identity/castle clean |
| Jitter spike once | Correlate with gateway reconnect (see Log #2) |

### 🔴 Problem — stop observation clock · investigate before Phase 1

| Signal | Action |
|--------|--------|
| `scr_tick` **stops increasing** over 2+ cycles while tab active | Log + check tab visibility / engine crash |
| `fork_risk: true` | Log full snapshot · do not proceed to Phase 1 |
| `identity_break: true` or sustained `structural: true` | ICL drift — log · hold Phase 1 |
| WAL `entry_count` runaway without session activity | Memory leak watch |
| Gateway offline **repeated** every cycle | Render uptime / ops — not World OS core |

---

## 5. Observation targets (three pillars)

| Pillar | Metric | Where |
|--------|--------|-------|
| **Rhythm** | `scr_tick` delta per cycle | `liveMonitor.scr` |
| **Stability** | `jitter_ms` trend (flat or down) | `organismRhythm` |
| **Memory growth** | `worldActionLog.entries.length` delta | `worldActionLog` |

Do not optimize these in Phase 0 — **record trends only**.

---

## 6. Phase 0 → Phase 1 transition gate

Phase 1 (**Observable Reality Layer v0.1**) opens only when **all three** are true across **≥3 consecutive snapshot cycles** (2–3h apart):

| # | Criterion | Pass |
|---|-----------|------|
| 1 | **Tick** | `scr_tick` continuously increases while session active |
| 2 | **Jitter** | Stable or downward trend · no runaway · identity/castle clean |
| 3 | **Identity** | No drift · `identity_break` false · `fork_risk` false |

**Then:** Phase 0 = *proven stable system* → implement Phase 1 read-only surfaces (no SCR trigger · no routing).

**Until then:** observation only · no deploy · no binding code.

---

## 7. Phase 1 sequence (after gate — spec only)

Order is locked in [`RHIZOH_OBSERVABLE_REALITY_LAYER_V0.1.md`](RHIZOH_OBSERVABLE_REALITY_LAYER_V0.1.md):

1. 🔵 **WAL Timeline UI** — memory becomes visible  
2. 🔵 **LiveMonitor Panel** — runtime state one glance  
3. 🔵 **Cap Wheel Intent Log** — user intent traceable  

Still **read-only** · no execution bridge (Phase 2).

---

## 8. Current system state (interpretation lock)

> Rhizoh is a **living system that works but has not yet shown itself** to the user.

| Layer | @ observation |
|-------|----------------|
| Motor | alive (`3400b3b` · scr_tick advancing) |
| Visibility | partial (console keys · no Phase 1 UI) |
| Binding | absent until Phase 1–2 |
| Correct action | **listen without touching** |

---

## 9. Observation log index

| Log | Date | Notes |
|-----|------|-------|
| #1 | 2026-06-03 | First Living World @ `3400b3b` — [`RHIZOH_PROD_FLOW_V0.2.md`](RHIZOH_PROD_FLOW_V0.2.md) |
| #2 | 2026-06-04 | Gateway flap · rhythm watch · scr 18→52 — [`RHIZOH_SNAPSHOT_FRAME_V0.1.md`](RHIZOH_SNAPSHOT_FRAME_V0.1.md) §6 |
| #3+ | *pending* | Append after each 2–3h cycle or daily summary |

---

## Related

- [`RHIZOH_PRODUCT_BINDING_LAYER_V0.md`](RHIZOH_PRODUCT_BINDING_LAYER_V0.md) — epistemic boundary · Phases 0–5
- [`RHIZOH_OBSERVABLE_REALITY_LAYER_V0.1.md`](RHIZOH_OBSERVABLE_REALITY_LAYER_V0.1.md) — Phase 1 spec
