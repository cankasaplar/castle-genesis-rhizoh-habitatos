/**
 * Ontological Repair Protocol v1 — operational fix bundle for:
 * 1) Single genesis authority lock
 * 2) Node temporal fission (dedupe evolution line)
 * 3) World_space re-attachment + drift quarantine
 * 4) Graph→spatial bridge + forced buffer flush + semantic mass bootstrap
 *
 * RESEARCH-ONLY observability + client boundary repair — no frozen phase*.js edits.
 */

import {
  getGenesisSingleAuthorityLockSnapshotV0,
  listGenesisAuthorityOriginsV0
} from "./genesisSingleAuthorityLockV0.js";
import {
  detectTemporalNodeClonesV0,
  dedupeTemporalNodeRowsV0
} from "./nodeTemporalFissionV0.js";
import {
  reattachWorldSpaceBridgeV0,
  estimateWorldSpaceDivergenceV0,
  SPATIAL_DRIFT_QUARANTINE_THRESHOLD_V0
} from "./worldSpaceReattachmentV0.js";
import { listSpatialNodesV0 } from "./rhizohSpatialNodeLayerV0.js";
import { flushSpatialBufferToWorldSpaceV0 } from "./spatialWorldSpaceFlushV0.js";
import {
  projectCausalNodesToSpatialV0,
  detectOrphanCausalGraphV0,
  bootstrapInternalSemanticMassV0
} from "./causalGraphSpatialBridgeV0.js";
import { publishCausalMapLayerV0 } from "./rhizohCausalMapLayerV0.js";
import { getSpatialReadyGateSnapshotV0 } from "./rhizohSpatialReadyGateV0.js";

export const ONTOLOGICAL_REPAIR_PROTOCOL_SCHEMA_V1 = "castle.rhizoh.ontological_repair_protocol.v1";

/**
 * @param {{ nodeRows?: object[], skipWorldSpace?: boolean }} [opts]
 */
export function runOntologicalRepairProtocolV1(opts = {}) {
  const genesisLock = getGenesisSingleAuthorityLockSnapshotV0();

  const spatialRows = (opts.nodeRows || listSpatialNodesV0()).map((n) => ({
    nodeId: n.id,
    atMs: n.atMs,
    kind: n.payload?.kind,
    tier: n.tier
  }));
  const cloneScan = detectTemporalNodeClonesV0(spatialRows);
  const fission = dedupeTemporalNodeRowsV0(spatialRows);

  const worldSpace = opts.skipWorldSpace === true ? null : reattachWorldSpaceBridgeV0({
    source: "ontological_repair_protocol_v1"
  });

  const spatialFlush = opts.skipWorldSpace === true ? null : flushSpatialBufferToWorldSpaceV0({ force: true });
  const causalMap = publishCausalMapLayerV0();
  const orphanGraph = detectOrphanCausalGraphV0();
  const graphBridge = projectCausalNodesToSpatialV0(causalMap, {
    force: orphanGraph.orphan === true
  });
  const semanticBootstrap = bootstrapInternalSemanticMassV0({ causalMap, currentMass: 0 });
  const spatialGate = getSpatialReadyGateSnapshotV0();
  const spatialCount = listSpatialNodesV0().length;

  const divergence = estimateWorldSpaceDivergenceV0();
  const physicallyUnbound = orphanGraph.orphan && spatialCount === 0;
  const report = Object.freeze({
    schema: ONTOLOGICAL_REPAIR_PROTOCOL_SCHEMA_V1,
    atMs: Date.now(),
    influencesExecution: false,
    diagnosis: Object.freeze({
      splitBrainRisk: genesisLock.originCount > 1,
      temporalSpam: cloneScan.temporalSpam,
      spatialDesync: divergence > SPATIAL_DRIFT_QUARANTINE_THRESHOLD_V0,
      orphanCausalGraph: orphanGraph.orphan,
      physicallyUnbound,
      epistemicHalfCollapse:
        orphanGraph.causalNodeCount > 0 && spatialCount === 0 && semanticBootstrap.bootstrapped
    }),
    genesisAuthority: genesisLock,
    genesisOrigins: Object.freeze(listGenesisAuthorityOriginsV0()),
    nodeEvolution: Object.freeze({
      inputNodeCount: spatialRows.length,
      temporalClones: cloneScan,
      fissionApplied: fission.fissionCount,
      evolvedRows: fission.rows
    }),
    worldSpace: worldSpace
      ? Object.freeze({
          ok: worldSpace.ok,
          quarantine: worldSpace.quarantine,
          cesiumRebound: worldSpace.cesiumRebound,
          divergence
        })
      : null,
    spatialBinding: Object.freeze({
      gate: spatialGate,
      flush: spatialFlush,
      graphBridge,
      orphanGraph,
      spatialNodeCount: spatialCount,
      causalNodeCount: causalMap?.nodeCount ?? 0
    }),
    semanticMass: semanticBootstrap,
    pass:
      !cloneScan.temporalSpam &&
      genesisLock.lockActive &&
      divergence <= SPATIAL_DRIFT_QUARANTINE_THRESHOLD_V0 &&
      !physicallyUnbound
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.ontologicalRepair = report;
    window.__RHIZOH_ONTOLOGICAL_REPAIR__ = report;
    window.runOntologicalRepairProtocolV1 = runOntologicalRepairProtocolV1;
  }

  return report;
}

/**
 * Idempotent boot wire — safe from nervous system / prod observability bridge.
 */
export function ensureOntologicalRepairProtocolV1() {
  if (typeof window === "undefined") return null;
  const prev = window.__rhizoh?.ontologicalRepair;
  if (prev?.schema === ONTOLOGICAL_REPAIR_PROTOCOL_SCHEMA_V1 && Date.now() - (prev.atMs || 0) < 4000) {
    return prev;
  }
  return runOntologicalRepairProtocolV1();
}
