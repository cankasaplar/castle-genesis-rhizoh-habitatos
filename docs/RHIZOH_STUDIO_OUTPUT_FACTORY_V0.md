# Rhizoh Studio Output Factory v0

**Status:** ACTIVE (packaging stub)  
**SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohStudioOutputPackV0.js`

---

## Rol

| Katman | Soru |
|--------|------|
| **RAR** | Ne üretildi? (lineage + export graph) |
| **Studio** | Nasıl **yaşanır** hale gelir? (packaging) |

---

## Pipeline

```text
MCIB → TRF → CCF → ECC → RESL
                ↓
              RAR artifact
                ↓
     STUDIO EXECUTION LOOP (B1)
                ↓
         WAL (episode history)
                ↓
              RSBL → SSL → SCR → surfaces
```

---

## Pack envelope

```json
{
  "schema": "castle.rhizoh.studio_output_pack.v0",
  "artifact_id": "rar_…",
  "lived_state": { "persistence": "wal_v0", "wal_entry_id": "wal_…", "episode_seq": 1 },
  "projection_map": { "…": "RSBL surfaces" },
  "packaging_stage": ["mcib","ccf","ecc","rar","studio","rsbl","ssl"]
}
```

---

## SSOT

```javascript
window.__rhizoh.studioOutputPack      // latest
window.__rhizoh.studioOutputPacks     // ring (16)
```

Event: `rhizoh:studio-output-pack-v0`

---

## Eksik (bilinçli v0 sınırı)

- Disk WAL / IndexedDB (B2+)
- Pet evolution persistence (C)
- Session replay export bundle

Loop: [`RHIZOH_STUDIO_EXECUTION_LOOP_V0.md`](RHIZOH_STUDIO_EXECUTION_LOOP_V0.md)
