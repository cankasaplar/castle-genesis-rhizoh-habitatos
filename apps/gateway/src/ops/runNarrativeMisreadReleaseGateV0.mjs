#!/usr/bin/env node
/**
 * CI / release gate — unified narrative + misread simulation must have zero high residual paths.
 */
import { buildUnifiedStateNarrativeV0 } from "./unifiedStateNarrativeV0.js";
import { runNarrativeMisreadSimulationV0 } from "./narrativeMisreadSimulationV0.js";
import { assertInterpretationUxContractV1 } from "./interpretationUxContractV1.js";

const maxHighResidual = Number(process.env.CASTLE_MISREAD_GATE_MAX_HIGH_RESIDUAL ?? "0");

const narrative = await buildUnifiedStateNarrativeV0({ platformScope: true });
assertInterpretationUxContractV1(narrative);

const sim = runNarrativeMisreadSimulationV0(narrative);

const payload = {
  gate: "rhizoh.narrative_misread_release_gate.v0",
  ranAt: new Date().toISOString(),
  scenarioCount: sim.scenarioCount,
  highResidualCount: sim.highResidualCount,
  tabletopVerdict: sim.tabletopVerdict,
  maxAllowedHighResidual: maxHighResidual,
  passed: sim.highResidualCount <= maxHighResidual
};

console.log(JSON.stringify(payload, null, 2));

if (!payload.passed) {
  console.error(
    `MISREAD_RELEASE_GATE_FAIL: highResidualCount=${sim.highResidualCount} > max=${maxHighResidual}`
  );
  for (const o of sim.outcomes.filter((x) => x.residualRisk === "high")) {
    console.error(`  - ${o.id}: ${o.trigger}`);
  }
  process.exit(1);
}

process.exit(0);
