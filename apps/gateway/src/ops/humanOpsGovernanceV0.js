/**
 * Human ops governance v0 — bundles scaling + UI safety + misread simulation.
 */

import { buildHumanDecisionScalingV0 } from "./humanDecisionScalingV0.js";
import { buildHumanDecisionOpsRunbookV0 } from "./humanDecisionOpsRunbookV0.js";
import { buildNarrativeUiDisplayPolicyV0 } from "./narrativeUiSafetyV0.js";
import { runNarrativeMisreadSimulationV0 } from "./narrativeMisreadSimulationV0.js";
import {
  buildInterpretationUxContractExportV1,
  assertInterpretationUxContractV1
} from "./interpretationUxContractV1.js";

export function enrichNarrativeWithHumanOpsGovernanceV0(narrativeExport, ctx = {}) {
  const humanDecisionOpsRunbook = buildHumanDecisionOpsRunbookV0({
    dau: ctx.dau,
    instances: ctx.instances,
    tenantCount: ctx.tenantCount
  });
  const humanDecisionScaling = buildHumanDecisionScalingV0(
    {
      dau: ctx.dau,
      instances: ctx.instances,
      tenantCount: ctx.tenantCount
    },
    humanDecisionOpsRunbook
  );
  const narrativeUiSafety = buildNarrativeUiDisplayPolicyV0(narrativeExport);
  const withUi = {
    ...narrativeExport,
    humanOps: { humanDecisionScaling, narrativeUiSafety, humanDecisionOpsRunbook }
  };
  const misreadSimulation = runNarrativeMisreadSimulationV0(withUi);
  const merged = {
    ...narrativeExport,
    humanOps: { humanDecisionScaling, narrativeUiSafety, humanDecisionOpsRunbook, misreadSimulation }
  };
  const interpretationUxContract = buildInterpretationUxContractExportV1(merged);
  assertInterpretationUxContractV1(merged);

  return Object.freeze({
    ...merged,
    interpretationUxContract,
    humanOps: Object.freeze({
      humanDecisionScaling,
      narrativeUiSafety,
      humanDecisionOpsRunbook,
      misreadSimulation
    }),
    productReadiness: Object.freeze({
      technicallyBounded: true,
      executionIsolated: true,
      humanDecisionLayerRequired: true,
      perceptualAuthorityRisk: "mitigated_not_eliminated",
      safeToScaleUsers: humanDecisionScaling.tier !== "solo_operator" || (ctx.dau ?? 0) < 1000,
      answerToIsItSafe:
        "Technically yes (bounded). Product scale requires human decision tier — narrative does not decide."
    })
  });
}
