# Console notes — session `c2c_host_peer_mqpgxzg0`

**Captured:** 2026-06-22 ~20:12 local  
**Archive video:** `../media/2026-06-22 20-12-15.mp4`

---

## Host (`index-DNdkvg1u.js`)

- `challengePeer({ playerId: "host" })` → `MATCH_REALITY_SYNC` ok
- Multiple `CommitMove` truth log entries (seq 2–11) — **mixed old bundle artifact**
- `ProposeMove` + `DRIFT_DETECTED classification=fork` on preview path

## Guest (`index-B6S3iZjP.js`)

- Late join via match URL + `proof=1`
- `CommitMove` seq 2–6 with fewer duplicates than host
- `DRIFT_DETECTED classification=pattern` on guest ProposeMove
- `gateway.uncertain` / reconnect cycles on guest tab

## Panel (visual capture)

- Same `sessionId`
- `in sync: yes`, `drift: none`
- Aligned `commitSeq` / projection at time of recording

---

## PR trail

- #313 merged — late-join snapshot, honest IDLE/catch-up
- #314 merged (round 1) — single MATCH_STATE path, idempotent serverSeq, reconcile snapshot
- Round 2 (`9317bee`) — ACK fan-out removed, transport dedupe, optimistic preview — **deploy pending**
