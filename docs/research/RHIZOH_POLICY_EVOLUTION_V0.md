# Rhizoh Policy Evolution — V0 (Reality Collider)

**SPECFLOW:** `RESEARCH-ONLY` — observation + learning graph export; **no execution authority**.

**Objective:** Rhizoh is not trained as an obedient Stockfish clone. Teacher (canonical) and mirror (Rhizoh) trajectories coexist in a **70/30 Reality Collider** — drift is mutation space, not mere error.

---

## Philosophy

| Stockfish teacher | Rhizoh mirror |
|-------------------|---------------|
| Canonical reference (~70% bias) | Alternative universe (~30% preserved) |
| Exploitation (known geometry) | Exploration (mutation field) |

**Drift ≠ punishment.** Drift = distance between two trajectories in shape space.

**Governance:** Policy evolution → Learning Graph only. Never → WAL, gateway, frozen `phase*.js`.

Requires **Stockfish WASM online** — `heuristic_fallback` matches are skipped (garbage in / garbage out).

---

## Triple module stack

```text
RegretVectorSystemV0        → measure teacher vs played eval distance
GeometricDriftFieldV0       → 70/30 canonical vs mirror pattern split
MirrorPolicyDiffTrackerV0   → POLICY_EVOLUTION_TICK → CodexBus + Drift Cube Z
```

---

## Event shape (CodexBus)

```javascript
emitCodexBusV0("POLICY_EVOLUTION_TICK", {
  layer: 42,
  canonicalTeacher: "enclosure",
  mirrorDivergence: "jump",
  driftVectorMagnitude: 0.24,
  canonicalWeight: 0.7,
  mirrorWeight: 0.3,
  status: "ALTERNATIVE_UNIVERSE_PRESERVED"
});
```

---

## Runtime modules

| Module | Role |
|--------|------|
| `regretVectorSystemV0.js` | Regret vectors from `evalTrace` |
| `geometricDriftFieldV0.js` | 70/30 field + alternative node archive |
| `mirrorPolicyDiffTrackerV0.js` | CodexBus emit + ring buffer |
| `policyEvolutionColliderV0.js` | Orchestrator wired from `chessLearningLoopV0` |

### Probe

```javascript
window.__rhizoh?.policyEvolution?.list?.()
window.__rhizoh?.policyEvolution?.alternatives?.()
```

Console: `[CASTLE_policy_evolution]`

---

## Related

- [`RHIZOH_GEOMETRY_LAYER_V0.md`](RHIZOH_GEOMETRY_LAYER_V0.md) — shape encoder (UGE)
- [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](../RHIZOH_HONEST_BASELINE_CHARTER_V1.md) — LLM transient motor; Rhizoh continuity protocol

---

*V0 — Chess pilot. Dual reality observation, not Stockfish overfitting.*
