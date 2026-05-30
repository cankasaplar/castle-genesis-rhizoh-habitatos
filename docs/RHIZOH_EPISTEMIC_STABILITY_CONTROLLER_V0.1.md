# Rhizoh epistemic stability controller v0.1

**SPECFLOW:** `RESEARCH-ONLY` — long-horizon interpretation; **non-executive**

**RCMM v1.1:** CMM = four operators (`M_STRESS`, `M_DRIFT`, `M_ANOMALY`, `M_COHERENCE`). `driftRiskScore`, smoothed graph, and unified report = **`DERIVED_RUNTIME_ONLY`** — not canonical measurements. See [`architecture/rhizoh_canonical_measurement_map_v1.md`](architecture/rhizoh_canonical_measurement_map_v1.md) §5.

**Runtime role lock:** [`architecture/rhizoh_runtime_semantic_role_lock_v1.md`](architecture/rhizoh_runtime_semantic_role_lock_v1.md) — `driftRiskScore` / `scoreBucket` = compute; `band` = project label only; must not drive phase gate or Core.

Sits on [`RHIZOH_EPISTEMIC_TICK_LEDGER_V0.1.md`](RHIZOH_EPISTEMIC_TICK_LEDGER_V0.1.md) after each §7 tick append.

## Role

| Capability | API |
|------------|-----|
| Tick graph smoothing (EMA on state rank) | `smoothEpistemicTickGraphV0()` |
| Long-term divergence thresholds | `evaluateLongTermDivergenceV0()` |
| A9 / A11 signal id check | `detectA9A11SignalSuppressionV0()` |
| System drift risk score (0–100) | `computeSystemDriftRiskScoreV0()` |
| Unified report | `evaluateEpistemicStabilityV0()` |

**Observation ≠ Execution** — smoothing never mutates ledger, tick `epistemic_state`, playbook, or boundary enforcement.

## Default thresholds (window = 32 ticks)

| Key | Default |
|-----|---------|
| `boundaryDivergedRatio` | 0.25 |
| `degradedRatio` | 0.35 |
| `quarantineRatio` | 0.12 |
| `compoundStreakTicks` | 3 |
| `clientGatewayGapTicks` | 8 |

## Suppression signals (v0.1)

- `a9_epistemic_smoothing_mask` — raw hot ≥2 ticks while smoothed reads `LIVE_OK`
- `a9_post_incident_calm_mask` — A9 closed but tail smoothed calm vs raw hot
- `a11_boundary_gap_suppressed` — seq gap rising while boundary not `DIVERGED`
- `a11_compound_without_boundary_escalation` — compound fault with `ALIGNED` boundary

## Drift risk buckets (compute + project)

| `driftRiskScore` | `scoreBucket` | `band` (project label only) |
|------------------|---------------|-----------------------------|
| 0–19 | 0 | `nominal` |
| 20–44 | 1 | `watch` |
| 45–69 | 2 | `elevated` |
| 70–100 | 3 | `critical` |

Authority uses **`scoreBucket`** / score — not English band strings.

## Captain

```javascript
window.__rhizoh.epistemicStability.evaluate();
window.__rhizoh.epistemicStability.driftRisk();
JSON.parse(window.__rhizoh.epistemicStability.exportReport());
```

Wired after `runEpistemicTickV0` when `recordLedger` and `recordStability` are true (default).

## Related

- Tick engine: [`RHIZOH_EPISTEMIC_TICK_ENGINE_V0.1.md`](RHIZOH_EPISTEMIC_TICK_ENGINE_V0.1.md)
- Attack A9/A11: [`RHIZOH_EXTERNAL_EPISTEMIC_ATTACK_MODEL_V0.1.md`](RHIZOH_EXTERNAL_EPISTEMIC_ATTACK_MODEL_V0.1.md)
