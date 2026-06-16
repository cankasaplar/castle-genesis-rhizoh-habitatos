/**
 * Chess Arena session settings — time control + Stockfish opponent preset.
 */

export const CHESS_ARENA_SESSION_SCHEMA_V0 = "rhizoh.chess_arena_session.v0";
const LS_KEY_V0 = "rhizoh.chess_arena_session.v0";

export const CHESS_TIME_CONTROL_V0 = Object.freeze({
  BULLET_1_0: Object.freeze({
    id: "bullet_1_0",
    labelTr: "Bullet 1+0",
    labelEn: "Bullet 1+0",
    initialMs: 60_000,
    incrementMs: 0
  }),
  BLITZ_3_2: Object.freeze({
    id: "blitz_3_2",
    labelTr: "Blitz 3+2",
    labelEn: "Blitz 3+2",
    initialMs: 180_000,
    incrementMs: 2_000
  }),
  RAPID_10_0: Object.freeze({
    id: "rapid_10_0",
    labelTr: "Rapid 10+0",
    labelEn: "Rapid 10+0",
    initialMs: 600_000,
    incrementMs: 0
  })
});

export const CHESS_OPPONENT_PRESET_V0 = Object.freeze({
  TEACHER_BACKUP: Object.freeze({
    id: "TEACHER_BACKUP",
    labelTr: "Öğretmen yedek (~1258)",
    labelEn: "Teacher backup (~1258)",
    preset: "TEACHER_BACKUP"
  }),
  ARENA: Object.freeze({
    id: "ARENA",
    labelTr: "Arena (~1800)",
    labelEn: "Arena (~1800)",
    preset: "ARENA"
  }),
  STRONG: Object.freeze({
    id: "STRONG",
    labelTr: "Güçlü (~2200)",
    labelEn: "Strong (~2200)",
    preset: "STRONG"
  }),
  MAX: Object.freeze({
    id: "MAX",
    labelTr: "Maksimum",
    labelEn: "Maximum",
    preset: "MAX"
  })
});

const DEFAULT_SESSION_V0 = Object.freeze({
  timeControlId: CHESS_TIME_CONTROL_V0.BLITZ_3_2.id,
  opponentPresetId: CHESS_OPPONENT_PRESET_V0.TEACHER_BACKUP.id,
  aiMoveDelayMs: 450,
  voiceMoves: true
});

export function resolveChessTimeControlV0(raw) {
  const id = String(raw || DEFAULT_SESSION_V0.timeControlId);
  return Object.values(CHESS_TIME_CONTROL_V0).find((t) => t.id === id) || CHESS_TIME_CONTROL_V0.BLITZ_3_2;
}

export function resolveChessOpponentPresetV0(raw) {
  const id = String(raw || DEFAULT_SESSION_V0.opponentPresetId);
  return (
    Object.values(CHESS_OPPONENT_PRESET_V0).find((o) => o.id === id) ||
    CHESS_OPPONENT_PRESET_V0.TEACHER_BACKUP
  );
}

export function readChessArenaSessionV0() {
  if (typeof window === "undefined") return { ...DEFAULT_SESSION_V0 };
  try {
    const raw = window.localStorage.getItem(LS_KEY_V0);
    if (!raw) return { ...DEFAULT_SESSION_V0 };
    const parsed = JSON.parse(raw);
    return Object.freeze({
      timeControlId: resolveChessTimeControlV0(parsed?.timeControlId).id,
      opponentPresetId: resolveChessOpponentPresetV0(parsed?.opponentPresetId).id,
      aiMoveDelayMs: Math.max(200, Math.min(2000, Number(parsed?.aiMoveDelayMs) || 450)),
      voiceMoves: parsed?.voiceMoves !== false
    });
  } catch {
    return { ...DEFAULT_SESSION_V0 };
  }
}

export function saveChessArenaSessionV0(patch = {}) {
  const prev = readChessArenaSessionV0();
  const next = Object.freeze({
    schema: CHESS_ARENA_SESSION_SCHEMA_V0,
    timeControlId: patch.timeControlId
      ? resolveChessTimeControlV0(patch.timeControlId).id
      : prev.timeControlId,
    opponentPresetId: patch.opponentPresetId
      ? resolveChessOpponentPresetV0(patch.opponentPresetId).id
      : prev.opponentPresetId,
    aiMoveDelayMs:
      patch.aiMoveDelayMs != null
        ? Math.max(200, Math.min(2000, Number(patch.aiMoveDelayMs) || prev.aiMoveDelayMs))
        : prev.aiMoveDelayMs,
    voiceMoves: patch.voiceMoves != null ? patch.voiceMoves !== false : prev.voiceMoves
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

export function listChessTimeControlsV0() {
  return Object.freeze(Object.values(CHESS_TIME_CONTROL_V0).map((t) => Object.freeze({ ...t })));
}

export function listChessOpponentPresetsV0() {
  return Object.freeze(Object.values(CHESS_OPPONENT_PRESET_V0).map((o) => Object.freeze({ ...o })));
}
