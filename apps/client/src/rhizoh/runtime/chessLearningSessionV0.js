/**
 * Chess learning session v0 — researcher-applied presets, saved settings, media seal hooks.
 */

import { CHESS_VARIANT_ID_V0 } from "./chessVariantRegistryV0.js";

export const CHESS_LEARNING_SESSION_SCHEMA_V0 = "rhizoh.chess_learning_session.v0";
const LS_KEY_V0 = "rhizoh.chess_learning_session.v0";

export const CHESS_LEARNING_STYLE_V0 = Object.freeze({
  RESEARCHER: "researcher",
  APPLIED: "applied",
  TEACHER: "teacher"
});

export const CHESS_LEARNING_SESSION_PRESET_V0 = Object.freeze({
  BULLET_RESEARCH: Object.freeze({
    id: "bullet_research",
    labelTr: "Bullet araştırma · 1+0",
    labelEn: "Bullet research · 1+0",
    timeControlId: "bullet_1_0",
    opponentPresetId: "TEACHER_BACKUP",
    variantId: CHESS_VARIANT_ID_V0.STANDARD,
    learningStyle: CHESS_LEARNING_STYLE_V0.RESEARCHER,
    voiceMoves: true,
    recordMedia: true
  }),
  TEAM_PET_RHIZOH: Object.freeze({
    id: "team_pet_rhizoh",
    labelTr: "Fox+Octo · Rhizoh AI · Blitz 3+2",
    labelEn: "Fox+Octo · Rhizoh AI · Blitz 3+2",
    timeControlId: "blitz_3_2",
    opponentPresetId: "ARENA",
    variantId: CHESS_VARIANT_ID_V0.TEAM_PET_VS_RHIZOH,
    learningStyle: CHESS_LEARNING_STYLE_V0.APPLIED,
    voiceMoves: true,
    recordMedia: true
  }),
  MICRO_APPLIED: Object.freeze({
    id: "micro_applied",
    labelTr: "Mikro uygulama · 1+0",
    labelEn: "Micro applied · 1+0",
    timeControlId: "bullet_1_0",
    opponentPresetId: "STRONG",
    variantId: CHESS_VARIANT_ID_V0.STANDARD,
    learningStyle: CHESS_LEARNING_STYLE_V0.APPLIED,
    voiceMoves: false,
    recordMedia: true
  })
});

const DEFAULT_SESSION_V0 = Object.freeze({
  presetId: CHESS_LEARNING_SESSION_PRESET_V0.BULLET_RESEARCH.id,
  variantId: CHESS_VARIANT_ID_V0.STANDARD,
  learningStyle: CHESS_LEARNING_STYLE_V0.RESEARCHER,
  recordMedia: true,
  voiceMoves: true
});

export function listChessLearningSessionPresetsV0() {
  return Object.freeze(Object.values(CHESS_LEARNING_SESSION_PRESET_V0).map((p) => Object.freeze({ ...p })));
}

export function resolveChessLearningSessionPresetV0(id) {
  const key = String(id || DEFAULT_SESSION_V0.presetId);
  return (
    Object.values(CHESS_LEARNING_SESSION_PRESET_V0).find((p) => p.id === key) ||
    CHESS_LEARNING_SESSION_PRESET_V0.BULLET_RESEARCH
  );
}

export function readChessLearningSessionV0() {
  if (typeof window === "undefined") return { ...DEFAULT_SESSION_V0 };
  try {
    const raw = window.localStorage.getItem(LS_KEY_V0);
    if (!raw) return { ...DEFAULT_SESSION_V0 };
    const parsed = JSON.parse(raw);
    const preset = resolveChessLearningSessionPresetV0(parsed?.presetId);
    return Object.freeze({
      presetId: preset.id,
      variantId: String(parsed?.variantId || preset.variantId),
      learningStyle: String(parsed?.learningStyle || preset.learningStyle),
      recordMedia: parsed?.recordMedia !== false,
      voiceMoves: parsed?.voiceMoves !== false
    });
  } catch {
    return { ...DEFAULT_SESSION_V0 };
  }
}

export function saveChessLearningSessionV0(patch = {}) {
  const prev = readChessLearningSessionV0();
  const preset = patch.presetId ? resolveChessLearningSessionPresetV0(patch.presetId) : null;
  const next = Object.freeze({
    schema: CHESS_LEARNING_SESSION_SCHEMA_V0,
    presetId: preset?.id || prev.presetId,
    variantId: patch.variantId || preset?.variantId || prev.variantId,
    learningStyle: patch.learningStyle || preset?.learningStyle || prev.learningStyle,
    recordMedia:
      patch.recordMedia != null ? patch.recordMedia !== false : preset?.recordMedia ?? prev.recordMedia,
    voiceMoves: patch.voiceMoves != null ? patch.voiceMoves !== false : preset?.voiceMoves ?? prev.voiceMoves
  });
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LS_KEY_V0, JSON.stringify(next));
    } catch {
      /* noop */
    }
  }
  return next;
}

/**
 * Persist learning session seal for media replay pipeline.
 * @param {object} row
 */
export function sealChessLearningSessionV0(row = {}) {
  if (typeof window === "undefined") return null;
  const seal = Object.freeze({
    id: `learn_${row.matchId || Date.now()}`,
    atMs: Date.now(),
    presetId: row.presetId || readChessLearningSessionV0().presetId,
    variantId: row.variantId || readChessLearningSessionV0().variantId,
    learningStyle: row.learningStyle || readChessLearningSessionV0().learningStyle,
    moves: Array.isArray(row.moves) ? row.moves.slice() : [],
    outcome: row.outcome || null,
    recordMedia: row.recordMedia !== false
  });
  try {
    window.__rhizoh = window.__rhizoh || {};
    const prev = Array.isArray(window.__rhizoh.chessLearningSeals)
      ? window.__rhizoh.chessLearningSeals
      : [];
    window.__rhizoh.chessLearningSeals = [seal, ...prev].slice(0, 32);
  } catch {
    /* noop */
  }
  return seal;
}
