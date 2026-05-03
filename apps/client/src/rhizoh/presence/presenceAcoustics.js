/**
 * QPP akustik katman — varsayılan kapalı; gain ~0.09–0.11
 */
import { subscribeRhizohPresence } from "./presenceBus.js";
import { QPP_PHASE } from "./presenceStateMachine.js";

let ambientCtx = null;

function getAmbientCtx() {
  if (typeof window === "undefined") return null;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ambientCtx || ambientCtx.state === "closed") ambientCtx = new AC();
    return ambientCtx;
  } catch {
    return null;
  }
}

function playPulseChime(ctx, gainVal = 0.095) {
  const g = ctx.createGain();
  g.gain.value = gainVal;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(175, ctx.currentTime + 0.1);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

function startHumMod(ctx, gainVal = 0.09) {
  const g = ctx.createGain();
  g.gain.value = gainVal;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 62;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.22;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 4;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  osc.connect(g);
  g.connect(ctx.destination);
  lfo.start();
  osc.start();
  return () => {
    try {
      lfo.stop();
      osc.stop();
    } catch {
      /* noop */
    }
  };
}

let humStop = null;
let lastPhase = "";

/**
 * @param {{ isSoundEnabled: () => boolean }} opts
 * @returns {() => void} unsubscribe
 */
export function installRhizohPresenceAcoustics(opts) {
  const isOn = typeof opts?.isSoundEnabled === "function" ? opts.isSoundEnabled : () => false;

  const unsub = subscribeRhizohPresence((detail) => {
    if (!isOn()) {
      if (humStop) {
        humStop();
        humStop = null;
      }
      return;
    }
    const phase = String(detail.phase || "");
    const ctx = getAmbientCtx();
    if (!ctx) return;

    if (phase === QPP_PHASE.PULSE && lastPhase !== QPP_PHASE.PULSE) {
      playPulseChime(ctx, 0.095 + Math.random() * 0.02);
    }

    if (phase === QPP_PHASE.QUIET && lastPhase !== QPP_PHASE.QUIET) {
      if (humStop) humStop();
      humStop = startHumMod(ctx, 0.09 + Math.random() * 0.02);
    }

    if (phase !== QPP_PHASE.QUIET && humStop) {
      humStop();
      humStop = null;
    }

    lastPhase = phase;
  });

  return () => {
    unsub();
    lastPhase = "";
    if (humStop) {
      humStop();
      humStop = null;
    }
  };
}
