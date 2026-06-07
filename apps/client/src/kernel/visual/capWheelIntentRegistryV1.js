/**
 * Cap wheel intent registry — single source for geometry encoding + intent taxonomy.
 *
 * Prevents semantic drift between: icon glyph · hover ladder · click seedIntent wiring.
 * Voice / gate systems do NOT consume this — cap wheel intent compiler only.
 *
 * Pipeline: icon (geometry) → hover (whisper) → click (seedIntent via onCapNodeIntent)
 */

export const CAP_WHEEL_INTENT_REGISTRY_SCHEMA_V1 = "castle.rhizoh.cap_wheel_intent_registry.v1";

export const CAP_WHEEL_GEOMETRY_KIND_V1 = Object.freeze({
  CUBE: "cube",
  SPIRAL: "spiral",
  RING: "ring",
  ARCHIVE: "archive"
});

/** Pre-linguistic intent class — max 4 buckets (hint inflation guard). */
export const CAP_WHEEL_INTENT_CLASS_V1 = Object.freeze({
  IDENTITY: "identity",
  FLOW: "flow",
  BRIDGE: "bridge",
  STORE: "store"
});

/** @type {Readonly<Record<string, string>>} */
export const CAP_WHEEL_GEOMETRY_INTENT_CLASS_V1 = Object.freeze({
  [CAP_WHEEL_GEOMETRY_KIND_V1.CUBE]: CAP_WHEEL_INTENT_CLASS_V1.IDENTITY,
  [CAP_WHEEL_GEOMETRY_KIND_V1.SPIRAL]: CAP_WHEEL_INTENT_CLASS_V1.FLOW,
  [CAP_WHEEL_GEOMETRY_KIND_V1.RING]: CAP_WHEEL_INTENT_CLASS_V1.BRIDGE,
  [CAP_WHEEL_GEOMETRY_KIND_V1.ARCHIVE]: CAP_WHEEL_INTENT_CLASS_V1.STORE
});

/** Node id → geometry kind (SSOT — locale copy must match). */
export const CAP_WHEEL_NODE_GEOMETRY_V1 = Object.freeze({
  create: CAP_WHEEL_GEOMETRY_KIND_V1.CUBE,
  invite: CAP_WHEEL_GEOMETRY_KIND_V1.SPIRAL,
  explore: CAP_WHEEL_GEOMETRY_KIND_V1.SPIRAL,
  learn: CAP_WHEEL_GEOMETRY_KIND_V1.CUBE,
  broadcast: CAP_WHEEL_GEOMETRY_KIND_V1.SPIRAL,
  build: CAP_WHEEL_GEOMETRY_KIND_V1.CUBE,
  companion: CAP_WHEEL_GEOMETRY_KIND_V1.SPIRAL,
  robotics: CAP_WHEEL_GEOMETRY_KIND_V1.RING,
  swarm: CAP_WHEEL_GEOMETRY_KIND_V1.SPIRAL,
  world: CAP_WHEEL_GEOMETRY_KIND_V1.CUBE,
  library: CAP_WHEEL_GEOMETRY_KIND_V1.ARCHIVE
});

/**
 * @param {{ id?: string, geometryKind?: string, seedIntent?: string } | null | undefined} node
 */
export function resolveCapWheelIntentEncodingV1(node) {
  const nodeId = String(node?.id || "").trim();
  const geometryKind = resolveCapWheelGeometryKindV1(node);
  return Object.freeze({
    schema: CAP_WHEEL_INTENT_REGISTRY_SCHEMA_V1,
    nodeId,
    geometryKind,
    intentClass: CAP_WHEEL_GEOMETRY_INTENT_CLASS_V1[geometryKind] || CAP_WHEEL_INTENT_CLASS_V1.IDENTITY,
    seedIntent: node?.seedIntent != null ? String(node.seedIntent) : null
  });
}

/**
 * @param {{ id?: string, geometryKind?: string } | null | undefined} node
 * @returns {string}
 */
export function resolveCapWheelGeometryKindV1(node) {
  const kind = String(node?.geometryKind || "").trim();
  if (kind && Object.values(CAP_WHEEL_GEOMETRY_KIND_V1).includes(kind)) return kind;
  const id = String(node?.id || "").trim();
  return CAP_WHEEL_NODE_GEOMETRY_V1[id] || CAP_WHEEL_GEOMETRY_KIND_V1.CUBE;
}

/**
 * Locale node arrays must mirror registry geometry — catches copy drift at CI.
 * @param {readonly { id?: string, geometryKind?: string }[]} nodes
 */
export function validateCapWheelIntentCopyCoherenceV1(nodes) {
  const list = Array.isArray(nodes) ? nodes : [];
  for (const node of list) {
    const id = String(node?.id || "").trim();
    const expected = CAP_WHEEL_NODE_GEOMETRY_V1[id];
    if (!expected) continue;
    const actual = String(node?.geometryKind || "").trim();
    if (actual !== expected) {
      return Object.freeze({
        ok: false,
        error: "geometry_drift",
        nodeId: id,
        expected,
        actual: actual || null
      });
    }
  }
  return Object.freeze({ ok: true, nodeCount: list.length });
}
