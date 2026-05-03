/**
 * @deprecated Yeni boru hattı: normalizeRhizohOutput + presenceStateMachine + presenceBus
 */
import { normalizeRhizohOutput, materializeCommsFromNormalized } from "./normalizeRhizohOutput.js";
export { deriveCognitiveTraceLabel as resolveCognitiveTraceLabel } from "./deriveCognitiveTraceLabel.js";

export function processLlmReplyForQuietPresence(raw, routerIntent, gatewayPhase) {
  const norm = normalizeRhizohOutput({
    reply: raw,
    router: { intent: routerIntent },
    policy: { silenceCapable: true },
    gatewayPhase
  });
  return materializeCommsFromNormalized(norm, raw);
}
