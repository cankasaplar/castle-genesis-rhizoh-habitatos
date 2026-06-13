# Rhizoh OS Stabil Release Layer v1.0

**SPECFLOW:** `RESEARCH-ONLY` · Sprint 40  
**Depends on:** Sprint 39 Cluster Civilization (`cursor/sprint-39-cluster-civilization-3b5a`)

## Purpose

Ship **one OS feeling** at user open — not beta scaffolding, not sprint-visible engineering.

> Freeze = system cannot break itself, but can still live.

## Scope (Sprint 40)

| Item | Action |
|------|--------|
| Ecology lock | Freeze 64 cap, 30s drift poll, frequency-weight dominant rule |
| Kernel trace | Invisible mode in production (`rhizohKernelTraceMembraneV0.js`) |
| Boot | `bootRhizohOsStabilReleaseLayerV0()` in World Space |
| Medusa | `resolveOverlayNodeFromClusterEcologyV0` (drift-aware) |
| Dev flags | Document blocked stabil surface flags |
| Security model | [`RHIZOH_PRODUCTION_SECURITY_MODEL_V1.0.md`](RHIZOH_PRODUCTION_SECURITY_MODEL_V1.0.md) |
| Living freeze | [`RHIZOH_LIVING_FREEZE_MODEL_V1.0.md`](RHIZOH_LIVING_FREEZE_MODEL_V1.0.md) |

## Out of scope (post-sprint chain deploy)

- Full WebAuthn rollout
- Gateway security hardening deploy
- Single deploy package (user policy: after sprint chain)

## Boot sequence (World Space)

```
bootDrawerStateMachineV0()
bootRhizohOsStabilReleaseLayerV0()
  ├── bootClusterCivilizationV0()  // ecology + drift poll
  ├── scrubRhizohKernelTraceGlobalsV0()
  └── publish ecology lock snapshot (operator window only when trace exposed)
```

## Operator debug

Enable kernel trace in dev:

```bash
VITE_RHIZOH_KERNEL_TRACE_DEBUG=1
```

Production membrane: requires granular flag; `VITE_DEBUG` alone does not expose kernel trace in prod.

## Code map

| Module | Role |
|--------|------|
| `rhizohClusterEcologyLockV0.js` | Phase 1 locked constants |
| `rhizohKernelTraceMembraneV0.js` | Invisible trace globals |
| `rhizohOsStabilReleaseLayerV0.js` | Stabil boot orchestrator |
