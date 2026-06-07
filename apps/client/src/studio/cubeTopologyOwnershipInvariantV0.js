/**
 * Cube topology ownership invariant v0 — stabilization layer.
 * Invariant: cube.topology is never agent-owned.
 * Observers and companions may read and interpret; they must never write topology.
 * @see docs/RHIZOH_DGCS_MULTI_INSTANCE_COGNITION_V0.md
 */

export const CUBE_TOPOLOGY_INVARIANT_ID_V0 = "cube.topology.never_agent_owned";

/** Sole authority for topology mutation (user/session cognition ingress). */
export const CUBE_TOPOLOGY_COGNITION_INGRESS_V0 = "cognition_ingress";

/** Sources that must never mutate cube topology. */
export const CUBE_TOPOLOGY_FORBIDDEN_WRITERS_V0 = Object.freeze([
  "observer",
  "companion",
  "agent",
  "octo",
  "rhizoh",
  "fox",
  "inbox",
  "attention",
  "attention_field",
  "species",
  "coupling"
]);

/**
 * @param {ReturnType<typeof import("./octoCognitiveGeometryCompilerV1.js").createCognitiveGeometryEngineV1>} engine
 * @param {{ instanceId?: string }} [opts]
 */
export function sealCubeTopologyOwnershipV0(engine, opts = {}) {
  if (!engine) return null;
  const seal = {
    invariant: CUBE_TOPOLOGY_INVARIANT_ID_V0,
    owner: CUBE_TOPOLOGY_COGNITION_INGRESS_V0,
    instanceId: opts.instanceId ?? "local",
    writeCount: 0,
    lastWriteSource: null,
    lastWriteAtMs: null,
    agentWriteAttempts: 0,
    lastAgentWriteSource: null
  };
  engine._topologyOwnership = seal;
  return seal;
}

/**
 * @param {string} source
 */
export function isForbiddenTopologyWriterV0(source) {
  const normalized = String(source || "")
    .trim()
    .toLowerCase();
  if (!normalized) return true;
  if (normalized === CUBE_TOPOLOGY_COGNITION_INGRESS_V0) return false;
  return CUBE_TOPOLOGY_FORBIDDEN_WRITERS_V0.some(
    (blocked) => normalized === blocked || normalized.includes(blocked)
  );
}

/**
 * @param {ReturnType<typeof import("./octoCognitiveGeometryCompilerV1.js").createCognitiveGeometryEngineV1>} engine
 * @param {string} source
 * @param {{ twist?: number, fold?: number, spikes?: number, stretchY?: number }} nextTopology
 */
export function assertCubeTopologyWriteV0(engine, source, nextTopology) {
  if (!engine) {
    return Object.freeze({ ok: false, reason: "missing_engine" });
  }
  if (!engine._topologyOwnership) {
    sealCubeTopologyOwnershipV0(engine);
  }
  const seal = engine._topologyOwnership;

  if (isForbiddenTopologyWriterV0(source)) {
    seal.agentWriteAttempts += 1;
    seal.lastAgentWriteSource = source;
    return Object.freeze({
      ok: false,
      reason: "agent_owned_forbidden",
      invariant: CUBE_TOPOLOGY_INVARIANT_ID_V0,
      source
    });
  }

  seal.writeCount += 1;
  seal.lastWriteSource = source;
  seal.lastWriteAtMs = Date.now();

  return Object.freeze({
    ok: true,
    invariant: CUBE_TOPOLOGY_INVARIANT_ID_V0,
    source,
    topology: Object.freeze({
      twist: nextTopology?.twist ?? 0,
      fold: nextTopology?.fold ?? 0,
      spikes: nextTopology?.spikes ?? 0,
      stretchY: nextTopology?.stretchY ?? 1
    })
  });
}

/**
 * Read-only topology snapshot for observer/companion layers.
 * @param {ReturnType<typeof import("./octoCognitiveGeometryCompilerV1.js").createCognitiveGeometryEngineV1>} engine
 */
export function readCubeTopologySnapshotV0(engine) {
  const current = engine?.currentTopology ?? {};
  const target = engine?.targetTopology ?? {};
  return Object.freeze({
    current: Object.freeze({
      twist: current.twist ?? 0,
      fold: current.fold ?? 0,
      spikes: current.spikes ?? 0,
      stretchY: current.stretchY ?? 1
    }),
    target: Object.freeze({
      twist: target.twist ?? 0,
      fold: target.fold ?? 0,
      spikes: target.spikes ?? 0,
      stretchY: target.stretchY ?? 1
    }),
    readOnly: true,
    agentOwned: false
  });
}

/**
 * @param {ReturnType<typeof import("./octoCognitiveGeometryCompilerV1.js").createCognitiveGeometryEngineV1>} engine
 */
export function auditCubeTopologyOwnershipV0(engine) {
  const seal = engine?._topologyOwnership ?? null;
  const agentBlocked = (seal?.agentWriteAttempts ?? 0) === 0;
  return Object.freeze({
    invariant: CUBE_TOPOLOGY_INVARIANT_ID_V0,
    invariantHeld: agentBlocked,
    owner: seal?.owner ?? CUBE_TOPOLOGY_COGNITION_INGRESS_V0,
    instanceId: seal?.instanceId ?? "local",
    writeCount: seal?.writeCount ?? 0,
    agentWriteAttempts: seal?.agentWriteAttempts ?? 0,
    lastWriteSource: seal?.lastWriteSource ?? null,
    lastAgentWriteSource: seal?.lastAgentWriteSource ?? null
  });
}
