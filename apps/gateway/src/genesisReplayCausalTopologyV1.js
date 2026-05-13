/**
 * Regime segments along merged continuity order: nodes = consecutive `_replaySource` runs,
 * edges = transitions (overlap in seq space between substrate layers).
 */
export const GENESIS_REPLAY_CAUSAL_TOPOLOGY_SCHEMA = "castle.genesis.replay_causal_topology.v1";

/**
 * @param {Record<string, unknown>[]} continuityEvents — merged replay events (with `_replaySource`)
 */
export function buildRegimeSegmentGraphFromContinuityV1(continuityEvents) {
  const sorted = [...(continuityEvents || [])].sort(
    (a, b) => Math.floor(Number(a.seq) || 0) - Math.floor(Number(b.seq) || 0)
  );

  /** @type {{ segmentId: string, regime: string, fromSeq: number, toSeq: number, eventCount: number }[]} */
  const nodes = [];
  /** @type {{ fromSegmentId: string, toSegmentId: string, kind: string, atSeq: number }[]} */
  const edges = [];

  /** @type {{ segmentId: string, regime: string, fromSeq: number, toSeq: number, eventCount: number } | null} */
  let cur = null;

  for (const e of sorted) {
    const regime = String(e._replaySource || "unknown");
    const s = Math.floor(Number(e.seq) || 0);
    if (!s) continue;
    if (!cur || cur.regime !== regime) {
      if (cur) nodes.push(cur);
      const id = `seg_${nodes.length}`;
      cur = { segmentId: id, regime, fromSeq: s, toSeq: s, eventCount: 1 };
    } else {
      cur.toSeq = s;
      cur.eventCount += 1;
    }
  }
  if (cur) nodes.push(cur);

  for (let i = 1; i < nodes.length; i++) {
    edges.push({
      fromSegmentId: nodes[i - 1].segmentId,
      toSegmentId: nodes[i].segmentId,
      kind: "regime_transition",
      atSeq: nodes[i].fromSeq
    });
  }

  return {
    schema: GENESIS_REPLAY_CAUSAL_TOPOLOGY_SCHEMA,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges
  };
}
