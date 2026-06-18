/**
 * Chess cluster observatory — human-readable copy (TR/EN).
 * RESEARCH-ONLY presentation layer for broadcast + lobby.
 */

import { resolveChessClusterSlotModeV0 } from "./chessClusterSlotModesV0.js";
import { CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 } from "./chessLearningMonitorV0.js";

export const CHESS_CLUSTER_OBSERVATORY_COPY_SCHEMA_V0 =
  "castle.rhizoh.chess_cluster_observatory_copy.v0";

/** What each board is for in the 8-camera observatory. */
export const CHESS_CLUSTER_SLOT_ROLE_COPY_V0 = Object.freeze([
  Object.freeze({
    slotId: 0,
    tagTr: "CANLI YAYIN",
    tagEn: "LIVE",
    roleTr: "Rhizoh öğreniyor · Stockfish öğretmen",
    roleEn: "Rhizoh learns · Stockfish teacher",
    observesTr: "Ana yayın hamlesi — ELO ve policy_diff buradan akar",
    observesEn: "Featured broadcast move — ELO and policy_diff flow from here"
  }),
  Object.freeze({
    slotId: 1,
    tagTr: "Agresif iz",
    tagEn: "Aggressive trace",
    roleTr: "OctoAI · saldırı stili",
    roleEn: "OctoAI · attack style",
    observesTr: "Yüksek contempt varyasyonları — Rhizoh'a risk örnekleri",
    observesEn: "High-contempt lines — risk examples for Rhizoh"
  }),
  Object.freeze({
    slotId: 2,
    tagTr: "Savunma iz",
    tagEn: "Defensive trace",
    roleTr: "Fox · pozisyon savunması",
    roleEn: "Fox · positional defense",
    observesTr: "Sakin yapı taşları — savunma hafızası",
    observesEn: "Solid structures — defensive memory"
  }),
  Object.freeze({
    slotId: 3,
    tagTr: "Keşif",
    tagEn: "Explore",
    roleTr: "Fox vs Octo · gürültü",
    roleEn: "Fox vs Octo · noise",
    observesTr: "Rastgele sapma — açılış çeşitliliği",
    observesEn: "Random perturbation — opening diversity"
  }),
  Object.freeze({
    slotId: 4,
    tagTr: "Ayna",
    tagEn: "Mirror",
    roleTr: "Kullanıcı stili",
    roleEn: "User style mirror",
    observesTr: "Senin maçlarından yansıma (sim)",
    observesEn: "Reflection of your games (sim)"
  }),
  Object.freeze({
    slotId: 5,
    tagTr: "Baseline",
    tagEn: "Baseline",
    roleTr: "Stockfish vs Stockfish",
    roleEn: "Stockfish vs Stockfish",
    observesTr: "Referans motor çizgisi",
    observesEn: "Reference engine line"
  }),
  Object.freeze({
    slotId: 6,
    tagTr: "Hibrit",
    tagEn: "Hybrid",
    roleTr: "Octo + Fox",
    roleEn: "Octo + Fox",
    observesTr: "Takım stili karışımı",
    observesEn: "Team style blend"
  }),
  Object.freeze({
    slotId: 7,
    tagTr: "RL iz",
    tagEn: "RL trace",
    roleTr: "Octo vs Fox · deneysel",
    roleEn: "Octo vs Fox · experimental",
    observesTr: "Öğrenme eğrisi ham verisi",
    observesEn: "Raw learning-curve data"
  })
]);

/**
 * @param {string} endReason
 * @param {number} [ply]
 * @param {boolean} [tr]
 */
export function formatClusterEndReasonLabelV0(endReason, ply = 0, tr = true) {
  const p = Number(ply) || 0;
  const reason = String(endReason || "unknown");
  if (reason === "timeout") {
    return tr ? `Süre doldu · ${p} hamle` : `Time flag · ${p} moves`;
  }
  if (reason === "max_ply_cap") {
    return tr ? `Sim sınırı (${p} hamle)` : `Sim cap (${p} moves)`;
  }
  if (reason === "checkmate_or_draw") {
    return tr ? `Oyun bitti · ${p} hamle` : `Game over · ${p} moves`;
  }
  return tr ? `${reason} · ply ${p}` : `${reason} · ply ${p}`;
}

/**
 * @param {number} slotId
 * @param {boolean} [tr]
 */
export function resolveClusterSlotRoleCopyV0(slotId, tr = true) {
  const id = Number(slotId);
  const row =
    CHESS_CLUSTER_SLOT_ROLE_COPY_V0.find((r) => r.slotId === id) ||
    CHESS_CLUSTER_SLOT_ROLE_COPY_V0[0];
  const mode = resolveChessClusterSlotModeV0(id);
  return Object.freeze({
    schema: CHESS_CLUSTER_OBSERVATORY_COPY_SCHEMA_V0,
    slotId: id,
    featured: id === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0,
    tag: tr ? row.tagTr : row.tagEn,
    role: tr ? row.roleTr : row.roleEn,
    observes: tr ? row.observesTr : row.observesEn,
    modeLabel: mode.label,
    learningTag: mode.learningTag
  });
}

/**
 * @param {boolean} [tr]
 */
export function getChessObservatoryHeroCopyV0(tr = true) {
  return Object.freeze({
    schema: CHESS_CLUSTER_OBSERVATORY_COPY_SCHEMA_V0,
    title: tr ? "Rhizoh 8 stile karşı öğreniyor" : "Rhizoh learns against 8 styles",
    subtitle: tr
      ? "Canlı maç = gerçek Stockfish. Diğer kameralar = gözlem ve B-roll."
      : "Live match = real Stockfish. Other cameras = observation B-roll.",
    ctaLive: tr ? "Canlı maç" : "Live match",
    ctaGrid: tr ? "8 kamera" : "8 cameras",
    learningNote: tr
      ? "Fox & Octo burada motor değil — öğrenme izi üretirler."
      : "Fox & Octo are not engines here — they generate learning traces.",
    lobbyCta: tr
      ? "Canlı yayın — Rhizoh 8 stile karşı öğreniyor"
      : "Live broadcast — Rhizoh learns against 8 styles",
    lobbyDesc: tr
      ? "Ana kamera gerçek Stockfish ile öğrenir; diğer 7 kamera stil izleri üretir."
      : "Featured camera learns with real Stockfish; other 7 cameras generate style traces."
  });
}

/** Human label for engine telemetry strings in move lists. */
export function formatEngineDisplayLabelV0(engine, tr = true) {
  const id = String(engine || "");
  if (id === "stockfish_wasm") return "Stockfish";
  if (id.startsWith("rhizoh_learned")) return tr ? "Rhizoh (öğrenilmiş)" : "Rhizoh (learned)";
  if (id.startsWith("rhizoh_")) return "Rhizoh";
  if (id.includes("broadcast_grid")) return tr ? "B-roll iz" : "B-roll trace";
  if (id.includes("cluster_fast")) return tr ? "Hızlı iz" : "Fast trace";
  if (id.includes("heuristic")) return tr ? "Yedek iz" : "Fallback trace";
  if (id.includes("random")) return tr ? "Keşif" : "Explore";
  return id.replace(/_/g, " ");
}
