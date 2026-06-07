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

Then run **Auto Observation System v1** (§11) for block runs, **Observation Control v1** (§3) for labeled manual points, or Full Snapshot v2 (§4) for extended capture.

---

## 3. Observation Control System v1 (copy-paste · primary)

**File:** [`scripts/rhizohObserveConsoleV1.js`](scripts/rhizohObserveConsoleV1.js)  
**Not in prod bundle** — paste once per browser session into Chrome DevTools on rhizoh.com.

Paste the full file contents, then:

```javascript
rhizohObserve("t0");        // baseline this session
// 2–3 hours later:
rhizohObserve("t2h");
// end of day:
rhizohObserve("daily-summary");
```

**Returns:** health `console.table` · optional `delta` vs previous call · full object · append to `window.__rhizoh_observe_log`.

**Delta is the critical signal:** `tick_diff > 0` while tab active = system living; `tick_diff === 0` over multiple cycles = investigate.

### Inline one-liner (same logic)

<details>
<summary>Expand paste block</summary>

```javascript
window.rhizohObserve = (label = "manual") => {
  const r = window.__rhizoh || {};
  const g = (p) => p.split(".").reduce((o, k) => (o ? o[k] : undefined), r);
  const structural = g("liveMonitor.identity.structural");
  const identityBreak = g("liveMonitor.identity.identity_break");
  const snap = {
    meta: { label, time: new Date().toISOString(), ts: Date.now() },
    signal: {
      rhythm_ok: g("organismRhythm.ok"),
      jitter_ms: g("organismRhythm.max_jitter_ms"),
      scr_tick: g("liveMonitor.scr.tick_seq"),
      identity_ok: structural !== true && identityBreak !== true,
      fork_risk: g("liveMonitor.castle.fork_risk"),
      castle_split: g("liveMonitor.castle.castle_surface_split")
    },
    system: {
      gateway_phase: window.__CASTLE_GATEWAY_SESSION_KEEPER__?.lastPhase
        ?? window.__CASTLE_BUILD_RUNTIME_SNAPSHOT__?.()?.gatewayState?.phase
        ?? null,
      live: !!g("liveMonitor"),
      wal: !!g("worldActionLog"),
      wal_entries: g("worldActionLog.entries")?.length ?? null,
      memory: !!g("worldWalPersistence")
    },
    phase0_guard: { observation_only: true, no_actions: true, no_mutation: true }
  };
  const prev = window.__rhizoh_last_snapshot;
  if (prev?.signal) {
    snap.delta = {
      tick_diff: (snap.signal.scr_tick ?? 0) - (prev.signal.scr_tick ?? 0),
      jitter_diff: (snap.signal.jitter_ms ?? 0) - (prev.signal.jitter_ms ?? 0),
      ms_since_prev: snap.meta.ts - (prev.meta?.ts ?? snap.meta.ts)
    };
  }
  window.__rhizoh_last_snapshot = snap;
  (window.__rhizoh_observe_log = window.__rhizoh_observe_log || []).push(snap);
  console.log("🧪 RHIZOH OBSERVE:", label);
  console.table(snap.signal);
  if (snap.delta) console.log("📈 DELTA:", snap.delta);
  console.log("📦 FULL:", snap);
  return snap;
};
```

</details>

### What this gives you

| Layer | Signal |
|-------|--------|
| Instant health | rhythm · jitter · fork · split |
| **Delta** | SCR tick growth · jitter trend · ms since last |
| Phase 0 safety | no actions · no mutation · read-only |

### Current reading (Log #2 aligned)

| Signal | Status |
|--------|--------|
| Engine | alive |
| SCR loop | stable (tick advancing) |
| Gateway | flaky offline/online — **not product bug** |
| Rhythm `ok: false` | threshold/timing — watch jitter trend |
| Risk class | network + runtime cadence · not feature |

> System is **working but not yet settled into observable rhythm** — observation muscle first, then binding, then features.

---

## 4. Full Snapshot v2 (extended capture)

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

## 5. What we are looking for

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

## 6. Observation targets (three pillars)

| Pillar | Metric | Where |
|--------|--------|-------|
| **Rhythm** | `scr_tick` delta per cycle | `liveMonitor.scr` |
| **Stability** | `jitter_ms` trend (flat or down) | `organismRhythm` |
| **Memory growth** | `worldActionLog.entries.length` delta | `worldActionLog` |

Do not optimize these in Phase 0 — **record trends only**.

---

## 7. Phase 0 → Phase 1 transition gate

Phase 1 opens when **all three** pass across **≥3 consecutive** `rhizohObserve()` cycles (2–3h apart):

| # | Criterion | Pass |
|---|-----------|------|
| 1 | **Tick** | `delta.tick_diff > 0` each cycle (tab active) |
| 2 | **Jitter** | Stable or downward `jitter_diff` trend · identity/castle clean |
| 3 | **Identity** | `signal.identity_ok === true` every cycle |

**Additional gate (from Log #2):** gateway oscillation must be **explainable** (cold start) not **persistent every cycle** — log boot `app.gateway.offline` count per session.

**Then:** Phase 0 = proven stable → Phase 1 read-only surfaces.

---

## 8. Phase 1 sequence (after gate)

Order is locked in [`RHIZOH_OBSERVABLE_REALITY_LAYER_V0.1.md`](RHIZOH_OBSERVABLE_REALITY_LAYER_V0.1.md):

1. 🔵 **WAL Timeline UI** — memory becomes visible  
2. 🔵 **LiveMonitor Panel** — runtime state one glance  
3. 🔵 **Cap Wheel Intent Log** — user intent traceable  

Still **read-only** · no execution bridge (Phase 2).

---

## 9. Current system state (interpretation lock)

> Rhizoh is a **living system that works but has not yet shown itself** to the user.

| Layer | @ observation |
|-------|----------------|
| Motor | alive (`3400b3b` · scr_tick advancing) |
| Visibility | partial (console keys · no Phase 1 UI) |
| Binding | absent until Phase 1–2 |
| Correct action | **listen without touching** |

---

## 10. Observation log index

| Log | Date | Notes |
|-----|------|-------|
| #1 | 2026-06-03 | First Living World @ `3400b3b` — [`RHIZOH_PROD_FLOW_V0.2.md`](RHIZOH_PROD_FLOW_V0.2.md) |
| #2 | 2026-06-04 | Gateway flap · rhythm watch · scr 18→52 — [`RHIZOH_SNAPSHOT_FRAME_V0.1.md`](RHIZOH_SNAPSHOT_FRAME_V0.1.md) §6 |
| #3 | 2026-06-04 | **Lab L0 CLOSED** — `HEALTHY_OVERLOAD_EQUILIBRIUM` — [`RHIZOH_DISTRIBUTED_OBSERVE_LAB_V0.md`](RHIZOH_DISTRIBUTED_OBSERVE_LAB_V0.md) § L0 CLOSED |
| #4 | 2026-06-04 | **Lab L0.5 Laptop A CLOSED** — official `A_t0_120b`→`A_t2_120b` · Δ232.8s · seq +893 · CIS 0.9496 · rhythm breach |
| #5 | 2026-06-04 | **Lab L0.5 Laptop B CLOSED** — `B_t0`→`B_t2` · seq +389 · drain 2.044/s (projection) · jitter 82–83 · CIS 0.9496 |
| #6 | 2026-06-04 | **Lab L1 A/B FINAL** — A ok_rate 1 jitter 20 · B ok_rate 0 jitter 108 plateau · worst_phase null (re-probe) — steady temporal desync |
| #7 | 2026-06-04 | **Lab L1 Path 2 LOCK** — scheduler drift **fixed offset** (108 plateau) · not propagation/oscillation |
| #8 | 2026-06-04 | **Lab L1 attribution fix** — `L1_B_*` phase-check/long runs were on **A** (B offline) · B L1 **OPEN** · A L1 CLOSED unchanged |
| #9 | 2026-06-04 | **Single-runtime + observer** — `laptop` deprecated · B = mirror shell only |
| #10 | 2026-06-04 | **SRPOA-v1 LOCK** — runtime `origin` only · `context` observer-only · read-only guards — [`RHIZOH_SRPOA_V1.md`](RHIZOH_SRPOA_V1.md) |
| #11 | 2026-06-04 | **SRPOA-v1 harden** — `context` throw on runtime · `snapshot()` · fail-fast multi-runtime · no injection |
| #12 | 2026-06-04 | **SRPOA-v1 CLOSED (ops)** — single-stream · snapshot=serialize-only lock · Inspector Panel deferred |

### Log #3 — Lab L0 FINAL (locked)

| Node | WAL `world_id` | Gateway boot | Rhythm | CIS | Ingress |
|------|----------------|--------------|--------|-----|---------|
| **A** | `8b539cdd` | Log #2 cold-start (+6693/+14744/+17807) | ok · jitter 3→57 | 0.9496 | 64/BP · seq 18446→20039 |
| **B** | `adcce01c` | Fast connect (+520) | fail · jitter 82 | 0.9496 | 64/BP · seq 18601→19781 |

**Conclusion:** Same prod model · independent world instances · A steadier rhythm · B under rhythm load · shared ingress saturation · gateway offline ≠ core instability.

**SSOT closure (Lab L0 + L0.5):** Single truth layer = organism scheduler (`organismRhythm.ok`). Projections: queue/seq, `world_id`, lab exports, gateway probe. `temporal_budget_violation` = organism state label, not `failure_class`. Full lock: [`RHIZOH_DISTRIBUTED_OBSERVE_LAB_V0.md`](RHIZOH_DISTRIBUTED_OBSERVE_LAB_V0.md) § Truth vs projection.

**A time series:** baseline `02:29Z` jitter 3 → dump jitter 57 → `observe` b1 seq 19265 → `A_SYNC` seq 20039 (`inflight: 1`).

`observe.snapshot("A_SYNC")` — string → **`meta: { label: "A_SYNC" }`** only (no `0:"A"` leak). Prefer `observe.snapshot({ label: "A_SYNC", laptop: "A" })`. L0.5 metrics: [`scripts/rhizohLabL05MetricsV0.js`](scripts/rhizohLabL05MetricsV0.js).

---

## 11. Auto Observation System v1 (interval · buffer · readiness)

**File:** [`scripts/rhizohAutoObserveConsoleV1.js`](scripts/rhizohAutoObserveConsoleV1.js)  
**Not in prod bundle** — paste once per browser session. Complements §3 manual `rhizohObserve`.

### Paste once

Copy full file from `docs/scripts/rhizohAutoObserveConsoleV1.js` into Chrome DevTools on rhizoh.com.

### Usage

```javascript
// Dev / dense sampling (2 min)
rhizohAuto.start(120000);

// Phase 0 block observation (2 h) — tab must stay open
rhizohAuto.start(7200000);

rhizohAuto.tick();           // manual snapshot anytime
rhizohAuto.report();         // duration · tick_growth · jitter_trend · readiness score
rhizohAuto.readinessScore(); // { score, gate, notes } only
rhizohAuto.exportLog();      // JSON for observation log paste
rhizohAuto.stop();
```

### What it solves

| Before | After |
|--------|-------|
| Single snapshot = noise | Time series = behavior curve |
| Manual copy-paste | Automatic delta each interval |
| No trend | `report()` + readiness gate |

**Buffer:** up to 50 samples in `rhizohAuto.history` · also appends to `window.__rhizoh_observe_log`.

**Phase 0 guard:** read-only · no WAL writes · no UI/voice · no feature triggers.

### Readiness score (0–100)

Heuristic only — not a Phase 1 unlock by itself. Requires **≥3 samples**.

| Gate | Score band | Meaning |
|------|------------|---------|
| `WATCH` | ≥75 · no stall · identity clean · no fork | Trending toward Phase 1 gate |
| `HOLD` | 50–74 | Keep observing |
| `BLOCK` | <50 | Do not open Phase 1 — investigate |

Penalties: SCR stall · jitter run-up · identity/fork · gateway flips · sustained `rhythm_ok: false`.

**Phase 1 still requires** ≥3 manual or auto **2–3h block** cycles per §7 — auto score is advisory.

### Current reading (Log #2 aligned)

| Signal | Status |
|--------|--------|
| Engine | stable |
| SCR | working |
| Identity | clean |
| Gateway | unstable — **primary watch signal** |
| Rhythm | noise — likely timing jitter |

> System is a **self-observing runtime organism**, not a feature-driven app. Phase 1 = *system can see itself over time*, not “turn on features.”

### Future (not implemented)

- Auto Drift Detector (gateway instability classifier · rhythm anomaly)
- Read-only dashboard (tick graph · jitter timeline · heartbeat)

Console-only until Phase 1 surfaces spec ships.

---

## 11b. Observe Button v0 (console locked · DOM open)

**File:** [`scripts/rhizohObserveButtonV0.js`](scripts/rhizohObserveButtonV0.js)  
**When:** DevTools console unavailable but page JS/DOM injection still works (Lab L0.5+ on reference node A).

**Minimal one-liner** (quick probe — output still needs console unless you use full script):

```javascript
const btn = document.createElement("button");
btn.innerText = "RHIZOH OBSERVE";
btn.style = "position:fixed;top:10px;right:10px;z-index:999999;padding:8px;background:#000;color:#0f0;border:1px solid #0f0;";
btn.onclick = () => console.log(window.__rhizoh);
document.body.appendChild(btn);
```

**Recommended (no console):** paste full `rhizohObserveButtonV0.js` once → fixed button → click opens on-page panel + **Copy JSON** (uses `rhizohObserve` if already loaded).

```javascript
// after paste file contents:
rhizohObserveButton.mount();  // idempotent
rhizohObserveButton.tick();   // manual snapshot
```

| Layer | Locked? | Observe path |
|-------|---------|--------------|
| Console | often locked | avoid |
| Runtime `__rhizoh` | open | source |
| DOM | open | button + panel |

**Lab rule:** Do not mount on Laptop A until **Lab L0** hour is archived; then A = reference + UI observe, B = raw until L0 B done.

---

## 12. Observability Panel v1 (read-only HTML dashboard)

**File:** [`scripts/rhizoh-observe.html`](scripts/rhizoh-observe.html)  
**Not in prod bundle** · Phase 0 · read-only · no mutation.

### How to use on rhizoh.com

`window.__rhizoh` lives on the **main app tab** only. The panel must run **on that same page**:

1. Open **rhizoh.com** (main app loaded · `__rhizoh` populated)
2. DevTools → Console → run:

```javascript
RhizohPanel.mountOverlay();
```

3. First time: open `docs/scripts/rhizoh-observe.html` locally, copy the full `<script>...</script>` block (or entire file via snippet), paste once on rhizoh.com, then `RhizohPanel.mountOverlay()`.

**Alternative:** open the HTML file in browser for UI preview — live data requires inject on rhizoh.com tab.

### Controls

| Action | Command |
|--------|---------|
| Manual snapshot | `RhizohPanel.tick()` or **Tick** button |
| Auto 10s / 2m | **Auto 10s** · **Auto 2m** |
| Stop | **Stop** |
| Export log | **Export JSON** → clipboard + console |
| Overlay | **Inject on rhizoh.com** |

### Three-layer stack

| Layer | Role |
|-------|------|
| **Runtime** (rhizoh.com) | Real system · `window.__rhizoh` |
| **Panel** (this HTML) | Self-view over time · signal · delta · drift |
| **Buffer** | `RhizohPanel.history` · shared `__rhizoh_observe_log` · optional `rhizohAuto` sync |

### Phase 0.7 — Drift classifier (multi-axis)

See §14. Panel card **Drift classifier v0.7** when Ground Truth Lock loaded.

### Next evolution

- Phase 1 → WAL timeline + event replay (read-only surfaces spec)

---

## 13. Phase 0.6 — Ground Truth Lock

**File:** [`scripts/rhizohObserveGroundTruthV0_6.js`](scripts/rhizohObserveGroundTruthV0_6.js)  
**Paste first** on rhizoh.com before observe / auto / panel.

Every snapshot carries `ground_truth`:

| Field | Clock | Role |
|-------|-------|------|
| `ts` | `Date.now()` | Wall epoch |
| `wall_ts` | `performance.now()` | Monotonic render time |
| `server_ts_proxy` | `liveMonitor.atMs` | Runtime publish time (not NTP) |
| `scr_tick` | SCR sequence | System tick anchor |
| `frame_id` | `__CASTLE_RUNTIME_FRAME_ID__` | Tab session frame |
| `visibility` / `focused` | DOM | Idle vs active sampling |

**Dual-clock delta:**

- `tick_velocity_per_s` — Δtick / Δwall_ts
- `sampling_skew_ms` — observer timing vs epoch
- `idle_gap` — sample after hidden tab

> **Panel = consumer · runtime = source.** No `__rhizoh` → empty sensor.

**Paste order:** (1) Ground Truth → (2) optional Gateway Index → (3) observe/auto/panel

---

## 14. Phase 0.7 — Drift Classifier v0.7

Multi-axis beyond tick + jitter + gateway:

| Axis | Signal |
|------|--------|
| Tick velocity | Δtick / Δwall_ms |
| Reconnect pressure | reconnect_attempts delta |
| Heartbeat variance | since_health_ok_ms spread |
| Idle throttle | visibility / focus ratio |
| Sampling skew | dual-clock correction |

Classes: `normal_jitter` · `gateway_noise` · `timing_jitter` · `idle_throttle` · `reconnect_pressure` · `heartbeat_variance` · `real_instability` · `identity_risk`

Output: `drift.confidence` 0–1 · `drift.axes` · weighted classes

---

## 15. Phase 0.8 — False-offline eliminator

**Observe:** [`scripts/rhizohFalseOfflineEliminatorV1.js`](scripts/rhizohFalseOfflineEliminatorV1.js)  
**Runtime (boot log):** `apps/client/src/rhizoh/runtime/gatewayBootObservabilityFilterV0.js`

Cold-start `offline` → observe semantic `warming_up` · boot log `app.gateway.warming_up` (not `app.gateway.offline`).

```javascript
rhizohFalseOffline.report();
// summary.verdict: cold_start_only | investigate_real_degradation | mixed
```

**Paste order:** Ground Truth → Gateway Index → False-offline eliminator → observe/auto

---

## Roadmap lock (Observation → Stabilization → Phase 1)

| # | Track | Gate |
|---|-------|------|
| 1 | Observation | Ground truth · drift · semantic gateway · false-offline filter |
| 2 | Stabilization | Boot log warming_up · (future) warm-start cache |
| 3 | Phase 1 | WAL timeline · replay · read-only surfaces |

---

## 16. Two-laptop lab (Lab L0–L4)

**SSOT:** [`RHIZOH_DISTRIBUTED_OBSERVE_LAB_V0.md`](RHIZOH_DISTRIBUTED_OBSERVE_LAB_V0.md)

| Lab phase | A | B | Single variable |
|-----------|---|---|-----------------|
| **L0** (now) | raw · no observe | raw · no observe | none — baseline hour |
| **L0.5** | +observe panel | untouched | observer effect |
| **L1** | baseline + false-offline verify | same | stabilization tooling |
| **L1.5** | control network | network perturbation | environment |
| **L2** | identity A | identity B | cross-account state |

**Not** formal repo Phase 0.5 (Safe Reality Layer). **Do not** break the L0 hour — it is the reference for all later diffs.

---

## Related

- [`RHIZOH_PRODUCT_BINDING_LAYER_V0.md`](RHIZOH_PRODUCT_BINDING_LAYER_V0.md) — epistemic boundary · Phases 0–5
- [`RHIZOH_GATEWAY_HEALTH_INDEX_V0.md`](RHIZOH_GATEWAY_HEALTH_INDEX_V0.md) — what `app.gateway.offline` means · Health Index v1
