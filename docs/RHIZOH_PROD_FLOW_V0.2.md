# Rhizoh Production Flow v0.2

**Status:** **LOCKED** · **SPECFLOW:** ops SSOT  
**Parent:** [`RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md`](RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md)

> **System definition:** This record proves Rhizoh is **alive**, not merely **running**.  
> *(Bu kayıt, Rhizoh'un "çalıştığını" değil, "yaşadığını" kanıtlar.)*

| System phase | Status |
|--------------|--------|
| World OS v0.2 final lock | **LOCKED** @ `2d2f883` |
| First living world (prod) | **RECORDED** @ `3400b3b` · 2026-06-03 |
| CI deploy gates | **ALL GATES PASS** · 2026-06-03 |
| **Observation phase** | **ACTIVE** · 24–48h from 2026-06-03 · **no core changes** |
| Full system audit lane | **DEFERRED** until observation completes |
| Product layer activation | **PENDING** (Voice v3.1 · Castle Socials · profiles · publishing) |

Deploy is **not publishing** — it is a **world runtime start action**.

Render = **T0 bootstrap host** (gateway). Truth lives in SCR · ICL · WAL · Pet · Studio.  
Client = **Firebase Hosting** (rhizoh.com product surface).

---

## First Living World Record

**Moment:** 2026-06-03 · World OS v0.2 first prod continuity transfer with full browser observability  
**Label:** *İlk yaşayan dünya* — canonical snapshot for replay, audit, and future diff.

### Deploy pin

| Field | Value |
|-------|--------|
| **Git commit (client + bridge)** | [`3400b3b`](https://github.com/cankasaplar/castle-genesis-rhizoh-habitatos/commit/3400b3b) — `Wire prod browser observability bridge for window.__rhizoh world OS keys.` |
| **Prior architecture lock** | [`2d2f883`](https://github.com/cankasaplar/castle-genesis-rhizoh-habitatos/commit/2d2f883) — `world-os-v0.2-final-architecture-lock` |
| **Branch** | `main` |
| **Deploy track** | `spatial-main` ([`scripts/rhizoh-spatial-main-prod-profile.mjs`](../scripts/rhizoh-spatial-main-prod-profile.mjs)) |

### Firebase (client edge)

| Field | Value |
|-------|--------|
| **Workflow** | [`.github/workflows/deploy-hosting.yml`](../.github/workflows/deploy-hosting.yml) — manual `workflow_dispatch` |
| **Project** | `castle-genesis` |
| **Commit deployed** | `3400b3b` |
| **Run result** | Success · ~1m 6s |
| **Prod URL** | https://rhizoh.com |
| **Served bundle** | `/assets/index-C_Zwx7x_.js` · `/assets/index-OFoGPeoa.css` |
| **Prior bundle (pre-bridge)** | `/assets/index-C4slXIMN.js` |

### Render (gateway host)

| Field | Value |
|-------|--------|
| **Service** | `castle-genesis-rhizoh-habitatos` / spec [`ops/rhizoh-core.render.yaml`](../ops/rhizoh-core.render.yaml) |
| **Role** | T0 bootstrap host · LLM gateway · `/health` |
| **Base URL** | `https://castle-genesis-rhizoh-habitatos.onrender.com` |
| **Health snapshot (2026-06-03)** | `{ ok: true, service: "castle-gateway", wsPort: 10000, persistence: "file", presenceMesh: "sse" }` |
| **Note** | `3400b3b` was **client-only** (observability bridge). Gateway redeploy not required for this smoke pass. |

### Local CI build artifact (pre-push gate)

| Field | Value |
|-------|--------|
| **Command** | `npm run ops:deploy-test-phase-v0` |
| **Result** | **ALL GATES PASS** (2026-06-03) |
| **Local dist bundle** | `index-CgRg771F.js` (hash differs from Firebase — expected; same commit tree) |
| **Artifacts verified** | `dist/ui` · `dist/scr` · `dist/studio` · `dist/castle` · `dist/pet` |

### Bootstrap result (CLI + browser)

**Node bootstrap** (`scripts/bootstrap-world-v0.mjs` via deploy-test-phase):

```json
{
  "schema": "castle.rhizoh.world_bootstrap.v0",
  "ok": true,
  "mode": "production_world",
  "runtime_ok": true,
  "gates_ok": false,
  "wal_entry_id": "wal_1780526623641_1"
}
```

**60s compressed monitor** (deploy-test-phase):

| Signal | Value |
|--------|-------|
| scr | true |
| icl | true |
| pet | true |
| studio | true |
| castle | true |
| organism | true |
| wal_chain_ok | true |

**Browser boot timeline** (rhizoh.com · hard refresh · returning user · `route=app`):

| Δms | Event |
|-----|--------|
| +10 | `boot.ontological_gate` · CONTINUITY_OK |
| +14 | `boot.world_observability` · presence + liveMonitor bridge active |
| +15 | `boot.rhizoh_ingress` · route=app |
| +18 | `boot.react_mount` |
| +497 | `app.engine.ready` |
| +945 | `app.gateway.connected` |

### Prod browser smoke (verified 2026-06-03)

```javascript
window.__rhizoh?.presenceState?.rhizoh_is_present        // true
window.__rhizoh?.continuityFirstPaint?.ok                // true
window.__rhizoh?.liveMonitor?.schema                     // "castle.rhizoh.live_monitor.v0"
window.__rhizoh?.deployStatus?.schema                    // "castle.rhizoh.live_monitor.v0" (alias)
window.__rhizoh?.reslPresentation?.continuityLine        // "Rhizoh burada · hazır"
window.__rhizoh?.presenceFrame?.coherenceId               // "0:0:none:breathe"
Object.keys(window.__rhizoh).length                       // 58 (was 13 pre-bridge)
```

### liveMonitor snapshot (prod session · schema reference)

Captured keys present on first paint after bridge. Full object refreshes every 5s via `rhizohProdWorldObservabilityBridgeV0`.

```json
{
  "schema": "castle.rhizoh.live_monitor.v0",
  "rhythm": { "ok": true, "phase01": "<number|null>", "max_jitter_ms": "<number|null>" },
  "identity": {
    "same_world": true,
    "drift_class": null,
    "structural": false,
    "identity_break": false,
    "chain_ok": true
  },
  "scr": { "coherence_id": "0:0:none:breathe", "tick_rate_ok": true },
  "pet": { "inhabited": true, "owns_state": false },
  "castle": { "projection_locked": true },
  "studio": { "loop_ok": true },
  "emergency_mode": false
}
```

Re-capture anytime:

```javascript
JSON.parse(JSON.stringify(window.__rhizoh.liveMonitor))
```

### deployStatus snapshot

**SSOT:** `window.__rhizoh.liveMonitor`  
**Alias:** `window.__rhizoh.deployStatus` (set by observability bridge for ops smoke compatibility)

```javascript
window.__rhizoh.deployStatus === window.__rhizoh.liveMonitor  // true
```

Historical note: older docs referenced `deployStatus` as a separate SSOT — prod now aliases to `liveMonitor`.

### worldIdentity snapshot (prod session · schema reference)

Published under `window.__rhizoh.worldIdentity` when WAL chain advances.

```json
{
  "schema": "castle.rhizoh.world_identity.v0",
  "world_identity_id": "world_id_<hash12>",
  "identity_version": "<number>",
  "chain_head_hash": "h<hex>",
  "last_entry_id": "wal_<ts>_<seq>",
  "last_coherence_id": "0:0:none:breathe",
  "experiential_now_id": "<string|null>",
  "atMs": "<number>"
}
```

Cross-check with ICL:

```javascript
window.__rhizoh.worldIdentityConsistency?.equivalence?.same_world  // true
window.__rhizoh.worldIdentityConsistency?.drift?.drift_class       // null | "soft" | ...
```

Re-capture:

```javascript
JSON.parse(JSON.stringify({
  worldIdentity: window.__rhizoh.worldIdentity,
  icl: window.__rhizoh.worldIdentityConsistency
}))
```

---

## Post-deploy phases (recommended order)

### Phase A — Observation window (24–48h) · **ACTIVE**

**Started:** 2026-06-03 · **Ends:** ~2026-06-05  
**Rule:** No new core layers · no voice fixes · no engine changes. **Observe only.**

Watch only:

```javascript
window.__rhizoh.deployStatus
window.__rhizoh.liveMonitor
window.__rhizoh.organismRhythm
window.__rhizoh.worldIdentity
window.__rhizoh.worldWalPersistence
```

| Watch for | Symptom |
|-----------|---------|
| Identity drift | `liveMonitor.identity.drift_class !== null` · `same_world === false` |
| WAL growth pattern | `worldIdentity.identity_version` runaway · `worldWalPersistence` chain unstable |
| Rhythm jitter | sustained vs spike — `liveMonitor.rhythm.max_jitter_ms` · `organismRhythm.ok === false` |
| Castle projection split | `liveMonitor.castle.castle_surface_split === true` |
| Memory leak | `Object.keys(window.__rhizoh).length` creep · tab RAM growth |

**Wrong reflex now:** new layers · voice fixes · engine patches.  
**Right reflex now:** let the system live · watch drift · prepare product layer transition.

### Phase B — Full System Audit Lane (non-blocking) · **DEFERRED**

**Do not run during observation.** Deploy is green; audit would add noise before stability is verified.

After observation completes:

```bash
npm run ops:full-system-audit-v0
```

Triage lane for peripheral failures:

- voice engine v3
- whisper artifacts
- transport
- transcription

Deploy gates remain: `npm run ops:deploy-test-phase-v0` only.

### Phase C — Product Layer iteration

World OS core is **stable enough**. Next value is product surface — not new core ontology.

| Tier | Scope | Status |
|------|--------|--------|
| **Core (frozen)** | SCR · ICL · WAL · Pet · Castle · Studio Organism | Do not redesign |
| **Product surface** | Voice · Social · Agents · Onboarding · Content · Broadcasts · Castle Socials | Primary energy from here |

**Voice roadmap (product — not World OS):**

| Version | Focus |
|---------|--------|
| Voice v3.1 | directed speech · ambient separation · speaker confidence |
| Voice v3.2 | interruption · barge-in · overlap recovery |
| Voice v4 | memory-aware · castle-aware · pet-aware dialogue |

**Castle Socials timing:** no longer blocked. Preconditions met: ICL · co-presence · castle projection · agent boundary · castle hardening. Castle Socials = **multi-user surface of the same world**, not a parallel world.

**Rhizoh.com product direction:**

> World OS dış dünyaya açılan sosyal ve üretim yüzeyi.

Next product work (examples): onboarding · castle profiles · pet profiles · shared presence · publications · broadcasts · creator tools · studio experiences.

---

## Correct deploy chain (locked)

```
code final → git push → Render manual deploy (gateway, when gateway changes)
           → Firebase manual deploy (client) → 60s smoke → browser first-paint
```

Pre-push local gate (recommended):

```bash
npm run ops:deploy-test-phase-v0
```

---

## Step 1 — Pin git state

Render deploys **git only**. Commit and push before any manual deploy.

```bash
git status
git add .
git commit -m "world-os-v0.2-final-architecture-lock"
git push origin main
```

Verify CI gates green on `main` ([`.github/workflows/rhizoh-production.yml`](../.github/workflows/rhizoh-production.yml)).

---

## Step 2 — Render manual deploy

**After push only** — when gateway/runtime changes.

Render dashboard → **rhizoh-core** → **Manual Deploy** → latest commit

Spec: [`ops/rhizoh-core.render.yaml`](../ops/rhizoh-core.render.yaml)

| Setting | Value |
|---------|--------|
| Build | `npm ci && npm run build:ci -w apps/client` |
| Start | `node apps/gateway/src/server.js` |
| Health | `/health` |

---

## Step 3 — Firebase manual deploy (client)

GitHub Actions → **Deploy Firebase (hosting + rules)** → track `spatial-main` → target commit.

Expect new `/assets/index-*.js` hash after client changes.

---

## Step 4 — Expected build / boot signals

| Signal | Meaning |
|--------|---------|
| `boot.world_observability` | Observability bridge active (+14ms typical) |
| `boot.ontological_gate` CONTINUITY_OK | Pre-render gate passed |
| `app.engine.ready` | T0 + world loop mounted |
| `app.gateway.connected` | Render gateway reachable |

Local preflight:

```bash
node scripts/bootstrap-world-v0.mjs --skip-gates
# → "World is alive"
```

---

## Step 5 — 60s post-deploy smoke (critical)

Within **1 minute** of deploy, verify in browser console:

```javascript
window.__rhizoh.deployStatus
window.__rhizoh.liveMonitor
window.__rhizoh.presenceState?.rhizoh_is_present
window.__rhizoh.continuityFirstPaint?.ok
```

| Field | Expected |
|-------|----------|
| `presenceState.rhizoh_is_present` | `true` |
| `liveMonitor.schema` | `castle.rhizoh.live_monitor.v0` |
| `deployStatus` | alias of `liveMonitor` |
| `continuityFirstPaint.ok` | `true` |
| scr / icl / pet / castle | alive via `liveMonitor` sub-objects |

CLI (compressed):

```bash
node scripts/post-deploy-monitor-v0.mjs --compressed
# → "World stable — deployment complete"
```

---

## Step 6 — rhizoh.com first paint

| Window | Expected |
|--------|----------|
| **0–20ms** | Observability bridge · `presenceState` published |
| **0–3s** | T0 frame visible · no blank screen |
| **3–10s** | SCR tick · heartbeat starts |
| **10–30s** | Pet · Studio strip · gateway connected |

Product surface = **world window** (read-only). See architecture lock §4.

---

## Rollback plan (must be ready)

If post-deploy smoke fails:

| Symptom | Action |
|---------|--------|
| SCR dead | Rollback |
| ICL mismatch | Rollback |
| Pet missing | Rollback |
| Observability bridge missing | Redeploy Firebase @ known-good commit |

```bash
git revert HEAD
git push origin main
# Re-run Firebase deploy workflow on reverted commit
```

Or:

```bash
bash ops/rollback-world-v0.sh
```

---

## What NOT to do

| Wrong | Why |
|-------|-----|
| Render deploy before `git push` | Stale / wrong commit |
| `FULL_TESTS=1` in deploy path | Peripheral suite — non-blocking |
| Treat deploy as "static publish" | Deploy = world runtime start |
| New core layers during 24–48h observation | Stabilize before product iteration |

Full suite audit (separate lane):

```bash
npm run ops:full-system-audit-v0
```

---

## Related

- [`RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md`](RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md)
- [`RHIZOH_DEPLOY_TEST_PHASE_V0.md`](RHIZOH_DEPLOY_TEST_PHASE_V0.md)
- [`RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md`](RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md)
- [`apps/client/src/rhizoh/runtime/rhizohProdWorldObservabilityBridgeV0.js`](../apps/client/src/rhizoh/runtime/rhizohProdWorldObservabilityBridgeV0.js)
