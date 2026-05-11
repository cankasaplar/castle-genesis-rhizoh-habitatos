import {
  appendHypergraph,
  createHyperEdgeStore,
  hashHyperEdgeStore
} from "../memory/hyperEdgeStore.js";
import { resonanceWeightedNorm, solveResonanceField } from "../memory/resonanceIndex.js";
import {
  blendPressureWithConstitution,
  deriveConstitutionalPressure,
  mergePressureRebalance,
  pressureDelta
} from "./constitutionalPressureBus.js";
import { scheduleByResonance } from "./resonanceScheduler.js";
import { planWakeTopology } from "./topologyPlanner.js";

/**
 * Pure orchestrator:
 * memory ingest -> resonance solve -> pressure update -> priority shift -> wake topology delta.
 * @param {object} o
 * @param {{ nodes?: Array<object>, edges?: Array<object>, resonanceDelta?: number }} o.memoryArtifacts
 * @param {import('../memory/hyperEdgeStore.js').HyperEdgeStore | null} [o.prevStore]
 * @param {number[]} [o.prevPressure]
 * @param {"LOW" | "NORMAL" | "URGENT" | "SOVEREIGN"} [o.basePriority]
 * @param {number} [o.sovereignTier]
 * @param {number} [o.contradiction]
 * @param {number} [o.discomfort]
 * @param {Pick<import('../constitutional/constitutionalState.js').ConstitutionalState, 'confidence' | 'contradiction' | 'drift' | 'sealEntropy' | 'resonance'>} [o.constitutionSnapshot]
 * @param {number[]} [o.feedbackPressureRebalance] additive from injectConstitutionalFeedback
 */
export function orchestrateMemory(o) {
  const prevStore = o.prevStore || createHyperEdgeStore();
  const nextStore = appendHypergraph(prevStore, o.memoryArtifacts || {});
  const resonanceField = solveResonanceField(nextStore);
  const resonanceNorm = resonanceWeightedNorm(resonanceField);
  let pressure = deriveConstitutionalPressure({
    resonanceField,
    contradiction: o.contradiction,
    discomfort: o.discomfort
  });
  if (o.constitutionSnapshot) {
    pressure = blendPressureWithConstitution(pressure, o.constitutionSnapshot);
  }
  if (o.feedbackPressureRebalance) {
    pressure = mergePressureRebalance(pressure, o.feedbackPressureRebalance);
  }
  const delta = pressureDelta(o.prevPressure || [0, 0, 0, 0, 0], pressure);
  const priority = scheduleByResonance({
    basePriority: o.basePriority || "NORMAL",
    resonanceField,
    pressure,
    sovereignTier: o.sovereignTier ?? 0.33
  });
  const wakeTopologyDelta = planWakeTopology(o.memoryArtifacts || {});
  const orchestrationHash = hashOrchestration({
    storeHash: hashHyperEdgeStore(nextStore),
    pressure,
    nextPriority: priority.nextPriority,
    wakeTopologyDelta
  });
  return Object.freeze({
    store: nextStore,
    storeHash: hashHyperEdgeStore(nextStore),
    resonanceField,
    resonanceNorm,
    pressureVector: pressure,
    pressureDelta: delta,
    wakeTopologyDelta,
    priorityShift: priority,
    orchestrationHash
  });
}

/**
 * @param {object} o
 * @param {string} o.storeHash
 * @param {number[]} o.pressure
 * @param {string} o.nextPriority
 * @param {object} o.wakeTopologyDelta
 */
export function hashOrchestration(o) {
  const canonical = JSON.stringify({
    storeHash: o.storeHash,
    pressure: o.pressure.map((x) => Number(x.toFixed(6))),
    nextPriority: o.nextPriority,
    wakeTopologyDelta: o.wakeTopologyDelta
  });
  let x = 5381;
  for (let i = 0; i < canonical.length; i++) x = ((x << 5) + x + canonical.charCodeAt(i)) >>> 0;
  return `0x${x.toString(16)}`;
}
