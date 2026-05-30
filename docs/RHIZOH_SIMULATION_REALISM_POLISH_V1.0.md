# Rhizoh Simulation Realism Polish v1.0

**Status:** **FROZEN** — regression-only (Phase gate A). No new polish sprint.  
**Blocked by:** [`RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md`](RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md) §3–§5 — every task must cite a **leakage ID** and pass §4 gate.

**Not a layer** — polish on existing Surface + Control only. No data plane.

---

## PR gate (mandatory)

Before merge:

1. Which **leakage ID** (L1–L15) does this close?
2. Does it introduce any **§4.2 forbidden** cue?
3. If touching 2+ perception axes (UI/state/copy/routing/camera), was coupling checked?

---

## Work queue (from leakage register)

| ID | Action | Files (indicative) |
|----|--------|-------------------|
| **L1** | No unsolicited `flyToIstanbul` on cold open; user intent only | ✓ boot interval removed; `flyToBootstrapViewport` |
| **L3** | Replace `Istanbul Nexus` swarm copy → field-layer neutral | ✓ `formatMeshSwarmFieldObservationV0` |
| **L4** | Event preview location → mesh field | ✓ `meshFieldLayer` |
| **L5** | Remove `Demo Loop:` HUD; state observation | ✓ dev-gated replay grid |
| **L6** | Empty scaffold agents when no substrate tasks | `RelationalPresenceComposerV1.js` |
| **L7** | `demoLoopState` → dev overlay only | `AppRhizoh528.jsx`, `RhizohVisualCognitionComposerV1.js` |
| **L8** | Identity graph: no center semantics in `favoritePlaces` / memory lines | `rhizohIdentityKernelV1.js` |
| **L15** | Gateway banner: remove “yerel demo” on prod path | `RhizohGatewayBanner.jsx` |

| **L2** | REAL CITY chrome → observation map / topology globe | ✓ `worldMeshLabelsV0` + neutral toggle chrome |

### Done (boundary-aligned)

| Item | Leakage |
|------|---------|
| `WORLD_MESH_LABELS_V0` wired (shell, presence, identity welcome) | L8 partial |
| `guided creation` → `open composition` | §4.2 forbidden |

---

## P2 — Camera / reactive world

| Task | Boundary ref |
|------|----------------|
| Audit `enqueueApexCameraAfterCesiumIfNeeded` | §1 cluster C |
| DSL `REAL_MAP` spawn — user-triggered only | §2 Camera axis |

---

## P3 — Never in polish

- `VITE_RHIZOH_PHASE1_SIGNAL=1`
- WAL external ingest
- Multi-city default home

---

## Acceptance

- [ ] All **HIGH** leakage rows (L1, L3, L5, L9) closed or dev-gated
- [ ] `npm run activation:readiness-check` AUTO_PASS
- [ ] Ingress tests pass
- [ ] §11 boundary checklist → Step 3 mapping unlock

*Polish v1.0 — Step 2 — 2026-05-19*
