/**
 * Chess variant registry v0 — research labels for multi-side / 3D modes (spec stage).
 */

export const CHESS_VARIANT_ID_V0 = Object.freeze({
  STANDARD: "standard",
  TEAM_PET_VS_RHIZOH: "team_pet_vs_rhizoh",
  THREE_PLAYER: "three_player",
  FOUR_PLAYER: "four_player",
  CHESS_3D: "chess_3d"
});

export const CHESS_VARIANT_REGISTRY_V0 = Object.freeze([
  Object.freeze({
    id: CHESS_VARIANT_ID_V0.STANDARD,
    labelTr: "Klasik",
    labelEn: "Standard",
    players: 2,
    implemented: true
  }),
  Object.freeze({
    id: CHESS_VARIANT_ID_V0.TEAM_PET_VS_RHIZOH,
    labelTr: "Fox + Octo · Rhizoh AI",
    labelEn: "Fox + Octo · Rhizoh AI",
    players: 2,
    implemented: true,
    teamWhite: Object.freeze(["fox", "octo"]),
    teamBlack: Object.freeze(["rhizoh_ai"])
  }),
  Object.freeze({
    id: CHESS_VARIANT_ID_V0.THREE_PLAYER,
    labelTr: "3 oyuncu (araştırma)",
    labelEn: "3-player (research)",
    players: 3,
    implemented: false
  }),
  Object.freeze({
    id: CHESS_VARIANT_ID_V0.FOUR_PLAYER,
    labelTr: "4 oyuncu (araştırma)",
    labelEn: "4-player (research)",
    players: 4,
    implemented: false
  }),
  Object.freeze({
    id: CHESS_VARIANT_ID_V0.CHESS_3D,
    labelTr: "3D satranç (araştırma)",
    labelEn: "3D chess (research)",
    players: 2,
    implemented: false
  })
]);

export function resolveChessVariantV0(id) {
  const key = String(id || CHESS_VARIANT_ID_V0.STANDARD);
  return (
    CHESS_VARIANT_REGISTRY_V0.find((v) => v.id === key) ||
    CHESS_VARIANT_REGISTRY_V0.find((v) => v.id === CHESS_VARIANT_ID_V0.STANDARD)
  );
}

export function listChessVariantsV0() {
  return CHESS_VARIANT_REGISTRY_V0.map((v) => Object.freeze({ ...v }));
}
