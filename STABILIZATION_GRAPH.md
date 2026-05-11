## Frozen Epistemic Core DAG (v562–v570)

> Module-level dependency graph for the bounded epistemic adaptive control system.
> Nodes are files; edges are **direct imports** (excluding tests and external layers).

```text
crossAgentRhythmSyncV561.js
  → phaseIdentityAndCollapseV562.js
  → phaseConstraintKernelV563.js
  → phaseConstraintAdaptationV564.js
  → phaseConstraintEquilibriumAnchorV565.js
  → phaseAnchorPlasticityV566.js
  → phaseObservationControlCouplingV567.js
  → phaseObservationTrustCalibrationV568.js
  → phaseTrustCalibrationDriftV569.js
  → phaseEpistemicErrorSemanticsV570.js
```

### Core edges (by file)

```text
phaseIdentityAndCollapseV562.js
  (no phase* imports)

phaseConstraintKernelV563.js
  ← phaseIdentityAndCollapseV562.js

phaseConstraintAdaptationV564.js
  ← phaseConstraintKernelV563.js

phaseConstraintEquilibriumAnchorV565.js
  ← phaseConstraintAdaptationV564.js
  ← phaseConstraintKernelV563.js

phaseAnchorPlasticityV566.js
  ← phaseConstraintAdaptationV564.js
  ← phaseConstraintEquilibriumAnchorV565.js
  ← phaseConstraintKernelV563.js

phaseObservationControlCouplingV567.js
  ← phaseConstraintAdaptationV564.js
  ← phaseAnchorPlasticityV566.js
  ← phaseConstraintEquilibriumAnchorV565.js
  ← phaseConstraintKernelV563.js

phaseObservationTrustCalibrationV568.js
  ← phaseConstraintAdaptationV564.js
  ← phaseAnchorPlasticityV566.js
  ← phaseConstraintEquilibriumAnchorV565.js
  ← phaseObservationControlCouplingV567.js
  ← phaseConstraintKernelV563.js

phaseTrustCalibrationDriftV569.js
  ← phaseConstraintAdaptationV564.js
  ← phaseAnchorPlasticityV566.js
  ← phaseConstraintEquilibriumAnchorV565.js
  ← phaseObservationControlCouplingV567.js
  ← phaseObservationTrustCalibrationV568.js
  ← phaseConstraintKernelV563.js

phaseEpistemicErrorSemanticsV570.js
  ← phaseTrustCalibrationDriftV569.js
```

This graph is intentionally **descriptive only**: it encodes the **DAG and layer order**, not behavior.

