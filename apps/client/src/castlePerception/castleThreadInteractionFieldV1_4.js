/**
 * Castle Thread Interaction Field v1.4 — directional thread physics.
 * Not "how much degrade?" but "how transform?" — suppresses, enhances, reframes, delays.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_4.md
 */

export const CASTLE_THREAD_INTERACTION_SCHEMA_V1_4 = "castle.thread_interaction.v1.4";

export const INTERACTION_KIND_V1_4 = Object.freeze({
  SUPPRESSES: "suppresses",
  ENHANCES: "enhances",
  REFRAMES: "reframes",
  DELAYS: "delays"
});

/** Directed topic → topic interaction rules (A influences B). */
const DIRECTED_TOPIC_RULES_V1_4 = Object.freeze({
  co_watch_sports: Object.freeze({
    audiobook: Object.freeze({ suppresses: 0.42, delays: 0.22 }),
    technical: Object.freeze({ suppresses: 0.18, reframes: 0.12 }),
    general: Object.freeze({ enhances: 0.14, reframes: 0.08 }),
    co_watch_sports: Object.freeze({ enhances: 0.05 })
  }),
  audiobook: Object.freeze({
    co_watch_sports: Object.freeze({ reframes: 0.2, delays: 0.15 }),
    technical: Object.freeze({ enhances: 0.12 }),
    general: Object.freeze({ reframes: 0.18 }),
    audiobook: Object.freeze({ enhances: 0.04 })
  }),
  technical: Object.freeze({
    co_watch_sports: Object.freeze({ suppresses: 0.1, reframes: 0.25 }),
    audiobook: Object.freeze({ suppresses: 0.08 }),
    general: Object.freeze({ enhances: 0.2, reframes: 0.15 }),
    technical: Object.freeze({ enhances: 0.06 })
  }),
  general: Object.freeze({
    co_watch_sports: Object.freeze({ reframes: 0.28, enhances: 0.1 }),
    audiobook: Object.freeze({ reframes: 0.22 }),
    technical: Object.freeze({ enhances: 0.08 }),
    general: Object.freeze({ enhances: 0.03 })
  })
});

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function topicKey(label) {
  return label || "general";
}

/**
 * Resolve directed interaction from source thread to target thread.
 * @param {object} sourceNode
 * @param {object} targetNode
 */
export function resolveThreadInteractionV1_4(sourceNode, targetNode) {
  if (sourceNode.threadId === targetNode.threadId) {
    return Object.freeze({
      fromThreadId: sourceNode.threadId,
      toThreadId: targetNode.threadId,
      suppresses: 0,
      enhances: 0,
      reframes: 0,
      delays: 0
    });
  }

  const rules =
    DIRECTED_TOPIC_RULES_V1_4[topicKey(sourceNode.topicLabel)]?.[topicKey(targetNode.topicLabel)] ||
    DIRECTED_TOPIC_RULES_V1_4.general?.[topicKey(targetNode.topicLabel)] ||
    Object.freeze({ reframes: 0.1 });

  const salienceScale = clamp01(sourceNode.salience ?? sourceNode.executionShare ?? 0.5);
  const scale = (v) => Number(clamp01(v * salienceScale).toFixed(4));

  return Object.freeze({
    schema: CASTLE_THREAD_INTERACTION_SCHEMA_V1_4,
    fromThreadId: sourceNode.threadId,
    toThreadId: targetNode.threadId,
    fromTopic: sourceNode.topicLabel,
    toTopic: targetNode.topicLabel,
    suppresses: scale(rules.suppresses || 0),
    enhances: scale(rules.enhances || 0),
    reframes: scale(rules.reframes || 0),
    delays: scale(rules.delays || 0)
  });
}

/**
 * Build full interaction field for thread nodes.
 * @param {object[]} nodes
 */
export function buildThreadInteractionFieldV1_4(nodes) {
  /** @type {object[]} */
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      edges.push(resolveThreadInteractionV1_4(nodes[i], nodes[j]));
    }
  }
  return Object.freeze({
    schema: CASTLE_THREAD_INTERACTION_SCHEMA_V1_4,
    edgeCount: edges.length,
    edges: Object.freeze(edges)
  });
}

/**
 * Aggregate inbound interaction effects on a target thread.
 * @param {string} threadId
 * @param {object[]} edges
 */
export function aggregateInboundInteractionV1_4(threadId, edges) {
  let suppresses = 0;
  let enhances = 0;
  let reframes = 0;
  let delays = 0;

  for (const e of edges) {
    if (e.toThreadId !== threadId) continue;
    suppresses += e.suppresses;
    enhances += e.enhances;
    reframes += e.reframes;
    delays += e.delays;
  }

  return Object.freeze({
    threadId,
    suppresses: Number(clamp01(suppresses).toFixed(4)),
    enhances: Number(clamp01(enhances).toFixed(4)),
    reframes: Number(clamp01(reframes).toFixed(4)),
    delays: Number(clamp01(delays).toFixed(4))
  });
}
