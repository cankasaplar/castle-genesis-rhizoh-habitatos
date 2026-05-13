/**
 * Equivalence-class topology: nodes = identity classes, edges = temporal succession + class flips.
 */
export const GENESIS_REPLAY_EQUIVALENCE_TOPOLOGY_SCHEMA = "castle.genesis.replay_equivalence_topology.v1";

/**
 * @param {string} fp
 */
function nodeIdForFingerprint(fp) {
  const f = String(fp || "");
  return f.length > 0 ? `fp_${f}` : "fp_empty";
}

/**
 * @param {unknown} stabilityField
 */
export function computeEquivalenceTopologyGraphV1(stabilityField) {
  const runs = Array.isArray(/** @type {{ runs?: unknown[] }} */ (stabilityField)?.runs)
    ? /** @type {{ fingerprint: string, fromSeq: number, toSeq: number, windowStreak: number }[]} */ (
        /** @type {{ runs: unknown[] }} */ (stabilityField).runs
      )
    : [];
  const transitions = Array.isArray(/** @type {{ classTransitions?: unknown[] }} */ (stabilityField)?.classTransitions)
    ? /** @type {{ atSeq: number, fromFingerprint: string, toFingerprint: string }[]} */ (
        /** @type {{ classTransitions: unknown[] }} */ (stabilityField).classTransitions
      )
    : [];

  /** @type {Map<string, { nodeId: string, fingerprint: string, persistenceWindows: number, fromSeq: number, toSeq: number }>} */
  const nodeMap = new Map();
  for (const r of runs) {
    const fp = String(r.fingerprint || "");
    const id = nodeIdForFingerprint(fp);
    const prev = nodeMap.get(id);
    const streak = Math.floor(Number(r.windowStreak) || 0);
    const rf = Math.floor(Number(r.fromSeq) || 0);
    const rt = Math.floor(Number(r.toSeq) || 0);
    if (!prev) {
      nodeMap.set(id, {
        nodeId: id,
        fingerprint: fp,
        persistenceWindows: streak,
        fromSeq: rf,
        toSeq: rt
      });
    } else {
      prev.persistenceWindows += streak;
      prev.fromSeq = Math.min(prev.fromSeq, rf);
      prev.toSeq = Math.max(prev.toSeq, rt);
    }
  }

  const nodes = [...nodeMap.values()].sort((a, b) => a.fingerprint.localeCompare(b.fingerprint));

  /** @type {{ fromNodeId: string, toNodeId: string, kind: string, weight: number, atSeq: number | null }[]} */
  const edges = [];

  /** @type {Map<string, { fromNodeId: string, toNodeId: string, kind: string, weight: number, atSeqMin: number }>} */
  const temporalAgg = new Map();
  for (let k = 0; k < runs.length - 1; k += 1) {
    const a = String(runs[k].fingerprint || "");
    const b = String(runs[k + 1].fingerprint || "");
    if (a === b) continue;
    const fromNodeId = nodeIdForFingerprint(a);
    const toNodeId = nodeIdForFingerprint(b);
    const mid = Math.floor((Math.floor(Number(runs[k].toSeq) || 0) + Math.floor(Number(runs[k + 1].fromSeq) || 0)) / 2);
    const key = `${fromNodeId}|${toNodeId}|temporal_succession`;
    const cur = temporalAgg.get(key);
    if (!cur) {
      temporalAgg.set(key, { fromNodeId, toNodeId, kind: "temporal_succession", weight: 1, atSeqMin: mid });
    } else {
      cur.weight += 1;
      cur.atSeqMin = Math.min(cur.atSeqMin, mid);
    }
  }
  for (const v of temporalAgg.values()) {
    edges.push({
      fromNodeId: v.fromNodeId,
      toNodeId: v.toNodeId,
      kind: v.kind,
      weight: v.weight,
      atSeq: v.atSeqMin
    });
  }

  /** @type {Map<string, { fromNodeId: string, toNodeId: string, kind: string, weight: number, atSeqMin: number }>} */
  const flipAgg = new Map();
  for (const t of transitions) {
    const fa = String(t.fromFingerprint || "");
    const fb = String(t.toFingerprint || "");
    if (fa === fb) continue;
    const fromNodeId = nodeIdForFingerprint(fa);
    const toNodeId = nodeIdForFingerprint(fb);
    const key = `${fromNodeId}|${toNodeId}`;
    const at = Math.floor(Number(t.atSeq) || 0);
    const cur = flipAgg.get(key);
    if (!cur) {
      flipAgg.set(key, { fromNodeId, toNodeId, kind: "class_flip", weight: 1, atSeqMin: at });
    } else {
      cur.weight += 1;
      cur.atSeqMin = Math.min(cur.atSeqMin, at);
    }
  }
  for (const v of flipAgg.values()) {
    edges.push({
      fromNodeId: v.fromNodeId,
      toNodeId: v.toNodeId,
      kind: v.kind,
      weight: v.weight,
      atSeq: v.atSeqMin
    });
  }

  edges.sort((a, b) => {
    const ka = `${a.kind}|${a.fromNodeId}|${a.toNodeId}`;
    const kb = `${b.kind}|${b.fromNodeId}|${b.toNodeId}`;
    return ka.localeCompare(kb);
  });

  return {
    schema: GENESIS_REPLAY_EQUIVALENCE_TOPOLOGY_SCHEMA,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges
  };
}
