# Rhizoh Production Flow v0.2

**Status:** **LOCKED** · **SPECFLOW:** ops SSOT  
**Parent:** [`RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md`](RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md)

Deploy is **not publishing** — it is a **world runtime start action**.

Render = **T0 bootstrap host** (not the world runner). Truth lives in SCR · ICL · WAL · Pet · Studio.

---

## Correct chain (locked)

```
code final → git push → Render manual deploy (latest commit) → 60s smoke → browser first-paint
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

**After push only** — deploy latest commit, not stale build.

Render dashboard → **rhizoh-core** → **Manual Deploy** → latest commit

Spec: [`ops/rhizoh-core.render.yaml`](../ops/rhizoh-core.render.yaml)

| Setting | Value |
|---------|--------|
| Build | `npm ci && npm run build:ci -w apps/client` |
| Start | `node apps/gateway/src/server.js` |
| Health | `/health` · `/world/heartbeat` · `/world/identity` |

Render triggers: build · static bundle · runtime bootstrap wiring.

---

## Step 3 — Expected build / boot signals

During Render build or local bootstrap, expect (conceptual order):

| Signal | Meaning |
|--------|---------|
| `rhizohWorldBootstrapV0.js` loaded | Bootstrap entry |
| SCR initialized | T0 frame + tick |
| ICL check passed | `same_world` |
| WAL hydrated (B2+) | Chain continuity |
| Pet inhabitance active | Validator present |
| Studio organism initialized | Loop ready |
| Castle projection ready | `projection_locked` |

Local preflight:

```bash
node scripts/bootstrap-world-v0.mjs --skip-gates
# → "World is alive"
```

---

## Step 4 — 60s post-deploy smoke (critical)

Within **1 minute** of deploy, verify in browser console or Node harness:

```javascript
window.__rhizoh.deployStatus
window.__rhizoh.liveMonitor
```

| Field | Expected |
|-------|----------|
| `scr` | alive / stable |
| `icl` | `same_world` |
| `pet` | inhabited |
| `castle` | coherent / projection locked |
| `wal_chain_ok` | `true` |

CLI (compressed):

```bash
node scripts/post-deploy-monitor-v0.mjs --compressed
# → "World stable — deployment complete"
```

---

## Step 5 — rhizoh.com first paint

Open **www.rhizoh.com** after edge/Firebase sync.

| Window | Expected |
|--------|----------|
| **0–3s** | T0 frame visible · no blank screen |
| **3–10s** | SCR tick · heartbeat starts |
| **10–30s** | Pet appear (Cesium / marker) · Studio strip mounts |

Product surface = **world window** (read-only). See [`RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md`](RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md) §4.

---

## Rollback plan (must be ready)

If post-deploy smoke fails:

| Symptom | Action |
|---------|--------|
| SCR dead | Rollback |
| ICL mismatch | Rollback |
| Pet missing | Rollback |

```bash
git revert HEAD
git push origin main
# Render auto-redeploys from reverted commit
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

Full suite audit (separate lane):

```bash
npm run ops:full-system-audit-v0
```

---

## Related

- [`RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md`](RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md)
- [`RHIZOH_DEPLOY_TEST_PHASE_V0.md`](RHIZOH_DEPLOY_TEST_PHASE_V0.md)
- [`RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md`](RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md)
