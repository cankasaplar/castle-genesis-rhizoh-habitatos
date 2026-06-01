import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { isRhizohCreativeSurfaceEnabledV0 } from "./castleCreativeSurfaceGateV0.js";
import {
  CSE_EVENT_V0,
  maybeRunContinuitySeamlessEntryV0,
  shouldUseContinuitySeamlessEntryV0
} from "./continuitySeamlessEntryV0.js";
import { ExpressiveRealityEmotionalAnchorStripV0 } from "./ExpressiveRealityEmotionalAnchorStripV0.jsx";
import { ExpressiveRealityTransitionOverlayV0 } from "./ExpressiveRealityTransitionOverlayV0.jsx";
import {
  maybeStartContinuityEntryCompressionV0,
  shouldUseContinuityEntryCompressionV0
} from "./continuityEntryCompressionV0.js";
import {
  buildExpressiveRealityTransitionPlanV0,
  maybeStartExpressiveRealityBootTransitionV0,
  RTL_EVENT_CONTEXT_V0,
  RTL_EVENT_SURFACE_REVEAL_V0,
  RTL_PHASE_COMPLETE_V0,
  shouldRunExpressiveRealityTransitionV0
} from "./expressiveRealityTransitionV0.js";
import {
  isExpressiveRealityBootCompleteV0,
  maybeTriggerMapPinChangeMicroRtlV0,
  maybeTriggerMapSurfaceMicroRtlV0,
  persistEmotionalAnchorV0,
  RTL_EVENT_MICRO_V0,
  triggerChatReturnMicroRtlV0
} from "./expressiveRealityMicroTransitionV0.js";

/**
 * Mount once at app root — seamless continuation default; micro-RTL during play; overlay only for micro/ceremony opt-in.
 */
export function ExpressiveRealityTransitionHostV0() {
  const [overlayActive, setOverlayActive] = useState(false);
  const [microActive, setMicroActive] = useState(false);
  const [anchorPulse, setAnchorPulse] = useState(false);
  const [continuedFlash, setContinuedFlash] = useState(false);
  const [phase, setPhase] = useState(
    /** @type {{ id?: string, variant?: string, headline?: string, lines?: string[] } | null} */ (null)
  );
  const [experienceState, setExperienceState] = useState("E2-X");

  const pulseAnchorBrief = useCallback(() => {
    setAnchorPulse(true);
    window.setTimeout(() => setAnchorPulse(false), 320);
  }, []);

  const finishBoot = useCallback(() => {
    setOverlayActive(false);
    setPhase(null);
    pulseAnchorBrief();
  }, [pulseAnchorBrief]);

  const startBoot = useCallback((input = {}) => {
    if (shouldUseContinuitySeamlessEntryV0()) {
      maybeRunContinuitySeamlessEntryV0(input, {
        onComplete: (snap) => {
          setExperienceState(snap.experience_state || "E2-X");
          setContinuedFlash(true);
          pulseAnchorBrief();
          window.setTimeout(() => setContinuedFlash(false), 480);
        }
      });
      return;
    }

    const useCompression = shouldUseContinuityEntryCompressionV0();
    const useFullRtl = shouldRunExpressiveRealityTransitionV0();
    if (!useCompression && !useFullRtl) return;

    setOverlayActive(true);

    const onPhase = (p) => {
      setPhase(p);
      if (p.id === RTL_PHASE_COMPLETE_V0) {
        window.setTimeout(() => setOverlayActive(false), 400);
      }
    };

    if (useCompression) {
      const started = maybeStartContinuityEntryCompressionV0(input, {
        onPhase: (p) => {
          setExperienceState("E2-X");
          onPhase(p);
        },
        onComplete: (plan) => {
          setExperienceState(plan.experience_state || "E2-X");
          persistEmotionalAnchorV0(plan.pal_anchor, { kind: "cec_continue" });
          finishBoot();
        }
      });
      if (started.started && started.plan) {
        persistEmotionalAnchorV0(started.plan.pal_anchor, { kind: "cec_open" });
        setExperienceState(started.plan.experience_state || "E2-X");
      }
      return;
    }

    const plan = buildExpressiveRealityTransitionPlanV0(input);
    setExperienceState(plan.experience_state);
    persistEmotionalAnchorV0(plan.pal_anchor, { kind: "boot" });
    maybeStartExpressiveRealityBootTransitionV0(input, {
      onPhase,
      onComplete: finishBoot
    });
  }, [finishBoot, pulseAnchorBrief]);

  useLayoutEffect(() => {
    if (!isRhizohCreativeSurfaceEnabledV0()) return;
    startBoot({});
  }, [startBoot]);

  useEffect(() => {
    if (!isRhizohCreativeSurfaceEnabledV0()) return undefined;

    const onContext = (ev) => {
      const detail = ev?.detail && typeof ev.detail === "object" ? ev.detail : {};
      if (detail.complete) return;
      const plan = detail.plan || buildExpressiveRealityTransitionPlanV0(detail);
      persistEmotionalAnchorV0(plan.pal_anchor, {
        kind: "context",
        thread_id: plan.thread_id,
        trace_id: plan.trace_id
      });
      if (shouldRunExpressiveRealityTransitionV0()) return;
      maybeTriggerMapPinChangeMicroRtlV0(detail.lifeEntityProjection, detail.lifeEntityResolver, {
        threadId: detail.threadId,
        traceId: detail.traceId
      });
    };

    const onMicro = (ev) => {
      const detail = ev?.detail && typeof ev.detail === "object" ? ev.detail : {};
      const microPhase = detail.phase;
      if (!microPhase) return;
      setExperienceState("E2-X");
      setPhase(microPhase);
      setMicroActive(true);
      setAnchorPulse(true);
      const durationMs = Math.max(200, Number(microPhase.durationMs) || 300);
      window.setTimeout(() => {
        setMicroActive(false);
        setPhase(null);
        setAnchorPulse(false);
      }, durationMs);
    };

    const onSurface = (ev) => {
      if (!isExpressiveRealityBootCompleteV0()) return;
      const detail = ev?.detail && typeof ev.detail === "object" ? ev.detail : {};
      if (detail.surface === "map") {
        maybeTriggerMapSurfaceMicroRtlV0({ source: String(detail.phaseId || "map") });
      }
      if (detail.surface === "chat") {
        triggerChatReturnMicroRtlV0();
      }
    };

    const onSeamless = () => {
      setContinuedFlash(true);
      window.setTimeout(() => setContinuedFlash(false), 480);
    };

    window.addEventListener(RTL_EVENT_CONTEXT_V0, onContext);
    window.addEventListener(RTL_EVENT_MICRO_V0, onMicro);
    window.addEventListener(RTL_EVENT_SURFACE_REVEAL_V0, onSurface);
    window.addEventListener(CSE_EVENT_V0, onSeamless);
    return () => {
      window.removeEventListener(RTL_EVENT_CONTEXT_V0, onContext);
      window.removeEventListener(RTL_EVENT_MICRO_V0, onMicro);
      window.removeEventListener(RTL_EVENT_SURFACE_REVEAL_V0, onSurface);
      window.removeEventListener(CSE_EVENT_V0, onSeamless);
    };
  }, [startBoot]);

  if (!isRhizohCreativeSurfaceEnabledV0()) return null;

  return (
    <>
      <ExpressiveRealityEmotionalAnchorStripV0 pulse={anchorPulse} continued={continuedFlash} />
      <ExpressiveRealityTransitionOverlayV0
        active={overlayActive || microActive}
        phase={phase}
        experienceState={experienceState}
      />
    </>
  );
}
