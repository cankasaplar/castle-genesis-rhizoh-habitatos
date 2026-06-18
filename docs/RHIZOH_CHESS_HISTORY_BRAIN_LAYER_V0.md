# Rhizoh Chess History Brain Layer v0

**SPECFLOW:** `RESEARCH-ONLY`  
**Status:** PR-A landed (loader + memory store); PR-B/C spec below

---

## Problem

Live engine loop observes games in real time but cannot answer:

- What **quality tier** of games was seen?
- Which **player styles** shaped Rhizoh's bias?
- Did **opening preference** evolve across deploys?
- Is **drift** a bug or a learning curve?

Observation counters (`learningReport`) are necessary but not sufficient. We need **model state evolution tracking** fed by an offline corpus.

---

## Architecture

```text
REALTIME ENGINE (cluster / arena)
        ↓
EVENT STORE (simulation IDB — world layer)
        ↓
LIVE LEARNING (weights, opening book, lifetime ledger)
        ↓
OFFLINE CORPUS (PGN / TCEC / GM classics)     ← PR-A
        ↓
PATTERN EXTRACTION (opening FP, tactical proxy) ← PR-A
        ↓
STYLE EMBEDDINGS (player fingerprint)           ← PR-B
        ↓
BATCH TRAINER (weight + opening recalibration)  ← PR-C
        ↓
ENGINE BEHAVIOR UPDATE (inference only)
```

**Inference stays online. Training pipeline runs offline/batch.**

---

## Persistent memory layout

| Path | Store key | PR |
|------|-----------|-----|
| `games/` | `rhizoh.chess_memory_store.v0` → `games[]` | A |
| `player_styles/` | same → `playerStyles[]` | A seed, B compute |
| `embeddings/` | same → `embeddings[]` | B |
| `opening_book_vX/` | `rhizoh_opening_book_v0` (existing) | C sync |
| `learning_snapshot_vX/` | `rhizoh.chess.learning_checkpoint.v0` + history ring | Checkpoint ✅ |

**Versioned graph:** `graphVersion` on memory store; migrate on read (`graph_v1` → `graph_v2`).

### Deploy-safe learning checkpoint ✅ (Option B)

- `rhizohChessLearningCheckpointV0.js` — versioned learning store (not world IndexedDB)
- On deploy: weight matrix freeze, corpus merge, incremental training resume
- `learning_snapshot_v1_{deployTag}_{id}.json` export shape
- `window.__rhizoh.chessLearningCheckpoint()` — checkpoint report
- `window.__rhizoh.freezeChessLearningCheckpoint()` — manual freeze
- `window.__rhizoh.exportChessLearningCheckpointJson()` — DevTools export

**Resume rule:** never decrease `matchesLearned`, `lifetimeMoves`, opening game counts, or corpus games.

### Unified Chess Memory Graph ✅ (Option C — PR-B foundation)

- `chessUnifiedMemoryGraphV0.js` — single notebook: PositionNode / MoveEdge / EvalEdge / WeightUpdateEdge
- `chessUnifiedGraphProjectorV0.js` — project corpus + live + learning into graph
- `chessHistoryCorpusBundlesV0.js` — GM expansion, engine league, opening tree, tactical motifs
- `chessCorpusExpansionLoaderV0.js` — idempotent bundle load
- `chessStyleEmbeddingV0.js` — lightweight style vectors from corpus exposure
- `window.__rhizoh.chessUnifiedMemoryGraph()` — unified graph report
- Deploy merge: checkpoint + corpus + lifetime → unified graph → weight matrix

---

## PR split

### PR-A — ChessHistoryLoader ✅

- `chessPgnParserV0.js` — PGN → SAN via chess.js
- `chessMemoryStoreV0.js` — versioned localStorage store
- `chessHistoryCorpusSeedV0.js` — offline GM seed bundle
- `chessHistoryLoaderV0.js` — import PGN / bundle / seed
- `chessHistoryPatternV0.js` — opening fingerprint + tactical proxy
- `window.__rhizoh.chessHistoryBrain()` — evolution report
- `window.__rhizoh.importChessPgn(pgn)` — DevTools import

### PR-B — Style Embedding System

- Compute `playerStyles[]` from corpus games (aggression, risk, endgame proxy)
- Link to `chessHistoricalMindV0` presets as anchors
- Store vectors in `embeddings[]`
- Report: `playerStyleExposure`, style-match hints in move picker

### PR-C — Offline Batch Trainer

- `runChessOfflineBatchTrainerV0()` — scheduled / manual
- Replay corpus + live archive → regret samples
- Update `chessLearningWeightsV0` + opening book bias
- Emit `intelligenceEvolution` delta in `chessHistoryBrain()`

---

## DevTools

```js
window.__rhizoh.chessHistoryBrain()
window.__rhizoh.chessEvolutionCurve()  // unified learning timeline
window.__rhizoh.chessLearningCheckpoint()  // deploy-safe learning snapshot
window.__rhizoh.chessUnifiedMemoryGraph()  // single notebook graph
window.__rhizoh.freezeChessLearningCheckpoint()
window.__rhizoh.exportChessLearningCheckpointJson()
window.__rhizoh.rebuildChessUnifiedGraph()
window.__rhizoh.importChessPgn(`[White "Carlsen"]...`)
```

---

## Quality tiers

| Tier | Meaning |
|------|---------|
| `gm_classical` | Titled human classics |
| `engine_league` | Stockfish / LC0 league sets |
| `titled_league` | TCEC / CCC style |
| `live_rhizoh` | Rhizoh cluster / arena |
| `seed_corpus` | Built-in bootstrap |

---

## Drift semantics (post layer)

| Before | After |
|--------|-------|
| Drift looks like error | Drift = learning curve signal |
| `avgDrift` alone | Corpus quality + live drift trend |
