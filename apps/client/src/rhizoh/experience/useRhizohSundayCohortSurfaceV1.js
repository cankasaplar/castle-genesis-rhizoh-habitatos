/**
 * Sunday cohort surface hooks — welcome, degrade, funnel (presentation only).
 */

import { useEffect, useRef } from "react";
import { parseEventJoinBundleV1, detectInviteJoinDegradeV1 } from "./rhizohEventCatalogSyncV1.js";
import {
  RHIZOH_DEGRADE_MOMENT_EVENT_V1,
  emitRhizohDegradeMomentV1,
  RHIZOH_DEGRADE_KIND_V1
} from "./rhizohExperienceDegradeCopyV1.js";
import {
  hasSeenRhizohWelcomeV1,
  markRhizohWelcomeSeenV1,
  resolveRhizohFirstWelcomeCopyV1,
  resolveRhizohInviteWelcomeCopyV1
} from "./rhizohExperienceWelcomeV1.js";
import {
  recordCohortFunnelStepOnceV1,
  RHIZOH_COHORT_FUNNEL_STEP_V1
} from "./rhizohCohortFunnelRingV1.js";
import { RHIZOH_EVENT_JOIN_MOMENT_EVENT_V1 } from "./rhizohEventJoinMomentV1.js";

/**
 * @param {{
 *   uiLocaleTr?: boolean,
 *   setRhizohMainHudReply: (v: object | null) => void,
 *   speakRhizoh: (text: string, opts?: object) => void,
 *   setJoinBanner: (text: string | null) => void,
 *   setRhizohFieldState: (s: string) => void
 * }} opts
 */
export function useRhizohSundayCohortSurfaceV1(opts) {
  const tr = opts.uiLocaleTr === true;
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const search = window.location.search || "";
    const bundle = parseEventJoinBundleV1(search);
    recordCohortFunnelStepOnceV1(RHIZOH_COHORT_FUNNEL_STEP_V1.LINK_OPEN, {
      eventId: bundle.eventId,
      hasInvite: Boolean(bundle.inviteToken)
    });

    const degrade = detectInviteJoinDegradeV1(search);
    if (degrade === "invite_broken") {
      emitRhizohDegradeMomentV1(RHIZOH_DEGRADE_KIND_V1.INVITE_BROKEN, { tr });
    } else if (degrade === "event_not_found") {
      emitRhizohDegradeMomentV1(RHIZOH_DEGRADE_KIND_V1.EVENT_NOT_FOUND, { tr });
    }

    if (!bundle.eventId && !hasSeenRhizohWelcomeV1()) {
      markRhizohWelcomeSeenV1();
      const welcome = resolveRhizohFirstWelcomeCopyV1(tr);
      optsRef.current.setRhizohMainHudReply({
        text: welcome,
        source: "rhizoh-welcome-v1",
        at: Date.now()
      });
      optsRef.current.speakRhizoh(welcome);
      optsRef.current.setRhizohFieldState("LISTENING");
    }
    return undefined;
  }, [tr]);

  useEffect(() => {
    const onJoin = () => {
      const welcome = resolveRhizohInviteWelcomeCopyV1(tr);
      optsRef.current.setJoinBanner(welcome);
      optsRef.current.setRhizohMainHudReply({
        text: welcome,
        source: "rhizoh-welcome-v1",
        at: Date.now()
      });
      optsRef.current.speakRhizoh(welcome);
      optsRef.current.setRhizohFieldState("LISTENING");
      window.setTimeout(() => optsRef.current.setJoinBanner(null), 12000);
    };
    const onDegrade = (event) => {
      const copy = event?.detail?.copy;
      if (!copy) return;
      optsRef.current.setRhizohMainHudReply({
        text: copy,
        source: "rhizoh-degrade-v1",
        at: Date.now()
      });
      optsRef.current.speakRhizoh(copy);
    };
    window.addEventListener(RHIZOH_EVENT_JOIN_MOMENT_EVENT_V1, onJoin);
    window.addEventListener(RHIZOH_DEGRADE_MOMENT_EVENT_V1, onDegrade);
    return () => {
      window.removeEventListener(RHIZOH_EVENT_JOIN_MOMENT_EVENT_V1, onJoin);
      window.removeEventListener(RHIZOH_DEGRADE_MOMENT_EVENT_V1, onDegrade);
    };
  }, [tr]);
}
