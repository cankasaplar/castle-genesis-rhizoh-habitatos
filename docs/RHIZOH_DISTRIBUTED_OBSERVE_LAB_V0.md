# Rhizoh Distributed Runtime Observability Lab v0

**Status:** ACTIVE · **SPECFLOW:** ops SSOT  
**Parent:** [`RHIZOH_OBSERVATION_PROTOCOL_V0.2.md`](RHIZOH_OBSERVATION_PROTOCOL_V0.2.md) · [`RHIZOH_GATEWAY_HEALTH_INDEX_V0.md`](RHIZOH_GATEWAY_HEALTH_INDEX_V0.md)

> **Naming lock:** **Lab L0–L4** below = distributed observe experiment track (L0–L0.5 used two laptops — **archived**).  
> **L1+ ops:** [**SRPOA v1**](RHIZOH_SRPOA_V1.md) (Single Runtime + Passive Observer Architecture) — 1 producer · 1 observer · 0 dual truth.  
> **Not** repo formal **Phase 0.5** (Safe Reality Layer) in [`RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md`](RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md).

---

## Model — SRPOA-v1 (locked 2026-06-04, L1+)

See [`RHIZOH_SRPOA_V1.md`](RHIZOH_SRPOA_V1.md).

| Layer | Role |
|-------|------|
| **Runtime** | Tek truth stream — `capture({ origin: "runtime" })` only |
| **Observer** | `context` inference (`mirror` \| `archive`) — READ only |

**No “A vs B”** on new L1+ ops. Historical two-laptop rows = archive only.

**Deprecated:** `meta.laptop` · `context` on runtime capture · dual-runtime parallel truth.

---

## Model — L0/L0.5 archive (two observation points · time separation)

Historical only — do not start new dual-runtime L1 series.

| Node | Role (archived experiment) |
|------|----------------------------|
| **Laptop A** | Reference / control |
| **Laptop B** | Perturbation / compare (L0.5 closed) |

**Invariant:** Each lab phase changes **exactly one** variable.

---

## Phase sequence (founder lock — 2026-06-04)

### Lab L0 — Raw baseline (NOW · ~1h · DO NOT BREAK)

| Node | Observe tooling | Action |
|------|-----------------|--------|
| **A** | None — raw runtime only | Open rhizoh.com · tab stays open · **no** console paste · **no** panel |
| **B** | None — raw runtime only | Same · independent session |

**Output:** Side-by-side comparison only (timestamps, gateway boot lines, SCR feel, subjective stability).  
**Forbidden:** Ground Truth paste · `rhizohObserve` · `rhizohAuto` · `RhizohPanel` · deploy · code change · network switch on either machine.

This hour is the **reference anchor** for all later lab phases.

### Lab L0 — CLOSED (2026-06-04)

**Question shift:** not “does it work?” → **“which bound regime?”**

| Metric | A | B | Read |
|--------|---|---|------|
| CIS | 0.9496 | 0.9496 | Semantic layer stable |
| Identity | locked | locked | World integrity held |
| Queue | 63–64 | 64 | Saturation band |
| Rhythm | 57ms ok | 82ms breach | Temporal layer diverges |

```
STATE: HEALTHY_OVERLOAD_EQUILIBRIUM
SEMANTIC LAYER: stable (CIS≈0.95, identity locked, WAL coherent)
QUEUE LAYER: bounded saturation (queue 63–64, seq monotonic)
TEMPORAL LAYER: runtime scheduling variance (A in budget, B temporal_budget_violation)
GATEWAY: startup convergence profile differs (A probe delay · B fast path) — not reconnect storm
FAILURE CLASS: none observed
PRESSURE CLASS: steady congestion plateau
```

**Evidence:** seq 18446→19265→20039 with `queued≈63–64` → throughput limit, not deadlock (`producer≈consumer`).

### Truth vs projection (final lock — 2026-06-04)

**Single executable truth layer:** **organism scheduler** state machine  
→ runtime surface: `window.__rhizoh.organismRhythm`  
→ code: [`rhizohOrganismStabilizationV0.js`](../apps/client/src/rhizoh/runtime/rhizohOrganismStabilizationV0.js) · `computeRhythmCoherenceV0`

Everything else in the lab is a **projection** (read-only, non-authoritative for system state):

| Projection | What it reflects |
|------------|------------------|
| Lab / observer scripts | Observation export only |
| Queue · `lastAcceptedSeq` | Throughput / backpressure projection |
| `world_id_*` | WAL head **alias** (presentation) |
| Raw jitter in paste logs | Diagnostic unless sourced from `organismRhythm` |

**Temporal validity — single SSOT:**

```text
organismRhythm.ok  ←  max_jitter_ms <= ORGANISM_JITTER_TOLERANCE_MS_V0 (64)
```

| Layer | Temporal decision |
|-------|-------------------|
| Organism scheduler / stabilization | **Truth generator** — YES |
| Lab / observer | Measurement only — NO |
| `perceptualContinuitySmooth` | UX projection — NO |

`temporal_budget_violation` = **organism-level state label** (rhythm not ok under load).  
**Not** `failure_class` · **not** a lab diagnostic signal · **not** semantic divergence.

**Continuity read order (projections ranked by authority):**

1. `identity_version` — global continuity truth  
2. CIS — semantic coherence  
3. `organismRhythm.ok` — temporal validity  
4. `lastAcceptedSeq` monotonic — throughput integrity  
5. `world_id_*` — presentation only (derived WAL head alias; **not** identity · **not** epoch · **not** continuity)

`world_identity_id = world_id_${chain_head_hash…}` — chain_head mutation **expected**; alias change ≠ new world.

**Default assumption:** same runtime lineage until `identity_version` / ICL discontinuity — not when alias string alone changes.

### L0 vs L0.5 measurement class (do not mix)

| Track | Window | Rate claim |
|-------|--------|------------|
| **L0** | Long observation / log series | Throughput + regime (capacity-scale) |
| **L0.5** | Micro-window Δobserver (e.g. ~20s) | **No absolute rate SSOT** — local seq slope only |

`L0.5 drain_rate_per_sec` ≠ L0 capacity metric.

### Measurement continuity (read before rates)

| Trap | Truth |
|------|--------|
| `world_id` different | Alias update — **not** epoch proof if `identity_version` monotonic + CIS stable |
| L0 vs L0.5 | Same **lineage family** unless version/ICL discontinuity — compare regime, not one continuous time series |
| A_t0 → A_t2 same tab | Micro-window seq slope OK; `world_id` string may change each WAL fold |
| `ingest_rate_per_sec_proxy` | **tickSeq / heartbeat** — not queue producer; ignore for plateau |
| Trust for plateau | L0: seq trend + queue 63–64 + BP; L0.5: same + **identity_version** monotonic |

**Continuity check before B_t2:**

```javascript
({
  world_id: window.__rhizoh?.worldIdentity?.world_identity_id,
  identity_version: window.__rhizoh?.worldIdentity?.identity_version,
  chain_head: window.__rhizoh?.worldIdentity?.chain_head_hash,
  episode: window.__rhizoh?.worldIdentity?.last_episode_seq
})
```

### Lab L0.5 — CLOSED (2026-06-04)

**Plateau read rule (locked):** `producer_approx_consumer` is **not** plateau proof — ingest proxy (tick plane) and drain (seq plane) are different manifolds. Plateau = **seq monotonic** + **queue saturation stable** + **backpressure true**.

#### Laptop A — official long window (`A_t0_120b` → `A_t2_120b`)

| Field | Value | Read |
|-------|-------|------|
| `delta_ms` | **232.8 s** | `wait_ok` ✔ (≥120s) |
| `lastAcceptedSeq` | 26004 → 26897 | **+893** monotonic |
| `identity_version` | 1026 → monotonic ↑ | continuity preserved |
| `cis01` | 0.9496 | semantic stable |
| `queued` + BP | 62–64 · true | saturation plateau |
| `organismRhythm.ok` | false | jitter ~109–116 · temporal breach only |
| `gateway` | warm path (~17.8s boot in L0) | probe convergence |

Also archived: short window `A_t0`→`A_t2` (20.5s · +67); partial `A_t0_120`→`A_t2_120` (57.9s · `wait_ok: false`).

#### Laptop B — official window (`B_t0` → `B_t2`)

| Field | Value | Read |
|-------|-------|------|
| `delta_ms` | **~190 s** (389 seq ÷ 2.044/s) | ≥120s ✔ |
| `lastAcceptedSeq` | 27513 → 27902 | **+389** monotonic |
| `identity_version` | 600 → **713** (session) | monotonic · no fork |
| `cis01` | 0.9496 | semantic stable |
| `queued` + BP | 64 · true | saturation plateau |
| `organismRhythm.ok` | false | jitter **82–83 ms** · temporal breach only |
| `gateway` | **+520 ms** connected | fast ready path (not warm-delay profile) |
| `world_id` | alias churn | non-canonical |

L0 anchor: `B_SYNC` seq 19781 · CIS 0.9496 · jitter 82 at boot.

**STATE (both nodes):** `HEALTHY_OVERLOAD_EQUILIBRIUM` · **FAILURE_CLASS:** `none_observed`

#### A + B combined read (locked)

One semantic world line · two **temporal pacing profiles** (not two systems):

| Profile | Gateway | Jitter envelope | Rhythm |
|---------|---------|-----------------|--------|
| **A** | warm convergence | higher (89–116 under observe load) | breach |
| **B** | fast ready path | tighter (82–83) | breach |

Shared: CIS 0.9496 · identity monotonic · queue saturated plateau · seq monotonic.

**Scripts:** [`scripts/rhizohLabL05InlineV0.js`](scripts/rhizohLabL05InlineV0.js) (preferred) · [`scripts/rhizohLabL05OneLineV0.txt`](scripts/rhizohLabL05OneLineV0.txt)

```javascript
rhizohLabL05.capture({ label: "B_t0", laptop: "B" });
// ≥120s — tab active
rhizohLabL05.capture({ label: "B_t2", laptop: "B" });
rhizohLabL05.report();
```

### SSOT diagnosis vocabulary (Lab L0 FINAL — locked)

**State class:** `HEALTHY_OVERLOAD_EQUILIBRIUM` (steady congested equilibrium)

**One line:**

> System is in **healthy overload**: ingress plateau (63–64) with backpressure equilibrium, no drop, monotonic seq; **CIS + identity** stable; **temporal layer** shows device/warmup scheduling variance (A within tolerance, B = `temporal_budget_violation`, not semantic failure); gateway shows **probe convergence delay**, not reconnect storm.

#### Three-plane split

| Plane | Observation | SSOT meaning |
|-------|-------------|--------------|
| **A) Queue / ingress** | 64→63→63 · BP true · seq ↑ | **Plateau state** — consumption ≈ production at bound; not error |
| **B) Temporal** | A: 3→57ms `ok` · B: 82ms breach | **Scheduling pressure metric** — not engine health; CIS unchanged |
| **C) Gateway** | offline→connected (A boot) · B +520ms | **Probe convergence delay** — HTTP probe + warm path + debounce; not flap |

#### OK metrics are not one metric

| Layer | Field | Meaning |
|-------|-------|---------|
| CIS / identity | `cis01`, `product_gate_ok`, WAL | **Semantic correctness** |
| Rhythm | `rhythm_ok` | **Temporal bound compliance** (`max_jitter ≤ 64ms`) |
| Gateway | `phase` / semantic | **Connectivity probe state** |

**B is not “fail” in the core sense** → classify as **`temporal_budget_violation`** (real-time threshold exceeded; system not broken).

#### Core vs risk surface

| | |
|--|--|
| **CORE (stable)** | Ingest saturated but stable · queue bounded BP · CIS ~0.9496 · identity locked · WAL consistent |
| **RISK SURFACE** | Jitter variance · probe startup delay · sporadic `inflight: 1` |

#### Architectural read

**Event-driven system under intentional saturation design** — not uncontrolled lag. `MAX_QUEUE = 64` = **stabilization band**, not failure ceiling.

**A vs B:** Same prod · two **runtime speed profiles** — A = warm steady runtime · B = cold/fast-path scheduling distortion (regime offset, not device good/bad).

| Layer | SSOT term | Wrong term |
|-------|-----------|------------|
| Gateway | Probe convergence delay · probe oscillator | Flap · WS reconnect · crash |
| Rhythm | Temporal budget violation (B) · threshold crossing | Global degradation · semantic fail |
| Ingress | Flow control · steady congestion plateau | Overflow bug · queue error |
| A vs B | Runtime speed profile / boot phase offset | Broken laptop vs healthy laptop |

**Healthy overload evidence:** `lastAcceptedSeq` monotonic · `queued` 63–64 · `backpressure: true` · no silent drop.

### Final reconciled state (LOCK)

```
STATE: HEALTHY_OVERLOAD_EQUILIBRIUM
failure_class: none
system_state: bounded overload equilibrium

QUEUE:
  saturated plateau (63–64) · backpressure stable
  seq monotonic · no loss · no fork

IDENTITY:
  identity_version monotonic · CIS stable (~0.9496)
  world_id = derived alias only (non-canonical)

TEMPORAL:
  organismRhythm.ok = authoritative (TRUE/FALSE)
  A within tolerance · B = temporal_budget_violation (scheduler variance)
  not failure_class — organism state transition only

GATEWAY:
  warm probe convergence · no instability signal
```

**SSOT closure (one sentence):**

> The system runs in **HEALTHY OVERLOAD EQUILIBRIUM** bound to a single truth layer (organism scheduler); all other lab metrics are projections; A/B difference is **temporal pacing variance only**, not semantic divergence.

### A vs B — final axis table

| Axis | A | B | Read |
|------|---|---|------|
| Identity | same regime | same regime | Continuity preserved (`identity_version`) |
| CIS | stable | stable | Semantic stable |
| Queue | plateau | plateau | Bounded equilibrium |
| Rhythm (`organismRhythm.ok`) | breach (L0.5) | breach | Same regime · different jitter envelope |
| System state | healthy overload | healthy overload | **Same regime** |

**Difference:** pacing profile · boot/warm path · **not** system-state divergence.

### L1 — stabilization problem (not a measurement phase)

**L0.5** answered: *which bound regime?* (`HEALTHY_OVERLOAD_EQUILIBRIUM`).

**L1** asks: *can the single truth layer stabilize?*

| | L0.5 | L1 |
|--|------|-----|
| Nature | Measurement / projection | **Stabilization problem** |
| DV | queue · seq · CIS (observe) | **`organismRhythm.ok` under load** |
| Goal | Classify regime | Phase-align jitter **production** (not threshold drift alone) |

**Entry gates (minimal — already true post L0.5):**

- queue plateau ✔ · identity monotonic ✔ · CIS stable ✔  
- **Only open variable:** can `organismRhythm.ok` approach a **deterministic stable region** while saturation holds?

**Not L1 primary:** queue alone · `world_id` · drain rate · ingest proxy · gateway boot · `producer_approx_consumer`

**Not L1 truth surface:** observer paste · `perceptualContinuitySmooth`

#### Controlled hybrid L1 (recommended install — ops only)

**Not prod runtime.** DevTools paste discipline: avoid “floating identity” (stub / rebuilt / `delete rhizohLabL1` / inline re-inject).

| Role | API | Mutates prod? |
|------|-----|----------------|
| **READ** | `rhizohLabL1.observe()` · `read()` · `preflight()` | No |
| **WRITE** | `rhizohLabL1.capture()` → `__rhizoh_lab_l1_log` append | No (lab log only) |

**Install order:** [`rhizohLabL1ProbeV0.js`](scripts/rhizohLabL1ProbeV0.js) → [`rhizohLabL1HybridControllerV0.js`](scripts/rhizohLabL1HybridControllerV0.js) → `window.__rhizoh_lab` SSOT · `window.rhizohLabL1` = frozen alias.

**Policy:** `allowWrite: true` (capture) · `allowReset: false` · `allowRebind: controller-only` · no stub loaders.

**Layer stack (plan):** L1 hybrid core → L2 aggregation → L3 interpretation → UI shell; upper layers **fed by** L1, not rebinding `rhizohLabL1`.

#### Path 1 — Observe-only L1 probe

**File:** [`scripts/rhizohLabL1ProbeV0.js`](scripts/rhizohLabL1ProbeV0.js) · runbook: [`scripts/LAB_L1_RUNBOOK_TR.md`](scripts/LAB_L1_RUNBOOK_TR.md)

```javascript
// paste rhizohLabL1ProbeV0.js
rhizohLabL1.preflight();
rhizohLabL1.capture({ label: "L1_t0", origin: "runtime" });
// ≥60–120s · saturated tab
rhizohLabL1.capture({ label: "L1_t1", origin: "runtime" });
rhizohLabL1.capture({ label: "L1_t2", origin: "runtime" });
rhizohLabL1.report();   // ok_rate · dominant_worst_phase · jitter delta
rhizohLabL1.read();     // layer jitter decomposition + heartbeat correlation
```

Reads (no mutation):

- `organismStabilization.rhythm.layers` — per-phase `jitter_ms` vs grid snap  
- `organismHeartbeat` — `aligned_at_ms` · `grid_ms` · `phase01`  
- `organismRhythm.ok` — SSOT temporal validity  

Report signals: `dominant_worst_phase` · `max_jitter_delta_ms` · `l1_stabilization_signal`

#### Path 2 — Stabilization hypothesis map (RESEARCH-ONLY · after Path 1 data)

No frozen-core edit until L1 probe shows **which phase** dominates breach.

| Lever | Surface | Hypothesis |
|-------|---------|------------|
| Phase marks | `markOrganismLayerPhaseV0(phase, atMs)` in studio loop | Align commit times to heartbeat snap, not raw `Date.now()` drift |
| Coherence | `computeRhythmCoherenceV0` | Worst-layer drives `max_jitter_ms`; stabilize offender first |
| Grid | `ORGANISM_HEARTBEAT_GRID_MS_V0` · `snapToOrganismHeartbeatV0` | Phase-aligned production before tolerance compression |
| Tolerance | `ORGANISM_JITTER_TOLERANCE_MS_V0` (64) | **Do not** widen as L1 fix — compress jitter **generation**, not the gate |

**L1 pass (research sketch):** sustained saturation + CIS/identity hold + `ok_rate` ↑ or `max_jitter_ms` compressing toward ≤64 without threshold change.

### Lab L1 — SRPOA-v1 status (2026-06-04)

| Track | Status | Notes |
|-------|--------|-------|
| **Runtime L1 (producer)** | **CLOSED** (reference) | Official probe · `ok_rate` 1 · `max_jitter_ms` ~20 · `context: local-debug` |
| **Dual-runtime B re-probe** | **CANCELLED** | Superseded by single-runtime model — historical inline 108 = archived compare only |
| **Observer shell** | Optional | B machine = `rhizohLabObserverShellV0.js` + `importArchive()` — no capture |

**Mislabeled session (archived lesson):** `L1_B_*` labels on producer tab without second runtime — invalid dual story; see § mislabeled below.

**Diff tool:** [`scripts/rhizohLabL1DiffV0.js`](scripts/rhizohLabL1DiffV0.js) — `runtime` log vs `archive` pin (no laptop axis).

```javascript
// optional: pin archive before diff (no laptop field)
window.__rhizoh_lab_l1_archive_pin = {
  origin: "runtime", context: "archive",
  probe: "rhizohLabL1ProbeV0.js",
  ok_rate: 1, max_jitter_ms: 20, queue: 63, backpressure: true,
  timing: "snapshot (back-to-back)"
};
// paste rhizohLabL1DiffV0.js → runtime log vs archive pin
```

#### A vs B — locked read (FINAL 2026-06-04)

| Axis | **A** | **B** |
|------|-------|-------|
| Probe | `rhizohLabL1ProbeV0.js` (**CLOSED**) | inline `installL1Probe` (timed 108) · **official probe OPEN** |
| Queue @ L1 | 63 + BP | 63 + BP (inline 3 captures) |
| **Regime** | HEALTHY_OVERLOAD_EQUILIBRIUM | same |
| `failure_class` | none | none |
| Capture timing | snapshot (back-to-back) | **~116 s / ~119 s** |
| `ok_rate` | **1.000** | **0.000** (3/3 false) |
| `max_jitter_ms` | **20** | **108** (flat plateau t0–t2) |
| `worst_phase` | from official layers | **null** (inline — re-probe before Path 2 code) |
| **Pattern** | low-variance overload | **steady temporal desync** (non-failing) |

**B series (normalized):**

```json
[
  { "label": "L1_B_t0", "ok": false, "jitter_ms": 108, "worst_phase": null, "queued": 63, "bp": true },
  { "label": "L1_B_t1", "ok": false, "jitter_ms": 108, "worst_phase": null, "queued": 63, "bp": true },
  { "label": "L1_B_t2", "ok": false, "jitter_ms": 108, "worst_phase": null, "queued": 63, "bp": true }
]
```

**Closure sentence (SSOT):**

> Tek doygun regime; A phase-aligned bounded overload içinde stabil (jitter 20); B aynı queue bandında **persistent temporal budget violation** (jitter 108 plateau) — failure değil, **stabilize olmamış latency plateau**.

**English lock:**

> System is stable under identical queue pressure, but exhibits persistent temporal desynchronization in the B execution window (non-failure bounded drift state).

**Divergence (only):** `organismRhythm.ok` + `max_jitter_ms` — not queue, not regime, not CIS.

**Path 2 — SSOT LOCKED (2026-06-04)**

**Selected model:** **Scheduler drift — fixed offset mode** (deterministic temporal displacement)

| B observation | Classification |
|---------------|----------------|
| 108 → 108 → 108 | **Not** unstable · **not** propagation growth · **not** oscillation |
| | **Locked shifted baseline** — system holds a **deterministic offset** above 64 ms tolerance |
| `ok_rate` 0, queue 63+BP | Non-failing **persistent temporal displacement** under saturation |

**Rejected branches (from flat plateau):**

- Propagation instability (would show rising jitter trend)
- Growth / runaway (would show ↑ jitter across timed captures)
- Oscillation (would show ok/jitter alternation)

**Path 2 intervention target (RESEARCH-ONLY, no tolerance widen):**

- Re-anchor **whole heartbeat grid** (`aligned_at_ms` / `deriveOrganismHeartbeatV0` + `snapToOrganismHeartbeatV0` for **all** `markOrganismLayerPhaseV0` commits)
- **Not** raise `ORGANISM_JITTER_TOLERANCE_MS_V0` (64 ms stays SSOT gate)
- **Not** single-phase fix on `scr_tick` alone when layers are tied (uniform layer table on **verified** machine only)

**Mislabeled capture on A — INVALID for B SSOT (2026-06-04):**

Console runs used labels `L1_B_phase_check` · `L1_B_phase_check_t2` · `L1_B_t0_long` · `L1_B_t2_long` with `laptop: "B"` but were executed on **laptop A** while B was offline. **Do not** merge into B series or Path 2 B closure.

| Mislabel (ran on **A**) | All 9 layers `jitter_ms` | `organismRhythm.ok` | `max_jitter` |
|-------------------------|--------------------------|---------------------|--------------|
| `L1_B_phase_check` | **59** (uniform) | true | 59 |
| `L1_B_phase_check_t2` | **24** (uniform) | true | 24 |
| `L1_B_t0_long` → `L1_B_t2_long` (clean log, 2 captures) | uniform (per layer table) | true | report delta per session |

**Research note (method — applies once re-verified on B):** If all phases share identical `jitter_ms`, `dominant_worst_phase: scr_tick` is **tie-break only** → **global fixed-offset**, not per-phase divergence.

**A supplemental (mislabeled, same A session):** `ok_rate` 1 · `compressing_toward_tolerance` (e.g. 59→24, long pair 59→36) — **not** B closure; does not replace A official L1 (~20 ms).

**No second-runtime L1:** Compare historical B inline 108 via [`RHIZOH_LAB_SINGLE_RUNTIME_OBSERVER_V0.md`](RHIZOH_LAB_SINGLE_RUNTIME_OBSERVER_V0.md) archive import — not a new capture on B tab unless B becomes the **sole** producer (then labels `L1_t*` only, no `L1_B_*`).

**Path 2 closure sentence (TR):**

> Tek doygun regime içinde A hizalı execution, B ise sabit 108 ms offset ile çalışan deterministik zamanlama kayması üretir — failure değil, kalıcı temporal displacement state.

**Path 2 closure sentence (EN):**

> Within one saturated regime, A remains phase-aligned; B operates with a **fixed ~108 ms temporal offset** — not failure, a **persistent temporal displacement state**.

Stub/rebuilt L1 on B — **invalid**, do not archive.

### Lab L1.5 — Environment perturbation (single variable: B network)

| Node | Change |
|------|--------|
| **A** | Control — same network as L0 |
| **B** | Controlled network change only (VPN off/on · DNS · Wi‑Fi ↔ tether · one change per run) |

**Question answered:** Gateway flap = environment vs core?

### Lab L2 — Identity split (Phase 1 product gate + lab)

| Setup | |
|-------|---|
| Identity A · Identity B | Same runtime model · different session / state / network |
| **A** | Account A · control network |
| **B** | Account B · optional perturbation |

**Question answered:** State replication across accounts vs independent instances?

Requires [`RHIZOH_OBSERVABLE_REALITY_LAYER_V0.1.md`](RHIZOH_OBSERVABLE_REALITY_LAYER_V0.1.md) observation-protocol §7 gate — lab L2 does not bypass it.

---

## L0 results intake (use when ~1h ends)

### Per laptop — minimal capture

1. **Session meta:** start ISO · end ISO · browser · tab focused % (estimate)
2. **Boot narrative:** copy first ~30s console lines (`app.gateway.*` · engine ready)
3. **Optional one-liner** (B only if you must stay zero-inject on A): after window closes, single read:

```javascript
({
  scr: window.__rhizoh?.liveMonitor?.scr?.tick_seq,
  rhythm_ok: window.__rhizoh?.organismRhythm?.ok,
  gateway: window.__CASTLE_GATEWAY_SESSION_KEEPER__?.lastPhase
    ?? window.__CASTLE_BUILD_RUNTIME_SNAPSHOT__?.()?.gatewayState?.phase,
  at: new Date().toISOString()
})
```

> Prefer **zero** console on A for full L0 purity; end-of-window one-liner on both is acceptable **only after** the hour mark.

### Compare matrix (paste into observation log #3)

| Field | Laptop A | Laptop B | Notes |
|-------|----------|----------|-------|
| Gateway convergence time | | | warming_up → connected? |
| Offline log count (raw) | | | |
| SCR monotonic | Y/N | Y/N | |
| Rhythm ok sustained | | | |
| Subjective “alive” | | | |

### Archive paths

- Manual: observation log row in protocol §10
- Structured: `rhizohAuto.exportLog()` — **Lab L0.5+ only**, not during L0 hour on A

---

## Anti-bloat rule

If multiple tracks grow at once:

```
observation + stabilization + phase1 UI + cross-account + network
```

→ **stop** · reset to **Lab L0 reference** · resume at next single-variable phase only.

---

## Related tools (not in prod bundle)

| Tool | File |
|------|------|
| Manual observe | [`scripts/rhizohObserveConsoleV1.js`](scripts/rhizohObserveConsoleV1.js) |
| Auto series | [`scripts/rhizohAutoObserveConsoleV1.js`](scripts/rhizohAutoObserveConsoleV1.js) |
| Panel overlay | [`scripts/rhizoh-observe.html`](scripts/rhizoh-observe.html) → `RhizohPanel.mountOverlay()` |
| Gateway semantic | [`scripts/rhizohGatewayHealthIndexV1.js`](scripts/rhizohGatewayHealthIndexV1.js) |
| False-offline | [`scripts/rhizohFalseOfflineEliminatorV1.js`](scripts/rhizohFalseOfflineEliminatorV1.js) |
| Lab L0.5 metrics | [`scripts/rhizohLabL05MetricsV0.js`](scripts/rhizohLabL05MetricsV0.js) |

---

## One line

*Lab L0 = listen without touching; everything else is diff against that hour.*
