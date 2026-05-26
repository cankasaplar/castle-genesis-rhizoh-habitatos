# Controlled Chaos Harness — Hat B (Substrate Truth Validator)

**Tag:** `CORE-ELIGIBLE` (lab harness + scoreboard); **never** weakens production invariants.

**Phase:** 2.1 — Epistemic Invariant Enforcement Layer  
**Next:** 2.2 — Recovery Semantics Layer (repair / re-anchor / fork isolate)

**Related:** [REPLAY_CORRUPTION_TAXONOMY_V0.md](./REPLAY_CORRUPTION_TAXONOMY_V0.md) · `chaosHarnessV0.js` · `chaosScoreboardV0.js`

---

## Principle

> Önce hak ettir. Sonra inşa et.

Hat A (feature expansion) before immunity proof risks persisting **wrong reality** on first corruption. Hat B proves:

**State exists?** irrelevant · **State correct?** insufficient · **When broken, what does the system do?** **this is the question.**

---

## Architecture

| Layer | Role |
|-------|------|
| **Chaos injector** | External only — lab adapter / steril IDB sandbox |
| **Production substrate** | Unchanged invariants — detect + `QUARANTINE_ISOLATION` |
| **Scoreboard** | Deterministic pass/fail per anomaly — not log presence |

**Test/production boundary:** `_testPutRawSegment` and in-memory adapter are **test-only**. Harness must not be mistaken for allowed production behavior.

---

## Kaos odası matrisi

| # | Canavar | Filtre | Skor hedefi |
|---|---------|--------|-------------|
| 1 | Stale Replay | `commitCursorWithMonotonicGuard` | Monotonic Violation Blocked |
| 2 | Hash Chain Mutation | `resolveSubstrateContinuityBootGuard` | Quarantine: HASH_CHAIN_MUTATION |
| 3 | Partial Crash Write | integrity + boot guard | Quarantine: PARTIAL_WRITE |
| 4 | Duplicate Append | composite key idempotency | Duplicate Collapse Idempotent |
| 5 | Out-of-Order | `assertNextReplayTickV0` | Chrono-Skew Isolation Successful |
| 6 | Epoch Regression | `minEpoch` boot floor | Epoch Floor Enforced |
| 7 | Profile Switch | `diskKey` envelope | Identity Bleed Isolated |

---

## Scoreboard schema

```json
{
  "schema": "castle.rhizoh.deterministic_quarantine_scoreboard.v0",
  "totalTests": 7,
  "passed": 7,
  "failed": 0,
  "status": "SUBSTRATE_IMMUNE",
  "immune": true,
  "logs": ["✅ [PASS] Stale Replay -> Monotonic Violation Blocked", "..."]
}
```

Status: `SUBSTRATE_IMMUNE` | `BREACHED`

---

## Run (steril lab)

### Vitest

```bash
cd apps/client
npm run test -- src/rhizoh/runtime/continuity/__tests__/chaosHarnessV0.test.js
```

### Browser console (dev)

```js
const r = await __rhizoh.runControlledChaos();
r.scoreboard.status; // "SUBSTRATE_IMMUNE"
```

Uses **in-memory lab adapter** by default — does not corrupt production IndexedDB.

---

## Maturity map

| Phase | Capability |
|-------|------------|
| **2.1 (now)** | detect · quarantine · block invalid replay |
| **2.2 (started)** | `replayRepairKernelV0.js` — detect · re-anchor · LKG cursor · rollback window |
| **2.2+ (future)** | fork resolution · full replay reconciliation |

Detection vs reconstruction: current gate is **refuse wrong continuity**; next gate is **rebuild right continuity from poisoned past**.
