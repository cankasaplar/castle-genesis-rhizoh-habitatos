# Rhizoh World Replay v0 (B2 read-only)

**Status:** ACTIVE  
**SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohWorldReplayV0.js`

---

## Rol

WAL entry → **read-only** world restore (cognition re-run yok).

```javascript
replayWorldActionLogEntryV0(entryId)
replayWorldActionLogEntryAsyncV0(entryId)  // IDB resolve
replayWorldStateAtMsV0(atMs)
clearWorldReplayModeV0()
```

Replay attaches `identity: { same_world, drift, code }` and runs **ICL** (`worldIdentityConsistency`) unless `runIcl: false`.

Bkz. [`RHIZOH_IDENTITY_CONSISTENCY_LAYER_V0.md`](RHIZOH_IDENTITY_CONSISTENCY_LAYER_V0.md)

---

## SSOT

```javascript
window.__rhizoh.replayMode
window.__rhizoh.replayedWorldState
```

Event: `rhizoh:world-replay-v0`

---

## Kilit

AI system değil → **world engine** (episodic replay).
