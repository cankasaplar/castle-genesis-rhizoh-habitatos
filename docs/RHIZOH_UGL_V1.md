# Rhizoh Unified Game Language (UGL) v1

**SPECFLOW:** `RESEARCH-ONLY`  
**Status:** v1 landed — semantic compiler over existing chess learning stack  
**Parent:** [`RHIZOH_CHESS_HISTORY_BRAIN_LAYER_V0.md`](RHIZOH_CHESS_HISTORY_BRAIN_LAYER_V0.md) · [`WORLDSTATE_V0_SPEC.md`](WORLDSTATE_V0_SPEC.md) · [`RHIZOH_TLA_EXECUTION_CORE_SKETCH_V1.0.md`](RHIZOH_TLA_EXECUTION_CORE_SKETCH_V1.0.md)

**One sentence:** UGL is not a new game engine — it is the **semantic compiler** that maps domain-specific play (chess FEN/UCI today) into a **canonical state–action–reward event stream** for cross-game learning.

---

## 0. Problem statement (precise)

| Claim (marketing) | Runtime truth (today) |
|-------------------|------------------------|
| “Rhizoh learns games” | Rhizoh learns **physics inside chess** |
| Multi-game substrate | Chess-native unified memory graph only |
| Reward-driven policy | Observation artifacts (`policy_diff`, drift logs) |

**Correct technical framing:**

> Rhizoh does not yet compile games into a single language; it learns **single-domain physics** until UGL adapters exist.

---

## 1. Core primitives

### 1.1 State (S)

```text
S = {
  space: Tensor,           // board / grid / graph — game-agnostic shape metadata
  players: StatePlayer[],
  turn: number,
  meta: { gameType, rulesetId }
}
```

**Chess mapping:** FEN → `8×8×13` piece planes + turn bit in `meta`.

### 1.2 Action (A)

```text
A = {
  actorId: string,
  type: "move" | "pass" | "interact" | "special",
  payload: unknown,
  legalityMask?: boolean[]
}
```

UGL actions are **intent vectors**, not domain strings. Chess UCI/SAN is wrapped, then encoded.

### 1.3 Transition (T)

```text
T: (S, A) → S'
```

Must be **replayable**. Deterministic or stochastic; engine-independent at the UGL boundary.

### 1.4 Reward (R) — semantic outcome function

```text
R = {
  terminal: number,   // win / loss / draw
  shaping: number,    // intermediate alignment
  drift: number,      // engine / policy disagreement
  novelty: number,    // exploration / new state
  total: number       // weighted scalar for learning gates
}
```

**Not** the same as raw `policy_diff` rows — those are **observation artifacts** until converted.

---

## 2. Event model (event-sourced)

```text
UGLEvent = {
  t: logicalTick | timestamp,
  s: S,
  a: A,
  s_next: S,
  r: R,
  meta: { matchId, gameType, causalChainId }
}
```

Every game is a **causal event stream** → unified graph → embedding field.

---

## 3. Game Physics Abstraction Layer (missing → v1 adds)

| API | Role |
|-----|------|
| `UGL.StateEncoder(game)` | `encodeUglStateV0(gameType, raw)` → canonical tensor |
| `UGL.ActionSpace(game)` | `encodeUglActionV0(gameType, raw)` → normalized action |
| `UGL.RewardModel(game)` | `computeUglRewardV0(signals)` → unified R |

**Runtime modules:**

| Module | Path |
|--------|------|
| Schema | `rhizohUglSchemaV0.js` |
| State encoder | `rhizohUglStateEncoderV0.js` |
| Action space | `rhizohUglActionSpaceV0.js` |
| Reward model | `rhizohUglRewardModelV0.js` |
| Drift → reward | `rhizohDriftRewardConverterV0.js` |
| Event stream | `rhizohUglEventV0.js` |
| Chess adapter | `rhizohUglChessAdapterV0.js` |
| Play / learn scheduler | `rhizohUglMatchSchedulerV0.js` |
| Boot + DevTools | `rhizohUglBootV0.js` |

---

## 4. Scheduler separation (play vs learn)

| Pipeline | SLA | Queue | Behavior |
|----------|-----|-------|----------|
| **PLAY** | Low latency, deterministic tick | `ARENA_MATCH` / `CLUSTER_MOVE` | Never blocked by learn backlog |
| **LEARN** | Async, stochastic, compressible | `LEARNING_MEASURE` / `BACKGROUND` | Deferred when play contended |

Prior art: `chessEngineTaskQueueV0` had priority only — UGL scheduler adds **pipeline isolation** and **learn deferral ring**.

---

## 5. Rhizoh-specific extensions

| Signal | Source | UGL field |
|--------|--------|-----------|
| Engine disagreement | `policy_diff`, MultiPV rank | `R.drift`, `R.shaping` |
| Geometry family mismatch | `geometryDriftCube` | `R.drift` (pattern axis) |
| New FEN / position | unified graph visitCount | `R.novelty` |
| Match outcome | game end | `R.terminal` |

**Epistemic firewall:** UGL writes **observation + learning projection** only — no execution authority (`¬(O → S)` per TLA sketch).

---

## 6. AlphaZero-lite → multi-game substrate

Existing pipeline (chess):

```text
corpus → unified graph → embedding → weight update
```

UGL adds the compile step:

```text
domain play → UGLEvent stream → drift/reward converter → same graph
```

Missing for full AlphaZero parity: **self-play arbitration**, **reward consistency across ticks**, **multi-engine league harness**.

---

## 7. DevTools probes

```js
window.__rhizoh.uglReport()
window.__rhizoh.uglEventStream()
window.__rhizoh.uglScheduler()
window.__rhizoh.uglRewardModel()
```

Chess cluster move / policy_diff / geometry drift events auto-compile when UGL boot is active.

---

## 8. Evolution curve (graphVersion 2 → performance delta)

`rhizohChessEvolutionCurveV0` records `performanceDelta` when:

- `predictionAccuracy` changes between curve points
- `weightFingerprint` changes
- `graphVersion` bumps

Probe: `window.__rhizoh.chessEvolutionCurve()` → `performanceDelta`.

---

## 9. Future: multi-sport arena (out of v1 scope)

Chess arena pin / lobby remains chess-first. **Multi-sport arena** is a **UI routing** concern (Phase 2): same UGL substrate, new adapters (`go`, `shogi`, custom graph rules).

---

## 10. Invariants (v1)

| ID | Invariant |
|----|-----------|
| UGL-1 | UGL never mutates frozen v562–v570 execution subgraph |
| UGL-2 | `UGLEvent` is append-only in session ring; replayable from stored fields |
| UGL-3 | Learn pipeline must not preempt play pipeline |
| UGL-4 | `R.total` is derived — never hand-authored in adapters |
| UGL-5 | Cross-game embedding alignment requires shared `encode(S)` dim — chess v1 sets `embeddingDim=64` |

---

## 11. Validation

```bash
npm run test -w apps/client -- src/rhizoh/runtime/__tests__/rhizohUglLayerV0.test.js
npm run stabilization:validate-specflow
```

---

*Chess is plugin #1. UGL is the physics compiler — not the sport.*
