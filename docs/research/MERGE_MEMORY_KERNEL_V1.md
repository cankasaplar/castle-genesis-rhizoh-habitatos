# Merge Memory Kernel v1 — Research Spec

**SPECFLOW:** `RESEARCH-ONLY`  
**Status:** Spec / separate PR track (not runtime authority)  
**Related:** `cascadeReconciliationKernelV1.js` · `reconciliationEngineV0.js` · `chessLearningBridgeV0.js`

## Problem statement

The current stack resolves conflicts deterministically but does not retain **why** a merge happened. Stockfish, Rhizoh AI, and player events share event buses without a unified learning feedback loop.

> Merge Engine resolves reality — it does not yet **learn** reality.

## Design constraint (non-negotiable)

**Memory never mutates authoritative state.**  
It may only adjust **merge decision weighting** for future reconciliations. Replay equivalence and deterministic subgraph (v562–v570) remain untouched.

## Three-layer merge engine

| Layer | Role today | PR scope |
|-------|------------|----------|
| Runtime | Event resolution, cascade catch-up | Frozen / existing |
| Memory | — | **mergeEventLoggerV1** · **conflictEmbeddingStoreV1** |
| Policy | — | **mergePolicyAdjusterV1** (future) |

## Event → memory contract

```json
{
  "type": "MERGE_EVENT",
  "inputs": ["A", "B"],
  "resolution": "C",
  "context": { "tick": 0, "seed": 0, "layer": 0 }
}
```

## Embedding sketch

```js
function embedMergeMemory(A, B, C) {
  return {
    deltaA: diff(A, C),
    deltaB: diff(B, C),
    entropy: computeEntropy(A, B),
    outcomeBias: C.type
  };
}
```

## Learning pipeline

```
CONFLICT → MERGE DECISION → STATE RESULT → MEMORY EMBEDDING → POLICY UPDATE → FUTURE MERGE PRIORITY SHIFT
```

## Stockfish as teacher signal

Stockfish transitions from opponent to **gradient teacher**:

```js
if (stockfishMove !== rhizohMove) {
  learningSignal.push({
    position,
    bestLine: stockfishMove,
    actualLine: rhizohMove,
    evalDelta: computeEvalDiff()
  });
}
```

## Proposed modules (PR #79+ track)

| Module | Responsibility |
|--------|----------------|
| `mergeEventLoggerV1.js` | Append-only merge audit |
| `conflictEmbeddingStoreV1.js` | IndexedDB / WAL vectors |
| `teacherSignalAdapterV1.js` | Stockfish + chess arena bridge |
| `mergePolicyAdjusterV1.js` | Weight shifts (read-only to state) |
| `learningReplayAnalyzerV1.js` | Divergence replay without state mutation |

## Risk: overfitting reality

If memory writes back into state or replay seeds:

- deterministic drift begins
- replay hash locks fail
- CI stabilization graph breaks

**Mitigation:** epistemic firewall — memory outputs are `DERIVED_RUNTIME_ONLY`, never `RAW` or execution authority.

## System definition (post-kernel)

**Before:** Event Sourcing Engine  
**After:** Self-modifying deterministic reality compiler (memory-informed, state-frozen)

---

*This document scopes research work. UX / map / SpiralMMO fixes ship independently.*
