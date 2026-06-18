# Rhizoh Epistemic Memory Graph v0

**SPECFLOW:** `RESEARCH-ONLY`  
**Phase:** 4 — persistent cross-linked observation topology (user map: Phase 4).  
**Complements:** [RHIZOH_SHADOW_TRACE_LEDGER_V0.md](RHIZOH_SHADOW_TRACE_LEDGER_V0.md) · [RHIZOH_EPISTEMIC_STRESS_INJECTION_V0.md](RHIZOH_EPISTEMIC_STRESS_INJECTION_V0.md)

---

## 1. Purpose

Shadow ledger ring = ephemeral evidence log. Memory graph = **durable topology** linking stress runs, drift rows, council sessions, and heuristic lenses.

| Projects | Never |
|----------|-------|
| Shadow trace rows → nodes | Move selection |
| stressRunId hubs + causal edges | Drift feedback |
| Conflict-graph lenses | UI / execution effect |

---

## 2. EpistemicMemoryNode

```text
EpistemicMemoryNode {
  nodeId,
  kind,                 // shadow_projection | stress_run_hub | stress_lens | council_annotation
  shadowRecordId?,
  stressRunId?,
  causalChainId?,
  parentNodeId?,
  lensStance?,
  eventType,
  sourceSystem,
  entropyScore?,
  matchId?, slotId?,
  governance: { feedsDriftDetection: false, ... }
}
```

**Edges:** `causal_chain` · `stress_run` · `council_session` · `conflict_graph` · `match_sequence`

---

## 3. Projection hooks

| Source | Hook |
|--------|------|
| Every shadow append | `projectShadowTraceToEpistemicMemoryV0(record)` |
| Stress injection | `projectStressConflictGraphToEpistemicMemoryV0(...)` |

---

## 4. Compliance export

`exportShadowComplianceSnapshot` adds:

```text
memoryGraph: {
  nodeCount,
  edgeCount,
  crossLinkCount,
  stressHubCount,
  lensCount,
  memoryGraphDigest    // WAL-fold hash for replay boundary
}
```

---

## 5. DevTools

```js
window.__rhizoh.epistemicMemoryGraph
window.__rhizoh.exportShadowComplianceSnapshot?.('post_memory_graph')
```

---

## 6. Code

| Module | Role |
|--------|------|
| `rhizohEpistemicMemoryGraphV0.js` | Nodes, edges, digest, projection |
| `rhizohShadowTraceLedgerV0.js` | Auto-project on append |
| `rhizohEpistemicStressInjectionV0.js` | Lens projection after stress run |
