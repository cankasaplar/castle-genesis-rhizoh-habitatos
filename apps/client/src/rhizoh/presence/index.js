export { deriveCognitiveTraceLabel } from "./deriveCognitiveTraceLabel.js";
export {
  normalizeRhizohOutput,
  materializeCommsFromNormalized,
  derivePresenceIntensity,
  derivePresenceDuration,
  derivePulsePattern
} from "./normalizeRhizohOutput.js";
export { QPP_PHASE, QPP_EVENT, initialPresenceFsmState, stepPresenceFsm } from "./presenceStateMachine.js";
export { emitRhizohPresence, subscribeRhizohPresence, CASTLE_RHIZOH_PRESENCE_EVENT } from "./presenceBus.js";
export { useRhizohPresenceAnimation } from "./useRhizohPresenceAnimation.js";
export { installRhizohPresenceAcoustics } from "./presenceAcoustics.js";
/** @deprecated */
export { resolveCognitiveTraceLabel, processLlmReplyForQuietPresence } from "./rhizohQuietPresenceProtocol.js";
