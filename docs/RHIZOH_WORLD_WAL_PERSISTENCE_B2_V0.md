# Rhizoh World WAL Persistence B2+ (identity stabilization)

**Status:** ACTIVE  
**SPECFLOW:** `RESEARCH-ONLY`  
**Modüller:** `rhizohWorldActionLogIdbV0.js` · `rhizohWorldIdentityV0.js` · `rhizohWorldWalPersistenceV0.js`

---

## Rol (artık sadece “memory” değil)

B2+ = **identity stabilization layer** — “aynı dünya mıydı?” sorusuna episodic zincir + sürümlü kimlik ile cevap.

```text
LIVED WORLD ✔
IDENTITY DRIFT ⚠ → B2+ locks continuity across sessions
```

---

## Katmanlar

| Katman | v0 | B2+ |
|--------|-----|-----|
| Hot ring | 256 entry RAM | aynı (cache) |
| Durable store | — | IndexedDB `castle.rhizoh.world_action_log.v0` |
| World identity | — | `world_id_*` + `chain_head_hash` + `identity_version` |
| Replay check | read-only restore | `verifyWorldIdentityForReplayV0` |

---

## Pipeline

```text
appendWorldActionLogEntryV0 (ring)
   ↓ async
persistWorldWalEntryV0 → IDB entry + identity_link + meta
   ↓
publishWorldIdentityV0
```

Boot: `initRhizohWorldWalPersistenceV0()` → hydrate ring from IDB + restore identity.

---

## API

- `persistWorldWalEntryV0(entry)`
- `initRhizohWorldWalPersistenceV0({ force? })`
- `readWalPersistenceStatusV0()` → `{ persistence: wal_idb_v0, durable, world_identity_id }`
- `resolveWorldWalEntryV0(entryId)` — ring then IDB
- `replayWorldActionLogEntryAsyncV0(entryId)` — IDB-aware replay + identity check

---

## SSOT

```javascript
window.__rhizoh.worldWalPersistence
window.__rhizoh.worldIdentity
window.__rhizoh.worldActionLog.persistence  // wal_v0 | wal_idb_v0
window.__rhizoh.replayedWorldState.identity_check
```

Events: `rhizoh:world-wal-persistence-v0` · `rhizoh:world-identity-v0`

---

## Kilit cümle (stack)

```text
Engine produces world
SCR synchronizes world
Pet inhabits world
Studio organism organizes life of world
WAL makes world remember itself
```

---

## Sıra (post-B2+)

1. ~~Replay → identity consistency harness~~ ✔ [`RHIZOH_IDENTITY_CONSISTENCY_LAYER_V0.md`](RHIZOH_IDENTITY_CONSISTENCY_LAYER_V0.md) · `npm run ops:world-identity-consistency-v0`  
2. Organism stabilization · Studio polish  

Bkz. [`RHIZOH_WORLD_ACTION_LOG_V0.md`](RHIZOH_WORLD_ACTION_LOG_V0.md) · [`RHIZOH_WORLD_REPLAY_V0.md`](RHIZOH_WORLD_REPLAY_V0.md) · [`RHIZOH_STUDIO_PRODUCTION_ORGANISM_V0.md`](RHIZOH_STUDIO_PRODUCTION_ORGANISM_V0.md)
