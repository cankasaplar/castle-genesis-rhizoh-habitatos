# Rhizoh Epistemic Graph Lifecycle v0 (Phase 6)

**SPECFLOW:** `RESEARCH-ONLY`  
**Complements:** [RHIZOH_EPISTEMIC_EVOLUTION_ROADMAP_V0.md](RHIZOH_EPISTEMIC_EVOLUTION_ROADMAP_V0.md) · [RHIZOH_EPISTEMIC_MEMORY_GRAPH_V0.md](RHIZOH_EPISTEMIC_MEMORY_GRAPH_V0.md)

---

## 1. Problem

After Phase 5 prod verification (`graphNodes: 11`, `anomalyScore: 0.97`), the graph **lives**:

- node count will grow
- anomaly chains will lengthen
- council trigger density can rise

Risk today is **not failure** — it is **epistemic graph inflation** without decay.

---

## 2. Three policies

### A. Node TTL (per kind)

| Kind | TTL | Rationale |
|------|-----|-----------|
| `stress_lens` | 15 min | synthetic disagreement, high churn |
| `shadow_projection` | 45 min | evidence rows |
| `council_annotation` | 60 min | session annotations |
| `stress_run_hub` | 90 min | anchor for stress run cluster |
| `CHESS_MOVE_ANCHOR` projection | 120 min | slot-0 anchor chain |

Expired nodes → lifecycle prune (not execution effect).

### B. Edge decay

```text
weight = max(0, 1 - ageMs / decayHorizonMs)
prune when weight < 0.15
```

| linkKind | decayHorizon |
|----------|----------------|
| `conflict_graph` | 20 min |
| `causal_chain` | 40 min |
| `stress_run` | 60 min |
| `council_session` | 60 min |
| `match_sequence` | 90 min |

### C. Anomaly dampening

When inflation `level >= medium`:

```text
dampenedScore = rawScore * (1 - inflation.score * 0.35)
```

Observation still recorded; **reported** anomaly compressed to avoid false urgency spiral.

---

## 3. Inflation guard v2

| Signal | Soft cap | Action |
|--------|----------|--------|
| `nodeCount` | 256 | lifecycle pass + advisory |
| `edgeCount` | 512 | edge decay accelerate |
| `councilTriggers/min` | 8 | cooldown ×2 |
| `stressRuns/min` | 4 | block unless `force` |

**Council load balancing:**

| inflation.level | cooldown |
|-----------------|----------|
| low | 60s |
| medium | 120s |
| high | 300s |

---

## 4. Code

| Module | Role |
|--------|------|
| `rhizohEpistemicGraphLifecycleV0.js` | TTL + decay plan |
| `rhizohEpistemicGraphInflationGuardV0.js` | v2 assess + dampening + dynamic cooldown |
| `rhizohEpistemicMemoryGraphV0.js` | `runEpistemicMemoryGraphLifecycleV0()` |

---

## 5. DevTools

```js
window.__rhizoh.runGraphLifecyclePass?.()
window.__rhizoh.graphLifecycle
window.__rhizoh.graphInflationRisk   // v2 fields: softCapBreached, recommendedCooldownMs
```

---

## 6. Governance (unchanged)

Lifecycle and dampening **never** feed drift detection, move selection, or UI mutation.

---

## 7. Roadmap pointer

See [RHIZOH_EPISTEMIC_EVOLUTION_ROADMAP_V0.md](RHIZOH_EPISTEMIC_EVOLUTION_ROADMAP_V0.md) for full phase 3–6 map.
