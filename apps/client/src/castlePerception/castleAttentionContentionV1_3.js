/**
 * Castle Attention Contention Graph v1.3 — thread interference physics.
 * Threads compete, degrade each other, receive partial execution shares.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_3.md
 */

export const CASTLE_ATTENTION_CONTENTION_SCHEMA_V1_3 = "castle.attention_contention.v1.3";

const TOPIC_INTERFERENCE_V1_3 = Object.freeze({
  co_watch_sports: { co_watch_sports: 0.85, audiobook: 0.55, technical: 0.35, general: 0.25 },
  audiobook: { co_watch_sports: 0.55, audiobook: 0.7, technical: 0.4, general: 0.3 },
  technical: { co_watch_sports: 0.35, audiobook: 0.4, technical: 0.75, general: 0.45 },
  general: { co_watch_sports: 0.25, audiobook: 0.3, technical: 0.45, general: 0.2 }
});

const DECAY_HALF_LIFE_MS_V1_3 = 45_000;
const MIN_EXECUTION_SHARE_V1_3 = 0.05;

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function topicInterferenceV1_3(a, b) {
  const ta = a.topicLabel || "general";
  const tb = b.topicLabel || "general";
  let base = TOPIC_INTERFERENCE_V1_3[ta]?.[tb] ?? TOPIC_INTERFERENCE_V1_3.general?.[tb] ?? 0.3;
  if (a.ownerId === b.ownerId) base = Math.min(1, base + 0.1);
  else base = Math.min(1, base + 0.15);
  return Number(base.toFixed(4));
}

function computeDecayRateV1_3(thread, atMs) {
  const ageMs = Math.max(0, atMs - (thread.lastActivityMs || atMs));
  return Number(clamp01(Math.exp(-ageMs / DECAY_HALF_LIFE_MS_V1_3)).toFixed(4));
}

/**
 * Build ThreadNode list from active conversation threads.
 * @param {object[]} threads
 * @param {number} atMs
 */
export function buildThreadNodesV1_3(threads, atMs = Date.now()) {
  return threads.map((t) => {
    const decayRate = computeDecayRateV1_3(t, atMs);
    const salience = clamp01((t.priority / 100) * decayRate);
    return Object.freeze({
      id: t.threadId,
      threadId: t.threadId,
      ownerId: t.ownerId,
      topicLabel: t.topicLabel || "general",
      salience: Number(salience.toFixed(4)),
      decayRate,
      interferenceWeight: 0,
      executionShare: 0
    });
  });
}

/**
 * Pairwise thread interference matrix.
 * @param {object[]} nodes
 */
export function computeInterferenceMatrixV1_3(nodes) {
  const n = nodes.length;
  if (!n) return Object.freeze({ size: 0, matrix: Object.freeze([]) });

  /** @type {number[][]} */
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const v = topicInterferenceV1_3(nodes[i], nodes[j]);
      matrix[i][j] = v;
      matrix[j][i] = v;
    }
  }
  return Object.freeze({ size: n, matrix: Object.freeze(matrix.map((row) => Object.freeze(row))) });
}

/**
 * Apply contention — threads degrade each other; normalize to execution shares.
 * @param {object[]} nodes
 * @param {object} interference
 * @param {object} [context]
 */
export function applyContentionDegradationV1_3(nodes, interference, context = {}) {
  if (!nodes.length) return Object.freeze([]);

  const matrix = interference.matrix || [];
  const contextualBoost = context.contextualIdentity?.intentWeight ?? 1;

  const degraded = nodes.map((node, i) => {
    let interferenceSum = 0;
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      interferenceSum += (matrix[i]?.[j] || 0) * nodes[j].salience;
    }
    const interferenceWeight = Number(interferenceSum.toFixed(4));
    const effectiveSalience = Math.max(
      MIN_EXECUTION_SHARE_V1_3,
      node.salience * (1 - interferenceWeight * 0.65) * contextualBoost
    );
    return { ...node, interferenceWeight, effectiveSalience };
  });

  const total = degraded.reduce((s, n) => s + n.effectiveSalience, 0) || 1;
  return Object.freeze(
    degraded.map((n) =>
      Object.freeze({
        ...n,
        executionShare: Number((n.effectiveSalience / total).toFixed(4))
      })
    )
  );
}

export function getContentionSnapshotV1_3(nodes, interference) {
  return Object.freeze({
    schema: CASTLE_ATTENTION_CONTENTION_SCHEMA_V1_3,
    nodeCount: nodes.length,
    nodes: Object.freeze(nodes.map((n) => Object.freeze({ ...n }))),
    interferenceMatrix: interference
  });
}
