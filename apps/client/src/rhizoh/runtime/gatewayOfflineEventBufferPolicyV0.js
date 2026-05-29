/**
 * Gateway çevrimdışıyken Rhizoh mesaj niyetleri — mevcut kuyruk + politika özeti (telemetry / snapshot).
 */

export {
  enqueueRhizohMessageIntent,
  drainRhizohMessageIntentQueue,
  peekRhizohMessageIntentQueueLength
} from "../../castleFlight/castleIntentQueue.js";

export const RHIZOH_OFFLINE_INTENT_QUEUE_POLICY = {
  storageKey: "castle.rhizohMessageIntentQueue.v1",
  maxEntries: 24,
  dropPolicy: "oldest_shift",
  flushTrigger: "gateway_phase_transition_to_connected",
  payloadContract: "SEND_MESSAGE + provider + connectionId + agentId + llmKeySource + focus + optional identity merge fields"
};
