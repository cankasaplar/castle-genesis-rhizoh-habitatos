# Runtime frame correlation (v0)

**Purpose:** Bind boot, gateway, fatals (and later voice / studio) under one **tab-scoped** id lower than `sessionId`: `runtimeFrameId` (`window.__CASTLE_RUNTIME_FRAME_ID__`).

**Epistemic note:** `castle.runtime_snapshot.v1` ve bu dosyadaki tanımlar **gözlemlenebilirlik / korelasyon** içindir; yürütme SSOT’u değildir. Freeze · identity · snapshot sınırlarının tek özeti: [`RHIZOH_FREEZE_IDENTITY_SNAPSHOT_SSOT_V0.md`](RHIZOH_FREEZE_IDENTITY_SNAPSHOT_SSOT_V0.md).

## Storage keys

| Key | Role |
|-----|------|
| `castle.last_frame.v1` | Last snapshot: `{ at, frameId, gatewayPhase?, ... }` — replay after reload (30 min reuse TTL for same tab). |
| `castle.gateway.timeline.v1` | Ring buffer (~96) of `{ at, frameId, phase, ... }` entries on gateway phase transitions. |
| `castle.last_fatal.v1` | Fatal payload (includes `runtimeFrameId` when frame was initialized). |
| `castle.runtime_snapshot.v1` | Last unified `runtimeSnapshot.v1` JSON (written on fatal + optional `__CASTLE_PERSIST_RUNTIME_SNAPSHOT__()`). |

## Identity merge policy (v0)

- `apps/client/src/rhizoh/runtime/runtimeIdentityMergePolicyV0.js` — `resolveActiveRuntimeIdentity({ connectionId })`, `deriveDeterministicMergeId`, `lastCommitMergeId` via `castleRuntimeMergeLayerV0`.
- Roles: **frameId** (primary, tab UI), **sessionId** (anchor, product replay), **connectionId** (volatile attach), **mergeId** (deterministic FNV-1a over `v0|frame|session|connection`).
- DevTools: `window.__CASTLE_RESOLVE_RUNTIME_IDENTITY__({ connectionId: "..." })` · snapshot field `activeRuntimeIdentity`.

## Offline intent queue (policy surface)

- `apps/client/src/rhizoh/runtime/gatewayOfflineEventBufferPolicyV0.js` — re-exports `castleFlight/castleIntentQueue.js` + `RHIZOH_OFFLINE_INTENT_QUEUE_POLICY` (flush on gateway → `connected`).
- Enqueue records may include `runtimeFrameId`, `sessionId`, `deterministicMergeId` for merge correlation.

## Studio degradation (environment, not single crash)

- `apps/client/src/rhizoh/runtime/studioRuntimeDegradedModeV0.js` — `resolveStudioDegradationProfile(sync, warm)` → `tier` + `reasons`; `window.__CASTLE_STUDIO_RUNTIME_PROFILE__`.
- Runtime health panel shows **Studio tier** row (`full` | `degraded_render` | `degraded_gpu` | `minimal`).

## Code

- `apps/client/src/rhizoh/runtime/rhizohContinuityDiskMetaV0.js` — `readRhizohContinuityMetaDiskV0` (shared disk read).
- `apps/client/src/rhizoh/runtime/runtimeFrameCorrelationV0.js` — `initRuntimeFrameOnce`, `recordGatewayPhaseForTimeline`, `persistLastFrameSnapshot`, `readGatewayTimelineEntries`, `computeGatewayFlapPressure`, flap heuristic → `[CASTLE_GATEWAY_FLAP]` console warn.
- `apps/client/src/rhizoh/runtime/runtimeSnapshotV1.js` — `buildRuntimeSnapshotV1`, `persistRuntimeSnapshotV1`, `updateRuntimeSnapshotContext` (session / frame / gateway / voice / studio warm path).
- `apps/client/src/rhizoh/runtime/studioCapabilityProbeV0.js` — `syncStudioRenderCapabilityProbe` (WebGL vs WebGPU API; adapter null is warm-path / browser).
- `apps/client/src/main.jsx` — frame init; `window.__CASTLE_BUILD_RUNTIME_SNAPSHOT__` / `__CASTLE_PERSIST_RUNTIME_SNAPSHOT__`.
- `apps/client/src/AppRhizoh528.jsx` — gateway phase → timeline; snapshot context (gateway, `warmSwarmGpu`, voice).
- `apps/client/src/rhizoh/useRhizohGatewayMonitor.js` — health poll uses flap-aware **extra delay + jitter**; initial reconnect loop uses flap-aware **backoff + jitter** (not UI suppression yet).
- `apps/client/src/boot/castleCrashTelemetry.js` — `reportCastleFatal` adds `runtimeFrameId`; persists runtime snapshot after fatal.
- `apps/client/src/rhizoh/runtime/gatewayIdentityStoreV0.js` — gateway-owned connectionId + status store (single writer, subscribe, internal reducer).
- `apps/client/src/rhizoh/runtime/identityEventContractV0.js` — **Identity Event Contract** (`IDENTITY_EVENT_TYPES`, `origin` standardization, minimal validator + helper creators).

## Product follow-up

- Gateway: optional **silent recovery** (short hold before surfacing `offline` when flap is hot).
- `connectionId` in snapshot comes from gateway-owned store (when `/health/deps` exposes `activeConnectionId`/`connectionId`).
- Studio: dedicated async adapter chain (avoid racing `warmSwarmGpu` init) + renderer fallback paths per `tier`.

## Related

- `docs/RHIZOH_FREEZE_IDENTITY_SNAPSHOT_SSOT_V0.md` (canonical: freeze boundary, `connectionId` ownership, snapshot limits)
- `docs/RHIZOH_SESSION_IDENTITY_INVENTORY_V0.md`
- `docs/RHIZOH_RUNTIME_IDENTITY_RESOLUTION_FLOW_V0.md`
