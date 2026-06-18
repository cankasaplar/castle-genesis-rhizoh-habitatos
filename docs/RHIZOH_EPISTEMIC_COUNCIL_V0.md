# Rhizoh Epistemic Council v0

**SPECFLOW:** `RESEARCH-ONLY`  
**Observation Fabric:** [OBSERVATION_FABRIC_V1.md](OBSERVATION_FABRIC_V1.md) — *Agents may influence interpretation, never execution.*

---

## 1. Role

Council is **not** a truth generator or move selector. It is an **epistemic gatekeeper**:

| Does | Does not |
|------|----------|
| Map meaning across lenses on uncertainty | Pick chess moves |
| Emit `contextual_annotation` observations | Override Stockfish / Hard Kernel |
| Run async, non-blocking | Run continuously on every ply |

**Chess Arena first** (low-latency, high signal). **Living Map** later — landmark / memory-anchor only, threshold-gated.

---

## 2. CouncilSession lifecycle

```
INIT
  → COLLECT   (parallel model queries — gateway)
  → RANK      (anonymous cross-review — Karpathy stage 2)
  → SYNTHESIZE (chairman lens merge — observation text only)
  → EMIT_OBSERVATION
  → CLOSED
```

Client stub: `rhizohEpistemicCouncilV0.js`  
Gateway stub: `apps/gateway/src/council/rhizohEpistemicCouncilGatewayV0.js`

All transitions are **async** and **non-blocking** relative to the move pipeline.

---

## 3. Triggers (uncertainty spike only)

Council runs **only** when at least one trigger fires:

| Trigger | Source |
|---------|--------|
| `policy_diff_drift` | `policyDiff.drifted === true` |
| `topology_drift` | `TOPOLOGY_DRIFT_DETECTED` or magnitude ≥ 0.5 |
| `stockfish_timeout` | `arena move timeout` |
| `eval_variance` | MultiPV spread ≥ 0.35 (future) |

No trigger → **zero cost**, no council call.

---

## 4. Feedback loop isolation (critical)

**Risk:** drift → council → memory → drift detection → council (self-reinforcing loop).

**Rule:** Council output **MUST NOT** feed drift detection, policy_diff, or move selection.

```text
CouncilObservation {
  kind: "contextual_annotation"
  governance: {
    feedsDriftDetection: false
    feedsPolicyDiff: false
    feedsMoveSelection: false
    epistemicRole: "contextual_annotation"
  }
}
```

`maybeEnqueueEpistemicCouncilV0` rejects `sourceKind === contextual_annotation`.

Pattern compression (`chessClusterLearningV0`) reads **move observer** tags only — not council memory nodes.

---

## 5. Telemetry compression (Track A)

Prod default: **L0 critical** — drift, timeout, jump anomaly; **slot 0 moves always on** (deterministic anchor trace).

Enriched single-line envelope:

```text
DRIFT_EVENT {
  severity, clusterId, entropyScore, causalChainId, eventType, ...
}
```

Toggle: `localStorage.rhizoh_chess_telemetry_level_v0` (0–3) or `window.__rhizoh.debug.chessTelemetryLevel`.

---

## 6. Legal hold (C2 manual gate)

Default: **no auto-open** of 8-board cluster during legal hold.

- Manual: lobby button or `window.__rhizoh.openLegalHoldChessArena()`
- Legacy auto: `VITE_RHIZOH_LEGAL_HOLD_AUTO_CHESS=1` only

---

## 7. Karpathy adaptation map

| [llm-council](https://github.com/karpathy/llm-council) | Rhizoh |
|--------------------------------------------------------|--------|
| Stage 1 parallel models | Gateway `COLLECT` |
| Stage 2 rank | Gateway `RANK` |
| Chairman synthesis | Gateway `SYNTHESIZE` → **annotation string** |
| Chat UI | None in v0 — DevTools + memory graph |

---

## 8. Code map

| Module | Role |
|--------|------|
| `chessTelemetryLogV0.js` | L0–L3 gating, slot 0 anchor, DRIFT_EVENT envelope |
| `rhizohEpistemicCouncilV0.js` | Trigger eval, session FSM, dry-run |
| `chessClusterLearningTraceV0.js` | policy_diff → council hook |
| `rhizohTopologyEventEmitterV0.js` | topology drift → council hook |
| `chessStockfishEngineV0.js` | timeout → council hook |
| `rhizohLegalPendingWaitLoopV0.js` | C2 manual gate |

---

## 9. Non-goals (v0)

- Frozen core (`phase562–570`) changes
- Council-driven moves
- Continuous Living Map council
- Legal ingress checkbox copy changes
