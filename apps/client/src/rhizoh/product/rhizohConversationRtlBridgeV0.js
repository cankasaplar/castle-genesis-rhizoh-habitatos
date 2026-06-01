/**
 * Conversation orchestrator → Micro-RTL bridge (phase, thread, story).
 * @see docs/RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md
 */

import { isRhizohCreativeSurfaceEnabledV0 } from "../runtime/castleCreativeSurfaceGateV0.js";
import { explainRhizohPhaseTransition } from "../experience/rhizohExperienceLayerV1.js";
import {
  establishUserAnchorIfAbsentV0,
  mergePalIntoAnchorContextV0,
  mergeCohortAnchorV0
} from "../runtime/memoryAnchorSystemV0.js";
import { extractPalAnchorFromLifeProjectionV0 } from "../runtime/expressiveRealityTransitionV0.js";
import {
  triggerStoryShiftMicroRtlV0,
  triggerThreadSwitchMicroRtlV0
} from "../runtime/expressiveRealityMicroTransitionV0.js";
import { getRhizohCohortIdForRequestV0 } from "../runtime/rhizohCohortPinClientV0.js";
import { pushRhizohSeedInterpretationPulseV0 } from "../runtime/rhizohMultilingualBridgeV0.js";

/**
 * Phase / thread transitions during conversation orchestration.
 * @param {{
 *   prevPhase?: string,
 *   nextPhase?: string,
 *   prevThreadId?: string,
 *   nextThreadId?: string
 * }} input
 */
export function applyRhizohConversationRtlHooksV0(input = {}) {
  if (!isRhizohCreativeSurfaceEnabledV0()) return;

  const prevPhase = String(input.prevPhase || "");
  const nextPhase = String(input.nextPhase || "");
  if (prevPhase && nextPhase && prevPhase !== nextPhase) {
    const detail =
      explainRhizohPhaseTransition(prevPhase, nextPhase) ||
      `Anlatı fazı: ${nextPhase}`;
    triggerStoryShiftMicroRtlV0(detail);
  }

  const prevThread = String(input.prevThreadId || "").trim();
  const nextThread = String(input.nextThreadId || "").trim();
  if (prevThread && nextThread && prevThread !== nextThread) {
    triggerThreadSwitchMicroRtlV0(nextThread);
  }
}

/**
 * After LLM normalize — user anchor, cohort hint, PAL merge, thread id from response.
 * @param {{
 *   prevPhase?: string,
 *   nextPhase?: string,
 *   message?: string,
 *   normalized?: Record<string, unknown> | null,
 *   prevThreadId?: string
 * }} input
 */
export function registerRhizohConversationRtlAfterTurnV0(input = {}) {
  if (!isRhizohCreativeSurfaceEnabledV0()) return;

  const normalized = input.normalized && typeof input.normalized === "object" ? input.normalized : {};
  const lc =
    normalized.lifeContinuity && typeof normalized.lifeContinuity === "object"
      ? /** @type {Record<string, unknown>} */ (normalized.lifeContinuity)
      : {};
  const threadId = String(lc.thread_id || input.prevThreadId || "").trim();
  const nextThreadId = threadId || undefined;

  applyRhizohConversationRtlHooksV0({
    prevPhase: input.prevPhase,
    nextPhase: input.nextPhase,
    prevThreadId: input.prevThreadId,
    nextThreadId: threadId
  });

  const message = String(input.message || "").trim();
  if (message.length >= 8) {
    const pal = extractPalAnchorFromLifeProjectionV0(
      normalized.lifeEntityProjection,
      normalized.lifeEntityResolver
    );
    establishUserAnchorIfAbsentV0({
      threadId,
      messageExcerpt: message.slice(0, 200),
      palLabel: pal.label
    });
  }

  const cohortId = getRhizohCohortIdForRequestV0();
  if (cohortId) {
    mergeCohortAnchorV0({ cohortId, label: `Cohort ${cohortId.slice(0, 12)}` });
  }

  if (normalized.lifeEntityProjection || normalized.lifeEntityResolver) {
    const pal = extractPalAnchorFromLifeProjectionV0(
      normalized.lifeEntityProjection,
      normalized.lifeEntityResolver
    );
    mergePalIntoAnchorContextV0(pal, {
      threadId,
      traceId: String(normalized.traceId || ""),
      kind: "message_arrive"
    });
    if (pal.label) {
      pushRhizohSeedInterpretationPulseV0({ label: pal.label, message });
    }
  }

}
