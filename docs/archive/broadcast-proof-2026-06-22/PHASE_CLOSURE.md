# Broadcast Layer — Phase Closure (2026-06-22)

**SPECFLOW:** `RESEARCH-ONLY`

## What was proven

Under **nominal** two-client load on production `rhizoh.com`:

- Both peers maintained aligned `commitSeq` and `projectionSeq`
- Proof panel: `in sync: yes`, `drift: none`
- Deterministic reconciliation **appears successful**

Session: `c2c_host_peer_mqpgxzg0`

## What was not proven

- Behavior under **forced** failure (latency, WS drop, burst commits, refresh)
- Causality of `gateway.uncertain` vs drift score

## Hypothesis shift

| Before | After |
|--------|-------|
| `DRIFT_DETECTED` = primary reconciliation bug | Drift lane secondary; nominal sync works |
| Tune gateway immediately | **Boundary failure tests first**, then targeted gateway tuning |

## Deliverables in this archive

| Artifact | Location |
|----------|----------|
| Visual proof (screen recording) | `media/2026-06-22 20-12-15.mp4` (copy from Desktop) |
| Session notes | `logs/session-c2c_host_peer_mqpgxzg0-notes.md` |
| Evidence write-up | `OBSERVATION_EVIDENCE.md` |
| Next engineering spec | [`../../RHIZOH_BROADCAST_BOUNDARY_FAILURE_TEST_V1.md`](../../RHIZOH_BROADCAST_BOUNDARY_FAILURE_TEST_V1.md) |

## Engineering merged (PR #314)

- Late-join snapshot reconciliation
- Honest proof panel (`catching up` / `in sync: no` when lagging)
- WS reconnect auto-rejoin
- Idempotent gateway `serverSeq`
- Single commit path via `MATCH_STATE` when reality sync active

**Follow-up PR:** duplicate ACK path removal (merged #315); gateway consolidation (#316).

## Founder action

Copy video from Windows Desktop:

```
docs/archive/broadcast-proof-2026-06-22/media/2026-06-22 20-12-15.mp4
```

Then:

```bash
git add docs/archive/broadcast-proof-2026-06-22/media/
git commit -m "archive: add broadcast proof screen recording 2026-06-22"
```
