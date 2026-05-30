/**
 * CORE-ELIGIBLE — SpiralMMO phase transition: proto-world mesh + agreement layer (v0).
 *
 * **Phase:** perception field → proto-world mesh
 * **Boundary:** NOT shared state — soft *agreement layer* only (felt consensus).
 *
 * No WAL · no mesh authority · no player state merge.
 */

import { derivePassivePerceptionFieldV0 } from "./passivePerceptionFieldCoherenceV0.js";

export const SPIRAL_MMO_AGREEMENT_LAYER_SCHEMA_V0 = "castle.rhizoh.spiral_mmo_agreement_layer.v0";

const MESH_PHASES_V0 = Object.freeze(["seed", "spiral", "weave", "hold"]);

const AGREEMENT_LINES_V0 = Object.freeze([
  "Proto-mesh: hisler hizalanıyor — ama kimse kimsenin state'ini taşımıyor.",
  "Agreement layer aktif — yumuşak uzlaşı var, execution yok.",
  "Spiral örgüsü sadece algıda birleşiyor; veri paylaşılmıyor.",
  "Ortak mesh hissi — agreement skoru duygu, oylama değil.",
  "World mesh proto: perception field evrimi, state geçişi değil."
]);

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
 * Proto-world mesh derived from perception field (deterministic, read-only).
 *
 * @param {{
 *   worldInstanceId: string,
 *   selfSignature?: string,
 *   fieldEpoch?: string
 * }} io
 */
export function deriveProtoWorldMeshV0(io) {
  const id = String(io?.worldInstanceId || "");
  const self = String(io?.selfSignature || "anon");
  const d = new Date();
  const epoch =
    io.fieldEpoch ||
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  const h = djb2U32(`${id}|${self}|proto_mesh_v0|${epoch}`);
  const phase = MESH_PHASES_V0[h % MESH_PHASES_V0.length];
  const coherence01 = clamp01(0.4 + (h % 700) / 1000);

  return Object.freeze({
    schema: SPIRAL_MMO_AGREEMENT_LAYER_SCHEMA_V0,
    readOnly: true,
    sharedState: false,
    meshPhase: phase,
    meshCoherence01: coherence01,
    fieldEpoch: epoch,
    nodeHint: `mesh_${(h % 4096).toString(16).padStart(3, "0")}`
  });
}

/**
 * Agreement layer — soft felt consensus, NOT authoritative state.
 *
 * @param {{
 *   worldInstanceId: string,
 *   selfSignature?: string,
 *   perceptionField?: ReturnType<typeof derivePassivePerceptionFieldV0>,
 *   agreementLayerEnabled?: boolean
 * }} io
 */
export function deriveSpiralMMOAgreementLayerV0(io) {
  const enabled = Boolean(io?.agreementLayerEnabled);
  const perceptionField =
    io.perceptionField ||
    derivePassivePerceptionFieldV0({
      worldInstanceId: io.worldInstanceId,
      spiralBridgeEnabled: enabled
    });

  if (!enabled) {
    return Object.freeze({
      schema: SPIRAL_MMO_AGREEMENT_LAYER_SCHEMA_V0,
      phase: "perception_field_only",
      sharedState: false,
      agreementLayer: false,
      perceptionField,
      protoMesh: null,
      agreementLine: null
    });
  }

  const protoMesh = deriveProtoWorldMeshV0({
    worldInstanceId: io.worldInstanceId,
    selfSignature: io.selfSignature,
    fieldEpoch: perceptionField.fieldEpoch
  });

  const h = djb2U32(
    `${io.worldInstanceId}|${io.selfSignature}|${perceptionField.resonancePhase}|${protoMesh.meshPhase}`
  );
  const agreement01 = clamp01(
    perceptionField.resonance01 * 0.45 + protoMesh.meshCoherence01 * 0.55
  );
  const agreementLine = AGREEMENT_LINES_V0[h % AGREEMENT_LINES_V0.length];

  return Object.freeze({
    schema: SPIRAL_MMO_AGREEMENT_LAYER_SCHEMA_V0,
    phase: "proto_world_mesh_agreement",
    sharedState: false,
    agreementLayer: true,
    perceptionField,
    protoMesh,
    agreementScore01: agreement01,
    agreementPhase: protoMesh.meshPhase,
    agreementLine,
    disclaimer:
      "Agreement layer = shared perception consensus only. No shared execution state. SpiralMMO bridge v0."
  });
}

/**
 * Merge agreement layer copy into collective feeling.
 *
 * @param {ReturnType<import('./livingWorldCollectivePulseV0.js').deriveCollectivePresenceFeelingV0>} collective
 * @param {ReturnType<typeof deriveSpiralMMOAgreementLayerV0>} agreement
 */
export function mergeAgreementLayerIntoCollectiveFeelingV0(collective, agreement) {
  if (!agreement?.agreementLayer) return collective;
  const secondary = [collective.secondary, agreement.agreementLine].filter(Boolean).join(" ");
  return Object.freeze({
    ...collective,
    secondary: secondary || null,
    spiralAgreement: Object.freeze({
      phase: agreement.phase,
      meshPhase: agreement.agreementPhase,
      sharedState: false,
      agreementLayer: true
    })
  });
}
