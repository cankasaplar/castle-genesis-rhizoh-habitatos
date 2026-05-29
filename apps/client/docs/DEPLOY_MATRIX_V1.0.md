# Deploy Matrix v1.0 — Single File SSOT

**Tag:** `CORE-ELIGIBLE` · **Status:** SSOT v1.0  
**Purpose:** One table for env × authority × critical flags × rollback × demo/prod posture.  
**Do not duplicate secrets here** — values live in `.env.*.example` and secret stores.

| Related | Path / command |
|---------|----------------|
| Client env templates | [`../.env.example`](../.env.example) · [`../.env.staging.example`](../.env.staging.example) · [`../.env.production.example`](../.env.production.example) |
| Gap narrative | [`PRODUCT_LAUNCH_GAP_FINAL_FOUR_V1.0.md`](./PRODUCT_LAUNCH_GAP_FINAL_FOUR_V1.0.md) §1 |
| Activation (full) | [`docs/RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](../../../docs/RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md) |
| Go-live one page | [`GO_LIVE_CHECKLIST_ONE_PAGE_V1.0.md`](./GO_LIVE_CHECKLIST_ONE_PAGE_V1.0.md) |
| Phase A living shell | [`docs/ops/PHASE_A_LIVING_SHELL_PASS_V1.0.md`](../../../docs/ops/PHASE_A_LIVING_SHELL_PASS_V1.0.md) |
| Spatial shell lock | [`docs/ops/SPATIAL_SHELL_LOCK_V1.0.md`](../../../docs/ops/SPATIAL_SHELL_LOCK_V1.0.md) |
| T0 interface lock | [`docs/ops/T0_INTERFACE_LOCK_V1.0.md`](../../../docs/ops/T0_INTERFACE_LOCK_V1.0.md) |
| Phase 2 cohort ops | [`docs/ops/PHASE2_CONTROLLED_REALITY_TEST_V1.0.md`](../../../docs/ops/PHASE2_CONTROLLED_REALITY_TEST_V1.0.md) |
| Phase 0 legal-lite | [`docs/legal/PHASE0_MEMORY_ERASURE_USER_FACING_V0.1.md`](../../../docs/legal/PHASE0_MEMORY_ERASURE_USER_FACING_V0.1.md) |

---

## 1. Environment rows (canonical)

| Row ID | Environment | Build / copy | Authority profile | Primary client env file |
|--------|-------------|--------------|-------------------|-------------------------|
| **E0** | Local dev | `vite` / `npm run dev -w apps/client` | (unset or `staging` for substrate experiments) | `.env.local` from `.env.example` |
| **E1** | Staging | CI or manual staging build | **`staging`** | `.env.staging` from `.env.staging.example` |
| **E2** | Production | Firebase Hosting / prod pipeline | **`production`** | `.env.production` from `.env.production.example` |
| **E3** | Demo / survival | Same artifact as E2 *or* E0 with **demo flags** | Prefer **`staging`** or strict prod with **world off** | See §4 “Demo vs prod” |
| **E2-F** | Founder observe (MODE 1) | Local or staging host | **`production`** or `staging` | `.env.local` / staging | Debug on; allowlist = founder only |
| **E2-C** | Cohort reality test (MODE 2) | `rhizoh.com` prod host | **`production`** | `.env.production` cohort row | See §6 — **not** public launch |
| **E2-T0** | T0 full monolith (swarm + HUD) | `deploy_track=t0-interface-lock` | **`production`** | `.env.t0.example` | Branch `t0-interface-lock` @ `8bd4ff9` |
| **E2-S** | Spatial shell (main) | `deploy_track=spatial-main` + `VITE_WORLD_LAYER=1` secret | **`production`** | `.env.production` + world on | Lighter than T0; `RhizohSpatialWorldShell` |

**Invariant:** `VITE_GATEWAY_HTTP`, `VITE_GATEWAY_WS`, `VITE_LIVE_GATEWAY_BASE` must share one Render (or chosen) **origin** per environment — see comments in `.env.production.example` (SSE vs LLM drift).

---

## 2. Flag matrix (v1.0 — group by concern)

Legend: **P** = production example default · **S** = staging example emphasis · **L** = local common · **—** = typically off / commented.

| Flag | Concern | E0 Local | E1 Staging | E2 Prod | E3 Demo |
|------|---------|----------|------------|---------|---------|
| `VITE_CASTLE_AUTHORITY_PROFILE` | Seal / WAL strictness | L: varies | **S: staging** | **P: production** | **staging** or prod + world off |
| `VITE_DEBUG` | Debug umbrella | L: `1` ok | S: often `1` for hub | **P: `0`** | `0` for public demo |
| `VITE_WORLD_LAYER` | Cesium / REAL_MAP | L/S: often off | S: optional | **P: off / false** (Genesis-first) | **off** |
| `VITE_GATEWAY_HTTP` / `VITE_GATEWAY_WS` / `VITE_LIVE_GATEWAY_BASE` | Live backend | L: localhost:8090 | S: staging host | P: prod Render host | Same as row; **never** mixed origins |
| `VITE_GATEWAY_TOKEN` | Auth to gateway | Must match `CASTLE_GATEWAY_TOKEN` on that host | Same | Same | Same |
| `VITE_WAL_GEOMETRY_INGRESS` | Substrate ingress | L: optional | **S: `1`** in example | P: commented `0` | **off** unless staged demo |
| `VITE_WORLD_RUNTIME_DAEMON` | Daemon | L: optional | **S: `1`** | P: off | **off** |
| `VITE_PEER_WAL_CONVERGENCE` | WS WAL | With daemon + WS | **S: `1`** | P: off | **off** |
| `VITE_REALITY_SEAL_PERSIST` / `VITE_REALITY_SEAL_HEARTBEAT` | Sealer persist | L: dev only | S: `0` in example | P: off until gated | **off** |
| `VITE_SUBSTRATE_HEALTH_REPORT` | Ops metrics | L: optional | **S: `1`** | P: optional gated | Optional |
| `VITE_SUBSTRATE_CONTINUITY_IDB` | IDB continuity | L: `1` when testing | S: `0` default | P: gated | **off** for simple demo |
| `VITE_SPIRAL_MMO_PERCEPTION_BRIDGE` | Rhizoh ↔ Spiral copy | `0` / unset | Same | Same | **off** |
| `VITE_SPIRAL_MMO_AGREEMENT_LAYER` | Agreement layer copy | `0` / unset | Same | Same | **off** |
| `VITE_RHIZOH_PHASE1_SIGNAL` | Data-plane activation | **Must not be `1` in tracked prod** (activation checklist R3) | Staging-only after READY | **off** until ops READY | **off** |

**Spiral / Rhizoh CI:** `npm run spiral:validate-rhizoh-boundary` — [`scripts/validateSpiralRhizohBoundaryV1.mjs`](../../../scripts/validateSpiralRhizohBoundaryV1.mjs)

---

## 3. Rollback (v0 → v1 posture)

| Step | Action |
|------|--------|
| R1 | **Freeze artifact:** redeploy **previous** known-good Firebase Hosting release (Hosting rollback) or re-run pipeline from pinned git tag. |
| R2 | **Config rollback:** restore previous `.env.production` (or Hosting env vars) from secret manager / ops vault — especially `VITE_GATEWAY_*` + token. |
| R3 | **Kill switch:** set `VITE_RHIZOH_PHASE1_SIGNAL=0` (or omit); redeploy client — data-plane remains inert per [`phase1ActivationGateV0.js`](../src/rhizoh/ingress/phase1ActivationGateV0.js). |
| R4 | **Authority softening (emergency):** *only* with ops sign-off: temporary `VITE_CASTLE_AUTHORITY_PROFILE=staging` on a **dedicated** staging host — **not** as silent prod downgrade. |
| R5 | **Gateway:** roll back Render deployment to previous image; confirm `CASTLE_GATEWAY_TOKEN` still matches client `VITE_GATEWAY_TOKEN`. |

**v0 → v1:** “v0” = inert ingress + static shell; “v1” = any new flag bundle after signed READY + checklist. Rollback means reverting to last **documented** matrix row (E2 + previous flag set).

---

## 4. Demo vs production switch

| Mode | Rule |
|------|------|
| **Production user surface** | E2 + `VITE_DEBUG=0` + `VITE_CASTLE_AUTHORITY_PROFILE=production` + world layer off unless explicitly approved + no Phase1 signal until READY. |
| **Public demo / investor** | E3: same build as prod **or** trimmed build; **must** have `VITE_DEBUG=0`, gateway token valid or **graceful** empty-gateway copy (see `castleFlightConfig` / demo path in comments); no substrate flags unless demo is explicitly substrate-staged. |
| **Internal demo** | E1 or E0 with `VITE_DEBUG=1` — never ship this bundle to rhizoh.com production host. |

**Anti-pattern:** Production hostname with staging token or two different gateway origins (LLM vs SSE).

---

## 6. Launch modes (Controlled Reality Test)

Full runbook: [`PHASE2_CONTROLLED_REALITY_TEST_V1.0.md`](../../../docs/ops/PHASE2_CONTROLLED_REALITY_TEST_V1.0.md). Legal-lite: [`PHASE0_MEMORY_ERASURE_USER_FACING_V0.1.md`](../../../docs/legal/PHASE0_MEMORY_ERASURE_USER_FACING_V0.1.md).

| Mode | Row | `VITE_DEBUG` | Cohort | Studio / Spiral | Host |
|------|-----|--------------|--------|-----------------|------|
| **MODE 1 — DEV OBSERVE** | E2-F / E1 | `1` (not on shared prod for guests) | founder email only | OFF | local / staging |
| **MODE 2 — COHORT REAL** | E2-C | **`0`** | allowlist or server gate | OFF | `rhizoh.com` |
| **MODE 3 — EXPERIMENTAL** | E1 | per staging | founder only | voice/agent when added | **separate** staging |

**E2-C highlights:** `VITE_ONTOLOGICAL_BOOT_GATE=0`, `VITE_RHIZOH_PHASE1_SIGNAL=0`, `VITE_RHIZOH_LEGAL_PREAMBLE=1`, `VITE_RHIZOH_INVITE_ONLY_GOOGLE=1`, cohort allowlist or `VITE_RHIZOH_COHORT_SERVER_GATE=1`.

---

## 5. Change policy

- Any **default** change to E2 column → bump this doc to **v1.1** + changelog line + update `.env.production.example` in same PR.
- New global flag → add row to §2 + example file comment.

---

*v1.0 — single-file deploy SSOT for Castle client.*
