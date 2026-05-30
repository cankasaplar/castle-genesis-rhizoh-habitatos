/**
 * SPECFLOW: RESEARCH-ONLY — CSIL multi-user **engine skeleton** (one coherent thread helpers).
 *
 * Yürütme: mevcut `advanceCastleSocialIdentity` + kontrat sabitleri + çakışma motoru.
 * `peerCount` = `input.castlePeers.length` (yerel operatör dahil değil; çağıran gerekirse listeyi genişletir).
 * Üretim wiring: App / gateway / WS katmanı ayrıca `runCsilCastleSocialEngineStepV0` çağırır.
 */

import { advanceCastleSocialIdentity } from "../csil/socialRegistry.js";
import {
  CASTLE_GROUP_MODE_THRESHOLDS_V0,
  getCastleArbitrationPriorityStackV0
} from "../castleMultiUserSocialRuntimeContractV0.js";
import {
  blendCastlePresenceEnergy01V0,
  detectCastleSimultaneousSpeechConflictV0,
  resolveCastleSpeechOverlapV0
} from "./castleSpeechConflictEngineV0.js";

/**
 * @param {{
 *   peerCount: number,
 *   distinctLangCount?: number,
 *   conflictFlag?: boolean,
 *   silenceMs?: number,
 *   silenceThresholdMs?: number
 * }} input
 * @returns {string}
 */
export function deriveRhizohCastleRuntimeRoleV0(input) {
  const peerCount = Math.max(0, Math.floor(Number(input.peerCount) || 0));
  const distinctLang = Math.max(1, Math.floor(Number(input.distinctLangCount) || 1));
  const conflictFlag = !!input.conflictFlag;
  const silenceMs = Math.max(0, Number(input.silenceMs) || 0);
  const silenceThresholdMs = Math.max(0, Number(input.silenceThresholdMs) || 45_000);
  if (conflictFlag) return "ARBITER";
  if (silenceMs > silenceThresholdMs) return "AMBIENT_PRESENCE";
  if (peerCount <= 1) return "GUIDE";
  if (distinctLang >= 2 && peerCount >= 3) return "INTERPRETER";
  if (peerCount >= CASTLE_GROUP_MODE_THRESHOLDS_V0.groupModeMin) return "CONDUCTOR";
  if (peerCount >= CASTLE_GROUP_MODE_THRESHOLDS_V0.multiUserMin) return "MEDIATOR";
  return "GUIDE";
}

/**
 * @param {{
 *   registry: unknown,
 *   input: Record<string, unknown>,
 *   speechEvents?: Array<{ userId: string, ts: number, textLen?: number }>,
 *   userEnergySlices?: Array<{ userId: string, energy01?: number }>,
 *   silenceMs?: number,
 *   distinctLangCount?: number
 * }} params
 */
export function runCsilCastleSocialEngineStepV0(params) {
  const registry = params.registry;
  const input = params.input && typeof params.input === "object" ? params.input : {};
  const overlap = resolveCastleSpeechOverlapV0(params.speechEvents || []);
  const conflictFlag =
    !!params.socialConflictFlag || detectCastleSimultaneousSpeechConflictV0(params.speechEvents || []);
  const castlePeers = Array.isArray(input.castlePeers) ? input.castlePeers : [];
  const peerCount = castlePeers.length;
  const energy01 = blendCastlePresenceEnergy01V0(
    params.userEnergySlices && params.userEnergySlices.length
      ? params.userEnergySlices
      : castlePeers.map((p) => ({ userId: String(p?.id || ""), energy01: Number(p?.nexusEnergy) }))
  );
  const role = deriveRhizohCastleRuntimeRoleV0({
    peerCount,
    distinctLangCount: params.distinctLangCount,
    conflictFlag,
    silenceMs: params.silenceMs
  });
  const nextRegistry = advanceCastleSocialIdentity(registry, input);
  return {
    registry: nextRegistry,
    focus: overlap.focus,
    shadowListeners: overlap.shadowListeners,
    energy01,
    rhizohRuntimeRole: role,
    socialConflictFlag: conflictFlag,
    arbitrationPriority: getCastleArbitrationPriorityStackV0()
  };
}
