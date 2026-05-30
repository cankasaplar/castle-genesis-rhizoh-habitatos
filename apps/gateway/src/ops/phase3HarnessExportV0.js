/**
 * Phase 3 harness export composer — joins control + observation at firewall boundary.
 */
import {
  runPhase3ExecutionControlHarnessV0
} from "./phase3ControlledDivergenceRuntimeV0.js";
import { buildPhase3ObservationExportV0 } from "./phase3ObservationExportV0.js";
import { composePhase3HarnessExportV0 } from "./phase3ControlObservationFirewallV0.js";

export function runPhase3ExecutionSpecHarnessV0() {
  const control = runPhase3ExecutionControlHarnessV0();
  const observation = buildPhase3ObservationExportV0({
    atMs: control.atMs,
    outcomeRecords: control.outcomeRecords,
    scenarioResults: control.scenarios,
    overGatingOperational: control.overGatingMetrics.operational,
    overGatingDrill: control.overGatingMetrics.failureDrills,
  });
  return composePhase3HarnessExportV0({ control, observation });
}
