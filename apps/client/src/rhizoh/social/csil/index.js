export { detectPresence } from "./presenceDetection.js";
export { ENTITY_CLASS, resolveEntityFromSignals } from "./identityResolution.js";
export { REL_STAGE, advanceRelationshipRecord } from "./relationshipGraph.js";
export {
  INTRO_PHASE,
  parseSelfIntroductionName,
  parseConsentLikely,
  introductionGuidanceForLlm,
  advanceIntroductionPhase
} from "./introductionProtocol.js";
export { defaultPermissions, permissionsFor } from "./trustBoundary.js";
export {
  createInitialSocialRegistry,
  advanceCastleSocialIdentity,
  formatSocialRegistryForPrompt,
  toneHintForClass
} from "./socialRegistry.js";
export {
  createBrowserPresenceSignalRef,
  attachBrowserPresenceSensors,
  snapshotBrowserPresenceForCsil
} from "./browserPresenceSensors.js";
export { castlePeersForSocial, mergeCastlePeersIntoRegistry } from "./castlePeers.js";
export { createInitialSocialPhysicsState, advanceSocialPhysics } from "../physics/index.js";
export { createInitialSocialFieldTheoryState, advanceSocialFieldTheory } from "../fieldTheory/index.js";
