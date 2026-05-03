export { perceiveSharedRoom } from "./socialPerception.js";
export { mergeBondGraphFromTurn, seedBondStubs } from "./bondGraph.js";
export { computeAttention, extractMentions } from "./attentionRouter.js";
export { inferVoiceRoute, VOICE_ROUTE } from "./voiceRouting.js";
export { createInitialSocialField, advanceSocialField, formatSocialFieldForPrompt } from "./socialCognition.js";
export {
  createInitialSocialRegistry,
  advanceCastleSocialIdentity,
  formatSocialRegistryForPrompt,
  ENTITY_CLASS,
  INTRO_PHASE,
  REL_STAGE,
  createBrowserPresenceSignalRef,
  attachBrowserPresenceSensors,
  snapshotBrowserPresenceForCsil,
  castlePeersForSocial,
  createInitialSocialFieldTheoryState,
  advanceSocialFieldTheory
} from "./csil/index.js";
export { fusePhysicsIntoPresenceTelemetry } from "./qpp/index.js";
export {
  createInitialSpawnEnvelopeQueue,
  stepProtoAgentGestationQueue,
  PROTO_AGENT_DEFAULT_TTL_MS,
  computePhantomMassScale,
  phantomShadowAdditive,
  extractIntentMixFromTimeline,
  deriveLocalSemanticRoleFromMix,
  deriveTemperamentBiasFromGrid,
  applyComplementaryRolePolicy,
  roleScoresFromMix,
  pickSemanticRoleAvoidingImprints,
  formatCognitiveSubThreadsForPrompt,
  COGNITIVE_BIRTH_THRESHOLD,
  MAX_ACTIVE_COGNITIVE_THREADS,
  MAX_STORED_COGNITIVE_THREADS,
  evaluateEmbodiment,
  conductCognitiveChorus,
  formatCognitiveChorusForPrompt
} from "./spawn/index.js";
export { computeGhostEcologyV1, GHOST_ECOLOGY_V1 } from "./ecology/index.js";
