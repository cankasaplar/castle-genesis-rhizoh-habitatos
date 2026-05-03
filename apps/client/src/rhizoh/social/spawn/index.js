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
  pickSemanticRoleAvoidingImprints
} from "./protoAgentGestation.js";
export {
  COGNITIVE_BIRTH_THRESHOLD,
  MAX_ACTIVE_COGNITIVE_THREADS,
  MAX_ACTIVE_IN_CHORUS,
  MAX_STORED_COGNITIVE_THREADS,
  COGNITIVE_THREAD_PROMPT_CHARS,
  COGNITIVE_THREAD_TTL_MS,
  cognitiveSubThreadFromEnvelope,
  stepCognitiveSubThreads,
  graduateEmbryosToCognitiveThreads,
  formatCognitiveSubThreadsForPrompt
} from "./cognitiveSubThread.js";
export { evaluateEmbodiment } from "./embodimentGate.js";
export { conductCognitiveChorus, formatCognitiveChorusForPrompt } from "./cognitiveConductor.js";
