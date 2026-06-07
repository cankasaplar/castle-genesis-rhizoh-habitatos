# Rhizoh.com Soft Open — Production Plan V1 (Real Launch)

**Tag:** `CORE-ELIGIBLE` (ops + product)  
**Status:** Locked direction — progressive exposure, not full unrestricted open  
**Surface SSOT:** [`RHIZOH_T0_EXPERIENCE_SHELL_V1.md`](RHIZOH_T0_EXPERIENCE_SHELL_V1.md)  
**Activation gate (unchanged):** [`RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md) · [`RHIZOH_PHASE_TRANSITION_NOTE_V1.0.md`](RHIZOH_PHASE_TRANSITION_NOTE_V1.0.md)  
**Social/event DNA:** [`castleSocial/`](../apps/client/src/castleSocial/) · [`MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md`](MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md)

---

## 0. Founder lock (Sunday target)

> **First living users test the system from inside — not by choosing modes.**

| Yes | No |
|-----|-----|
| Single continuous Rhizoh world | Multi-entry shell picker |
| Cap Wheel = interaction launcher | Cap Wheel = static feature list |
| Everything connected in one session context | Isolated feature silos |
| Progressive exposure | “Full open” unrestricted prod |
| Core stable + controlled expansion | Feature count over experience quality |

**Monetization thesis:** continuous experience quality — events · invites · live interaction — not engineering surfaces (alignment, fracture, CI).

---

## 1. Production surface (locked)

```
/  →  AppRhizoh528T0  =  RHIZOH CORE EXPERIENCE LAYER
```

**Unified interaction:** Camera + Voice + Chat = one dock · one session context · Rhizoh-orchestrated entry points.

**Invisible forever (prod):** fracture · alignment debug · executor graph · CI.

User sentence:

> *Rhizoh is active. Octo is present. You are inside Castle.*

---

## 2. Cap Wheel — interaction launcher (corrected role)

Cap Wheel is **not** a feature catalog. It is an **interaction launcher** — every spoke opens a **controlled entry** into the same session.

| Spoke action | Launcher behavior | Execution rule |
|--------------|-------------------|----------------|
| Open map | Habitat + spatial lens expand | `routeCesiumCommandV0` via grammar/user intent only |
| Robotics mode | Sim / placeholder surface (P2) | No real actuator path |
| Voice session | Mic + Rhizoh voice loop | Session context preserved |
| Create event | Event flow entry (P1) | Contract + UI; no WAL until READY |
| Castle connect | Invite / visit flow (P1) | Social graph edge; stub WebRTC OK |
| Studio / drawers | Product surface switch | Presentation only |

**Rule:** `direct execution` ❌ · `controlled entry points` ✔ · flows pass through **Rhizoh-orchestrated** binding (`emitProductBindingActionV0`, grammar, drawers) — never bypass executor spine.

**Code anchor:** `RhizohCapabilityHaloV1` → `onCapNodeIntent` / `onSeedIntent` in `AppRhizoh528T0`.

---

## 3. Deploy tiers (P0 / P1 / P2)

### P0 — MUST WORK (Sunday core)

| Capability | User-visible | Engineering anchor | Soft-open bar |
|------------|--------------|-------------------|---------------|
| Rhizoh chat (text) | Primary dock | `RhizohT0ShellChromeV1` · `handleExecute` | Must not crash; gateway degrade OK |
| Octo presence | Always on stage | `OctoConversationStageV1` | Visual + reactive idle/listening |
| T0 shell | Full screen | `AppRhizoh528T0` | No empty canvas |
| Cap Wheel | Visible + tappable | `RhizohCapabilityHaloV1` | All nodes route somewhere safe |
| Castle drawers | Profile / map / studio / social | `RhizohProductSurfaceDrawerV0` | Open/close without losing session |
| Session persistence | Return visit continuity | `rhizohProductSessionPersistenceV1` / continuity IDB | Best-effort local |

### P1 — LIVE TEST (Sunday — invite cohort)

| Capability | Sunday expectation | Honest status |
|------------|-------------------|---------------|
| Voice | Rhizoh conversational voice | Runtime exists; monitor latency + errors |
| Camera | Octo view / presence feed | Product camera dock; permission UX |
| Map | Cesium or simplified globe | Executor spine live; collapsed default |
| Event create/join | First monetization surface | **V1.1 contract** ✔ · **UI shell** → V1.2 poster |
| Invite (email) | Cohort growth | `cohortInvitePackV0` · research outreach path |

### P2 — LIMITED / SAFE MODE

| Capability | Sunday mode |
|------------|-------------|
| Robotics | Simulated actions only · copy says “preview” |
| Advanced spatial tools | Hidden or dev-gated |
| Live broadcast | Stub / single-host only |
| Multi-user sync | Basic presence labels; full graph post-READY |

---

## 4. Continuous experience (session context)

User does **not** “switch modes.” One **session context** flows:

```
Chat  →  Map  →  Event  →  Octo  →  Voice
         └──────── same sessionContext ────────┘
```

**Sketch (client read-model, no new execution):**

```text
RhizohExperienceSessionContextV0 {
  sessionId,           // local or invite-bound
  productSurface,      // drawer / wheel selection
  fieldState,          // cognitive (per user)
  eventId?,            // when in event flow
  persistenceEpoch
}
```

Wheel and drawers **mutate presentation + context** — not separate app entries.

---

## 5. Camera + Octo (Sunday behavior)

| Wrong | Right (locked) |
|-------|----------------|
| Camera controls Octo | Camera **projects** Octo state |
| Octo = video avatar | Octo = reactive field entity |
| Real-time mesh puppet | `fieldState` change → visible motion |

**Concert / audio (P1):** audio → `OctoPerformanceFeedV0` intensity (contract) → visual feedback — sim feed acceptable Sunday.

**User:** watches Octo from product camera dock; Octo reacts; no executor from Octo.

---

## 6. Voice + Castle communication (Sunday MVP)

| Layer | MVP | Stub acceptable |
|-------|-----|-----------------|
| Voice | Rhizoh conversational loop in T0 dock | — |
| Castle invite | Email / link pack | `cohortInvitePackV0` |
| Live call | Basic session join UX | WebRTC token **stub** until data-plane READY |
| Presence | online / live / idle labels | Local + mock sync |

**No** session master WAL until activation READY.

---

## 7. Event system — growth + monetization center

Sunday minimum path:

1. **Create event** (axis tuple + lifecycle `DRAFT`→`SCHEDULED`)
2. **Invite user** (social edge)
3. **Join event** (`LIVE` binding allowed — placeholder ids)
4. **Live interaction** (Octo + chat + voice in same shell)
5. **Replay** (basic log / archived state — no full VOD required)

**Contracts:** [`castleEventInstanceV0.js`](../apps/client/src/castleSocial/castleEventInstanceV0.js)  
**Next UI:** V1.2 scheduled poster + create flow in drawer (presentation-only).

---

## 8. Deploy strategy — progressive exposure

**Not** “full open.” **Progressive exposure deploy.**

### Phase 1 — Soft open (Sunday)

| Control | Setting |
|---------|---------|
| Audience | Invite-only cohort |
| Concurrency | Low cap |
| Features | P0 stable · P1 live test · P2 safe/stub |
| Ops | Logging · crash-safe · `HOLD`/`READY` per ops checklist |
| Data-plane | Remains **controlled** per phase gate — client-first experience OK |

### Phase 2 — Expansion (post-Sunday)

- Robotics expansion
- Advanced map tools
- Social graph growth (L1 envelopes)
- External integrations · WebRTC production

---

## 9. Pre-Sunday checklist (engineering)

| # | Check | Command / artifact |
|---|-------|-------------------|
| 1 | T0 boots on `/` | Manual + `data-rhizoh-t0-chat-dock` |
| 2 | Cap Wheel nodes safe-route | Tap each spoke — no throw |
| 3 | Executor CI green | `npm run stabilization:validate-cesium-executor-v0` |
| 4 | Perception CI green | `npm run stabilization:validate-perception-alignment-v0` |
| 5 | No prod alignment strip | `VITE_RHIZOH_PERCEPTION_ALIGNMENT_DEBUG` unset |
| 6 | No spatial shell in prod env | `VITE_RHIZOH_SPATIAL_SHELL` unset |
| 7 | Activation decision recorded | `activation_decision_*.json` READY or explicit soft-open HOLD note |
| 8 | Invite pack tested | `cohortInvitePackV0` test green |
| 9 | Crash boundary | Gateway offline → degraded chat, not white screen |

---

## 10. Product rules (repeat)

1. **User never chooses system** — one world adapts ([`RHIZOH_T0_EXPERIENCE_SHELL_V1.md`](RHIZOH_T0_EXPERIENCE_SHELL_V1.md))
2. **Everything open visually ≠ everything unrestricted** — P2 sim/stub labeled
3. **Feature count < experience continuity**
4. **Events + invites = first revenue surface**
5. **Rhizoh orchestrates entry · Octo performs · execution stays invisible**

---

## 11. Sunday success definition

> *İlk yaşayan kullanıcılar sistemi içeride test eder.*

Success = user completes without knowing:

- alignment · fracture · executor · session graph schema

Success = user **does** feel:

- Rhizoh responds · Octo is present · Castle is home · invite/event is one tap from wheel

---

## 12. Immediate next implementation (post-plan)

| Priority | Item | Risk |
|----------|------|------|
| 1 | `RhizohExperienceSessionContextV0` read-model (local) | **✔** [`rhizohExperienceSessionContextV0.js`](../apps/client/src/rhizoh/experience/rhizohExperienceSessionContextV0.js) |
| 2 | V1.2 event poster + create in social drawer | **✔** [`rhizohEventSurfaceV12.js`](../apps/client/src/rhizoh/experience/rhizohEventSurfaceV12.js) · [`RhizohEventCreatePanelV12.jsx`](../apps/client/src/components/RhizohEventCreatePanelV12.jsx) |
| 3 | Cap Wheel spoke → orchestrated flow map doc in code | Partial ✔ (Create/Broadcast → greenroom event panel) |
| 4 | Invite join deep-link → T0 with context | **✔** URL `evp` hydrate + experience merge |
| 5 | Cross-device event catalog sync V1 | **✔** [`rhizohEventCatalogSyncV1.js`](../apps/client/src/rhizoh/experience/rhizohEventCatalogSyncV1.js) |
| 6 | Join moment + Cap Wheel Invite spoke | **✔** welcome + degrade + funnel ring |
| 7 | Sunday cohort UX (welcome · degrade · funnel) | **✔** [`useRhizohSundayCohortSurfaceV1.js`](../apps/client/src/rhizoh/experience/useRhizohSundayCohortSurfaceV1.js) |
| 8 | WebRTC / multi-sync | Post-READY |
