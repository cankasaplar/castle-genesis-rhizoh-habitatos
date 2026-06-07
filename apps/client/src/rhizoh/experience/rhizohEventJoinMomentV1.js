/**
 * Perceptual join confirmation — not execution, not WAL.
 */

import { loadRhizohEventRecordV12 } from "./rhizohEventSurfaceV12.js";
import {
  recordCohortFunnelStepOnceV1,
  RHIZOH_COHORT_FUNNEL_STEP_V1
} from "./rhizohCohortFunnelRingV1.js";

export const RHIZOH_EVENT_JOIN_MOMENT_EVENT_V1 = "rhizoh:event-join-moment-v1";

const seenJoinKeys = new Set();

/**
 * @param {ReturnType<typeof import("./rhizohExperienceSessionContextV0.js").buildRhizohExperienceSessionContextV0>} context
 */
export function maybeEmitEventJoinMomentV1(context) {
  if (!context || context.lastTransition !== "invite_join" || !context.eventId) return null;
  const key = `${context.experienceSessionId || "exp"}:${context.eventId}:${context.inviteToken || ""}`;
  if (seenJoinKeys.has(key)) return null;
  seenJoinKeys.add(key);

  const record = loadRhizohEventRecordV12(context.eventId);
  const detail = Object.freeze({
    eventId: context.eventId,
    title: record?.title || "Shared experience",
    lifecycle: context.eventLifecycle || record?.lifecycle || "SCHEDULED",
    atMs: Date.now()
  });

  recordCohortFunnelStepOnceV1(RHIZOH_COHORT_FUNNEL_STEP_V1.INVITE_JOIN, {
    eventId: detail.eventId
  });
  recordCohortFunnelStepOnceV1(RHIZOH_COHORT_FUNNEL_STEP_V1.FRIEND_JOIN, {
    eventId: detail.eventId
  });

  if (typeof window !== "undefined") {
    window.__RHIZOH_EVENT_JOIN_MOMENT__ = Object.freeze({
      schema: "castle.rhizoh_event_join_moment.v1",
      readOnly: true,
      last: detail
    });
    window.dispatchEvent(
      new CustomEvent(RHIZOH_EVENT_JOIN_MOMENT_EVENT_V1, { detail })
    );
  }
  return detail;
}

/** @internal vitest */
export function __resetRhizohEventJoinMomentForTestV1() {
  seenJoinKeys.clear();
  try {
    if (typeof window !== "undefined") delete window.__RHIZOH_EVENT_JOIN_MOMENT__;
  } catch {
    /* noop */
  }
}

export { resolveRhizohInviteWelcomeCopyV1, resolveEventJoinMomentCopyV1 } from "./rhizohExperienceWelcomeV1.js";
