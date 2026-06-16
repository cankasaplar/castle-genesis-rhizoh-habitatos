# Rhizoh UGE — Silent Observer Mode (Phase 1)

**SPECFLOW:** `RESEARCH-ONLY` — passive observation; **zero policy influence, zero move influence**.

## Architectural decision

> Önce agent değil — **observer**. Learner sonra gelir.

| Phase | Status | What runs |
|-------|--------|-----------|
| **1 — Observation** | **ACTIVE NOW** | UGE silent observer + Drift Cube + topology events |
| **2 — Memory** | Future | MirrorPolicyDiffTracker + counterfactual archive |
| **3 — Learning** | **GATED OFF** | ChessRegretEngine + adaptive 70/30 weighting |

ChessRegretEngine weight updates are **blocked** until Phase 3 (`rhizohObservationPhaseV0.js`).

---

## UGE Silent Observer pipeline

```text
Stockfish bestmove + Rhizoh move
  → geometric embedding (UGE encoder)
  → drift vector (topology drift)
  → topology classification
  → Drift Cube store + CodexBus event
  → NO policy influence
```

---

## CodexBus events (Phase 1 only)

| Event | When |
|-------|------|
| `TOPOLOGY_DRIFT_DETECTED` | Family mismatch or drift magnitude ≥ 0.12 |
| `TOPOLOGY_CLUSTER_LOCKED` | Cluster alignment, low drift |
| `TOPOLOGY_JUMP_ANOMALY` | Rhizoh jump geometry, teacher non-jump |

All events carry `governance: { policyInfluence: false, moveInfluence: false }`.

---

## Runtime modules

| Module | Role |
|--------|------|
| `rhizohUgeSilentObserverV0.js` | Phase 1 orchestrator |
| `rhizohTopologyEventEmitterV0.js` | CodexBus topology events |
| `rhizohGeometryChessEncoderV0.js` | SAN → topology embedding |
| `rhizohGeometryTopologyV0.js` | Drift vector calculation |
| `rhizohGeometryDriftCubeV0.js` | Experience coordinate storage |
| `rhizohObservationPhaseV0.js` | Phase gate (learning off) |

Wired from `chessLearningBridgeV0.js` after each match. Skips when `heuristic_fallback` (Stockfish offline).

---

## Console probes

```javascript
window.__rhizoh?.ugeSilentObserver?.last?.()
window.__rhizoh?.geometryDriftCube?.list?.()
```

Logs: `[CASTLE_uge_silent_observer]`, `[CASTLE_uge_topology]`, `[CASTLE_geometry_drift]`

---

## Why ChessRegretEngine waits

Active regret shaping would start **reward shaping** and **exploration bias** before the system has learned **what it sees**. Premature optimization → chaotic drift amplification.

Phase 1 answers: *what geometric shapes exist between teacher and mirror?*  
Phase 3 answers: *how should policy evolve?*

---

*Phase 1 — observer, not learner.*
