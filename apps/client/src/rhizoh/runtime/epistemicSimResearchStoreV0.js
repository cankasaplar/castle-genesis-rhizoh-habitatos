/**
 * Phase 9.4.1 wire — latest epistemic simulation snapshot for overlay + Cesium.
 * Observation-only store; does not touch worldPresence or execution gates.
 */

/** @type {import('./epistemicSimResearchStoreV0.js').EpistemicSimResearchSnapshotV0 | null} */
let latestSnapshotV0 = null;

/**
 * @typedef {Object} EpistemicSimResearchSnapshotV0
 * @property {number} frame
 * @property {number} simTimeMs
 * @property {number} epistemicSplitBrainScore
 * @property {number} coherenceGradient
 * @property {string|null} focusNodeId
 * @property {string|null} executorNodeId
 * @property {string|null} stabilizationMode
 * @property {boolean|null} allowConcurrentExecution
 * @property {number} terrainMaxOffsetMeters
 * @property {number} causalityTraceCount
 * @property {number} shaderDrawCalls
 * @property {boolean} truthCollapsed
 * @property {number} updatedAtMs
 * @property {import('./continuity/__research__/causalTerrainMutationV0.js').EpistemicNavigationPhysicsV0} [navigationPhysics]
 * @property {import('./continuity/__research__/causalTerrainMutationV0.js').EpistemicPhysicsEventV0[]} [physicsEvents]
 * @property {number} [eventBusSeqHead]
 */

/**
 * @param {EpistemicSimResearchSnapshotV0} snap
 */
export function setEpistemicSimResearchSnapshotV0(snap) {
  latestSnapshotV0 = { ...snap, updatedAtMs: Date.now() };
}

/**
 * @returns {EpistemicSimResearchSnapshotV0 | null}
 */
export function getEpistemicSimResearchSnapshotV0() {
  return latestSnapshotV0;
}

export function resetEpistemicSimResearchStoreForTestsV0() {
  latestSnapshotV0 = null;
}
