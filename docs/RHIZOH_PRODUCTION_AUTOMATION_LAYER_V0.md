# Rhizoh Production Automation Layer v0

**Status:** ACTIVE · **SPECFLOW:** `RESEARCH-ONLY`  
**Architecture lock:** [`RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md`](RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md)  
**Deploy phase:** [`RHIZOH_DEPLOY_TEST_PHASE_V0.md`](RHIZOH_DEPLOY_TEST_PHASE_V0.md) · `npm run ops:deploy-test-phase-v0`  
**Manual prod flow:** [`RHIZOH_PROD_FLOW_V0.2.md`](RHIZOH_PROD_FLOW_V0.2.md) — git push → Render manual deploy → 60s smoke → first paint  
**Tek komut:** `bash ops/deploy-world-v0.sh` · `npm run ops:deploy-world-v0`

---

## 0. Kavram

Sistem artık **deploy eden sistem değil** — **world runtime orchestrator**.

Rhizoh deploy = Engine + SCR + Pet + Studio Organism + WAL + ICL + Castle + Co-presence + Organism Rhythm + UI surfaces

- Tek sistem · tek runtime · çok yüzeyli projection
- **Tek dünya invariant**

Deploy = **world continuity transfer event** (code publish değil)

---

## 1. Tek komut

```bash
bash ops/deploy-world-v0.sh
# OR (cross-platform)
npm run ops:deploy-world-v0

# CI / local without infra CLI
DRY_RUN=1 bash ops/deploy-world-v0.sh
```

Pipeline:

1. **Deploy gates only** (rhythm · ICL · castle · runbook bundle)
2. Build + world artifact materialization
3. Render → Firebase → Edge (skipped when `DRY_RUN=1`)
4. `bootstrap-world-v0.mjs`
5. `post-deploy-monitor-v0.mjs` (60s window; `--compressed` in CI)

**Production deploy command (locked):**

```bash
npm run ops:deploy-world-v0
# or
npm run ops:deploy-test-phase-v0
```

`FULL_TESTS` / `test:all` **never** runs inside deploy pipelines.

---

## 1.1 Test tiers (locked separation)

| Tier | Scope | Blocks deploy? | Command |
|------|--------|----------------|---------|
| **Deploy gates** | rhythm · ICL · castle · runbook · bootstrap · 60s monitor | **Yes** | `ops:deploy-test-phase-v0` |
| **System audit** | full client vitest suite (voice v3 · whisper · transport · experimental) | **No** | `ops:full-system-audit-v0` |
| **Orphan / experimental** | deprecated voice layers · shadow adapters | **No** | triage in cleanup lane |

Peripheral sensory stack failures do **not** invalidate world deploy when deploy gates pass.

---

## 2. Ana dosyalar

| Dosya | Rol |
|-------|-----|
| [`ops/deploy-world-v0.sh`](../ops/deploy-world-v0.sh) | Shell entry |
| [`scripts/deploy-world-v0.mjs`](../scripts/deploy-world-v0.mjs) | Node orchestrator |
| [`scripts/bootstrap-world-v0.mjs`](../scripts/bootstrap-world-v0.mjs) | World bootstrap CLI |
| [`scripts/post-deploy-monitor-v0.mjs`](../scripts/post-deploy-monitor-v0.mjs) | 60s stability window |
| [`apps/client/src/rhizoh/runtime/rhizohWorldBootstrapV0.js`](../apps/client/src/rhizoh/runtime/rhizohWorldBootstrapV0.js) | Browser + runtime bootstrap |
| [`ops/rollback-world-v0.sh`](../ops/rollback-world-v0.sh) | Fail-safe rollback |

---

## 3. World artifacts

Post-build:

```bash
node scripts/materialize-world-artifacts-v0.mjs
node scripts/verify-world-artifacts-v0.mjs
```

Layout:

```
dist/ui
dist/scr
dist/studio
dist/castle
dist/pet
dist/world-manifest.v0.json
```

Edge boot loader (manifest):

```javascript
window.__RHIZOH_BOOT = { mode: "t0", source: "studio", hydrate: true }
```

---

## 4. Bootstrap (browser)

```javascript
import { bootstrapWorldV0 } from "./rhizohWorldBootstrapV0.js";
await bootstrapWorldV0();
// → window.__rhizoh.worldBootStatus
```

Stack order: SCR → WAL → ICL → Pet → Studio organism → Castle → Co-presence

---

## 5. Post-deploy monitor

```javascript
window.__rhizoh.deployStatus
```

SUCCESS only if:

- SCR stable
- ICL `same_world`
- Pet inhabited
- Studio loop ok
- Castle projection locked
- WAL chain ok

---

## 6. GitHub Actions

[`.github/workflows/rhizoh-production.yml`](../.github/workflows/rhizoh-production.yml)

- **push main:** CI gates + bootstrap + compressed monitor
- **workflow_dispatch + deploy_infra=true:** full infra deploy (secrets required)

---

## 7. Render — rhizoh-core

[`ops/rhizoh-core.render.yaml`](../ops/rhizoh-core.render.yaml)

Health: `/health` · `/world/heartbeat` · `/world/identity`

---

## 8. Failure protocol

CRITICAL → auto rollback recommendation:

```javascript
if (!same_world || !pet.inhabited) triggerRollback()
```

```bash
bash ops/rollback-world-v0.sh
```

---

## Related

- [`RHIZOH_PROD_FLOW_V0.2.md`](RHIZOH_PROD_FLOW_V0.2.md)
- [`RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md`](RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md)
- [`RHIZOH_DEPLOY_TEST_PHASE_V0.md`](RHIZOH_DEPLOY_TEST_PHASE_V0.md)
- [`RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md`](RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md)
- [`RHIZOH_WORLD_EXPANSION_LAYER_V0.1.md`](RHIZOH_WORLD_EXPANSION_LAYER_V0.1.md)
- [`RHIZOH_PRODUCTION_RHYTHM_STRESS_V0.md`](RHIZOH_PRODUCTION_RHYTHM_STRESS_V0.md)
