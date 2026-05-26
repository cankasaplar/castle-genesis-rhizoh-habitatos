#!/usr/bin/env node
import { MISAPPREHENSION_SHAPE_V0 } from "./realityDriftObserverLayerV0.js";
import { buildUnifiedStateNarrativeV0 } from "./unifiedStateNarrativeV0.js";

const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-rdol-gate-ci" });
const rdol = n.realityDriftObserver;

if (!rdol?.schema) {
  console.error("RDOL_GATE_FAIL: missing realityDriftObserver");
  process.exit(1);
}

const catalog = rdol.misapprehensionShapeCatalog;
const hasObservers =
  rdol.realityModelDrift?.schema &&
  rdol.propagationLiveDivergence?.schema &&
  rdol.roboticsFeedbackMismatch?.schema;

const taxonomyOk = Object.values(MISAPPREHENSION_SHAPE_V0).every((id) => typeof id === "string");
const nonExecute = rdol.nonExecutable === true && n.interpretationSafetyContract?.can_execute === false;
const etclPresent = Boolean(n.epistemicTemporalCoherence?.schema);

const payload = {
  gate: "rhizoh.reality_drift_observer_gate.v0",
  ranAt: new Date().toISOString(),
  shapeCount: catalog?.shapeCount,
  driftActive: rdol.driftObserverSummary?.active,
  criticalShapes: rdol.driftObserverSummary?.criticalShapeCount,
  etclPresent,
  taxonomyOk,
  hasObservers,
  nonExecute,
  passed: hasObservers && taxonomyOk && nonExecute && etclPresent && catalog?.schema != null
};

console.log(JSON.stringify(payload, null, 2));
process.exit(payload.passed ? 0 : 1);
