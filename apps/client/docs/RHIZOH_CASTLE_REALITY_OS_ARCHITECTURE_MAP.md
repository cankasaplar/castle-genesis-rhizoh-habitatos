# Rhizoh Castle Reality OS — Architecture Map (Extraction)

**Scope:** system-wide truth map as implemented or explicitly specified in this repo at extraction time.  
**Not included:** new features, refactors, marketing claims.  
**Legend:** *real* = executable production path exists; *stub* = placeholder or summarize-only; *hybrid* = real subset + stubs/gates; *spec-only* = SPECFLOW / snapshot / test without runtime wiring.

Primary code roots: `apps/client/src/rhizoh/`, `apps/client/src/studio/`, `apps/client/src/AppRhizoh528.jsx`.

---

## 1. Layered Architecture (Text + Structure)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COGNITIVE LAYER                                                            │
│  AppRhizoh528 + rhizoh/social/* — coherence, memory/persona rails, narrative │
│  (social runtime, arbiter, history book, epistemic rails, YouTube ingest)   │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ intent / distribution / hints (no direct sim write)
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STUDIO LAYER                                                               │
│  studio/* — PresenceStudioViewport (THREE), director intent, mesh ingest,    │
│  ghost pet / companion slices, kernel store (RSK)                          │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ getState / setStudioKernelState, causal append
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  EXECUTION COUPLING LAYER                                                   │
│  studio/lib/somaticExecutionCouplingLayerV0.ts                              │
│  Order: nav → flock → FSM → look-at → integratorPost                         │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ optional handlers (default no-op)
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  SOMATIC / SIMULATION LAYER                                                 │
│  studio/lib/realSimulation/* + realSimulationEngineCouplingV0.ts (opt-in)   │
│  Nav grid BFS, FSM tick, separation flock, yaw look-at, fixed-step integrator│
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ reads/writes presence.pets when enabled
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  WORLD AUTHORITY (WAL) — v0/v1 SPEC                                         │
│  rhizoh/spatial/worldAuthorityLayerV0.js                                    │
│  rhizoh/spatial/worldAuthorityLiveStreamEngineV1.js                          │
│  (surface stacks, graphs, paths; not a standalone runtime daemon)            │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ referenced design targets
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  REALITY OS (ROS) — v0/v1/v2 SPEC                                           │
│  realityOperatingSystemLayerV0.js                                           │
│  realityOperatingSystemGovernanceNetworkV1.js                               │
│  realityOperatingSystemConstitutionLayerV2.js                               │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ policy / governance contracts (no executable ROS kernel)
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  EPOCH SYSTEM — SPEC + DESIGN                                               │
│  multiLayerRealityConsensusEngineV0.js (ticks, inflation, decoupling)      │
│  epochClassificationEngineV0.js (pre-sealer classifier)                    │
│  epochPolicyAlgebraLayerV0.js (compose verdicts, ROS↔classifier feedback)    │
│  Runtime: worldPhysics.globalTick; causal tickIndex; sim fixed-step counter │
│  `realitySeal.realityEpoch` on RSK (Sprint 1 sealer skeleton); WAL/ROS still unwired. │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Vertical truth chain (design intent, partially enforced in code):**  
coherence → presence projection → (readiness / bridge) → nav/FSM → writeback to presence — see `realEngineGapMapV0.js`. Coherence must not own Three.js meshes or raw physics authority.

---

## 2. Runtime Data Flow Graph

**Nominal chain (as designed in specs + partial wiring):**

`event` → `classification (spec)` → `ROS arbitration (spec)` → `WAL stream / seal (spec)` → `simulation kernel (hybrid, opt-in)` → `somatic coupling tick (sync)` → `epoch / snapshot semantics (spec + partial: rollback/hash)` → `memory / history (sync/async mix)`

| Segment | Mechanism | Async / Sync / Batch | Deterministic? |
|---------|-----------|----------------------|----------------|
| User / gateway / WS | `presenceMeshIngestSlice`, room broadcast, social runtime | async ingress; sync fold into RSK | causal append paths aim for reproducibility; network not |
| Coherence tick | `runSocialCoherenceKernelTickV0` family, `AppRhizoh528` loop | batched / tick-driven | reducer tests; full live determinism depends on inputs |
| Ghost embodiment drive | Rhizoh social → `mergeGhostPetEmbodimentDriveIntoPresence` | sync on merge | deterministic given same drive payload |
| Spatial readiness bridge | `spatialReadinessBridgeFromPresenceV0` | sync | pure functions on state slices |
| Studio `sync()` | `PresenceStudioViewport` `requestAnimationFrame` | sync per frame | bounded dt clamp; not fixed wall-clock |
| Somatic coupling | `tickSomaticExecutionCouplingV0` | sync inside `sync()` | handler order fixed; handlers optional |
| Real sim coupling | `installRealSimulationEngineCouplingV0` | sync handlers; fixed-step **batched** substeps | grid BFS + FSM + separation are deterministic given same floats |
| Rollback / hash | `simulationCompletionLayerV0` + integrator post | snapshot queued per outer coupling pass | hash is deterministic function of tick + transforms |
| History book | `castleHistoryBookV0` persistence hooks | async local persistence where used | append rules tested |

**Async hotspots:** Firebase auth/session, YouTube publisher bridge fetch (`youtubePublisherBridgePullOnce` async), WS mesh ingest.  
**Sync core:** RSK `getStudioKernelState` / `setStudioKernelState`, viewport render loop, coupling tick when installed.

---

## 3. Tick & Time Model

| Concept | Status in codebase | Role |
|---------|---------------------|------|
| `worldPhysics.globalTick` | **Real** field on `StudioKernelState` | Monotonic kernel tick for causal / physics-adjacent bookkeeping |
| Causal `tickIndex` / graph writers | **Real** (`appendCausalNode`, branches) | Per-branch logical time for causal nodes |
| Simulation fixed substep | **Real** when real sim installed (`pumpFixedTimestepV0`) | Deterministic integration steps; capped per outer frame |
| `reality_epoch` | **hybrid** | Sealer pipeline + WAL stream ingress (schedule influence); ROS execution not bound |
| `sim_subtick`, `stream_seq`, `intent_seq`, Lamport/HLC | **Spec-only** (named in epoch / consensus specs) | Intended fast-path ordering without epoch inflation |

**Clocks named in specs:** “ROS clock”, “WAL clock”, “simulation clock” — **design separations**; only sim fixed-step and `globalTick` / causal ticks exist as concrete clocks in code.

**Why decouple (as documented):** single metronome would couple LLM/coherence latency to physics hitching and stream jitter to arbitration (`multiLayerRealityConsensusEngineV0.js`). Decoupling preserves integrity: fast layers use subcounters; rare sealing advances epoch **when implemented**.

---

## 4. Engine Status Matrix

| Subsystem | Status | Notes |
|-----------|--------|------|
| Nav solver (grid BFS + discs) | **hybrid** | Real math in `studio/lib/realSimulation/minimalPathGridNavV0.ts`; **only runs** when `installRealSimulationEngineCouplingV0` + `window.__rskRealSim` |
| FSM runtime (`tickLocomotionFsmGraphV0`) | **hybrid** | Same opt-in coupling |
| Flocking (separation) | **hybrid** | Same |
| Look-at (stable yaw; quat helpers) | **hybrid** | Yaw applied to pet `rotY`; quaternion path available for rigs |
| Frame integrator + rollback queue | **hybrid** | Fixed step + FIFO rewind; opt-in |
| WAL v0 / v1 | **hybrid** | Sprint B stream ingress `worldAuthorityStreamIngressV0.js` → `submitWorldAuthoritySealCandidateOnKernelV0` (geometry authority proposals; schedule influence only) |
| ROS v0 / v1 / v2 | **spec-only** | `realityOperatingSystem*.js` |
| Multi-layer consensus + epoch inflation doc | **spec-only** | `multiLayerRealityConsensusEngineV0.js` |
| Epoch classification engine | **spec-only** | `epochClassificationEngineV0.js` |
| Epoch policy algebra | **spec-only** | `epochPolicyAlgebraLayerV0.js` |
| Somatic execution coupling | **real** | Default handlers empty; order enforced in code |
| `registerMinimumRealSimulationKernelHandlersV0` | **real** | Thin wiring layer |
| Studio autonomous director intent | **real** | `computeAutonomousStudioDirectorIntentV0` consumed from App refs |
| YouTube → coherence feedback | **hybrid** | `ingestYouTubeAnalyticsForCoherenceFeedbackV0`, bridge URL from flight config; network optional |
| Ghost pet embodiment | **hybrid** | Social drive + orbit transform; **physics authority** flag when real sim on |
| World topology (regions, portals, room bindings) | **hybrid** | `worldTopologySlice`, `ensureCastleWorldTopology` — not streamed from live glTF |
| Global castle diff reducer (federated roster merge) | **real** (narrow scope) | `globalCastleDiffReducerV0.js` — deterministic merge for **roster-like** WS slices, not full spatial world |
| WAL “live stream engine” runtime | **stub / absent** | No continuous obstacle stream bound to gateway scene graph in this extraction |

---

## 5. Dependency Graph

### Hard (must exist for downstream to function meaningfully)

- RSK `StudioKernelState` + `internalStore` (all studio/rhizoh consumers).
- Causal graph append path for presence / mesh ingest that uses it.
- `PresenceStudioViewport` or equivalent shell for Three presentation (when using studio visuals).

### Soft (optional / enhancement)

- Real simulation engine coupling (`__rskRealSim`).
- YouTube publisher bridge URL + pull.
- Spatial readiness bridge merge in App.
- `__rhizoh.debug()` snapshots (gap maps, ROS specs, consensus specs).

### Circular / tension risks (design-level)

- **Orbit vs physics:** `presenceWithSyncedPetTransforms` skips when `simulationPoseAuthoritative` — good; if both active without flag → fight (mitigated by flag).
- **Coherence → presence → sim:** integrity chain demands coherence never writes transforms directly; violation would reintroduce “hallucinated movement” risk (`realEngineGapMapV0.js`).
- **ROS↔classifier feedback (spec):** ping-pong if two writers update shared context same slice without `single_writer_per_epoch_slice` discipline (`epochPolicyAlgebraLayerV0.js`).

---

## 6. Critical Missing Pieces (Explicit)

### 6.1 Honest runtime gap matrix (substrate completion targets)

| Missing core | Status | Where it lands (when built) |
|--------------|--------|-----------------------------|
| Executable WAL stream daemon | **absent** | Sprint B — after sealer loop |
| Live obstacle streaming | **absent** | Sprint B → `submitWorldAuthoritySealCandidateV0` |
| Scene graph → nav bake runtime | **absent** | Sprint B → sim authority feed |
| Executable ROS arbitration runtime | **absent** | Sprint D — post sim authority |
| Real federation merge runtime | **absent** | Sprint D (spatial), roster merge exists |
| Canonical epoch sealer service loop | **partial+** | Sprint A — schedule + constitution + boot continuity (`*ScheduleV0`, `*ConstitutionGateRuntimeV0`, `*BootContinuityV0`) |
| Server-authoritative lockstep | **absent** | Sprint C |
| Full replay / reconciliation | **partial** | Sprint A witness + Sprint C |

**Phase shift:** work is no longer “add features” — it is **substrate completion** (each layer has a fixed seat in the stack).

**APIs / contracts (present)**

- `realitySeal` on RSK + `realitySealingCoreV0.js` (classifier, budget, drain).
- WAL **streamed geometry authority** — `worldAuthorityStreamIngressV0.js` → seal candidates + schedule poke (no direct epoch).
- Sealer **runtime tick** — `realitySealerRuntimeV0.js` (drain loop, policy hold, replay witness, optional disk persist).
- **Live wiring (ontological rhythm, not rAF)** — `realitySealerLiveWiringV0.js`: WAL ingress poke → schedule; 2s watchdog; optional 8s heartbeat (`VITE_REALITY_SEAL_HEARTBEAT=1`).

**Still unwired**

- No unified **WAL obstacle stream → `setRealSimulationDiscObstaclesV0`** from gateway mesh deltas (manual `setRealSimulationDiscObstaclesV0` exists).

**External keys / config (environment-dependent)**

- Firebase: present (`castleFirebase.js`, auth paths); **misconfiguration** yields demo/degraded paths in UI (see App copy around bridge list).
- YouTube: publisher **bridge base URL** from flight config; live URL constant in App — not a “missing key” in repo, **missing in deployment** if unset.
- GoDaddy: **no references** in `apps/client` search — not part of client architecture map.

**Runtime bindings**

- Real sim: **opt-in flag** only; default studio path uses coupling no-ops.
- WAL / ROS / epoch algebra: **no production wire** from `PresenceStudioViewport` beyond debug imports for sim.

**World ingestion**

- Scene graph → nav mesh bake / streaming: **not wired** (WAL v1 describes target).
- Cross-castle **spatial** federation: global reducer is **roster/coherence input**, not full world geometry merge.

**Physics / world sync**

- Pet pose: orbit slice vs sim authority — resolved by `simulationPoseAuthoritative` when sim on.
- No server-authoritative physics lockstep in client extraction.

---

## 7. Risk Analysis (Focused)

| Risk | Current mitigation / state |
|------|---------------------------|
| Epoch inflation | **Partial** — `checkEpochBudgetV0` + `realitySealerRuntimeV0` policy hold; not yet wired to live WAL/ROS ingress rates |
| Simulation desync | Optional `wsDesyncAlpha` + `getWsAuthorityXZForSlot` in real sim coupling; **off by default** |
| WAL lag | Spec: backpressure / readiness degradation; **no live WAL engine** to observe lag against |
| ROS oscillation | Spec: bidirectional feedback + single-writer rule; **not executed** in code |
| Multi-world conflict divergence | `globalCastleDiffReducerV0` reduces **specific** merged WS shapes; ROS v1/v2 **spec** for broader arbitration; **gap** for spatial truth |

---

## 8. Final System Definition (One Paragraph)

This repository’s Rhizoh client is a **React + Three.js studio shell** around a **kernelized social simulation state (`StudioKernelState`)** with an emerging **sealed-reality substrate**: `realitySeal.realityEpoch` advances only through `realitySealingCoreV0` + `realitySealerRuntimeV0`, while WAL ingress (`submitWorldAuthoritySealCandidateV0`) may enqueue candidates but **never** write epoch directly. Coherence and presence remain production-close; **optional** fixed-timestep somatic simulation attaches via the coupling hook without LLM physics authority. **WAL v1, ROS v1/v2, and federation arbitration** remain mostly **spec + debug snapshots** until substrate sprints B–D wire live streams and execution. Production async edges: Firebase, YouTube, WS mesh; deterministic cores: reducers, seal replay witness, opt-in local integrator.

---

## 9. Substrate completion roadmap (do not reorder)

| Sprint | Name | Delivers |
|--------|------|----------|
| **A** | Canonical Sealer Runtime | Drain loop, epoch bump policy, budget enforcement, replay witness, seal persistence (`realitySealerRuntimeV0.js` — **partial**) |
| **B** | WAL Runtime | Stream ingress (**started**) — obstacle/scene/topology → `worldAuthorityStreamIngressV0`; nav invalidation post-seal **pending** |
| **C** | Simulation Authority | Authoritative reconciliation, rollback/replay, deterministic sync, multi-client causal replay |
| **D** | ROS Execution | Arbitration runtime, leases, constitution enforcement, causal law execution |

**Invariant (touch-invariant):** *Only the sealer may advance canonical reality.*

---

## 10. Faz 1 — Validation window (three-layer ops)

**Goal:** Prove the substrate stays coherent under pressure — not deploy, not ROS, not federation law.

**Mental model:** *authority ≠ execution*. Gateway vetoes and relays; **only the client substrate runtime** advances `realityEpoch` (sealer + daemon + peer convergence in `AppRhizoh528` mount).

### 10.1 Three layers

```
┌─────────────────────────────────────────────┐
│ GATEWAY (authority layer)                   │
│ auth · WS relay · unsigned WAL reject       │
│ POST /rhizoh/substrate/health · metrics     │
└──────────────────────┬──────────────────────┘
                       │ WS + health reports
                       ▼
┌─────────────────────────────────────────────┐
│ SUBSTRATE RUNTIME (client — VPS headless)   │
│ realitySealerLiveWiringV0                   │
│ worldRuntimeDaemonLiveWiringV0              │
│ peerWalConvergenceWireV0                    │
│ realityEpoch produced here                  │
└──────────────────────┬──────────────────────┘
                       │ read-only
                       ▼
┌─────────────────────────────────────────────┐
│ OBSERVERS (laptop / curl / debug)           │
│ no execution authority                      │
└─────────────────────────────────────────────┘
```

| Layer | Code roots | Does **not** do |
|-------|------------|-----------------|
| Gateway | `apps/gateway/src/server.js`, `gatewaySubstrateAuthorityV0.js`, `substrateOperationalMetrics.js` | Advance epoch, run sealer drain |
| Substrate runtime | `realitySealerLiveWiringV0.js`, `worldRuntimeDaemonLiveWiringV0.js`, `peerWalConvergenceWireV0.js` | Bypass constitution / unsigned WAL at boundary |
| Observers | `__rhizoh.debug().realityHealth`, `GET /infra/metrics` | Drive ticks or mutate seal state |

**Critical:** Sealer tick, daemon interval, and peer in-memory state live in the **browser JS event loop**. Headless Chromium (or an open tab) on the runtime host is required — gateway-only soak is **not** full Faz 1.

### 10.2 GO / NO-GO (start gate)

```bash
npm run ci:substrate-gate          # must be GREEN
npm run audit:render-authority:strict   # GREEN on gateway host with env filled
```

| Block | Client (`apps/client/.env.local` or build env) | Gateway (`apps/gateway/.env`) |
|-------|-----------------------------------------------|------------------------------|
| A | `VITE_WAL_GEOMETRY_INGRESS=1` | `CASTLE_REQUIRE_AUTH=true` |
| | `VITE_WORLD_RUNTIME_DAEMON=1` | `CASTLE_REQUIRE_WAL_PEER_AUTH=true` |
| | `VITE_PEER_WAL_CONVERGENCE=1` | `CASTLE_REJECT_UNSIGNED_WAL=true` |
| | `VITE_CASTLE_AUTHORITY_PROFILE=staging` | `CASTLE_GATEWAY_TOKEN` (≥16) = client `VITE_GATEWAY_TOKEN` |
| | `VITE_SUBSTRATE_HEALTH_REPORT=1` | `CASTLE_JWT_SECRET` (≥24) or Firebase Admin |
| | `VITE_REALITY_SEAL_PERSIST=0` | `CASTLE_ALLOW_DEV_ANON=false` |
| | `VITE_REALITY_SEAL_HEARTBEAT=0` | `CASTLE_ALLOW_DEV_HTTP_UID=false` |

**Blocked for Faz 1** (`preDeploySubstrateGateV0.js`): `VITE_ROS_EXECUTION_RUNTIME`, `VITE_FEDERATION_LAW_NEGOTIATION`, `VITE_CROSS_CASTLE_TOPOLOGY_MERGE`, `VITE_GLOBAL_SPATIAL_CONSENSUS`.

### 10.3 VPS runtime (recommended)

Two processes on the substrate host + headless browser:

```bash
# (A) Gateway
npm run dev:gateway
# prod: node apps/gateway/src/server.js

# (B) Client — build-time VITE_* then serve
npm run build -w apps/client
npx vite preview -w apps/client --host 0.0.0.0 --port 4173

# (C) Headless Chromium (keeps event loop alive)
chromium --headless=new --disable-gpu http://127.0.0.1:4173
```

Local dev equivalent: `npm run dev` (port 5173) + gateway on 8090.

**Low-GPU soak (laptop):** open **`http://localhost:5173/?mode=headless`** — skips ApexEngine, Cesium, swarm GPU, and live-agent projection; mounts substrate wiring + terminal-style `realityHealth` panel (`rhizohHeadlessModeV0.js`, `RhizohHeadlessObservabilityPanel.jsx`). Optional env: `VITE_RHIZOH_HEADLESS=1`.

### 10.4 Observation (72h)

| When | Question |
|------|----------|
| 2–6 h | Processes up? WS connected? Health ingest flowing? |
| 24 h | Faz 1 GO/NO-GO on **trends** |
| 72 h | Ecology behavior before domain + production profile |

**Primary data source (observers):**

- Gateway: `GET /infra/metrics` (Prometheus; aggregates client `realityHealth` via `POST /rhizoh/substrate/health`)
- Client (optional): `__rhizoh.debug().realityHealth` (sync — not a Promise)

**Five signals:**

| # | Field | Healthy | Unhealthy |
|---|--------|---------|-----------|
| 1 | `rates.epochBumpsPerMin` | sparse, burst → decay | sustained high |
| 2 | `peerConvergence.quarantineCount` | slow rise → flat | exponential / same `castleId` repeat |
| 3 | `drainLatency.maxMs` | spike → drop | plateau |
| 4 | `peerConvergence.replayMismatchTotal` | rare | steady climb, accept↔quarantine flip-flop |
| 5 | backpressure | transient `paused` | sticky pause / constant drops |

**Rules during window:** no new features, no config changes, no panic fixes on single spikes — measure **recovery**, not instantaneous anomalies.

### 10.5 Success criterion

> **Substrate remains self-balanced under uninterrupted execution.**

After green Faz 1: production domain, `VITE_CASTLE_AUTHORITY_PROFILE=production`, and later ROS execution become materially safer.

---

## 11. Phase 2 — Continuity (post–Faz 1)

**Question shift:** *Runtime stable?* → ***Continuity preserved across interruption?***

**SSOT:** [`SUBSTRATE_CONTINUITY_PHASE2_V0.md`](./SUBSTRATE_CONTINUITY_PHASE2_V0.md) (`RESEARCH-ONLY` spec; implementation `CORE-ELIGIBLE` in `rhizoh/runtime/*` only).

**Replay corruption taxonomy (Faz 2.1):** [`REPLAY_CORRUPTION_TAXONOMY_V0.md`](./REPLAY_CORRUPTION_TAXONOMY_V0.md) — 7 breach classes, `QUARANTINE_ISOLATION`.

**Hat B — Controlled chaos:** [`CONTROLLED_CHAOS_HARNESS_V0.md`](./CONTROLLED_CHAOS_HARNESS_V0.md) — `chaosHarnessV0.js` + Deterministic Quarantine Scoreboard (`chaosScoreboardV0.js`). Vitest + `__rhizoh.runControlledChaos()`.

**Faz 2.4 — Temporal identity:** [`TEMPORAL_IDENTITY_BINDING_V0.md`](./TEMPORAL_IDENTITY_BINDING_V0.md) — Time Ownership Contract (`temporalIdentityBindingV0.js`); node = time sovereignty unit.

| Pillar | Mechanism |
|--------|-----------|
| **L1 Local** | IndexedDB: `wal_segments` (truth), `canonical_snapshots` (cache), `peer_state`, `replay_cursor`, `pending_outbox` |
| **L2 Relay** | Guardian as witness/append sink — **not** authoritative brain |
| **L3 Catch-up** | Outbox + drain FSM + deterministic reconnect merge |

**Principle:** Snapshots accelerate hydrate; **append chain is reality.** Epoch still advanced **only** by sealer.

Upper layers (Cesium, Ghost, agents, map atmosphere) stay frozen until Faz 2 exit criteria in the spec doc pass.

---

## 12. Rhizoh Living Loop Orchestrator (RLL-O)

**Status:** **wired (v0)** — `rhizohLivingLoopOrchestratorV0.js` · `RhizohLivingLoopRuntime.jsx` · `AppRhizoh528` via `RhizohAtmospherePresenceBridge`.

**Chain (single tick rhythm):**

```text
LocationSeed (tz + locale, route-independent)
    → WorldInstance (session-stable wi_* id)
    → Atmosphere (liveRuntimeOrchestrator → worldPresence + projection)
    → Ribbon (deriveLivingLoopRibbonFrameV0 → RhizohExperienceRibbon copy)
    → Castle Interaction ([data-rhizoh-atmosphere-castle-surface] + affordanceId)
    → Memory WAL (living_loop_frame segments when VITE_SUBSTRATE_CONTINUITY_IDB=1)
```

| Leg | Module | Authority |
|-----|--------|-----------|
| LocationSeed | `locationSeedV0.js` | Projection only |
| WorldInstance | `worldInstanceFromLocationSeedV0.js` | Session identity bucket |
| Atmosphere | `liveRuntimeOrchestratorV0.js` | Weather → presence → CSS/Cesium sink |
| Ribbon | `deriveLivingLoopRibbonFrameV0` | UI narrative merge (no execution) |
| Castle | `deriveCastleInteractionFrameV0` | Affordance hints only |
| Memory WAL | `livingLoopMemoryWalV0.js` | Append-only observation lane; **does not** advance sealer cursor |

**Debug:** `__rhizoh.debug().livingLoop` → `getRhizohLivingLoopSnapshotV0()` (wire in mount if needed).

---

*Extraction artifact. Update when wiring changes materially.*
