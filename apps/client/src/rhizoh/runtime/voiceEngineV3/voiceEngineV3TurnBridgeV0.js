/**
 * Voice Engine v3 — AppRhizoh528 turn bridge (Chrome STT bypass when VITE_RHIZOH_VOICE_ENGINE_V3=1).
 */

import { createVoiceEngineOrchestratorV3 } from "./voiceEngineOrchestratorV3.js";
import { isVoiceEngineV3EnabledV0 } from "./isVoiceEngineV3EnabledV0.js";

export const VOICE_V3_MAX_RECORD_MS = 8000;

/**
 * @param {{
 *   refs: {
 *     voiceEngineV3: { current: ReturnType<typeof createVoiceEngineOrchestratorV3> | null },
 *     voiceSttStartInFlight: { current: boolean },
 *     voiceSttMaxRecordTimer: { current: number },
 *     voiceSttGotAnyResult: { current: boolean }
 *   },
 *   callbacks: {
 *     setRhizohFieldState: (s: string) => void,
 *     setMicListening: (v: boolean) => void,
 *     handleVoiceTranscriptRef: { current: (text: string, opts: object) => Promise<void> },
 *     scheduleVoiceMicRestart: (keepAlive: boolean, opts?: object) => void,
 *     maybeWarnVoiceSilentStop: (key: string) => void,
 *     speakRhizoh?: (text: string, opts?: object) => void,
 *     logInfo?: (tag: string, detail?: object) => void,
 *     logWarn?: (tag: string, detail?: object) => void,
 *     noteEvent?: (tag: string, detail?: object) => void
 *   }
 * }} ctx
 */
export function createVoiceEngineV3TurnBridgeV0(ctx) {
  const { refs, callbacks } = ctx;
  const logInfo = callbacks.logInfo || (() => {});
  const logWarn = callbacks.logWarn || (() => {});
  const noteEvent = callbacks.noteEvent || (() => {});

  function clearMaxRecordTimer() {
    if (refs.voiceSttMaxRecordTimer.current) {
      window.clearTimeout(refs.voiceSttMaxRecordTimer.current);
      refs.voiceSttMaxRecordTimer.current = 0;
    }
  }

  function abortTurn() {
    clearMaxRecordTimer();
    refs.voiceEngineV3.current?.abort?.();
    refs.voiceEngineV3.current = null;
    refs.voiceSttStartInFlight.current = false;
    callbacks.setMicListening(false);
  }

  async function finishTurn(keepAlive) {
    const engine = refs.voiceEngineV3.current;
    if (!engine) {
      refs.voiceSttStartInFlight.current = false;
      return { ok: false, error: "no_engine" };
    }
    clearMaxRecordTimer();
    callbacks.setRhizohFieldState("INTERPRETING");
    callbacks.setMicListening(false);
    noteEvent("V3_STOP", { keepAlive });
    logInfo("V3_STOP", { keepAlive });

    const result = await engine.stop();
    refs.voiceEngineV3.current = null;
    refs.voiceSttStartInFlight.current = false;

    if (result.ok && result.merged?.text) {
      refs.voiceSttGotAnyResult.current = true;
      noteEvent("V3_FINAL", {
        chars: result.merged.text.length,
        strategy: result.merged.strategy
      });
      logInfo("V3_FINAL", {
        chars: result.merged.text.length,
        strategy: result.merged.strategy,
        preview: result.merged.text.slice(0, 96)
      });
      await callbacks.handleVoiceTranscriptRef.current(result.merged.text, {
        manageVoiceTurn: keepAlive,
        source: "mic_v3"
      });
      return { ok: true };
    }

    if (result.error === "no_speech" || result.error === "no_transcript") {
      callbacks.maybeWarnVoiceSilentStop("empty");
      if (keepAlive) {
        callbacks.scheduleVoiceMicRestart(keepAlive, {
          context: "onresult_empty",
          lastSessionHadResult: refs.voiceSttGotAnyResult.current
        });
      } else {
        callbacks.setRhizohFieldState("IDLE");
      }
      return { ok: false, error: result.error };
    }

    logWarn("V3_TRANSCRIBE_FAIL", { error: result.error });
    callbacks.setRhizohFieldState("IDLE");
    return { ok: false, error: result.error || "transcribe_failed" };
  }

  async function startTurn(keepAlive = false) {
    if (refs.voiceEngineV3.current?.isBusy?.()) {
      return finishTurn(keepAlive);
    }
    if (refs.voiceSttStartInFlight.current) {
      logInfo("V3_START_SKIPPED", { reason: "in_flight" });
      return { ok: false, error: "in_flight" };
    }
    refs.voiceSttStartInFlight.current = true;
    refs.voiceSttGotAnyResult.current = false;

    callbacks.setRhizohFieldState("LISTENING");
    callbacks.setMicListening(true);
    noteEvent("V3_SESSION_BEGIN", { keepAlive });
    logInfo("V3_SESSION_BEGIN", { keepAlive });

    const engine = createVoiceEngineOrchestratorV3({
      onFastTranscript: ({ text }) => {
        refs.voiceSttGotAnyResult.current = true;
        noteEvent("V3_FAST", { preview: text.slice(0, 48) });
        logInfo("V3_FAST", { preview: text.slice(0, 48) });
      },
      onError: ({ code }) => {
        if (code === "no_speech" || code === "no_transcript") return;
        logWarn("V3_ERROR", { code });
      }
    });
    refs.voiceEngineV3.current = engine;

    const startRes = await engine.start();
    if (!startRes.ok) {
      abortTurn();
      callbacks.setRhizohFieldState("IDLE");
      callbacks.maybeWarnVoiceSilentStop("audio");
      return startRes;
    }

    refs.voiceSttMaxRecordTimer.current = window.setTimeout(() => {
      void finishTurn(keepAlive);
    }, VOICE_V3_MAX_RECORD_MS);

    return { ok: true };
  }

  return Object.freeze({ startTurn, finishTurn, abortTurn, enabled: isVoiceEngineV3EnabledV0 });
}

export { isVoiceEngineV3EnabledV0 };
