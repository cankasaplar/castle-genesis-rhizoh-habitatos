# Rhizoh Production Deployment Runbook v0

**Status:** ACTIVE · **SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohProductionDeploymentRunbookV0.js`

---

## 0. Deploy tanımı

Rhizoh deploy =

**Engine + SCR + Pet + Studio Organism + WAL + ICL + Castle + Co-presence + Organism Rhythm + UI surfaces**

- Tek sistem
- Tek runtime
- Çok yüzeyli projection
- **Tek dünya invariant**

Deploy ≠ code publish · **world continuity transfer event**

---

## 1. Pre-deploy gate (zorunlu)

Tüm gate'ler geçmeden deploy **yasak**.

### 1.1 Rhythm Gate (kritik)

```javascript
window.__rhizoh.deployRhythmGate.deploy_ready === true
```

| Metrik | Eşik |
|--------|------|
| `jitter_ms` | ≤ 64 |
| `studio_tick_ok` | ≥ 0.99 |
| `pet_continuity` | ≥ 0.99 |
| `icl_identity_ok` | `true` |
| `wal_chain_ok` | `true` |

```bash
npm run ops:production-rhythm-stress-v0
```

### 1.2 Identity Gate (ICL)

```javascript
window.__rhizoh.worldIdentityConsistency.equivalence.same_world === true
```

FAIL → **DEPLOY YASAK**

```bash
npm run ops:world-identity-consistency-v0
```

### 1.3 Coherence Gate (SCR + Castle)

```javascript
window.__rhizoh.castleCoherenceLock.projection_locked === true
```

### 1.4 Safety Gate (Agent / Pet / SCR boundaries)

- `agent.origination === false`
- `scr_bypass === false`
- `pet.owns_state === false`

### Combined (browser)

```javascript
import {
  primeProductionDeployReadinessV0,
  evaluatePreDeployGatesV0
} from "./rhizohProductionDeploymentRunbookV0.js";

await primeProductionDeployReadinessV0({ stressTicks: 600 });
evaluatePreDeployGatesV0(); // → window.__rhizoh.preDeployGates
```

CI:

```bash
npm run ops:production-deploy-gates-v0
npm run ops:production-deploy-pipeline-v0   # full build + ops bundle
```

---

## 2. Deploy pipeline (gerçek akış)

### 2.1 GitHub source control

| Branch | Ortam |
|--------|-------|
| `main` | production |
| `develop` | staging |
| `feature/*` | experiment |

Release tag: `v0.production-rhizoh.epoch.timestamp`

### 2.2 Build pipeline (CI)

GitHub Actions / local:

```bash
npm run build
npm run ops:production-rhythm-stress-v0
npm run ops:world-identity-consistency-v0
npm run ops:castle-coherence-hardening-v0
npm run ops:production-deploy-gates-v0
```

Deploy gate FAIL → **STOP DEPLOY**

Full client suite (peripheral — **non-blocking** for world deploy):

```bash
npm run ops:full-system-audit-v0
```

### 2.3 Artifact output

Build outputs (conceptual):

- `/dist/ui`
- `/dist/scr`
- `/dist/studio`
- `/dist/castle`
- `/dist/pet`

### 2.4 Render deploy (backend / runtime API)

Service: SCR runtime · WAL API · ICL service · co-presence sync

```bash
render deploy service rhizoh-core
```

Health: `/health` · `/world/heartbeat` · `/world/identity`

### 2.5 Firebase deploy (frontend + Studio UI)

```bash
npm run firebase:deploy:hosting
```

Targets: Studio UI · Cap Wheel · Drawer · Cesium shell · Pet marker overlay

### 2.6 rhizoh.com (edge / hosting)

```bash
vercel deploy --prod
# OR
cloudflare pages deploy
```

---

## 3. Live monitoring system

### 3.1 Core observability object

```javascript
window.__rhizoh.liveMonitor
```

```javascript
import { publishProductionLiveMonitorV0 } from "./rhizohProductionDeploymentRunbookV0.js";
publishProductionLiveMonitorV0();
```

### 3.2 Signals

| Domain | SSOT | Watch |
|--------|------|-------|
| **A. Rhythm** | `organismHeartbeat` · `organismRhythm` | `phase01`, `ok`, `max_jitter_ms` |
| **B. Identity** | `worldIdentityConsistency` | `same_world`, structural / identity_break |
| **C. SCR** | `presenceFrame` · stress `drift_trace` | tick rate, drift trace, latency |
| **D. Pet** | `petCitizen` | `inhabited`, continuity, `motion_frame_lock` |
| **E. Castle** | `castleCoherenceLock` | `projection_locked`, surface split |
| **F. Studio** | `studioProductionOrganism` | loop ok, tick rate, organism ok |

Anomaly scan:

```javascript
detectProductionAnomaliesV0(); // → window.__rhizoh.productionAnomalies
```

---

## 4. Anomaly signatures

### CRITICAL (auto rollback)

| Signature | Action |
|-----------|--------|
| `identity_break` / `same_world === false` | ROLLBACK IMMEDIATE |
| SCR fork explosion (`fork_risk`) | ROLLBACK IMMEDIATE |
| Pet detachment (`petCitizen.inhabited === false`) | ROLLBACK IMMEDIATE |

### WARNING

- `jitter_ms > 64`
- `castle_surface_split`
- `studio_tick_drift`
- `wal_chain_soft_fork`

### INFO

- cache warmup delay
- first paint latency
- SSR hydration mismatch

---

## 5. Rollback strategy (fail-safe)

### 5.1 Instant rollback trigger

```bash
git revert HEAD
# OR
vercel rollback
```

### 5.2 System-level rollback (logical)

```javascript
import {
  executeProductionRollbackV0,
  restoreWorldStateAtMsV0
} from "./rhizohProductionDeploymentRunbookV0.js";

await restoreWorldStateAtMsV0(lastStableMs);
await executeProductionRollbackV0();
```

Restores: last WAL snapshot · last ICL stable state · last SCR tick anchor

### 5.3 Emergency mode

```javascript
enableEmergencyModeV0("anomaly_A1");
// window.__rhizoh.emergencyMode === true
```

Behavior:

- disable Castle projection
- freeze SCR ticks
- keep Pet static
- keep Studio read-only

---

## 6. Deploy order (absolute sequence)

**DO NOT CHANGE ORDER**

1. Build CI
2. Identity check (ICL)
3. SCR stability check
4. WAL consistency
5. Pet inhabitation check
6. Studio organism check
7. Castle projection check
8. Firebase deploy
9. Render deploy
10. Edge deploy (rhizoh.com)
11. **60s live observation window**

Runtime activation (after infra deploy):

```javascript
await executeProductionDeploymentV0({ ... });
startPostDeployObservationV0({ onComplete: (r) => console.log(r) });
```

---

## 7. 60-second post-deploy window

Must stabilize:

- `organismHeartbeat` stable
- `same_world === true`
- `pet.inhabited === true`
- `studio_loop.ok === true`

```javascript
evaluatePostDeployWindowV0();
evaluateDeploySuccessConditionV0();
```

---

## 8. Final success condition

Deploy **SUCCESS** if:

- `same_world`
- `pet_inhabited`
- `scr_stable`
- `wal_chain_ok`
- `castle_projection_locked`
- `studio_loop_ok`

```javascript
evaluateDeploySuccessConditionV0(); // → window.__rhizoh.deploySuccessCondition
```

---

## Son mimari gerçek

Rhizoh production deploy artık **code publish değil** — **world continuity transfer event**.

---

## Related

- [`RHIZOH_PRODUCTION_RHYTHM_STRESS_V0.md`](RHIZOH_PRODUCTION_RHYTHM_STRESS_V0.md)
- [`RHIZOH_IDENTITY_CONSISTENCY_LAYER_V0.md`](RHIZOH_IDENTITY_CONSISTENCY_LAYER_V0.md)
- [`RHIZOH_ORGANISM_STABILIZATION_V0.md`](RHIZOH_ORGANISM_STABILIZATION_V0.md)
- [`RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md)
- [`RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md`](RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md)
