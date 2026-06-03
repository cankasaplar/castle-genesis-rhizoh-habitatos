# Rhizoh Deploy + Test Phase v0

**Status:** ACTIVE · **SPECFLOW:** ops / stabilization  
**Prerequisite:** [`RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md`](RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md)

Architecture is **locked**. This phase is the only permitted work stream: deploy · test · productization · stabilization.

---

## 0. Phase goal

Prove **LIVE WORLD ACTIVE** under v0.2 guarantees:

- ICL `same_world`
- Pet inhabited
- Castle projection locked
- SCR stable through 60s observation window
- Product surface read-only (no truth writes from UI)

---

## 1. Single command (local / CI)

```bash
npm run ops:deploy-test-phase-v0
```

Pipeline:

1. Production deploy gates (rhythm · ICL · castle · runbook)
2. World expansion layer tests
3. Build + world artifact verify
4. Bootstrap world runtime (Node harness)
5. Post-deploy monitor (60s compressed)

Dry-run full deploy (no infra CLI):

```bash
npm run ops:deploy-world-v0
# or
DRY_RUN=1 bash ops/deploy-world-v0.sh
```

---

## 2. Gate checklist

| Gate | Command | Pass criteria |
|------|---------|---------------|
| Rhythm stress | `npm run ops:production-rhythm-stress-v0` | Studio loop · WAL · ICL rhythm |
| ICL harness | `npm run ops:world-identity-consistency-v0` | `same_world` |
| Castle coherence | `npm run ops:castle-coherence-hardening-v0` | `projection_locked` |
| Deploy runbook | `npm run ops:production-deploy-gates-v0` | Pre-deploy gates green |
| World expansion | `npm run ops:world-expansion-v0` | 7/7 tests |
| Build | `npm run build:ci -w apps/client` | CI build |
| Artifacts | `node scripts/verify-world-artifacts-v0.mjs` | `dist/{ui,scr,studio,castle,pet}` |
| Bootstrap | `node scripts/bootstrap-world-v0.mjs` | `worldBootStatus.alive` |
| Monitor | `node scripts/post-deploy-monitor-v0.mjs --compressed` | SCR + ICL + Pet + Castle + WAL |

Build + deploy gates (no full suite):

```bash
npm run ops:production-deploy-pipeline-v0
```

Peripheral full-suite audit (**non-blocking**, separate lane):

```bash
npm run ops:full-system-audit-v0
```

Use after refactors · voice migration · experimental regression sweep — not before world deploy.

---

## 3. Production deploy flow (infra)

Only after local gates pass. **Locked manual sequence:** [`RHIZOH_PROD_FLOW_V0.2.md`](RHIZOH_PROD_FLOW_V0.2.md)

```
git push main → Render Manual Deploy (latest) → 60s smoke → rhizoh.com first paint
```

```bash
# GitHub Actions (push main)
# .github/workflows/rhizoh-production.yml

# Manual full deploy (secrets required)
bash ops/deploy-world-v0.sh
# workflow_dispatch + deploy_infra=true on rhizoh-production.yml
```

| Target | Role |
|--------|------|
| **Render** `rhizoh-core` | CORE runtime · `/health` · `/world/heartbeat` |
| **Firebase** | Studio UI hosting |
| **Edge** `rhizoh.com` | Product surface |

Render spec: [`ops/rhizoh-core.render.yaml`](../ops/rhizoh-core.render.yaml)

---

## 4. Post-deploy validation (60s window)

```javascript
window.__rhizoh.deployStatus
window.__rhizoh.liveMonitor
```

SUCCESS requires:

- SCR stable
- ICL `same_world`
- Pet inhabited
- Studio loop ok
- Castle projection locked
- WAL chain ok

Failure protocol:

```bash
bash ops/rollback-world-v0.sh
```

---

## 5. Product surface smoke (manual)

After edge deploy, verify on **www.rhizoh.com**:

| Check | Expected |
|-------|----------|
| World entry | GLOBE home — not map-as-world |
| Pet | Inhabited indicator visible |
| Studio | Observation surface; suggestions only |
| Cap Wheel | Visible on world surface |
| SCR | Live coherence readable (debug/advanced) |
| WAL replay | Read-only viewer; no writes from UI |

Product topology: [`rhizohProductTopologyV0.js`](../apps/client/src/rhizoh/product/rhizohProductTopologyV0.js)

---

## 6. Explicitly out of scope (this phase)

- New CORE modules or frozen `phase*.js` edits
- New ontology or layer design
- Multi-region SCR **production** federation
- Castle graph **external** networking
- Studio live editor **UI wiring** (beyond suggestion API)
- Hot reload **infra** zero-downtime

Track these as stabilization backlog — not architecture changes.

---

## 7. Exit criteria (phase complete)

| # | Criterion |
|---|-----------|
| 1 | `ops:deploy-test-phase-v0` green in CI on `main` |
| 2 | Staging deploy smoke: bootstrap + 60s monitor pass |
| 3 | Product surface manual smoke on www.rhizoh.com |
| 4 | Rollback drill documented and tested once |
| 5 | No P0 truth-boundary violations (product → SCR/WAL write) |

---

## Related

- [`RHIZOH_PROD_FLOW_V0.2.md`](RHIZOH_PROD_FLOW_V0.2.md)
- [`RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md`](RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md)
- [`RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md`](RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md)
- [`RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md)
