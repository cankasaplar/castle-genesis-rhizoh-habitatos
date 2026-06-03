# Rhizoh Studio Execution Loop v0 (B1)

**Status:** ACTIVE  
**SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohStudioExecutionLoopV0.js`

---

## Gerçek iş (pack değil)

```text
MCIB / CCF snapshot
   ↓
ECC stream finalize
   ↓
RAR artifact
   ↓
STUDIO PACK
   ↓
WAL append (lived version)
   ↓
RSBL → SSL → SCR
   ↓
UI surfaces
   ↓
Studio production organism (deep binding)
```

**Önce:** real-time cognitive system  
**Sonra:** episodic world engine — T0 = an + **episode**

---

## API

`runStudioExecutionLoopV0({ ecc, frame, resl, cognitive })`  
`publishExperienceContinuityV0` → otomatik loop tetikler.

Event: `rhizoh:studio-execution-loop-v0`

---

## SSOT

```javascript
window.__rhizoh.worldEpisode      // current episode pointer
window.__rhizoh.worldActionLog    // WAL index
window.__rhizoh.studioOutputPack  // latest pack (wal_v0)
window.__rhizoh.studioProductionOrganism  // deep binding snapshot
```

Bkz. [`RHIZOH_STUDIO_PRODUCTION_ORGANISM_V0.md`](RHIZOH_STUDIO_PRODUCTION_ORGANISM_V0.md) · [`RHIZOH_WORLD_ACTION_LOG_V0.md`](RHIZOH_WORLD_ACTION_LOG_V0.md) · [`RHIZOH_WORLD_REPLAY_V0.md`](RHIZOH_WORLD_REPLAY_V0.md)
