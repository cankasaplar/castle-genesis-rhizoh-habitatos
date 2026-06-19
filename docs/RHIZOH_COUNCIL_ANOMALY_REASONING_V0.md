# Rhizoh Council Anomaly Reasoning v0 (Phase 5)

**SPECFLOW:** `RESEARCH-ONLY`  
**Complements:** [RHIZOH_EPISTEMIC_COUNCIL_V0.md](RHIZOH_EPISTEMIC_COUNCIL_V0.md) · [RHIZOH_EPISTEMIC_MEMORY_GRAPH_V0.md](RHIZOH_EPISTEMIC_MEMORY_GRAPH_V0.md)

---

## 1. Purpose

Rhizoh is no longer log-only — Phase 5 wires **gateway collect/rank/synthesize** for council-driven **anomaly reasoning** without execution authority.

| Delivers | Never |
|----------|-------|
| `anomalyScore` + `reasoningChain` | Move selection |
| Gateway heuristic lenses (v0) | Drift feedback loops |
| Council cooldown + inflation guard | UI mutation |

---

## 2. Gateway route

```http
POST /rhizoh/council/anomaly-reasoning
```

Body: `{ matchId, slotId, fen, triggers, stressRunId, conflictGraph, memoryGraph }`

Response: `{ anomalyScore, severity, synthesis, lenses, reasoningChain, phases }`

Rate limit: 30 req/min/IP.

---

## 3. Client wire

- `rhizohEpistemicCouncilClientV0.js` — fetch via `resolveGenesisGatewayHttpBaseV0`
- `runEpistemicCouncilPipelineV0` — gateway-first, local fallback
- `maybeEnqueueEpistemicCouncilV0` — **60s cooldown per matchId**

---

## 4. Inflation guards (epistemic graph inflation risk)

| Guard | Rule |
|-------|------|
| Council cooldown | 60s per `matchId` |
| Stress repetition | 30s min interval (`force: true` bypass) |
| `graphInflationRisk` | node/edge density + council/stress rate |

DevTools:

```js
window.__rhizoh.graphInflationRisk
window.__rhizoh.councilAnomalyReasoning
```

---

## 5. Compliance export

`exportShadowComplianceSnapshot` adds:

```text
anomalyReasoning: { sessionId, anomalyScore, gatewayOk, severity, reasoningChain }
graphInflationRisk: { level, score, advisory, ... }
```

---

## 6. Code map

| Module | Role |
|--------|------|
| `apps/gateway/src/council/rhizohEpistemicCouncilAnomalyV0.js` | collect/rank/synthesize |
| `apps/gateway/src/council/rhizohEpistemicCouncilHttpV0.js` | HTTP handler |
| `rhizohEpistemicCouncilV0.js` | Pipeline + cooldown |
| `rhizohEpistemicCouncilClientV0.js` | Client fetch |
| `rhizohEpistemicGraphInflationGuardV0.js` | Inflation risk assessor |
