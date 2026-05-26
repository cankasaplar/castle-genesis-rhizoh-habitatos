# Replay Corruption Taxonomy — Reality Breach Classes

**Tag:** `RESEARCH-ONLY` (policy + test harness); guards in `rhizoh/runtime/continuity/*` are **`CORE-ELIGIBLE`**.

**Related:** [SUBSTRATE_CONTINUITY_PHASE2_V0.md](./SUBSTRATE_CONTINUITY_PHASE2_V0.md) · `continuityBootGuardV0.js` · `adversarialContinuityHarnessV0.js`

---

## Design shift

| Before | After |
|--------|--------|
| “Error → quarantine” | **Which reality breach class?** |
| Crash | **Semantic fail-safe** (`QUARANTINE_ISOLATION`) |

Rhizoh as **failure-aware reality machine**: primary goal is not only to run, but to **refuse wrong continuity**.

---

## Three axes (7 breach types)

### A — Time axis

| Breach | Threat | Defense |
|--------|--------|---------|
| **STALE_REPLAY** | History overwrite via stale async | `commitCursorWithMonotonicGuard` — reject `incomingTick < persistedTick` |
| **OUT_OF_ORDER_REPLAY** | Causal chain break | `assertNextReplayTickV0` — `incoming === lastProcessed + 1` |
| **EPOCH_REGRESSION** | Constitutional rollback | Cursor `lastEpoch` floor; reject lower epoch writes |

### B — Integrity axis

| Breach | Threat | Defense |
|--------|--------|---------|
| **DUPLICATE_APPEND** | Double-apply same tick | Composite key `['diskKey','tick']` + idempotent duplicate collapse |
| **PARTIAL_WRITE** | Malformed segment after crash | `validateWalSegmentIntegrityV0` on hydrate |
| **HASH_CHAIN_MUTATION** | Poisoned history | `H_n = f(H_{n-1}, payload_n)`; deep chain scan + cursor anchor |

### C — Identity axis

| Breach | Threat | Defense |
|--------|--------|---------|
| **PROFILE_SWITCH** | Universe bleed | `diskKey` envelope — read/write only matching namespace |

---

## Boot phase: `QUARANTINE_ISOLATION`

When deep hydration detects a breach:

```json
{
  "phase": "QUARANTINE_ISOLATION",
  "reason": "HASH_CHAIN_MUTATION",
  "recoveryPolicy": "quarantine_replay_halt"
}
```

Ontological fail-safe: **“reality is broken — I will not continue.”**

Recovery: **`replayRepairKernelV0.js`** · Orchestration: **`continuityRecoveryOrchestratorV0.js`** (repair vs reject, epistemic past, rehydrate gate). Fork isolate — later.

---

## Adversarial harness (steril lab)

**Vitest:** `continuity/__tests__/adversarialContinuityHarnessV0.test.js`  
**Runner:** `runAdversarialContinuitySuiteV0(createAdapter)`

| Rule | Why |
|------|-----|
| In-memory adapter is **test-only** | Avoid test/production invariant leak |
| Production never imports `_testPutRawSegment` | False confidence boundary |
| Harness **injects** corruption; runtime **rejects** it | Durability measured on wrong input |

---

## Manual debug (browser, harness enabled)

```js
__rhizoh.debug().continuityHarness.bootGuard
// phase: "RUN" | "QUARANTINE_ISOLATION"
// reason: breach class when quarantined
```

---

*Recovery semantics layer: future work — map `suggestRecoveryPolicyV0(axis)` to concrete repair flows.*
