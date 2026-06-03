# Rhizoh World Action Log (WAL) v0

**Status:** ACTIVE  
**SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohWorldActionLogV0.js`

---

## Problem

Artifact + projection var; **“yarın aynı dünya geri gelebilir mi?”** yok.

---

## Entry

```json
{
  "entry_id": "wal_…",
  "episode_seq": 1,
  "atMs": 0,
  "t0_frame": { "coherenceId", "masterNowMs", "temporalPhase", … },
  "rcal": { "experiential_now_id", "ccf_collapse_mode", … },
  "surface_bindings": { … },
  "artifact_ref": { "artifact_id", "pack_id" }
}
```

Ring: 256 entries (hot cache). **B2+:** IndexedDB durable store — [`RHIZOH_WORLD_WAL_PERSISTENCE_B2_V0.md`](RHIZOH_WORLD_WAL_PERSISTENCE_B2_V0.md).

---

## SSOT

```javascript
window.__rhizoh.worldActionLog
window.__rhizoh.worldEpisode
```

Event: `rhizoh:world-action-log-v0`
