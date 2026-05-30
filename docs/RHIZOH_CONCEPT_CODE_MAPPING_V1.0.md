# Rhizoh Concept → Code Mapping v1.0

**Status:** DRAFT — **Step 3** (finalize after boundary + polish)  
**Phase lock:** **0.5**

**Do not treat as SSOT until:** [`RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md`](RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md) §11 complete and HIGH leakage IDs closed.

**Perception SSOT:** [`RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md`](RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md) (clusters A–F, leakage L1–L15)  
**Polish queue:** [`RHIZOH_SIMULATION_REALISM_POLISH_V1.0.md`](RHIZOH_SIMULATION_REALISM_POLISH_V1.0.md)

> User examples (`WorldMeshScene.tsx`, `legalGateV0.js`) are **illustrative**. This doc lists **actual paths** in this repo.

---

## 1. Surface layer — “feels real”, fully controlled

| Concept | Repo file(s) | Fake-reality state / producer | Demo-risk |
|---------|--------------|------------------------------|-----------|
| **3D / Cesium map viewport** | `apps/client/src/castleFlight/CesiumRealMapLayer.jsx` | Renders globe; Istanbul bbox POI load | `flyToIstanbul`, `focusIstanbulPOI` — **bootstrap camera**, not “you are here” |
| **Epistemic Cesium bootstrap** | `apps/client/src/rhizoh/spatial/cesiumEpistemicBootstrapV0.js` | `getRhizohCalibrationRootInitialSetViewV0` — calibration root, not HOME_BASE | Comment-correct; keep out of identity |
| **Spatial adapter / atmosphere** | `apps/client/src/rhizoh/spatial/cesiumSpatialAdapterV0.js`, `deriveAnchorAtmosphereProjectionV0.js` | Deterministic projection from anchor | — |
| **Sim → scene apply** | `apps/client/src/rhizoh/spatial/applyEpistemicSimToCesiumSceneV0.js` | Epistemic sim overlay on Cesium | Debug overlay only in dev |
| **Runtime store (Cesium install)** | `apps/client/src/rhizoh/spatial/cesiumEpistemicRuntimeStoreV0.js` | Singleton install handle | — |
| **Geo seed (Istanbul bbox)** | `apps/client/src/castleFlight/geo.js`, `apps/client/src/scene/istanbulBiomePresetV540.js` | **Bootstrap observation data** — not world center | OSM/load limits in `CesiumRealMapLayer` |
| **Anchor policy (no demo-city=me)** | `apps/client/src/rhizoh/spatial/primaryAnchorResolverV0.js`, `anchorTruthTableV0.js`, `geographicAnchorsV0.js` | `ZERO_DEMO_POLICY_INTENT_V0` | Must win over UI defaults |
| **World mesh labels (SSOT copy)** | `apps/client/src/rhizoh/spatial/worldMeshLabelsV0.js` | Single label source for prod shell | Wire all shell copy here |
| **Main product shell / spatial UI** | `apps/client/src/AppRhizoh528.jsx` | Map mode, THREE fallback, HUD, welcome card | Large file — **highest demo-feel surface** |
| **Reality director / map surface** | `apps/client/src/reality/realityDirector.js`, `realityEngineSurface.js` | Mode reconciliation; **shows state**, should not “play tutorial” | `enqueueApexCameraAfterCesiumIfNeeded` — audit scripted camera |
| **Relational presence UI state** | `apps/client/src/kernel/visual/RelationalPresenceComposerV1.js` | Composes presence panel from substrate | Scaffold `RHIZOH_AGENT_*` lines = **sim dressing** |
| **Identity welcome narrative** | `apps/client/src/kernel/rhizohIdentityKernelV1.js` | `buildRhizohWelcomeNarrativeTr` | `favoritePlaces: Istanbul` — **polish target** |
| **Atmosphere bridge** | `apps/client/src/rhizoh/runtime/RhizohAtmospherePresenceBridge.jsx` | Presence → atmosphere | — |
| **Sovereign pick / node birth UX** | `apps/client/src/rhizoh/runtime/sovereign/cesiumSovereignGeographicPickV0.js`, `SovereignNodeOnboardingWizard.jsx`, `realitySyncUxV0.js` | Phase 2-bound; sim observation now | Wizard = **not** prod identity |
| **Studio viewport (dev)** | `apps/client/src/studio/ui/PresenceStudioViewport.tsx` | Research / kernel console | Demo avatar buttons — **not prod surface** |

**Surface rule:** Cesium **does not produce truth** (`cesiumEpistemicBootstrapV0.js` header). It projects controlled state.

---

## 2. Control plane — real system behavior (deterministic)

| Concept | Repo file(s) | Behavior | Notes |
|---------|--------------|----------|-------|
| **Ingress routing** | `apps/client/src/rhizoh/ingress/ingress_router.js` | `resolveIngressRouteV0`, session keys, legal/cohort gates | SSOT for turnstile |
| **Ingress UI flow** | `apps/client/src/rhizoh/ingress/RhizohIngressFlow.jsx` | Renders preamble → cohort → app | Frozen copy in `ingressFlowStylesV0.js` |
| **Legal preamble gate** | `apps/client/src/rhizoh/ingress/LegalPreambleScreen.jsx` + `isLegalPreambleRequiredV0()` in `ingress_router.js` | Host/env gated ack | Not separate `legalGateV0.js` |
| **Cohort gate (UI no-op)** | `apps/client/src/rhizoh/ingress/ClosedAdmissionCohortScreen.jsx`, `completeCohortGateNoOpV0()` in `ingress_router.js` | Writes decision key only; **no engine on UI path** | — |
| **Admission engine (harness)** | `apps/client/src/rhizoh/ingress/closedUserAdmissionEngineV0.js` | `evaluateClosedAdmissionForSessionV0` | Used by tests + `goLiveCohortSimulationV0.js` only |
| **Go-live cohort sim** | `apps/client/src/rhizoh/ingress/goLiveCohortSimulationV0.js`, `scripts/run-go-live-cohort-simulation.mjs` | Ops export JSON | Not runtime UI |
| **Phase 1 activation switch** | `apps/client/src/rhizoh/ingress/phase1ActivationGateV0.js` | **Only** reader of `VITE_RHIZOH_PHASE1_SIGNAL` | Data plane off when false |
| **Activation readiness (ops)** | `scripts/activation-readiness-check.mjs` → `docs/exports/ops/activation_readiness_v1.0.json` | AUTO checks + manual pending | Not `activationReadinessCheck.ts` |
| **Epistemic tick loop** | `apps/client/src/rhizoh/runtime/epistemicTickEngineV0.js`, `postGoLiveIntegrityLoopV0.js` | Deterministic internal ticks | Observation ≠ execution |
| **External boundary validation** | `apps/client/src/rhizoh/runtime/externalBoundaryValidationV0.js` | Client vs gateway snapshot | Read-only compare |
| **Shell entry** | `apps/client/src/App.jsx`, `apps/client/src/shell/CastleShellRouter.jsx` | Mounts Rhizoh ingress + `AppRhizoh528` | — |

---

## 3. Data plane — intentionally off

| Concept | Spec / switch | Runtime dependency today |
|---------|---------------|---------------------------|
| `device_heartbeat_v1` | `docs/RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md` | **None** — `isDataPlaneActiveV0()` → false |
| Edge / telemetry ingest | Phase 2–3 roadmap | **None** |
| WAL external ingestion | `presenceMeshWalIngressV0.ts` (studio tests) | **Not wired** to prod heartbeat |
| World authority stream | `worldAuthorityStreamIngressV0.js` | Spec/test path; gated |

**Switch SSOT:** `phase1ActivationGateV0.js` — no other file may read `VITE_RHIZOH_PHASE1_SIGNAL`.

---

## 4. Demo feel — three technical sources → file map

| Demo source | Where it lives | Polish action |
|-------------|----------------|---------------|
| **Fake / random data** | Epistemic sim overlays, scaffold agents in `RelationalPresenceComposerV1.js` | Deterministic copy; de-emphasize fake agent roster in prod HUD |
| **Single-city center** | `flyToIstanbul`, `ISTANBUL_GEO`, identity `favoritePlaces`, broadcast “Istanbul Arena” | Relabel → **bootstrap window**; SSOT `worldMeshLabelsV0.js` |
| **Scripted UI flow** | Ingress (frozen OK), sovereign wizard, `guided creation` preference string, `/demo` route (`observationLaneResolveV0`) | Ingress stays; remove tutorial lexicon from **prod shell** |

---

## 5. State → layer matrix (runtime stores)

| State key / module | Layer | Sim? | Effective on external world? |
|--------------------|-------|------|------------------------------|
| `rhizoh_legal_preamble_ack_v0.1` | Control | ✔ | No |
| `rhizoh_cohort_gate_decision_v0.1` | Control | ✔ | No |
| `cesiumEpistemicRuntimeStoreV0` | Surface | ✔ | No |
| `epistemicTickLedgerV0` | Control (protocol) | ✔ | No |
| `sessionStorage` ingress | Control | ✔ | No |
| `import.meta.env.VITE_RHIZOH_PHASE1_SIGNAL` | Data (future) | Off | **No** until READY |

---

## 6. Reactive world vs scripted scene

| Old (demo) | New (target) | Enforcement |
|------------|--------------|-------------|
| System plays a scene for you | System **reflects** state; user initiates node on mesh | `realityDirector` + copy discipline |
| Istanbul = origin | Istanbul = **bootstrap viewport** | `worldMeshLabelsV0` + anchor resolver |
| Named sim profiles in HUD | Research docs only | `AGENTS.md` |

---

## 7. Entry points (where to start debugging)

```
Browser → App.jsx → CastleShellRouter
       → RhizohIngressFlow (ingress_router)
       → AppRhizoh528 (surface + epistemic loops)
       → CesiumRealMapLayer (map surface)
```

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_WORLD_MESH_MENTAL_MODEL_V1.0.md`](RHIZOH_WORLD_MESH_MENTAL_MODEL_V1.0.md) | Originless mesh |
| [`RHIZOH_INGRESS_FLOW_V1.0.md`](RHIZOH_INGRESS_FLOW_V1.0.md) | Ingress freeze |
| [`RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md`](RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md) | Cold execution |

*Concept → code v1.0 — 2026-05-19*
