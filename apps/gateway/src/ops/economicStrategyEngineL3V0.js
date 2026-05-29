/**
 * Economic Strategy Engine (L3) v0 — visibility + proposals only; never executes policy.
 * Proposals enqueue to economicStrategyProposalQueueV0 (human approval).
 * @see docs/ops/ECONOMIC_STRATEGY_ENGINE_L3_V1.0.md
 */

import { buildGclVisibilityV0, detectGclDriftV0, readGlobalCostLedgerConfigV0 } from "./globalCostLedgerV0.js";
import {
  ECONOMIC_STRATEGY_PROPOSAL_KIND_V0,
  buildEconomicStrategyProposalV0,
  createEconomicStrategyProposalQueueV0
} from "./economicStrategyProposalQueueV0.js";

export const ECONOMIC_STRATEGY_ENGINE_SCHEMA_V0 = "rhizoh.economic_strategy_engine.l3.v0";

export const ECONOMIC_STRATEGY_ENGINE_RULES_V0 = Object.freeze({
  feedsExecution: false,
  cannotBeInterpretedAsGuidance: true,
  layer: "L3_observation_strategy",
  firewall:
    "L3 may propose config deltas; only human-approved APPLY_CONFIG may change env — never auto-wire to rhizohGatewayTurn."
});

/**
 * @param {{ global?: object, principal?: object | null, drift?: object }} ledgerSnapshot from getGlobalCostLedgerSnapshotV0
 */
export function evaluateEconomicStrategyL3V0(ledgerSnapshot = {}) {
  const cfg = readGlobalCostLedgerConfigV0();
  const global = ledgerSnapshot.global && typeof ledgerSnapshot.global === "object" ? ledgerSnapshot.global : {};
  const principal =
    ledgerSnapshot.principal && typeof ledgerSnapshot.principal === "object" ? ledgerSnapshot.principal : null;
  const drift = ledgerSnapshot.drift || detectGclDriftV0({ global });
  const visibility = ledgerSnapshot.visibility || buildGclVisibilityV0({ global, principal, cfg, drift });

  /** @type {ReturnType<buildEconomicStrategyProposalV0>[]} */
  const proposals = [];

  if (cfg.hardSpendLimitUsd > 0 && visibility.globalUsdUtilization01 != null && visibility.globalUsdUtilization01 >= 0.85) {
    proposals.push(
      buildEconomicStrategyProposalV0({
        kind: ECONOMIC_STRATEGY_PROPOSAL_KIND_V0.GLOBAL_USD_CAP_TIGHTEN,
        rationale: `global_usd_util_${visibility.globalUsdUtilization01}_above_0_85`,
        payload: { suggestedUsdCap: Math.round(cfg.hardSpendLimitUsd * 0.9) }
      })
    );
  }

  if (visibility.principalTokenUtilization01 >= 0.9) {
    proposals.push(
      buildEconomicStrategyProposalV0({
        kind: ECONOMIC_STRATEGY_PROPOSAL_KIND_V0.PRINCIPAL_TOKEN_CAP_REVIEW,
        rationale: `principal_token_util_${visibility.principalTokenUtilization01}`,
        payload: { principalTokens: principal?.tokens ?? 0 }
      })
    );
  }

  if (drift.driftDetected) {
    proposals.push(
      buildEconomicStrategyProposalV0({
        kind: ECONOMIC_STRATEGY_PROPOSAL_KIND_V0.PROVIDER_RECONCILE_HOLD,
        rationale: `estimate_provider_drift_ratio_${drift.ratio}`,
        payload: { estimatedUsd: drift.estimatedUsd, providerUsd: drift.providerUsd }
      })
    );
  }

  if (
    visibility.globalUsdUtilization01 != null &&
    visibility.globalUsdUtilization01 >= 0.7 &&
    visibility.globalUsdUtilization01 < 0.85
  ) {
    proposals.push(
      buildEconomicStrategyProposalV0({
        kind: ECONOMIC_STRATEGY_PROPOSAL_KIND_V0.GLOBAL_DEGRADE_MODE,
        rationale: "global_usd_soft_band_enforce_fast_dialogue",
        payload: { generationMode: "FAST_DIALOGUE" }
      })
    );
  }

  if (!proposals.length) {
    proposals.push(
      buildEconomicStrategyProposalV0({
        kind: ECONOMIC_STRATEGY_PROPOSAL_KIND_V0.MONITORING_HOLD,
        rationale: "economic_state_within_band",
        payload: { visibility }
      })
    );
  }

  const queue = createEconomicStrategyProposalQueueV0(proposals);

  return {
    schema: ECONOMIC_STRATEGY_ENGINE_SCHEMA_V0,
    rules: ECONOMIC_STRATEGY_ENGINE_RULES_V0,
    visibility,
    drift,
    proposalQueue: queue,
    summary: {
      proposalCount: proposals.length,
      byKind: proposals.reduce((acc, p) => {
        acc[p.kind] = (acc[p.kind] || 0) + 1;
        return acc;
      }, /** @type {Record<string, number>} */ ({}))
    }
  };
}
