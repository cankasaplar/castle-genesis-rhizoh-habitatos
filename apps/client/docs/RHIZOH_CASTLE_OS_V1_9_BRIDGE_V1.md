# Castle OS v1.9 → v2 Bridge Architecture

**SPECFLOW:** `CORE-ELIGIBLE` · **Deploy-pre engineering contract**  
**Extends:** [Castle OS v1.9](RHIZOH_CASTLE_OS_V1_9.md)

---

## Product decision (locked)

| Priority | Track | Rationale |
|----------|-------|-----------|
| **1** | Firebase / Cloud Adapter | Multi-device requires production infra; v2.0 is meaningless without it |
| **2** | Trace strip gated visibility | Internal + prod-debug cohort only — not full public replay UI |
| **3** | v2.0 Collective Room Physics | After individual cognition physics is stable + deployed |

> **Bireysel bilinç physics'i stabilize olmadan, kolektif bilinç inşa edilmez.**

Trace strip = **debug surface exposure**, not ingress UI change → **UI freeze safe**.

---

## Evolution map

| Phase | Scope |
|-------|-------|
| v1.x | Individual cognition physics |
| v1.9 | Explainable + portable cognition physics |
| v2.x | **Distributed cognition physics** (real product phase) |

---

## 1. Firebase schema

**Collection:** `rhizoh_client_sync/{firebaseUid}` (existing FER-1 mirror path)

**Rules:** `auth.uid == userId` · `productSurface` whitelist includes `castle`

```javascript
{
  productSurface: "castle",
  physicsLifecycleV1_9: {
    schema: "castle.physics_lifecycle_cloud.v1.9",
    userId: string,
    deviceId: string,
    physicsProfile: StabilityPhysicsProfileV1_8,
    learningTrace: LearningTraceV1_8[],   // tail max 12
    version: "1.9",
    checksum: string,
    timestamp: number,
    syncVersion: string                   // "{observationCount}:{atMs}"
  },
  physicsLifecycleUpdatedAt: serverTimestamp,
  physicsSyncMeta: {
    observationCount: number,
    lastPushDeviceId: string,
    conflictStrategy: "cognitive_merge_v1_9",
    cloudIsTruthSource: false
  }
}
```

**Implementation:** `castlePhysicsFirebaseAdapterV1_9.js`

---

## 2. Sync flow (production)

```
local tick → physics update → merge resolver (local)
        ↓
debounced push (900ms default)
        ↓
Firebase read → cognitive merge if checksum diverges → write
        ↓
other device pull → reconcilePhysicsState (local merge)
        ↓
execution continues on LOCAL reconciled profile
```

**Critical invariant:** `cloudIsTruthSource: false` at every layer.

---

## 3. Conflict resolution contract

| Scenario | Resolution |
|----------|--------------|
| Same device, sequential pushes | Last envelope wins on cloud field |
| Two devices, divergent profiles | `mergePhysicsProfilesV1_9` before push write |
| Pull on cold device | `reconcilePhysicsStateV1_9` — cognitive merge into local |
| Checksum match | Skip redundant write |
| Auth missing | Offline queue fallback (localStorage) |

**Not used:** server-side overwrite-as-truth, last-write-wins without merge on read.

---

## 4. Latency + debouncing spec

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `CLOUD_DEBOUNCE_MS` | 900ms | Coalesce rapid ticks before Firestore write |
| Trace tail on wire | 12 entries | Bound document size |
| Offline queue | 8 envelopes | Device-bound fallback when no adapter |
| Pull bootstrap | Once per session | Avoid pull storm on every tick |

Immediate flush: `pushPhysicsCloudSync(uid, { immediate: true })`

---

## 5. Trace strip production gating

| Tier | Flag | UI |
|------|------|-----|
| `off` | (default) | Hidden |
| `prod_debug` | `VITE_RHIZOH_STABILITY_TRACE_PROD_DEBUG=1` | Last 3 summary lines only — **no replay/scrub** |
| `internal` | `VITE_RHIZOH_STABILITY_LEARNING_TRACE=1` + debug | Full strip + replay path + timeline scrub |

**UI freeze note:** Strip is observational mirror — no execution authority, no ingress copy change.

---

## 6. Bootstrap + API

Auto-install on first OS loop publish when Firebase configured + auth resolved:

```javascript
window.__rhizoh.bootstrapPhysicsCloudSync()
window.__rhizoh.resolvePhysicsSyncUserId("user_local")  // → firebase uid when authed
window.__rhizoh.registerStabilityCloudSyncAdapter({ push, pull })  // custom override
```

Manual adapter override remains for tests / alternate backends.

---

## 7. v2.0 entry criteria (Collective Room Physics)

Do **not** start v2.0 until:

- [ ] Firebase adapter deployed + auth path verified in staging
- [ ] Multi-device reconcile tested (laptop ↔ phone scenario)
- [ ] Trace strip remains gated (no UX overload in prod)
- [ ] Individual physics profile stable under real usage (decay + merge behaving)

**v2.0 scope preview:** multi-user shared physics graph · room-level learning traces · shared attention economy · inter-user stability conflict resolution.

---

## 8. File map

| Module | Role |
|--------|------|
| `castlePhysicsFirebaseAdapterV1_9.js` | Firestore push/pull |
| `castlePhysicsCloudBootstrapV1_9.js` | Lazy adapter install |
| `castlePhysicsLifecycleCloudV1_9.js` | Envelope + debounce + reconcile |
| `castlePhysicsMergeV1_9.js` | Cognitive reconciliation engine |
| `castleLearningTraceStripV1_9.js` | Observable learning UI projection |
| `castleStabilityLearningTraceVisibilityV1_9.js` | Tiered gating |

---

## 9. One-line deploy truth

**v1.9 stabilization = portable individual physics with explainable learning — cloud is reconciliation, not oracle.**
