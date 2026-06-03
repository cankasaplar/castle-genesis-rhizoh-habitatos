/**
 * T0 Unified Presence Frame — single temporal authority for strip / orb / field.
 * RPSE tick = phase boundaries · RESL transitionFeel = curve · global clock = breathe sync.
 * @see docs/RHIZOH_T0_UNIFIED_PRESENCE_FRAME_V1.md
 */

export const T0_UNIFIED_PRESENCE_FRAME_SCHEMA_V0 = "castle.rhizoh.t0_unified_presence_frame.v0";

export const T0_TEMPORAL_PHASE_V0 = Object.freeze({
  ABSENT: "absent",
  TRANSITION_DELAY: "transition_delay",
  TRANSITION: "transition",
  PULSE: "pulse",
  FEL_DECAY: "fel_decay",
  BREATHE: "breathe",
  HOLD: "hold"
});

export const RHIZOH_T0_PRESENCE_FRAME_EVENT_V0 = "rhizoh:t0-presence-frame-v0";

const PULSE_TAIL_MS_V0 = 320;

let tickSeq = 0;
let presenceClockOriginMs = 0;
let transitionEpochMs = 0;
let lastStateKey = "";
/** @type {ReturnType<typeof buildT0UnifiedPresenceFrameV0> | null} */
let lastBaseFrame = null;

let rafId = 0;
/** @type {Set<(frame: ReturnType<typeof sampleT0PresenceFrameV0>) => void>} */
const samplerListeners = new Set();

function easeInOutV0(t) {
  const x = Math.max(0, Math.min(1, t));
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

/**
 * @param {number} nowMs
 * @param {number} periodMs
 * @param {number} originMs
 */
function breathe01FromClockV0(nowMs, periodMs, originMs) {
  const period = Math.max(1800, periodMs);
  const phaseRad = (((nowMs - originMs) % period) / period) * Math.PI * 2;
  return Object.freeze({
    breathe01: 0.5 + 0.5 * Math.sin(phaseRad),
    breathPhaseRad: phaseRad
  });
}

/**
 * @param {ReturnType<import("./rhizohPresenceStateEngineV0.js").deriveRhizohPresenceStateV0>} presence
 * @param {ReturnType<import("./rhizohReslPresentationPolicyV0.js").resolveReslPresentationV0>} resl
 * @param {ReturnType<import("./rhizohExperienceContinuityCompilerV0.js").compileExperienceContinuityV0> | null} [ecc]
 * @param {number} nowMs
 */
export function buildT0UnifiedPresenceFrameV0(presence, resl, ecc = null, nowMs = Date.now()) {
  tickSeq += 1;
  if (!presenceClockOriginMs) presenceClockOriginMs = nowMs;

  const present = presence?.rhizoh_is_present === true;
  const silenceForm = String(presence?.silence_form || "absent");
  const attention = String(presence?.rhizoh_attention || "idle");
  const stateKey = `${silenceForm}|${attention}`;

  if (stateKey !== lastStateKey) {
    transitionEpochMs = nowMs;
    lastStateKey = stateKey;
  }

  if (!present) {
    const empty = Object.freeze({
      schema: T0_UNIFIED_PRESENCE_FRAME_SCHEMA_V0,
      tickSeq,
      coherenceId: `${tickSeq}:absent`,
      masterNowMs: nowMs,
      presenceClockOriginMs,
      transitionEpochMs,
      stateKey,
      temporalPhase: T0_TEMPORAL_PHASE_V0.ABSENT,
      transitionProgress01: 0,
      breathe01: 0,
      breathPeriodMs: 4200,
      breathPhaseRad: 0,
      surfaces: Object.freeze({
        strip: Object.freeze({ opacity01: 0, transitionProgress01: 0 }),
        orb: Object.freeze({ breathe01: 0, intensity01: 0, rotationScale: 0.65 }),
        field: Object.freeze({ breathe01: 0, pulse01: 0, resonance01: 0 })
      }),
      fel: Object.freeze({ dampen01: 0, decayMs: 12_000 }),
      reslSilenceForm: silenceForm
    });
    lastBaseFrame = empty;
    return empty;
  }

  const fade = ecc?.fade_semantics;
  const feel = fade?.eventless ? fade : resl?.transitionFeel || {};
  const orb = resl?.orbModulation || {};
  const periodMs = Math.max(1800, Number(orb.breathPeriodMs) || 4200);
  const { breathe01, breathPhaseRad } = breathe01FromClockV0(nowMs, periodMs, presenceClockOriginMs);

  const delayMs = Number(feel.delayMs) || 0;
  const durationMs = Math.max(120, Number(feel.durationMs) || 400);
  const elapsed = nowMs - transitionEpochMs;

  let transitionProgress01 = 1;
  if (elapsed < delayMs + durationMs) {
    transitionProgress01 = elapsed < delayMs ? 0 : easeInOutV0((elapsed - delayMs) / durationMs);
  }

  let temporalPhase = T0_TEMPORAL_PHASE_V0.HOLD;
  if (elapsed < delayMs) temporalPhase = T0_TEMPORAL_PHASE_V0.TRANSITION_DELAY;
  else if (elapsed < delayMs + durationMs) temporalPhase = T0_TEMPORAL_PHASE_V0.TRANSITION;
  else if (silenceForm === "failure_narration") temporalPhase = T0_TEMPORAL_PHASE_V0.FEL_DECAY;
  else if (feel.reEngagePulse && elapsed < delayMs + durationMs + PULSE_TAIL_MS_V0) {
    temporalPhase = T0_TEMPORAL_PHASE_V0.PULSE;
  } else if (orb.breathe === true) temporalPhase = T0_TEMPORAL_PHASE_V0.BREATHE;

  const decayMs = Math.max(1000, Number(resl?.fel?.decayMs) || 12_000);
  const felElapsed = nowMs - transitionEpochMs;
  const felDampen01 =
    silenceForm === "failure_narration"
      ? Math.max(0, 1 - felElapsed / decayMs) * (1 - (Number(feel.felDampen01) || 0))
      : 1;

  const attentionDecay = Number(feel.attentionDecay01) || 0;
  const stripOpacity01 =
    temporalPhase === T0_TEMPORAL_PHASE_V0.TRANSITION_DELAY
      ? 0
      : temporalPhase === T0_TEMPORAL_PHASE_V0.TRANSITION
        ? transitionProgress01 * (1 - attentionDecay * (1 - transitionProgress01))
        : Math.min(1, felDampen01 + 0.12);

  const pulse01 =
    temporalPhase === T0_TEMPORAL_PHASE_V0.PULSE
      ? Math.max(0, 1 - (elapsed - delayMs - durationMs) / PULSE_TAIL_MS_V0)
      : 0;

  const intensity01 = Math.max(0, Math.min(1, Number(orb.intensity01) || 0.65));

  const narrativeStream = ecc
    ? Object.freeze({
        continuity_line: ecc.continuity_line,
        micro_transition: ecc.micro_transition,
        narrative_velocity: ecc.narrative_velocity,
        fade_semantics: ecc.fade_semantics,
        stream_coherence_id: ecc.stream_coherence_id,
        temporal_guard: ecc.temporal_guard || null,
        phase_coherence_ok: ecc.temporal_guard?.phase_coherence_ok !== false
      })
    : null;

  const frame = Object.freeze({
    schema: T0_UNIFIED_PRESENCE_FRAME_SCHEMA_V0,
    tickSeq,
    coherenceId: ecc?.stream_coherence_id || `${tickSeq}:${stateKey}`,
    masterNowMs: nowMs,
    presenceClockOriginMs,
    transitionEpochMs,
    stateKey,
    temporalPhase,
    transitionProgress01: Number(transitionProgress01.toFixed(4)),
    breathe01: Number(breathe01.toFixed(4)),
    breathPeriodMs: periodMs,
    breathPhaseRad,
    surfaces: Object.freeze({
      strip: Object.freeze({
        opacity01: Number(Math.max(0, Math.min(1, stripOpacity01)).toFixed(4)),
        transitionProgress01: Number(transitionProgress01.toFixed(4))
      }),
      orb: Object.freeze({
        breathe01: Number(breathe01.toFixed(4)),
        intensity01,
        rotationScale: Number(orb.rotationScale) || 1
      }),
      field: Object.freeze({
        breathe01: Number(breathe01.toFixed(4)),
        pulse01: Number(pulse01.toFixed(4)),
        resonance01: Number((breathe01 * intensity01).toFixed(4))
      })
    }),
    fel: Object.freeze({
      dampen01: Number(felDampen01.toFixed(4)),
      decayMs
    }),
    reslSilenceForm: silenceForm,
    transitionFeel: feel,
    narrativeStream
  });

  lastBaseFrame = frame;
  return frame;
}

/**
 * Interpolate breathe from global clock; keep phase boundaries from last RPSE publish.
 * @param {number} [nowMs]
 */
export function sampleT0PresenceFrameV0(nowMs = Date.now()) {
  const base = lastBaseFrame;
  if (!base || base.temporalPhase === T0_TEMPORAL_PHASE_V0.ABSENT) return base;

  const { breathe01, breathPhaseRad } = breathe01FromClockV0(
    nowMs,
    base.breathPeriodMs,
    base.presenceClockOriginMs
  );

  const elapsed = nowMs - base.transitionEpochMs;
  const feel = base.transitionFeel || {};
  const delayMs = Number(feel.delayMs) || 0;
  const durationMs = Math.max(120, Number(feel.durationMs) || 400);

  let transitionProgress01 = 1;
  if (elapsed < delayMs + durationMs) {
    transitionProgress01 = elapsed < delayMs ? 0 : easeInOutV0((elapsed - delayMs) / durationMs);
  }

  let temporalPhase = base.temporalPhase;
  if (elapsed < delayMs) temporalPhase = T0_TEMPORAL_PHASE_V0.TRANSITION_DELAY;
  else if (elapsed < delayMs + durationMs) temporalPhase = T0_TEMPORAL_PHASE_V0.TRANSITION;
  else if (base.reslSilenceForm === "failure_narration") temporalPhase = T0_TEMPORAL_PHASE_V0.FEL_DECAY;
  else if (feel.reEngagePulse && elapsed < delayMs + durationMs + PULSE_TAIL_MS_V0) {
    temporalPhase = T0_TEMPORAL_PHASE_V0.PULSE;
  } else if (base.surfaces.orb.breathe01 > 0) temporalPhase = T0_TEMPORAL_PHASE_V0.BREATHE;

  const attentionDecay = Number(feel.attentionDecay01) || 0;
  const decayMs = Math.max(1000, Number(base.fel?.decayMs) || 12_000);
  const felDampenLive =
    base.reslSilenceForm === "failure_narration"
      ? Math.max(0, 1 - elapsed / decayMs)
      : 1;
  const stripOpacity01 =
    temporalPhase === T0_TEMPORAL_PHASE_V0.TRANSITION_DELAY
      ? 0
      : temporalPhase === T0_TEMPORAL_PHASE_V0.TRANSITION
        ? transitionProgress01 * (1 - attentionDecay * (1 - transitionProgress01))
        : temporalPhase === T0_TEMPORAL_PHASE_V0.FEL_DECAY
          ? Math.min(1, felDampenLive + 0.12)
          : 1;

  const pulse01 =
    temporalPhase === T0_TEMPORAL_PHASE_V0.PULSE
      ? Math.max(0, 1 - (elapsed - delayMs - durationMs) / PULSE_TAIL_MS_V0)
      : 0;

  return Object.freeze({
    ...base,
    masterNowMs: nowMs,
    temporalPhase,
    transitionProgress01: Number(transitionProgress01.toFixed(4)),
    breathe01: Number(breathe01.toFixed(4)),
    breathPhaseRad,
    surfaces: Object.freeze({
      strip: Object.freeze({
        opacity01: Number(Math.max(0, Math.min(1, stripOpacity01)).toFixed(4)),
        transitionProgress01: Number(transitionProgress01.toFixed(4))
      }),
      orb: Object.freeze({
        ...base.surfaces.orb,
        breathe01: Number(breathe01.toFixed(4))
      }),
      field: Object.freeze({
        breathe01: Number(breathe01.toFixed(4)),
        pulse01: Number(pulse01.toFixed(4)),
        resonance01: Number((breathe01 * base.surfaces.orb.intensity01).toFixed(4))
      })
    })
  });
}

/**
 * @param {ReturnType<typeof buildT0UnifiedPresenceFrameV0>} frame
 */
export function publishT0UnifiedPresenceFrameV0(frame) {
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.presenceFrame = frame;
    window.__rhizoh.t0UnifiedFrame = frame;
    import("./rhizohSurfaceStackPublishV0.js")
      .then((m) => {
        const ecc = window.__rhizoh?.experienceContinuity;
        const resl = window.__rhizoh?.reslPresentation;
        m.publishRhizohSurfaceStackV0(frame, resl, ecc);
      })
      .catch(() => {});
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_T0_PRESENCE_FRAME_EVENT_V0, {
          detail: Object.freeze({ frame })
        })
      );
    } catch {
      /* noop */
    }
  }
  return frame;
}

/**
 * RPSE + RESL → unified frame publish (temporal authority).
 */
export function syncT0UnifiedPresenceFrameV0(presence, resl, ecc = null, nowMs = Date.now()) {
  const frame = buildT0UnifiedPresenceFrameV0(presence, resl, ecc, nowMs);
  return publishT0UnifiedPresenceFrameV0(frame);
}

export function readLastT0PresenceFrameV0() {
  return lastBaseFrame;
}

export function resetT0UnifiedPresenceFrameForTestV0() {
  tickSeq = 0;
  presenceClockOriginMs = 0;
  transitionEpochMs = 0;
  lastStateKey = "";
  lastBaseFrame = null;
  stopT0PresenceFrameSamplerV0();
}

function samplerLoopV0() {
  const frame = sampleT0PresenceFrameV0(Date.now());
  if (frame) publishT0UnifiedPresenceFrameV0(frame);
  samplerListeners.forEach((fn) => {
    try {
      fn(frame);
    } catch {
      /* noop */
    }
  });
  rafId = requestAnimationFrame(samplerLoopV0);
}

export function startT0PresenceFrameSamplerV0() {
  if (typeof window === "undefined" || rafId) return;
  rafId = requestAnimationFrame(samplerLoopV0);
}

export function stopT0PresenceFrameSamplerV0() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
}

/**
 * @param {(frame: ReturnType<typeof sampleT0PresenceFrameV0>) => void} fn
 */
export function subscribeT0PresenceFrameSamplerV0(fn) {
  samplerListeners.add(fn);
  startT0PresenceFrameSamplerV0();
  return () => samplerListeners.delete(fn);
}
