/**
 * Sora prompt compiler v1 — director scenes → render prompts (no API).
 * RESEARCH-ONLY · honest stub until Sora EP is wired.
 */

import { DIRECTOR_SCENE_KIND_V0 } from "./rhizohDirectorEngineV0.js";

export const RHIZOH_SORA_PROMPT_COMPILER_SCHEMA_V0 =
  "castle.rhizoh.sora_prompt_compiler.v0";

const STYLE_PRESETS_V0 = Object.freeze({
  chess_move: "chess_documentary_observation",
  drift_cut: "abstract_drift_glitch",
  memory_anchor: "memory_graph_soft",
  habitat_shift: "climate_atmosphere",
  world_sports_pulse: "sports_broadcast_insert",
  program_beat: "rhizoh_observation_vertical"
});

/**
 * @param {object} scene
 * @param {"en"|"tr"} locale
 */
export function compileSoraPromptFromSceneV0(scene, locale = "en") {
  const tr = locale === "tr";
  const style = STYLE_PRESETS_V0[scene.kind] || "rhizoh_observation_vertical";
  const subject = scene.narratorHint || scene.label || scene.kind;

  const prompt = tr
    ? `Dikey 9:16 gözlem kısa film. Stil: ${style}. Sahne: ${subject}. Yürütme yok — sadece gözlem. mutationPermitted false.`
    : `Vertical 9:16 observation short. Style: ${style}. Scene: ${subject}. No execution — observation only. mutationPermitted false.`;

  return Object.freeze({
    sceneId: scene.beatId || scene.label || scene.kind,
    kind: scene.kind,
    stylePreset: style,
    prompt,
    apiAvailable: false,
    renderStatus: "prompt_only"
  });
}

/**
 * @param {ReturnType<import("./rhizohDirectorEngineV0.js").buildRhizohDirectorTimelineV0>} timeline
 * @param {{ locale?: string, limit?: number }} [opts]
 */
export function compileRhizohSoraPromptPackV0(timeline, opts = {}) {
  const locale = opts.locale === "tr" ? "tr" : "en";
  const limit = Math.max(1, Number(opts.limit) || 12);
  const scenes = (timeline?.scenes || []).slice(0, limit);

  const prompts = Object.freeze(
    scenes.map((scene) => compileSoraPromptFromSceneV0(scene, locale))
  );

  return Object.freeze({
    schema: RHIZOH_SORA_PROMPT_COMPILER_SCHEMA_V0,
    interpretationOnly: true,
    promptCount: prompts.length,
    apiAvailable: false,
    honestLabel:
      locale === "tr"
        ? "Sora EP bağlı değil — yalnızca prompt derleyici"
        : "Sora EP not wired — prompt compiler only",
    prompts,
    atMs: Date.now()
  });
}
