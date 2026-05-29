/**
 * Social-usage agent noise balancer — tightens agent.spoke under concurrent load.
 */

const BASE_AGENT_MAX = 8;
const BASE_WINDOW_MS = 10_000;
const MIN_AGENT_MAX = 2;

/** @type {Map<string, number>} clientId → lastSeenMs */
const activeClients = new Map();
const CLIENT_TTL_MS = 30_000;

function pruneClients(now) {
  for (const [id, t] of activeClients) {
    if (now - t > CLIENT_TTL_MS) activeClients.delete(id);
  }
}

/**
 * @param {string} clientId
 */
export function noteGenesisIngressClientActivityV0(clientId) {
  const id = String(clientId || "anonymous").slice(0, 96);
  activeClients.set(id, Date.now());
  pruneClients(Date.now());
}

export function getGenesisIngressSocialLoadSnapshotV0() {
  pruneClients(Date.now());
  const concurrentClients = activeClients.size;
  let agentSpokeMax = BASE_AGENT_MAX;
  if (concurrentClients >= 12) agentSpokeMax = MIN_AGENT_MAX;
  else if (concurrentClients >= 6) agentSpokeMax = 4;
  else if (concurrentClients >= 3) agentSpokeMax = 6;
  return Object.freeze({
    schema: "castle.genesis.ingress_social_load.v0",
    concurrentClients,
    agentSpokeMaxPerWindow: agentSpokeMax,
    windowMs: BASE_WINDOW_MS,
    atMs: Date.now()
  });
}

export function resolveAgentSpokeRateLimitV0() {
  return getGenesisIngressSocialLoadSnapshotV0().agentSpokeMaxPerWindow;
}

/** @public Tests */
export function resetGenesisIngressSocialBalancerForTestsV0() {
  activeClients.clear();
}
