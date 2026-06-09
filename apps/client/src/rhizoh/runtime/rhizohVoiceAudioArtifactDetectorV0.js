/**
 * FILTER 2 — STT output artifact class (platform outro, UI chrome, RTL burst, loops).
 * Not acoustic silence — transcript-level contamination taxonomy.
 */

import {
  evaluateSttContaminationV0,
  scoreSttTemplateLeakV0,
  TEMPLATE_SCORE_QUARANTINE_MIN_V0
} from "./voiceSttContaminationGuardV0.js";
import { measureArabicScriptRatioV0, measureLatinScriptRatioV0 } from "./sttScriptLocaleGuardV0.js";
import { matchesRecentRhizohTtsEchoV0 } from "./voiceTtsEchoGuardV0.js";

export const RHIZOH_VOICE_AUDIO_ARTIFACT_SCHEMA_V0 = "castle.rhizoh.voice_audio_artifact.v0";

export const VOICE_STT_ARTIFACT_CLASS_V0 = Object.freeze({
  CLEAN: "clean",
  PLATFORM_OUTRO: "platform_outro",
  UI_CHROME: "ui_chrome",
  TAB_AUDIO: "tab_audio",
  RTL_BURST: "rtl_burst",
  PHANTOM_POLITE: "phantom_polite",
  TTS_ECHO: "tts_echo",
  STT_LOOP: "stt_loop",
  TEMPLATE_FUZZY: "template_fuzzy"
});

/**
 * @param {string} text
 * @param {{ confidence?: number, strategy?: string, band?: string, maxRms?: number, speechMs?: number }} [opts]
 */
export function classifyVoiceSttArtifactV0(text, opts = {}) {
  const raw = String(text || "").trim();
  if (!raw) {
    return Object.freeze({
      schema: RHIZOH_VOICE_AUDIO_ARTIFACT_SCHEMA_V0,
      artifactClass: VOICE_STT_ARTIFACT_CLASS_V0.CLEAN,
      block: false,
      reason: null
    });
  }

  const ttsEcho = matchesRecentRhizohTtsEchoV0(raw);
  if (ttsEcho.echo) {
    return Object.freeze({
      schema: RHIZOH_VOICE_AUDIO_ARTIFACT_SCHEMA_V0,
      artifactClass: VOICE_STT_ARTIFACT_CLASS_V0.TTS_ECHO,
      block: true,
      reason: "tts_echo",
      ttsEchoMatch: ttsEcho.matched
    });
  }

  const contamination = evaluateSttContaminationV0(raw, opts);
  if (contamination.contaminated) {
    const artifactClass =
      contamination.kind === "platform_outro"
        ? VOICE_STT_ARTIFACT_CLASS_V0.PLATFORM_OUTRO
        : contamination.kind === "ui_chrome_echo"
          ? VOICE_STT_ARTIFACT_CLASS_V0.UI_CHROME
          : contamination.kind === "tab_audio_spam"
            ? VOICE_STT_ARTIFACT_CLASS_V0.TAB_AUDIO
            : contamination.kind === "stt_loop"
              ? VOICE_STT_ARTIFACT_CLASS_V0.STT_LOOP
              : contamination.kind === "phantom_polite_closure"
                ? VOICE_STT_ARTIFACT_CLASS_V0.PHANTOM_POLITE
                : VOICE_STT_ARTIFACT_CLASS_V0.TEMPLATE_FUZZY;
    return Object.freeze({
      schema: RHIZOH_VOICE_AUDIO_ARTIFACT_SCHEMA_V0,
      artifactClass,
      block: true,
      reason: contamination.reason,
      contamination
    });
  }

  const scores = scoreSttTemplateLeakV0(raw, opts);
  if (scores.templateScore >= TEMPLATE_SCORE_QUARANTINE_MIN_V0) {
    return Object.freeze({
      schema: RHIZOH_VOICE_AUDIO_ARTIFACT_SCHEMA_V0,
      artifactClass: VOICE_STT_ARTIFACT_CLASS_V0.TEMPLATE_FUZZY,
      block: true,
      reason: "template_fuzzy_mid",
      templateScore: scores.templateScore,
      scores
    });
  }

  const arabicRatio = measureArabicScriptRatioV0(raw);
  const latinRatio = measureLatinScriptRatioV0(raw);
  const confidence = Number(opts.confidence);
  if (arabicRatio >= 0.42 && latinRatio < 0.15 && (!Number.isFinite(confidence) || confidence < 0.58)) {
    return Object.freeze({
      schema: RHIZOH_VOICE_AUDIO_ARTIFACT_SCHEMA_V0,
      artifactClass: VOICE_STT_ARTIFACT_CLASS_V0.RTL_BURST,
      block: true,
      reason: "rtl_burst_low_conf",
      arabicRatio,
      latinRatio
    });
  }

  return Object.freeze({
    schema: RHIZOH_VOICE_AUDIO_ARTIFACT_SCHEMA_V0,
    artifactClass: VOICE_STT_ARTIFACT_CLASS_V0.CLEAN,
    block: false,
    reason: null,
    templateScore: scores.templateScore
  });
}

/**
 * @param {ReturnType<typeof classifyVoiceSttArtifactV0>} artifact
 */
export function publishVoiceSttArtifactDebugV0(artifact) {
  if (typeof window === "undefined" || !artifact) return;
  try {
    window.__CASTLE_RHIZOH_STT_ARTIFACT__ = Object.freeze({
      ...artifact,
      atMs: Date.now()
    });
  } catch {
    /* noop */
  }
}
