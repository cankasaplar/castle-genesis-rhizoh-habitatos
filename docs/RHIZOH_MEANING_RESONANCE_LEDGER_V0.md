# Rhizoh Meaning Resonance Ledger v0

**Status:** DRAFT · `RESEARCH-ONLY` · Plane D (non-authoritative semantic trace)

---

## Ontological position

| System | Question | Authority |
|--------|----------|-----------|
| Causal graph | What happened? | **HARD** |
| Narrative plane (C) | What does it project as? | Read-only, ephemeral |
| Meaning ledger (D) | What meanings co-occurred? | **SOFT** — trace only |

**Tagline:** *Meaning emerges, but agency never does.*

Plane D is **not** a graph, learning loop, or truth source. It is a **resonance ledger** — it records co-occurrence events that passed the narrative bridge validation gate.

---

## Four bridge axioms

1. **Causal Invariance** — single events ≠ truth; only repeating Map/Chess patterns qualify.
2. **Non-Agentic Closure** — no intent, goal, or subject-decision inference.
3. **Bidirectional Non-Entanglement** — narrative may annotate; it may not write back to Map, Chess, or causal graphs.
4. **Temporal Continuity Dominance** — truth requires a continuity curve, not a snapshot.

---

## Pipeline

```
observerTrace
  → narrativeProjection (Plane C)
  → narrativeBridge.propose (weak relation ONLY)
  → bridgeValidateV0 (four axioms)
  → meaningLedger.record (NOT graph.append)
```

---

## Plane D axioms (ledger-specific)

1. **No Persistence Authority** — meaning cannot assert structure; only record co-occurrence.
2. **No Backpropagation** — meaning cannot influence Map, Chess, or narrative generation.
3. **Temporal Non-Closure** — meaning never becomes truth; remains interpretation trace.

---

## Authority policy

| Layer | Authority |
|-------|-----------|
| Causal | HARD |
| Semantic | SOFT |
| Identity | NONE |

---

## Browser API

```javascript
// Propose weak causal edge (validated → ledger record)
window.__rhizoh.narrativeBridge.propose({ locale: "en" });

// Direct validation (no record)
window.__rhizoh.narrativeBridge.validate({ mapEvent, chessEvent, narrativeEdge, observerEntries });

// Ledger snapshot (decayed epistemic weights)
window.__rhizoh.meaningLedger.snapshot();
```

---

## Epistemic weight decay

Weak causal edges carry capped strength (`≤ 0.35`) and decay via half-life (`EPISTEMIC_WEIGHT_HALF_LIFE_MS_V0` = 45 min). This provides drift-proof semantic fade without a learning rate.

---

## What Plane D does NOT do

- Learn, generalize, optimize, or feed back
- Become source of truth
- Append graph edges (`meaningGraph.append` is forbidden)

---

## Related

- [`RHIZOH_NARRATIVE_PROJECTION_ENGINE_V0.md`](RHIZOH_NARRATIVE_PROJECTION_ENGINE_V0.md)
- [`RHIZOH_EPISTEMIC_SEPARATION_PROOF_V0.md`](RHIZOH_EPISTEMIC_SEPARATION_PROOF_V0.md)
- [`RHIZOH_READ_ONLY_HOOK_V0.md`](RHIZOH_READ_ONLY_HOOK_V0.md)
