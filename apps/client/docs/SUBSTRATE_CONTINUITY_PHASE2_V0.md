# Substrate Continuity — Phase 2 (SSOT)

**Tag:** `RESEARCH-ONLY` (spec / policy); runtime implementation items marked **`CORE-ELIGIBLE`** when they extend existing `rhizoh/runtime/*` without frozen `phase*.js` changes.

**Status:** Normative target for post–Faz 1 work. Does not replace code; CI still gates via existing substrate tests + future continuity harness.

**Related:** [RHIZOH_CASTLE_REALITY_OS_ARCHITECTURE_MAP.md](./RHIZOH_CASTLE_REALITY_OS_ARCHITECTURE_MAP.md) §10–§11 · [RHIZOH_REPLAY_CONTRACT_V0.md](../../../docs/RHIZOH_REPLAY_CONTRACT_V0.md) · `realitySealBootContinuityV0.js` · `peerWalConvergenceWireV0.js` · `realitySealingCoreV0.js`

---

## 1. Phase transition

| Phase | Question | Pass signal |
|-------|----------|-------------|
| **Faz 1** | Is runtime character stable under uninterrupted execution? | `sessionSec` ↑, pathology metrics flat (idle OK) |
| **Faz 2** | Is **continuity** preserved across interruption? | Restart hydrate, offline outbox, reconnect merge |

**Signature sentence (Faz 2):**

> Rhizoh is not an app that resets on restart — it is an environment that can recall its state.

---

## 2. Layer invariant (do not collapse)

| Layer | Role | May write `realityEpoch`? |
|-------|------|---------------------------|
| **Execution** | Local sealer, daemon, peer wire (client runtime) | **Only** via sealer drain |
| **Authority** | Gateway auth, unsigned reject, convergence rules | No |
| **Observation** | Relay, witness, metrics, Guardian append sink | No |

Guardian / edge must **not** become authoritative brain. Allowed: continuity relay, convergence witness, append sink, wake coordination.

---

## 3. Truth model: append chain vs snapshot

**Principle:** A snapshot is never “reality itself” — only a **fast hydrate entry point**.

| Artifact | Mutability | Source of replay truth |
|----------|------------|-------------------------|
| `wal_segments` | Append-only immutable segments | **Canonical** |
| `canonical_snapshots` | Derived, replaceable | Acceleration only |
| `replay_cursor` | Pointer | Operational |
| `peer_state` | Derived from convergence | Operational |
| `pending_outbox` | Queue until ack | Operational |

If snapshot disagrees with segment chain → **segments win**; snapshot invalidated and rebuilt.

---

## 4. IndexedDB stores (client)

Schema namespace: `castle.rhizoh.substrate_continuity.v0`.

**Faz 2.0 code (minimal):** `substrateContinuityIdbV0.js` — only `wal_segments` + `replay_cursor`. Use `withSubstrateContinuityIdbSessionV0()` (short-lived open/close); do not hold a process-global `db` ref.

### 4.0 IDB keys & invariants (Faz 2.0)

| Store | `keyPath` | Notes |
|-------|-----------|--------|
| `wal_segments` | `['diskKey', 'tick']` | Tick alone is **not** unique across profile / branch / epoch reset |
| `replay_cursor` | `'diskKey'` | One cursor row per continuity namespace |

- **`segmentId`** (derived): `` `${diskKey}:${tick}:${hash}` `` — witness / display; indexed, not primary key.
- **Cursor monotonic:** `incoming.lastTick >= persisted.lastTick` or reject (`cursor_regressed`).
- **Cursor anchor:** `cursor.lastHash === wal[cursor.lastTick].hash` — cursor never carries truth outside the segment chain.
- **Hydrate:** `cursor` present ≠ continuity; Faz 2.0 = `warm_existence`; Faz 2.1+ = `requireContinuityProof` (segment exists + hash anchor).

**Explicitly not in Faz 2.0 module:** snapshot hydrate, outbox, peer persistence, network replay, gateway sync, branch recovery.

### 4.1 `wal_segments`

Immutable append-only records. Suggested fields per segment:

- `segmentId` (derived `${diskKey}:${tick}:${hash}` — see §4.0)
- `wallClockMs` (observation only — not authority)
- `canonicalTick` / `lamport` / `streamSeq` (as available)
- `payloadHash` / `queueDigest`
- `convergenceWitnessRef` (optional)
- `body` (seal candidate, WAL frame, drain proof — typed)

**Rules:** no in-place update; compaction = new segment + tombstone metadata only after policy window.

### 4.2 `canonical_snapshots`

- `realityEpoch`, `replayWitnessHead`, `sealQueueDigest`, `hydratedAtMs`
- `provenance`: `segmentId` range covered
- **Invalidation:** any witness break, epoch regression, digest mismatch vs replay

### 4.3 `peer_state`

- `castleId` → `{ disposition, scenario, lastSeenMs, quarantineReason }`
- Mirrors daemon `peerConvergence` but survives restart

### 4.4 `replay_cursor`

- `lastAppliedSegmentId`, `lastWitnessHash`, `bootGeneration`
- Enables partial replay and suspend/resume tests

### 4.5 `pending_outbox` (continuity heart)

Outbound work while offline or flaky. Each entry:

- `outboxId`, `causalId`, `monotonicSeq` (per device/session)
- `retryDigest` (idempotent send key)
- `convergenceWitness` (expected post-accept state)
- `payload` (substrate health report, WAL relay, seal relay — typed envelope)
- `state`: `pending` | `inflight` | `acked` | `dead`

Duplicate client sends → same `retryDigest` → gateway/relay **must** collapse to one effect.

---

## 5. Hydrate order (boot)

On client boot (after `realitySealBootContinuityV0` disk read):

```
1. Open IDB; migrate schema version if needed
2. Load replay_cursor + peer_state (cheap)
3. Validate canonical_snapshots against wal_segments tail (witness + digest)
   → on fail: QUARANTINE_GENESIS or snapshot rebuild path
4. Apply wal_segments from cursor → rebuild in-memory seal queue / witness
5. Merge peer_state into daemon peerConvergence maps
6. Flush pending_outbox eligibility (do not send until gateway auth ready)
7. Start execution wiring (sealer, daemon) — same as Faz 1
8. Enter catch-up FSM if outbox non-empty or gateway was offline
```

**Invariant:** No epoch bump during hydrate-only replay unless segment chain proves prior drain completed.

---

## 6. Replay invariants

1. **Witness chain:** `replayWitnessHead` must chain; break → `QUARANTINE_GENESIS` (existing boot continuity).
2. **Monotonic epoch:** `realityEpoch` never decreases across applied segments.
3. **Single writer:** only sealer drain advances epoch; WAL ingress enqueues only.
4. **Deterministic merge:** same segment log + same profile → same post-hydrate seal state.
5. **Idempotent segments:** duplicate `segmentId` or `retryDigest` → no double-apply.

Align with [`docs/RHIZOH_REPLAY_CONTRACT_V0.md`](../../../docs/RHIZOH_REPLAY_CONTRACT_V0.md) when implementing harness.

---

## 7. Convergence rules (peer / relay)

Unchanged authority boundary from Faz 1:

- Gateway may **reject** unsigned / stale / epoch-ahead feeds.
- Client peer wire may **quarantine**; never directly bump epoch.

**Persisted `peer_state` must not override** live convergence without replay of intervening segments.

---

## 8. Catch-up FSM (reconnect)

States:

```
IDLE → OUTBOX_PENDING → DRAINING → SYNC_WITNESS → STEADY
         ↑                    │
         └──── (flap) ────────┘
```

| State | Enter | Exit |
|-------|-------|------|
| `IDLE` | boot complete, empty outbox | outbox entries |
| `OUTBOX_PENDING` | network down or send failed | gateway ack / retry budget exhausted → `dead` |
| `DRAINING` | sealer `shouldDrain` + queue non-empty | queue empty + witness stable |
| `SYNC_WITNESS` | post-drain witness != relay witness | match or quarantine |
| `STEADY` | all green | outbox growth or witness drift |

**Flaky internet:** single failure → stay `OUTBOX_PENDING`; no panic reset of in-memory seal.

---

## 9. Suspend / resume semantics

| Event | Behavior |
|-------|----------|
| Tab hidden / laptop sleep | Timers may pause; on resume: catch-up FSM, no epoch bump without drain proof |
| Tab discard | Next session = hydrate from IDB + optional relay catch-up |
| Process kill | Same as tab discard |
| `?mode=headless` | Visual dormant; continuity stores still append if wiring enabled |

**Test:** suspend ≥ N minutes → resume → `replay_cursor` consistent, no duplicate epoch bumps.

---

## 10. Duplicate merge policy

| Duplicate type | Policy |
|----------------|--------|
| Same `retryDigest` in outbox | Keep one; mark others `acked` as shadow |
| Same WAL frame hash | Drop at ingress; metric `duplicateIngress` |
| Peer feed replay mismatch | Quarantine `castleId`; do not flip-flop accept without fresh feed |
| Segment re-delivered | Idempotent apply by `segmentId` |

---

## 11. Snapshot invalidation rules

Invalidate / rebuild snapshot when:

- Witness chain break
- `queueDigest` ≠ recomputed from queue
- `realityEpoch` in snapshot < chain tail epoch
- Profile switch (`staging` → `production`) with stricter rules
- Manual `QUARANTINE_GENESIS` boot decision

Never invalidate segments solely because snapshot is old — recompute snapshot from segments instead.

---

## 12. Edge / Guardian (L2) — non-goals

**In scope (relay):**

- Low-latency append of `wal_segments` copies
- Heartbeat continuity / wake hints
- Replay window distribution for multi-device read

**Out of scope (brain):**

- Authoritative epoch
- Replacing sealer drain
- Mutable “server truth” snapshot clients must obey

---

## 13. Upper layers frozen until Faz 2 green

Do not expand until continuity harness passes:

- Cesium / map atmosphere
- Ghost ecology UI
- Multilingual agents
- Barcelona node product surfaces

Risk: visual success hiding behavioral cracks in time/replay.

---

## 14. Faz 2.0 continuity harness (wired)

**Env:** `VITE_SUBSTRATE_CONTINUITY_IDB=1`  
**Module:** `substrateContinuityHarnessV0.js`

| Step | Behavior |
|------|----------|
| Boot | `assessHydrate({ requireContinuityProof: true })` → `__rhizoh.debug().continuityHarness.bootHydrate` |
| Per drain (`sealed > 0`) | `appendWalSegment` + monotonic cursor (`sealHashHead` anchor) |
| Process death | Full page reload; boot hydrate must show `continuity_ok` if prior drains ran |

Manual check after reload:

```js
__rhizoh.debug().continuityHarness.bootHydrate.mode // "continuity_ok"
__rhizoh.debug().continuityHarness.segmentsAppended // > 0 after drains in prior session
```

---

## 15. Faz 2 exit criteria (proposal)

| Test | Pass |
|------|------|
| Cold restart | Hydrate epoch + witness match pre-kill tail |
| 24h headless + kill | Segments monotonic; snapshot rebuild OK |
| Offline 30m + outbox | Reconnect merge deterministic; no duplicate epoch |
| Flap gateway | `uncertain` UX allowed; continuity metrics stable |
| Corrupt one segment | Isolate; partial recovery; no full amnesia |

---

## 16. Implementation map (existing code)

| Concern | Today | Faz 2 target |
|---------|--------|--------------|
| Disk persist | `REALITY_SEAL_DISK_KEY_V0` key only; `VITE_REALITY_SEAL_PERSIST` | `substrateContinuityIdbV0.js` (wal + cursor); full store set later |
| Boot continuity | `realitySealBootContinuityV0.js` | Extend hydrate order §5 |
| Peer quarantine | in-memory daemon | + `peer_state` store |
| Health metrics | `realityHealthMetricsV0.js` | + segment/outbox counters |
| Gateway ingest | `substrateHealthReportV0.js` | + relay append API (spec) |

---

*Faz 2.0 IDB landed (`substrateContinuityIdbV0.js`). Update when snapshots/outbox/catch-up FSM wire.*
