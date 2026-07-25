# Rhizoh Evaluation Plan v0.1

## Objective
Evaluate whether the core meets its stated guarantees.

## Experiments
1. Determinism replay test over identical observations and policy sets.
2. Tamper detection test for altered trace entries.
3. Constitution safety evaluation for denied actions.
4. Counterfactual replay comparison against baseline replay.
5. Cross-domain example execution in bank, medical, warehouse, calendar, and regulatory audit scenarios.

## Success Criteria
- Replay produces equivalent traces.
- Tampering is detected.
- Constitution violations block commit.
- Counterfactual outputs remain semantically distinct from replay.
