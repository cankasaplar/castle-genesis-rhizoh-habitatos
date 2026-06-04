# Rhizoh Snapshot Frame v0.1

**Status:** **RECORD** · **SPECFLOW:** ops SSOT  
**Captured:** 2026-06-03 · post–First Living World · pre–Observable Reality Layer v0.1  
**Prod pin:** [`3400b3b`](https://github.com/cankasaplar/castle-genesis-rhizoh-habitatos/commit/3400b3b) · bundle `index-C_Zwx7x_.js`  
**Parent:** [`RHIZOH_PROD_FLOW_V0.2.md`](RHIZOH_PROD_FLOW_V0.2.md) · [`RHIZOH_OBSERVABLE_REALITY_LAYER_V0.1.md`](RHIZOH_OBSERVABLE_REALITY_LAYER_V0.1.md)

> **Summary:** Motor alive · visibility partial · binding absent · memory exists but no UI.

Use this frame to diff before/after Phase 1 implementation.

---

## Snapshot summary (one screen)

| Dimension | State @ v0.1 snapshot |
|-----------|------------------------|
| 🧠 Motor | **Alive** — SCR loop · WAL append · pet inhabited · coherence stable |
| 👁 Visibility | **Partial** — 58 `__rhizoh` keys · no WAL timeline UI · no unified panel |
| 🔗 Binding | **Absent** — PRODUCT→WORLD bridge not implemented (Phase 2) |
| 🧾 Memory | **Runtime yes · UI no** — `worldActionLog` ring · drawer attrs only |

---

## 1. Runtime state snapshot

**Capture command (browser console):**

```javascript
JSON.parse(JSON.stringify({
  at: new Date().toISOString(),
  presenceState: window.__rhizoh?.presenceState,
  presenceFrame: window.__rhizoh?.presenceFrame,
  continuityFirstPaint: window.__rhizoh?.continuityFirstPaint,
  liveMonitor: window.__rhizoh?.liveMonitor,
  organismRhythm: window.__rhizoh?.organismRhythm,
  worldIdentity: window.__rhizoh?.worldIdentity,
  worldIdentityConsistency: window.__rhizoh?.worldIdentityConsistency,
  worldWalPersistence: window.__rhizoh?.worldWalPersistence,
  worldActionLogHead: window.__rhizoh?.worldActionLog?.entries?.slice?.(-3),
  keyCount: Object.keys(window.__rhizoh || {}).length
}))
```

### Verified prod values (2026-06-03 smoke)

| Signal | Value |
|--------|--------|
| `presenceState.rhizoh_is_present` | `true` |
| `continuityFirstPaint.ok` | `true` |
| `liveMonitor.schema` | `castle.rhizoh.live_monitor.v0` |
| `deployStatus` | alias of `liveMonitor` |
| `reslPresentation.continuityLine` | `Rhizoh burada · hazır` |
| `presenceFrame.coherenceId` | `0:0:none:breathe` |
| `Object.keys(__rhizoh).length` | **58** (was 13 pre-bridge) |
| Boot `world_observability` | +14ms |
| Gateway connected | ~945ms |

### SCR / WAL / rhythm (conceptual)

| Subsystem | Runtime | Browser observability |
|-----------|---------|---------------------|
| SCR tick / sampler | Active after T0 mount | `presenceFrame` · `liveMonitor.scr` |
| WAL append | Via studio execution loop (~4s ECC path) | `worldActionLog` — **no list UI** |
| WAL IDB persist | **Not on default boot** | `initRhizohWorldWalPersistenceV0` runbook-only |
| ICL harness | CLI/deploy gates | `worldIdentityConsistency` often absent early |
| Organism rhythm | After studio loop | `organismRhythm` · `liveMonitor.rhythm` |

---

## 2. UI surface snapshot

| Surface | Role (truth label) | User-visible behavior @ snapshot |
|---------|-------------------|----------------------------------|
| **Cap Wheel** | Intent generator | Chat prefill + `LISTENING` · layer focus · **no routing** |
| **Studio drawer** | Simulation | KernelConsole · DirectorDeck · topology viz — **not SCR controller** |
| **Product drawer** | Metadata viewer | Episode/WAL attrs on DOM · **no timeline · no replay** |
| **Shell bar** | Surface router | world/hall/studio/broadcast — spatial side-effects |
| **Voice dock** | Input channel | v3 adapter registered · **no WAL append per turn** |
| **Ingress** | Product gate | legal/cohort when env on · observability bridge at boot |

### Phase 1 target delta (not yet shipped)

| Surface | Snapshot (now) | Phase 1 (spec) |
|---------|----------------|----------------|
| WAL Drawer | metadata attrs | Episode timeline + inspector + replay preview |
| Live Monitor | console-only keys | Unified read-only panel |
| Cap Wheel | prefill only | intent ring + history feed |

---

## 3. Binding gap snapshot

### Current flow (actual)

```
Cap Wheel click → setCmd + LISTENING (+ layer focus)
Studio panel    → studioStore sim (parallel stack)
Drawer          → read organism attrs
Voice           → STT → LLM / precheck (no WAL tag)
SCR loop        → background ECC ~4s (no product trigger)
```

### Target flow (Phase 2+ — not snapshot)

```
Cap Wheel → ProductBinding → SCR suggestion → WAL append
Voice     → transcript → intent → binding → WAL
Drawer    → query + replay (Phase 1 read-only first)
```

### Gap table

| Link | Snapshot | Phase |
|------|----------|-------|
| PRODUCT → BINDING | **Missing** | Phase 1 intent log only |
| BINDING → WORLD | **Missing** | Phase 2 |
| WORLD → UI feedback | Partial (`__rhizoh` keys) | Phase 1 panel |
| WAL → UI | **Missing** | Phase 1 drawer |
| deployStatus schema | Browser alias vs Node report split | Phase 1 normalize |

---

## 4. Re-capture protocol

**SSOT:** [`RHIZOH_OBSERVATION_PROTOCOL_V0.2.md`](RHIZOH_OBSERVATION_PROTOCOL_V0.2.md) — every 2–3h · Full Snapshot v2 · transition gate (§6).

**When:** end of observation · after each Phase 1 PR · before Phase 2 gate · daily during Phase 0.

1. Hard refresh rhizoh.com (Ctrl+Shift+R)
2. Run runtime snapshot JSON (§1)
3. Screenshot: world surface + Cap Wheel + drawer (if open)
4. Note bundle hash from Network tab (`index-*.js`)
5. Append row to commit message or `RHIZOH_PROD_FLOW_V0.2.md` First Living World section

---

## 5. Interpretation lock

This snapshot is **pre–Observable Reality Layer v0.1**. It proves:

- The **motor runs** without product binding.
- **Visibility lag** is the bottleneck, not capability.
- Phase 1 adds **no power** — only **memory · state · intent** surfaces.

**Rhizoh @ snapshot:** observable in console, not yet observable in product UI.

---

## 6. Observation log

### Log #1 — First Living World (2026-06-03)

Baseline @ `3400b3b` · gateway ~945ms · scr_tick after engine · 58 keys. See [`RHIZOH_PROD_FLOW_V0.2.md`](RHIZOH_PROD_FLOW_V0.2.md) First Living World Record.

### Log #2 — Gateway flap + rhythm watch (2026-06-04)

**Bundle:** `index-C_Zwx7x_.js` · **route:** app · **session:** returning user

**Boot timeline:**

| Δms | Event |
|-----|--------|
| +16 | world_observability |
| +448 | app.engine.ready |
| +6693 | **app.gateway.offline** |
| +14744 | **app.gateway.offline** (repeat) |
| +17807 | app.gateway.connected |

**Two console captures (~62s apart):**

| Signal | T1 `00:29:38Z` | T2 `00:30:40Z` | Δ | Verdict |
|--------|----------------|----------------|---|---------|
| `scr_tick` | 18 | 52 | +34 | SCR alive · ticking |
| `rhythm_ok` | false | false | — | **watch** |
| `jitter_ms` | 163 | 174 | +11 | elevated · not runaway |
| `identity_ok` | true | true | — | stable |
| `castle_split` | false | false | — | ok |
| `fork_risk` | false | false | — | ok |

**Interpretation:**

- **Motor:** alive — SCR progressed 18→52 in ~62s; identity/castle stable.
- **Gateway:** transient offline 6.7s–17.8s — Render cold start / network; **not** World OS failure. Correlates with rhythm jitter window.
- **Rhythm `ok: false`:** observation watch item — likely gateway reconnect + organism loop threshold; **not** identity drift or castle split.
- **Phase 1 UI:** not shipped — runtime keys present only.

**Phase readiness (corrected — not UI):**

| Check | Runtime | Phase 1 UI |
|-------|---------|------------|
| `worldActionLog` exists | yes | **no** timeline |
| `liveMonitor` exists | yes | **no** panel |
| Cap Wheel intent log | **no** `productBinding` | **no** |
| WAL replay UI | N/A (fn not on window) | **no** |

**Observation action:** continue Phase 0 · log gateway offline frequency · re-capture after 24h idle session.

### Canonical observation script (console)

Use this instead of voiceAdapter heuristics for `phaseReadiness`:

```javascript
(async () => {
  const r = window.__rhizoh || {};
  const get = (p) => p.split(".").reduce((o, k) => (o ? o[k] : undefined), r);
  const snapshot = Object.freeze({
    time: new Date().toISOString(),
    health: Object.freeze({
      rhythm_ok: get("organismRhythm.ok"),
      jitter_ms: get("organismRhythm.max_jitter_ms"),
      scr_tick: get("liveMonitor.scr.tick_seq"),
      identity_ok: get("liveMonitor.identity.structural") === false,
      castle_split: get("liveMonitor.castle.castle_surface_split"),
      fork_risk: get("liveMonitor.castle.fork_risk")
    }),
    phase0: Object.freeze({ observation: true }),
    phase1: Object.freeze({
      wal_runtime: Boolean(get("worldActionLog")),
      wal_ui: false,
      live_monitor_runtime: Boolean(get("liveMonitor")),
      live_monitor_ui: false,
      cap_intent_log: Boolean(get("productBinding")),
      gateway_last: get("liveMonitor") ? "see boot log" : null
    }),
    wal_entry_count: get("worldActionLog.entries")?.length ?? null
  });
  console.table(snapshot.health);
  console.log("phase1 (corrected):", snapshot.phase1);
  window.__rhizoh_snapshot = snapshot;
  return snapshot;
})();
```

---


- [`RHIZOH_OBSERVABLE_REALITY_LAYER_V0.1.md`](RHIZOH_OBSERVABLE_REALITY_LAYER_V0.1.md) — Phase 1 spec
- [`RHIZOH_PRODUCT_BINDING_LAYER_V0.md`](RHIZOH_PRODUCT_BINDING_LAYER_V0.md) — epistemic boundary · Phases 0–5
