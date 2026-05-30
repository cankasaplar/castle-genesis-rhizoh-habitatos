/**
 * CORE-ELIGIBLE — Passive multi-user perception field (v0).
 *
 * **Critical boundary:**
 * - world ≠ shared state (no WAL merge, no authoritative mesh)
 * - world = shared *perception field* (read-only emotional resonance)
 *
 * SpiralMMO bridge: deterministic field phase only — no live multiplayer state.
 */

export const PASSIVE_PERCEPTION_FIELD_SCHEMA_V0 = "castle.rhizoh.passive_perception_field.v0";

const FIELD_LINES_V0 = Object.freeze([
  "Örgüde başka nefesler var — senin state'ini paylaşmıyorlar, ama aynı alanı hissediyorlar.",
  "Uzak ritimler aynı gökyüzüne bakıyor — perception field ortak, execution değil.",
  "Kimse senin Castle'ına dokunmaz; ama sessiz bir alan paylaşımı sürer.",
  "Spiral'e köprü henüz kapalı — yine de yalnız değilsin hissi örgüden gelir.",
  "Paylaşılan his, paylaşılan state değil — bu sınır korunuyor."
]);

const RESONANCE_PHASES_V0 = Object.freeze(["dawn", "midday", "dusk", "night"]);

function djb2U32(input) {
  const s = String(input || "");
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return h >>> 0;
}

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * Deterministic perception-field phase (not player count).
 *
 * @param {{
 *   worldInstanceId: string,
 *   fieldEpoch?: string,
 *   spiralBridgeEnabled?: boolean
 * }} io
 */
export function derivePassivePerceptionFieldV0(io) {
  const id = String(io?.worldInstanceId || "");
  const d = new Date();
  const epoch =
    io.fieldEpoch ||
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  const h = djb2U32(`${id}|perception_field_v0|${epoch}`);
  const phase = RESONANCE_PHASES_V0[h % RESONANCE_PHASES_V0.length];
  const line = FIELD_LINES_V0[h % FIELD_LINES_V0.length];
  const resonance01 = clamp01(0.35 + (h % 1000) / 2000);

  const spiralBridgeEnabled = Boolean(io?.spiralBridgeEnabled);

  return Object.freeze({
    schema: PASSIVE_PERCEPTION_FIELD_SCHEMA_V0,
    readOnly: true,
    sharedState: false,
    sharedPerceptionField: true,
    fieldEpoch: epoch,
    resonancePhase: phase,
    resonance01,
    resonanceLine: line,
    spiralBridge: Object.freeze({
      enabled: spiralBridgeEnabled,
      mode: spiralBridgeEnabled ? "perception_only" : "closed",
      disclaimer: "SpiralMMO köprüsü: shared perception field — execution / WAL yok."
    })
  });
}

/**
 * Merge perception field into collective feeling (emotion only).
 *
 * @param {ReturnType<import('./livingWorldCollectivePulseV0.js').deriveCollectivePresenceFeelingV0>} collective
 * @param {ReturnType<typeof derivePassivePerceptionFieldV0>} field
 */
export function mergePerceptionFieldIntoCollectiveFeelingV0(collective, field) {
  if (!field?.sharedPerceptionField) return collective;
  const secondary = [collective.secondary, field.resonanceLine].filter(Boolean).join(" ");
  return Object.freeze({
    ...collective,
    secondary: secondary || null,
    perceptionField: Object.freeze({
      phase: field.resonancePhase,
      sharedState: false,
      bridge: field.spiralBridge.mode
    })
  });
}
