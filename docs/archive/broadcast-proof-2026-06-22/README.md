# Broadcast Layer — Two-Client Visual Proof Archive (2026-06-22)

**SPECFLOW:** `RESEARCH-ONLY` · controlled experiment evidence · not production READY claim

---

## What this archive holds

| Asset | Path | Status |
|-------|------|--------|
| Screen recording | `media/2026-06-22 20-12-15.mp4` | **Founder copy from Desktop → here** |
| Session manifest | `manifest.json` | ✓ |
| Observation evidence | `OBSERVATION_EVIDENCE.md` | ✓ |
| Phase closure summary | `PHASE_CLOSURE.md` | ✓ |
| Console log excerpt | `logs/session-c2c_host_peer_mqpgxzg0-notes.md` | ✓ |
| Next test spec | [`RHIZOH_BROADCAST_BOUNDARY_FAILURE_TEST_V1.md`](../../RHIZOH_BROADCAST_BOUNDARY_FAILURE_TEST_V1.md) | ✓ |

---

## Ingest video (one-time)

From Windows Desktop, copy the file into this folder:

```text
docs/archive/broadcast-proof-2026-06-22/media/2026-06-22 20-12-15.mp4
```

Then commit:

```bash
git add "docs/archive/broadcast-proof-2026-06-22/media/2026-06-22 20-12-15.mp4"
git commit -m "archive: broadcast two-client visual proof 2026-06-22"
```

If GitHub rejects file size (>100MB), use Git LFS or store hash-only + external link in `manifest.json`.

---

## Proof session (summary)

- **sessionId:** `c2c_host_peer_mqpgxzg0`
- **Host URL:** `https://rhizoh.com/match/c2c_host_peer_mqpgxzg0?role=player&playerId=host&proof=1`
- **Guest URL:** `https://rhizoh.com/match/c2c_host_peer_mqpgxzg0?role=player&playerId=2&proof=1`
- **PR:** [#314](https://github.com/cankasaplar/castle-genesis-rhizoh-habitatos/pull/314) (merged round 1); round 2 follow-up pending deploy

---

## What was proven (normal load)

- Two browsers, same `sessionId`
- `in sync: yes`, `drift: none` on proof panel (visual capture)
- `commitSeq` / projection aligned under nominal play
- Deterministic reconciliation **appears successful** at nominal load

## What was NOT proven yet

See [`docs/RHIZOH_BROADCAST_BOUNDARY_FAILURE_TEST_V1.md`](../../RHIZOH_BROADCAST_BOUNDARY_FAILURE_TEST_V1.md).

---

*Observation ≠ Execution · interpretationOnly: true*
