/**
 * Quiet Presence FSM — LLM normalize çıktısı ve kullanıcı olayları buraya girer, UI bus tek doğruluk kaynağı.
 */

/**
 * @typedef {{
 *   phase: string,
 *   intensity: number,
 *   resonance: number,
 *   label: string,
 *   pulsePattern: string | null,
 *   durationMs: number | null,
 *   uiHint: string | null
 * }} PresenceFsmState
 */

export const QPP_PHASE = Object.freeze({
  IDLE: "idle",
  ABSORBING: "absorbing",
  PULSE: "pulse",
  SETTLING: "settling",
  QUIET: "quiet",
  FADE: "fade"
});

export const QPP_EVENT = Object.freeze({
  USER_MESSAGE: "USER_MESSAGE",
  QPP_ENTER: "QPP_ENTER",
  QPP_EXTEND: "QPP_EXTEND",
  QPP_EXIT: "QPP_EXIT",
  INTERRUPT: "INTERRUPT",
  TIMEOUT: "TIMEOUT",
  FADE_COMPLETE: "FADE_COMPLETE",
  PULSE_COMPLETE: "PULSE_COMPLETE",
  THINKING_END: "THINKING_END",
  /** Social physics bias field → soft QUIET extension + intensity/resonance drift (not a hard phase switch). */
  PHYSICS_BIAS: "PHYSICS_BIAS"
});

/** @returns {PresenceFsmState} */
export function initialPresenceFsmState() {
  return {
    phase: QPP_PHASE.IDLE,
    intensity: 0.4,
    resonance: 0.5,
    label: "present",
    pulsePattern: null,
    durationMs: null,
    uiHint: null
  };
}

/**
 * @param {PresenceFsmState} state
 * @param {{ type: string, payload?: Record<string, unknown> }} action
 * @returns {PresenceFsmState}
 */
export function stepPresenceFsm(state, action) {
  const { type, payload = {} } = action;
  const p = payload && typeof payload === "object" ? payload : {};

  switch (type) {
    case QPP_EVENT.USER_MESSAGE:
    case QPP_EVENT.INTERRUPT:
      return {
        ...state,
        phase: QPP_PHASE.PULSE,
        intensity: typeof p.intensity === "number" ? p.intensity : state.intensity,
        resonance: typeof p.resonance === "number" ? p.resonance : state.resonance,
        label: typeof p.label === "string" ? p.label : "listening",
        pulsePattern: typeof p.pulsePattern === "string" ? p.pulsePattern : "receive_absorb_settle",
        durationMs: null,
        uiHint: typeof p.uiHint === "string" ? p.uiHint : null
      };

    case QPP_EVENT.PULSE_COMPLETE: {
      if (state.phase !== QPP_PHASE.PULSE) return state;
      const stillThinking = !!p.stillThinking;
      return {
        ...state,
        phase: stillThinking ? QPP_PHASE.ABSORBING : QPP_PHASE.SETTLING,
        label: stillThinking ? "absorbing" : state.label
      };
    }

    case QPP_EVENT.QPP_ENTER:
      return {
        ...state,
        phase: QPP_PHASE.QUIET,
        intensity: typeof p.intensity === "number" ? p.intensity : state.intensity,
        resonance: typeof p.resonance === "number" ? p.resonance : state.resonance,
        label: typeof p.label === "string" ? p.label : state.label,
        durationMs:
          typeof p.durationMs === "number" && Number.isFinite(p.durationMs)
            ? Math.min(180_000, Math.max(2_000, p.durationMs))
            : 12_000,
        pulsePattern: typeof p.pulsePattern === "string" ? p.pulsePattern : state.pulsePattern,
        uiHint: typeof p.uiHint === "string" ? p.uiHint : state.uiHint
      };

    case QPP_EVENT.QPP_EXTEND: {
      if (state.phase !== QPP_PHASE.QUIET) return state;
      const add = typeof p.addMs === "number" ? p.addMs : 0;
      return {
        ...state,
        durationMs: Math.min(180_000, (state.durationMs || 0) + add)
      };
    }

    case QPP_EVENT.PHYSICS_BIAS: {
      const bf = p.biasField && typeof p.biasField === "object" ? p.biasField : {};
      const next = { ...state };
      if (state.phase === QPP_PHASE.QUIET) {
        const add = typeof bf.quietExtendMs === "number" ? bf.quietExtendMs : 0;
        if (add > 0.5) {
          next.durationMs = Math.min(180_000, (state.durationMs || 0) + add);
        }
      }
      if (typeof bf.intensity === "number" && Number.isFinite(bf.intensity)) {
        next.intensity = Math.max(0.12, Math.min(0.95, bf.intensity));
      }
      if (typeof bf.resonance === "number" && Number.isFinite(bf.resonance)) {
        next.resonance = Math.max(0.12, Math.min(0.95, bf.resonance));
      }
      if (typeof bf.label === "string" && bf.label.length && state.phase === QPP_PHASE.QUIET) {
        next.label = bf.label;
      }
      return next;
    }

    case QPP_EVENT.TIMEOUT:
      if (state.phase !== QPP_PHASE.QUIET) return state;
      return { ...state, phase: QPP_PHASE.FADE };

    case QPP_EVENT.FADE_COMPLETE:
      return initialPresenceFsmState();

    case QPP_EVENT.QPP_EXIT:
      return initialPresenceFsmState();

    case QPP_EVENT.THINKING_END:
      if (state.phase === QPP_PHASE.QUIET || state.phase === QPP_PHASE.FADE) return state;
      return initialPresenceFsmState();

    default:
      return state;
  }
}
