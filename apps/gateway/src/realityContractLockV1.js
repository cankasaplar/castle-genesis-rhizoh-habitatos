/**
 * vNext-Edge Reality Consistency — tek kaynak sözleşme kilidi (gateway).
 * Test / CI bu nesnenin SHA256 özetini `CASTLE_REALITY_CONTRACT_LOCK_SHA256` ile sabitleyebilir.
 */

export const REALITY_CONTRACT_LOCK = Object.freeze({
  layer: "vNext-edge-reality-consistency",
  lockVersion: 1,
  membershipFirestoreSchemaVersion: 1,
  membershipStripeDerivationVersion: 1,
  broadcastProtocolClientRef: "v555.1",
  presenceInfluenceHardeningRef: "v556",
  feedbackStabilityGovernorRef: "v557",
  adaptiveStabilityRelaxationRef: "v558",
  perceptualRhythmGovernorRef: "v559",
  rhythmicPhaseMemoryRef: "v560",
  crossAgentRhythmSyncRef: "v561",
  phaseIdentityAndCollapseRef: "v562",
  phaseConstraintKernelRef: "v563",
  phaseConstraintAdaptationRef: "v564",
  phaseConstraintEquilibriumAnchorRef: "v565",
  phaseAnchorPlasticityRef: "v566",
  phaseObservationControlCouplingRef: "v567",
  phaseObservationTrustCalibrationRef: "v568",
  phaseTrustCalibrationDriftRef: "v569",
  phaseEpistemicErrorSemanticsRef: "v570",
  stripeWebhookEventTypes: Object.freeze([
    "checkout.session.completed",
    "customer.subscription.updated",
    "customer.subscription.deleted"
  ])
});
