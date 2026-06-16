# Rhizoh Policy Evolution — V0.1 (Reality Collider + Dual Reality Ledger)

**SPECFLOW:** `RESEARCH-ONLY` — observation + learning graph export; **no execution authority**.

**Objective:** We are no longer training a chess engine. We maintain a **dual-reality policy system** where truth is emergent, not given.

---

## Philosophy

| Stockfish teacher | Rhizoh mirror |
|-------------------|---------------|
| **Anchor** (~70% starting prior) — not authority | **Exploration** (~30% starting prior) |
| Exploitation (known geometry) | Mutation field (preserved alternatives) |

**Drift ≠ punishment.** Exploration never collapses into "real error penalty."

**Regret ≠ Loss.** A 2.0 eval gap may be strategic universe divergence, sacrifice space, or tactical branch — not blunder.

**Governance:** Policy evolution → Learning Graph only. Never → WAL, gateway, frozen `phase*.js`.

Requires **Stockfish WASM online** — `heuristic_fallback` matches are skipped.

---

## Triple module stack (V0.1)

```text
RegretVectorSystemV0        → scalar regret + directional drift + topology tag
GeometricDriftFieldV0.1     → adaptive Bayesian 70/30 field (not static)
MirrorPolicyDiffTrackerV0   → Dual Reality Ledger + counterfactual memory
```

### 1. RegretVectorSystemV0 — three outputs

| Output | Meaning |
|--------|---------|
| `scalarRegret` | Normalized eval distance (e.g. 2.0 cp gap → magnitude) |
| `directionalDriftVector` | Which strategy axis (enclosure / jump / cluster) diverged |
| `topologyTag` | Position error vs strategic universe vs sacrifice vs tactical branch |

Topology tags: `position_error`, `strategic_universe_divergence`, `sacrifice_space`, `tactical_branch`, `neutral_divergence`.

### 2. GeometricDriftField V0.1 — adaptive weighting

Starting priors: **70% canonical / 30% mirror** — but weights evolve:

| Signal | Effect |
|--------|--------|
| Mirror universe wins match | `+Δ` exploration bias |
| Loss streak | Annealing down |
| Novel but neutral divergence | Latent space expansion |

Canonical = **anchor**, never execution authority.

### 3. MirrorPolicyDiffTracker — counterfactual memory

Each tick records the **triad**:

```javascript
dualRealityLedger: {
  canonicalPolicy:  { move, pattern, evalCp, role: "anchor" },
  mirrorPolicy:     { move, pattern, evalCp, role: "exploration" },
  counterfactualOutcome: {
    teacherMove, mirrorMove,
    teacherLineCp, mirrorLineCp, deltaCp,
    branchClass, hypothesis
  }
}
```

**Yapılan** vs **yapılmayan** vs **olabilen** — all three logged.

---

## Event shape (CodexBus)

```javascript
emitCodexBusV0("POLICY_EVOLUTION_TICK", {
  layer: 42,
  canonicalTeacher: "enclosure",
  mirrorDivergence: "jump",
  driftVectorMagnitude: 0.24,
  topologyTag: "strategic_universe_divergence",
  dualRealityLedger: { canonicalPolicy, mirrorPolicy, counterfactualOutcome },
  status: "ALTERNATIVE_UNIVERSE_PRESERVED"
});
```

---

## Runtime modules

| Module | Role |
|--------|------|
| `regretVectorSystemV0.js` | Scalar + directional + topology classification |
| `geometricDriftFieldV0.js` | Adaptive Bayesian field + alternative archive |
| `mirrorPolicyDiffTrackerV0.js` | Dual Reality Ledger + counterfactual ring |
| `policyEvolutionColliderV0.js` | Orchestrator wired from `chessLearningLoopV0` |

### Probe

```javascript
window.__rhizoh?.policyEvolution?.list?.()
window.__rhizoh?.policyEvolution?.alternatives?.()
window.__rhizoh?.policyEvolution?.counterfactuals?.()
```

Console: `[CASTLE_policy_evolution]` — includes `topologyTag` + `branchClass`.

---

## Related

- [`RHIZOH_GEOMETRY_LAYER_V0.md`](RHIZOH_GEOMETRY_LAYER_V0.md) — shape encoder (UGE)
- [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](../RHIZOH_HONEST_BASELINE_CHARTER_V1.md) — LLM transient motor; Rhizoh continuity protocol

---

*V0.1 — Chess pilot. Dual reality observation, not Stockfish overfitting.*
