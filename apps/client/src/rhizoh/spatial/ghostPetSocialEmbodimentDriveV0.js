/**
 * SPECFLOW: RESEARCH-ONLY — **Ghost Pet social embodiment drive**: `snapshotForLlm` (ve hafif UI skalerleri)
 * → orbit / bob / dikkat skalerleri. Metin yerine **Three / studio orbit** tarafına beslenir.
 *
 * `PET_GHOST_ORBIT_PHASE_DEFAULT` ile aynı taban faz (`Math.PI * 0.22`) — `petGhostOrbit.ts` ile hizalı.
 */

import { resolveGhostPetAttentionTargetV0 } from "./ghostPetAttentionTargetV0.js";
import { resolveGhostPetLocomotionHintV0 } from "./ghostPetLocomotionIntentV0.js";
import { deriveGhostPetMotionStyleEnvelopeV0 } from "./ghostPetMotionStyleEnvelopeV0.js";
import { computeGhostPetMultiPetSpacingHintStubV0 } from "./ghostPetMultiPetSocialPhysicsStubV0.js";

export const GHOST_PET_SOCIAL_EMBODIMENT_DRIVE_SCHEMA_V0 = "castle.rhizoh.ghost_pet_social_embodiment_drive.v0";

const BASE_ORBIT_PHASE = Math.PI * 0.22;

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * @param {Record<string, unknown>|null|undefined} llmSnapshot — `kernel.snapshotForLlm` / `dist.llmSnapshot`
 * @param {{
 *   energy01?: number|null,
 *   peerCount?: number|null,
 *   operatorUserId?: string|null,
 *   focusUserId?: string|null,
 *   recentJoinerUserId?: string|null
 * }|null|undefined} [opts] — `uiSnapshot` + operatör / odak
 */
export function computeGhostPetSocialEmbodimentDriveV0(llmSnapshot, opts) {
  const s = llmSnapshot && typeof llmSnapshot === "object" ? llmSnapshot : {};
  const o = opts && typeof opts === "object" ? opts : {};

  const sr = s.socialRuntimeV1 && typeof s.socialRuntimeV1 === "object" ? s.socialRuntimeV1 : {};
  const initiative01 = clamp01(Number(sr.initiativeBudget01));
  const mode = String(sr.mode || "").toUpperCase();

  const pc = s.personaContinuity && typeof s.personaContinuity === "object" ? s.personaContinuity : {};
  const continuityStrength01 = clamp01(Number(pc.continuityStrength01));
  const ticksInBand = Math.max(0, Math.floor(Number(pc.ticksInBand) || 0));

  const roleStance = String(s.rhizohCastleRuntimeRole || "").trim().slice(0, 32) || null;

  const recall = s.socialMemoryRecall && typeof s.socialMemoryRecall === "object" ? s.socialMemoryRecall : null;
  const recallN = Array.isArray(recall?.recallLines) ? recall.recallLines.length : 0;
  const memoryRecallWeight01 = clamp01(recallN / 5);

  const bleed = s.crossCastleBleedGuard && typeof s.crossCastleBleedGuard === "object" ? s.crossCastleBleedGuard : {};
  const bleedRisk01 = clamp01(Number(bleed.bleedRisk01));

  const peerN = Math.max(0, Math.floor(Number(o.peerCount) || 0));
  const energy01 = clamp01(Number(o.energy01));

  const roleTransitionNudge =
    ticksInBand > 0 && ticksInBand <= 2 && String(pc.band || "").trim() ? 0.16 : 0;
  const phaseWiggle = (initiative01 - 0.5) * 0.38 + (continuityStrength01 - 0.5) * 0.22;
  const orbitPhaseRad = BASE_ORBIT_PHASE + phaseWiggle + roleTransitionNudge;

  let radiusScale01 = 0.9 + initiative01 * 0.14;
  if (mode.includes("ACTIVE")) radiusScale01 += 0.07;
  radiusScale01 -= bleedRisk01 * 0.1;
  radiusScale01 = Math.round(Math.max(0.82, Math.min(1.18, radiusScale01)) * 1000) / 1000;

  let verticalBobScale01 = 0.72 + energy01 * 0.38 + memoryRecallWeight01 * 0.14;
  if (mode === "IDLE" && initiative01 < 0.38) verticalBobScale01 *= 0.92;
  verticalBobScale01 = Math.round(Math.max(0.62, Math.min(1.28, verticalBobScale01)) * 1000) / 1000;

  const socialAttention01 = Math.round(clamp01(Math.min(1, peerN / 8) + energy01 * 0.32) * 1000) / 1000;

  let moodHint = "open";
  if (bleedRisk01 > 0.48) moodHint = "guarded";
  else if (mode === "IDLE" && initiative01 < 0.34) moodHint = "rested";

  const attention = resolveGhostPetAttentionTargetV0(s, o);
  const locomotionHint = resolveGhostPetLocomotionHintV0({
    roleStance,
    socialModeUpper: mode,
    attentionMode: attention.mode,
    bleedRisk01,
    initiative01
  });
  const motionStyle = deriveGhostPetMotionStyleEnvelopeV0(moodHint, initiative01, bleedRisk01, attention.blend01);
  const multiPetHint =
    peerN >= 2 ? computeGhostPetMultiPetSpacingHintStubV0({ peerCount: peerN, petCount: peerN }) : null;

  return {
    schema: GHOST_PET_SOCIAL_EMBODIMENT_DRIVE_SCHEMA_V0,
    ts: Date.now(),
    orbitPhaseRad: Math.round(orbitPhaseRad * 1000) / 1000,
    radiusScale01,
    verticalBobScale01,
    initiativeLean01: Math.round(initiative01 * 1000) / 1000,
    continuityResonance01: Math.round(continuityStrength01 * 1000) / 1000,
    memoryRecallWeight01: Math.round(memoryRecallWeight01 * 1000) / 1000,
    socialAttention01,
    roleStance,
    moodHint,
    tickBand: ticksInBand,
    bleedRisk01: Math.round(bleedRisk01 * 1000) / 1000,
    attention,
    attentionYawOffsetRad: Math.round(Number(attention.yawOffsetRad || 0) * 1000) / 1000,
    locomotionHint,
    motionStyle,
    multiPetHint
  };
}
