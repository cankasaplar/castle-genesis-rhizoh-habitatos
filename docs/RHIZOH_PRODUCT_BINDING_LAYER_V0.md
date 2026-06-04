# Rhizoh Product Binding Layer v0

**Status:** **SPEC ONLY** · **SPECFLOW:** `RESEARCH-ONLY`  
**Phase gate:** Observation ACTIVE (2026-06-03 → ~2026-06-05) — **no implementation until observation closes**  
**Parent:** [`RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md`](RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md) · [`RHIZOH_PROD_FLOW_V0.2.md`](RHIZOH_PROD_FLOW_V0.2.md)

> **One line:** Rhizoh OS v0.2 is alive, but the user can only feel ~20–30% of it through UI — the missing piece is not features, it is the **binding layer**.

---

## 0. System definition

| Layer | State (2026-06-03 prod) | User feels |
|-------|-------------------------|------------|
| **Motor (CORE)** | SCR loop · WAL · Pet · coherence · liveMonitor | Indirectly (presence, globe, voice) |
| **World (WORLD)** | Castle · co-presence · studio organism tick | Background keys on `window.__rhizoh` |
| **Product (rhizoh.com)** | Cap Wheel · Studio drawer · ingress · voice dock | **~20–30% connected** |

**Architectural tension:** PRODUCT reflects WORLD but does not **act on** WORLD. Three realities stack without a single **Capability → Runtime Action Bridge**.

This document defines **`RhizohProductBindingLayerV0`** — the missing connective tissue. It is **not** a new core ontology. It routes **UI events → WORLD actions → UI feedback** without SCR/WAL owning product truth.

---

## 1. What Product Binding Layer is (and is not)

### Is

- A **domain router** + **event bridge** between Product Surface and World OS
- Explicit **truth labels** (intent vs router vs read-only vs sim)
- **Activation points** for capabilities that already exist in code
- **SCR tick ↔ product interaction sync** contract (when user acts, world records it)

### Is not

- New SCR/ICL/WAL primitives
- Ghost feature deletion (ghost features = **latent capabilities**, not trash)
- Voice v3.1 / Cesium / Academy / Economy **implementation** (those come after binding)
- Deploy or runtime change during observation phase

### Proposed module home (future)

```
apps/client/src/rhizoh/product/rhizohProductBindingLayerV0.js   (router + dispatch)
apps/client/src/rhizoh/product/rhizohProductDomainRouterV0.js    (static maps)
apps/client/src/rhizoh/product/rhizohProductBindingEventsV0.js   (CustomEvent bus)
```

---

## 2. Binding architecture (target)

```
┌─────────────────────────────────────────────────────────────┐
│  PRODUCT SURFACE                                            │
│  Cap Wheel · Shell Bar · Drawer · Voice dock · Ingress      │
└───────────────────────────┬─────────────────────────────────┘
                            │ UI events (click, intent, route)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  RhizohProductBindingLayerV0  ← THIS SPEC                  │
│  · classify: intent | route | replay | observe | sim-only     │
│  · dispatch → WORLD action OR studio sim OR read-only       │
│  · publish feedback → UI + window.__rhizoh observability    │
└───────────────────────────┬─────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
   CORE (SCR tick)    WORLD (castle/      PRODUCT SIM
   WAL append         co-presence)        (kernel console)
          │                 │                 │
          └─────────────────┴─────────────────┘
                            ▼
              window.__rhizoh + UI state feedback
```

**Golden rule (from World OS lock):** Product never owns SCR/WAL truth. Binding **invokes** world actions; it does not **become** truth.

---

## 3. Control surface truth fix (labels locked)

Before any wiring, each surface gets an honest role:

| Surface | Current lie | Truth label | Binding mode |
|---------|-------------|-------------|--------------|
| **Cap Wheel** | Whispers promise navigation | **Intent generator** (+ optional layer focus) | `INTENT` or `ROUTE` per node — must be explicit |
| **Studio drawer panels** | Feels like world control | **Simulation panel** (kernel store) | `SIM` — separate from SCR loop |
| **Drawer memory attrs** | "Memory organ" | **Metadata viewer** today | `READ` → target `REPLAY` |
| **Voice dock** | Engine registered | **Input channel** not full interaction graph | `INPUT → DISPATCH → SCR` |
| **Academy route** | Page exists | **Gated export observer** | `OBSERVE` until export env on |
| **Social/YouTube code** | Library complete | **Latent capability** | `DORMANT` until Castle Socials phase |

---

## 4. Domain router maps

### 4.1 Cap Wheel → action map

**Config SSOT:** `apps/client/src/kernel/visual/rhizohCapabilityHaloConfigV1.js`  
**Current wire:** `AppRhizoh528T0.jsx` `onSeedIntent` → `setCmd` + `LISTENING`; `onFocusLayer` → `SET_LAYER_FOCUS`

| Node ID | Current binding | Target binding mode | WORLD action (when activated) | Product feedback |
|---------|-----------------|---------------------|-------------------------------|------------------|
| `create` | `INTENT` only | **ROUTE** | `SET_PRODUCT_SURFACE: studio` + optional SCR tick tag `cap:create` | Open studio drawer; append WAL `surface_enter` |
| `explore` | `INTENT` only | **INTENT + MAP** | `applyRhizohWorldMapToolV0(explore)` | Map tool strip active |
| `learn` | `INTENT` + layer 11 | **ROUTE** | Navigate `/academy/observe` or drawer academy link | Academy observability feed subscribe |
| `build` | `INTENT` + layer | **ROUTE** | `SET_PRODUCT_SURFACE: studio` + layer 7 | Director/build panel |
| `broadcast` | `INTENT` only | **ROUTE** | `SET_PRODUCT_SURFACE: broadcast` | DirectorDeck sim |
| `companion` | `INTENT` only | **INTENT** | Voice `LISTENING` + pet citizen pulse read | Pet overlay emphasis |
| `robotics` | layer 13 + intent | **INTENT** (until device bridge) | Layer focus only; **no** device I/O | Honest whisper update |
| `swarm` | `INTENT` + layer | **INTENT + SCR** | Trigger swarm visual flag if policy allows | Swarm active chip |
| `world` | `INTENT` only | **ROUTE** | `SET_PRODUCT_SURFACE: world` | Cap wheel visible |
| `library` | `INTENT` only | **ROUTE** | Open drawer profile or media playlist panel | Media list if gateway data |
| Robotics chips | layer 13 + intent | **DORMANT → DEVICE** | `executionRouterV0` when Hue/device bridge enabled | Device ack panel |

**SCR tick trigger (target):** Cap Wheel **ROUTE** actions call `emitProductBindingActionV0({ source: 'cap_wheel', action, scrTick: true })` → binding layer calls `tickRhizohPresenceStateV0` + optional `runStudioExecutionLoopV0` **after** `presenceFrame` ready (fixes known race).

**Copy fix:** Whispers that promise GreenRoom/Studio **navigation** must match binding mode — either wire `ROUTE` or rewrite whispers to "intent only".

---

### 4.2 Shell bar → surface map

**SSOT:** `apps/client/src/studio/ui/UnifiedProductShellBar.jsx`  
**Current:** `onProductShellSelect` in `AppRhizoh528T0.jsx` sets surface + reality mode + layer focus

| Surface ID | Drawer | Binding | WORLD side-effect |
|------------|--------|---------|-------------------|
| `world` | suppressed | **ROUTE** | Cap wheel + map strip; SCR sampler active |
| `hall` | KernelConsole | **SIM** | No SCR loop trigger |
| `greenroom` | DirectorDeck | **SIM** | Layer 5 focus |
| `broadcast` | DirectorDeck | **SIM** | Broadcast sim state |
| `studio` | WorldLivingMap + Kernel | **SIM + READ** | Topology read; organism metadata read-only |
| `profile` | Profile + RuntimeHealth | **READ** | Gateway health only |

**Target:** Shell bar selection publishes `rhizoh:product-binding-v0` event with `{ surface, mode: 'SIM'|'ROUTE'|'READ' }` so observability can distinguish sim vs world navigation.

---

### 4.3 Drawer → WAL / memory map

**Runtime SSOT:** `rhizohWorldActionLogV0.js` · `rhizohWorldReplayV0.js` · `rhizohWorldWalPersistenceV0.js`  
**UI SSOT:** `RhizohProductSurfaceDrawerV0.jsx` (attrs only today)

| Drawer capability | Current | Target binding | Runtime call |
|-------------------|---------|----------------|--------------|
| Episode seq display | READ (DOM attr) | READ | `window.__rhizoh.studioProductionOrganism.memory_organ` |
| WAL entry list | **missing** | **REPLAY UI** | `window.__rhizoh.worldActionLog.entries` |
| Episode replay | **missing** | **REPLAY** | `replayWorldActionLogEntryV0(entryId)` |
| Replay exit | **missing** | **REPLAY** | `clearWorldReplayModeV0()` |
| WAL persistence mode | **missing** | **READ** | `worldWalPersistence.persistenceMode` |
| ICL same_world badge | **missing** | **READ** | `worldIdentityConsistency.equivalence.same_world` |

**UX contract (v0):**

1. Drawer **Memory** tab (or strip expand) lists last N WAL entries (read-only ring).
2. Click entry → binding calls replay → UI shows replay banner + restores frame/pet projection.
3. Replay events append to `liveMonitor` anomaly slot as `replay_active: true` (observability only).

**Boot gap to close (post-observation):** `initRhizohWorldWalPersistenceV0()` on prod app mount — today only runbook/tests.

---

### 4.4 Voice → interaction graph

**Current path (partial):**

```
mic → voiceAdapter (v3 or Chrome STT)
  → handleVoiceTranscript (AppRhizoh528T0)
    → fast precheck bypass OR gateway LLM
      → setRhizohMainHudReply / TTS
```

**Missing links to WORLD:**

| Stage | Exists | Bound to SCR/WAL? |
|-------|--------|-------------------|
| STT transcript | yes | no WAL entry for voice turn |
| Intent classification | yes (regex micro) | no `appendWorldActionLogEntryV0` |
| LLM dispatch | yes | `lastVoiceLlmDispatch` on `__rhizoh` only |
| Field state LISTENING/SPEAKING | yes | drives RPSE but not explicit WAL |
| Voice → surface route | **no** | "open studio" voice commands don't route |

**Target interaction graph:**

```
VOICE_INPUT
  → sanitize gate (existing)
  → ProductBindingLayer.classifyVoiceIntent
      ├─ LOCAL_COMMAND → rhizohLocalCommandHandlersV0 (existing)
      ├─ ROUTE_COMMAND → domain router (studio/broadcast/world)
      ├─ DIALOGUE → gateway LLM (existing)
      └─ OBSERVE_ONLY → cohort/review paths
  → on every committed turn:
      appendWorldActionLogEntryV0({ channel: 'voice', ... })
      tickRhizohPresenceStateV0({ voiceListening, fieldState })
  → UI feedback: reslPresentation + optional TTS
```

**Activation point:** single hook in `handleVoiceTranscript` **after** gate pass, **before** dispatch — binding layer only, no engine rewrite.

---

### 4.5 Academy activation map

| Asset | Path | Gate | Target binding |
|-------|------|------|----------------|
| Route `/academy/observe` | shell router | always | **READ** observatory UI |
| Route `/academy/research` | `AcademicObservatoryPageV0.jsx` | always | **READ** |
| Export client | `academicObservatoryClientV0.js` | `CASTLE_ACADEMIC_OBSERVATORY=1` on gateway | **OBSERVE → EXPORT** |
| Turn-layer academy tick | `rhizohLayerCrossVisibilityV0.js` | passive on LLM turns | **OBSERVE** — publish to `continuityObservability` |
| Cap Wheel `learn` node | halo config | none | **ROUTE** → academy when binding on |

**WAL query map (target):** Academy export requests tagged `provenance: academy` append read-only WAL entries — no academy execution on CORE.

---

### 4.6 Social / Castle Socials activation map

| Asset | Path | State | Activation trigger |
|-------|------|-------|-------------------|
| Unified WAL+social WS | `castleSocialWalUnifiedWiringV0.js` | dead | `VITE_PEER_WAL_CONVERGENCE=1` + `installCastleSocialWalUnifiedWiringV0()` from binding boot |
| Global coherence tick | `globalCoherenceKernelBridgeV0.js` | dead | mount hook post–Castle Socials phase |
| CSIL engine | `csilCastleSocialEngineV0.js` | partial | feed from co-presence when social phase starts |
| YouTube publish emitter | `youtubePublishRequestEmitterV0.js` | dead | `VITE_YOUTUBE_PUBLISHER_BRIDGE_URL` + Studio broadcast **SIM → PRODUCT** promote |
| Co-presence readout | `RhizohCastleCoPresenceStripV0.jsx` | **READ active** | extend to **feed** when social WS live |

**Co-presence feed map (target):**

```
castleSocialWs → binding layer → window.__rhizoh.coPresence
                              → liveMonitor.social (new read-only field, spec only)
                              → drawer co-presence strip
```

---

### 4.7 Economy activation map

| Asset | Path | Default prod | Activation |
|-------|------|--------------|------------|
| Perceptual entropy economy | `perceptualEntropyEconomyV0.js` | living-entry only | `VITE_RHIZOH_SPATIAL_SHELL=1` OR post–Product Layer promote |
| World mutation feedback | `worldMutationFeedbackV0.js` | living-entry only | same |
| Spiral MMO layer | `spiralMMOAgreementLayerV0.js` | env-gated | `VITE_SPIRAL_MMO_*` |
| Event ledger (target) | *not implemented* | — | Economy v0 appends **read-only** WAL tags; never CORE scores |

**Rule:** Economy = **PRODUCT event ledger** projecting WAL tags — not a fourth core primitive.

---

### 4.8 Cesium / spatial entry path

| Entry | Condition | Current | Target binding |
|-------|-----------|---------|----------------|
| Default T0 globe | `VITE_RHIZOH_SPATIAL_SHELL=0` | `AppRhizoh528T0` + Cesium layer in map | **active** — no change |
| Spatial product shell | `VITE_RHIZOH_SPATIAL_SHELL=1` | `AppRhizoh528LivingEntry` → full economy stack | **alt track** |
| Cap wheel spatial stub | `RhizohSpatialWorldShell.jsx` | `onFocusLayer` noop | **ROUTE** parity with T0 or hide wheel |
| Cesium pick sovereign | `cesiumSovereignGeographicPickV0.js` | spatial/sovereign paths | **INPUT → WAL** anchor entry |

**Cesium integration prerequisite:** Binding layer must label spatial shell as **WORLD track** vs T0 **PRODUCT track** — never merge without explicit env flag.

---

## 5. Event bus contract (spec)

**Event:** `rhizoh:product-binding-v0`

```typescript
// Spec-only shape
{
  schema: "castle.rhizoh.product_binding.v0",
  source: "cap_wheel" | "shell_bar" | "drawer" | "voice" | "academy" | "ingress",
  mode: "INTENT" | "ROUTE" | "REPLAY" | "READ" | "SIM" | "DORMANT",
  action: string,
  scrTickRequested: boolean,
  walEntryId?: string,
  atMs: number
}
```

**Subscribers (target):**

| Subscriber | Purpose |
|------------|---------|
| `rhizohWorldActionLogV0` | append on committed actions |
| `rhizohProdWorldObservabilityBridgeV0` | optional liveMonitor refresh |
| `rhizohContinuityObservabilityV0` | CIS samples on product actions |
| UI stores | drawer open, surface change feedback |

---

## 6. SCR tick ↔ product sync rules

1. **Product ROUTE actions** may request SCR tick; binding waits for `presenceFrame` non-null.
2. **SIM actions** (KernelConsole, DirectorDeck) **must not** append WAL as world truth — sim state stays in `studioStore`.
3. **REPLAY actions** use `replayWorldActionLogEntryV0` — read-only restore; new WAL entry marks replay provenance.
4. **Voice committed turns** always append WAL + RPSE tick.
5. **DORMANT capabilities** return `{ mode: 'DORMANT', reason: 'phase_gate' }` — no silent no-op.

---

## 7. Observability extensions (spec only)

| Key | Purpose |
|-----|---------|
| `window.__rhizoh.productBinding` | last N binding events ring |
| `liveMonitor.product` | `{ last_action, route_surface, replay_active, voice_turn_count }` |
| `deployStatus` | unchanged — alias of liveMonitor |

Fix **deployStatus schema split** (browser alias vs Node success report) in same binding phase — document in runbook, do not break prod smoke.

---

## 8. Implementation roadmap (locked · post-observation)

> **Bottleneck:** not the motor — the **nervous system (binding layer)**.  
> Rhizoh is no longer a product that accumulates features; it is a **runtime organism that becomes alive as connections are made**.

### Immutable boundary (never break)

```
PRODUCT → proposes
BINDING → translates
WORLD   → executes
WAL     → records
```

**PRODUCT layer never owns SCR/WAL truth.**

---

### Phase 0 — Observation (ACTIVE)

**Risk:** none · **Code:** none · **Deploy:** none

Watch: `deployStatus` · `organismRhythm` · `worldIdentity` · `liveMonitor` · `worldWalPersistence`

Ends: ~2026-06-05 (see [`RHIZOH_PROD_FLOW_V0.2.md`](RHIZOH_PROD_FLOW_V0.2.md))

---

### Phase 1 — Read-only truth alignment · **Risk: Low**

**Goal:** show memory and unify observability before any world influence.

| # | Item | Priority | Binds | UI target | Rules |
|---|------|----------|-------|-----------|-------|
| **1** | **WAL Replay Surface** | P0 | `worldActionLog` · `worldWalPersistence` · `replayWorldActionLogEntryV0` | Drawer → episode timeline · WAL entry list · replay scrub (**read-only**) | User must **see what happened** before routing is safe |
| **2** | **LiveMonitor exposure normalization** | P0 | `liveMonitor` · `deployStatus` · `organismRhythm` | Single read-only dashboard: rhythm / SCR / identity unified panel | One truth surface; fix browser vs Node `deployStatus` schema split |
| **3** | **Cap Wheel → intent logger** | P0 | Cap Wheel clicks | `capWheel.intent = { node, payload, timestamp }` on `window.__rhizoh.productBinding` | ❌ no SCR trigger · ❌ log + preview only (extends chat prefill) |

**Phase 1 exit criteria:** Drawer shows WAL history; liveMonitor panel is unified; every Cap Wheel click is logged with truth label `INTENT`.

---

### Phase 2 — Single-direction binding · **Risk: Medium**

**Goal:** first real **world influence** — product proposes, binding translates, world executes.

| # | Item | Priority | Flow | Rules |
|---|------|----------|------|-------|
| **4** | **Cap Wheel → SCR trigger bridge** | P1 | Cap Wheel → Product Binding → SCR tick **suggestion** → WAL append | UI **never** writes SCR directly |
| **5** | **Drawer → episode query engine** | P1 | Query WAL by time · event type · castle · pet interaction | ❌ no replay write · read + filter only |
| **6** | **Voice → input binding graph** | P1 | Voice v3 → transcript → intent → Cap Wheel / SCR **suggestion** | Speech = **input node** · no autonomous action |

**Phase 2 exit criteria:** Committed Cap Wheel ROUTE actions append WAL; voice turns append WAL; drawer queries filter entries.

---

### Phase 3 — World action bridging · **Risk: Medium–High**

**Goal:** sim surfaces become **control candidates**; knowledge and multi-node perception become observable.

| # | Item | Priority | Flow | Rules |
|---|------|----------|------|-------|
| **7** | **Studio → SCR suggestion layer** | P2 | Studio tick → suggestion → SCR queue | ❌ no direct execution · **proposal system only** |
| **8** | **Academy activation layer** | P2 | `academicObservatoryClientV0` → WAL analytics · SCR trends | Research feed · **passive export only** |
| **9** | **Social / Castle graph bridge** | P2 | `coPresence` · `castleGraph` · WAL sync events | Shared presence **view** · no editing power yet |

**Phase 3 exit criteria:** Academy feed live (export gated); co-presence visible in drawer; studio proposals appear in SCR queue (not auto-run).

---

### Phase 4 — Spatial & external systems · **Risk: High**

**Goal:** spatial projection and external output — still no new world ontology.

| # | Item | Priority | Flow | Rules |
|---|------|----------|------|-------|
| **10** | **Cesium / spatial shell entry** | P3 | Cap Wheel WORLD node OR Studio map focus → T0 frame → spatial projection | ❌ spatial ≠ new world · **projection layer only** |
| **11** | **Economy / perceptual layer** | P3 | `perceptualEntropyEconomyV0` · interaction density · WAL activity | **Metrics only** · no financial logic |
| **12** | **YouTube / broadcast bridge** | P3 | WAL event → publish emitter → external API (future) | ❌ no auto publish · **manual trigger only** |

**Phase 4 exit criteria:** Spatial entry explicit env flag; economy metrics on dashboard; broadcast manual emit with audit trail.

---

### Phase 5 — Full closed loop · **Risk: Very High**

**Goal:** bidirectional control and multi-user write — only after Phases 1–4 stable.

| # | Item | Priority | Scope |
|---|------|----------|-------|
| **13** | **Bidirectional control surface** | P4 | Cap Wheel ↔ SCR ↔ Studio ↔ Drawer live feedback loop |
| **14** | **Multi-user binding** | P4 | coPresence **write mode** · shared WAL streams |
| **15** | **Economy + social full activation** | P4 | Monetization · audience graph · creator loops |

**Phase 5 gate:** Requires 24–48h+ stable observation data + Phase 1–3 smoke pass. Not before Product Layer proof.

---

### Roadmap summary

| Phase | When | Risk | Focus |
|-------|------|------|-------|
| **0** | Now | — | Observe only |
| **1** 🔵 | First implement | Low | WAL replay UI · liveMonitor normalize · intent log |
| **2** 🟢 | After Phase 1 | Medium | Cap Wheel→SCR · drawer query · voice input graph |
| **3** 🟡 | After Phase 2 | Med–High | Studio proposals · Academy feed · social view |
| **4** 🟠 | After Phase 3 | High | Cesium · economy metrics · broadcast |
| **5** 🔴 | Last | Very High | Bidirectional · multi-user write · full social/economy loop |

---

## 9. Legacy priority table (superseded by §8)

See Phase 1–5 above. Original flat list retained for traceability:

| # | Binding | Phase |
|---|---------|-------|
| 1 | Drawer WAL list + replay | **1** |
| 2 | Cap Wheel intent log → ROUTE | **1 → 2** |
| 3 | Voice turn → WAL append | **2** |
| 4 | `initRhizohWorldWalPersistenceV0` on boot | **1** |
| 5 | Product binding event bus | **1–2** |
| 6 | Shell bar SIM vs ROUTE labels | **1** |
| 7 | Academy export gate | **3** |
| 8 | Social WS behind flag | **3** |
| 9 | YouTube → liveMonitor stream | **4** |
| 10 | Economy WAL tag ledger | **4** |

---

## 10. Non-goals (this spec)

- Deleting ghost features
- Changing SCR/ICL/WAL semantics
- Voice engine rewrite
- Cesium engine work
- Deploy pipeline changes during observation

---

## Related

- [`RHIZOH_PROD_FLOW_V0.2.md`](RHIZOH_PROD_FLOW_V0.2.md) — First Living World Record · observation ACTIVE
- [`RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md`](RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md) — Core frozen
- [`RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md`](RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md) — Deploy gates
- [`apps/client/src/rhizoh/runtime/rhizohProdWorldObservabilityBridgeV0.js`](../apps/client/src/rhizoh/runtime/rhizohProdWorldObservabilityBridgeV0.js) — smoke layer
- [`apps/client/src/kernel/visual/rhizohCapabilityHaloConfigV1.js`](../apps/client/src/kernel/visual/rhizohCapabilityHaloConfigV1.js) — Cap Wheel SSOT
