# Rhizoh epistemic tick ledger v0.1

**SPECFLOW:** `RESEARCH-ONLY` (interpretation + history; no execution authority)

Cross-tick consistency layer on top of [`RHIZOH_EPISTEMIC_TICK_ENGINE_V0.1.md`](RHIZOH_EPISTEMIC_TICK_ENGINE_V0.1.md).

## Role

| Capability | Module |
|------------|--------|
| Append-only tick history | `epistemicTickLedgerV0.js` |
| Tick graph (sequential + shared correlation) | `buildEpistemicTickGraphV0()` |
| Divergence over time | `analyzeCrossTickDivergenceV0()` |
| Replayable export | `exportEpistemicTickHistoryJsonV0()` |
| A9 cross-tick correlation closure | `analyzeA9CrossTickCorrelationV0()` |

**Observation ≠ Execution** — ledger never triggers playbook, boundary enforcement, or synthesis actions.

## Wiring

- Every `runEpistemicTickV0` (default) calls `appendEpistemicTickToLedgerV0` after report freeze.
- Opt out: `recordLedger: false`.
- Captain: `window.__rhizoh.epistemicTickLedger` · `window.__rhizoh_epistemic_tick_ledger`

## A9 closure rule (v0.1)

Hot ticks (non-`LIVE_OK`, `compoundFault`, or any divergence flag) form an **incident window**. When ≥2 hot ticks appear in one window:

- `crossTickCompound: true` if ≥2 ticks carry `compoundFault`, **or** ≥3 unique divergence flags across the window.
- `a9Closed: true` when any incident satisfies cross-tick compound.

## Related

- Stability (long-horizon): [`RHIZOH_EPISTEMIC_STABILITY_CONTROLLER_V0.1.md`](RHIZOH_EPISTEMIC_STABILITY_CONTROLLER_V0.1.md)
- Attack model A9: [`RHIZOH_EXTERNAL_EPISTEMIC_ATTACK_MODEL_V0.1.md`](RHIZOH_EXTERNAL_EPISTEMIC_ATTACK_MODEL_V0.1.md)
- Breach observability: [`RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md`](RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md)
