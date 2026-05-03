/**
 * Episodik sıkıştırma v0: aynı intent + zaman penceresindeki turları tek “olay kümesi”ne indirger.
 * Granular `rhizohWeightedTurns` korunur; özet `rhizohMemoryEpisodes` retrieval’ı zenginleştirir.
 */

const DEFAULT_WINDOW_MS = 12 * 60 * 1000;
const MIN_CLUSTER = 2;
const MAX_EPISODES = 20;

function mergeCluster(cluster) {
  const intent = String(cluster[0]?.intent || "CHAT");
  const tsEnd = Number(cluster[cluster.length - 1]?.ts) || Date.now();
  const user = cluster
    .map((c) => String(c?.user || c?.text || "").trim())
    .filter(Boolean)
    .join(" ¶ ");
  const assistant = cluster
    .map((c) => String(c?.assistant || "").trim())
    .filter(Boolean)
    .join(" ¶ ");
  const importance = Math.max(...cluster.map((c) => Number(c?.importance) || 0));
  const resonance =
    cluster.reduce((s, c) => s + (Number(c?.resonance) || 0), 0) / Math.max(1, cluster.length);
  const bond = cluster.reduce((s, c) => s + (Number(c?.bond) || 0), 0) / Math.max(1, cluster.length);
  const emotionalSalience =
    cluster.reduce((s, c) => s + (Number(c?.emotionalSalience) || 0), 0) / Math.max(1, cluster.length);
  const tags = [
    ...new Set(cluster.flatMap((c) => (Array.isArray(c?.tags) ? c.tags : [])))
  ].slice(0, 12);

  return {
    id: `ep_${tsEnd.toString(36)}_${cluster.length}`,
    kind: "episode",
    intent,
    ts: tsEnd,
    spanCount: cluster.length,
    user: user.slice(0, 900),
    assistant: assistant.slice(0, 1400),
    importance: Math.min(1, Math.round(importance * 1000) / 1000),
    emotionalSalience: Math.min(1, Math.round(emotionalSalience * 1000) / 1000),
    resonance: Math.min(1, Math.round(resonance * 1000) / 1000),
    bond: Math.min(1, Math.round(bond * 1000) / 1000),
    tags
  };
}

/**
 * @param {unknown[]} turns — rhizohWeightedTurns
 * @param {{ windowMs?: number, minCluster?: number }} [opts]
 * @returns {Array<Record<string, unknown>>}
 */
export function buildMemoryEpisodesFromTurns(turns, opts = {}) {
  const windowMs = Number(opts.windowMs) > 0 ? Number(opts.windowMs) : DEFAULT_WINDOW_MS;
  const minCluster = Number(opts.minCluster) > 0 ? Number(opts.minCluster) : MIN_CLUSTER;
  if (!Array.isArray(turns) || turns.length < minCluster) return [];

  const sorted = [...turns]
    .filter((t) => t && typeof t === "object" && Number.isFinite(t.ts))
    .sort((x, y) => Number(x.ts) - Number(y.ts));

  const episodes = [];
  let cluster = [];

  const flush = () => {
    if (cluster.length >= minCluster) episodes.push(mergeCluster(cluster));
    cluster = [];
  };

  for (const t of sorted) {
    if (!cluster.length) {
      cluster.push(t);
      continue;
    }
    const last = cluster[cluster.length - 1];
    const sameIntent = String(t.intent || "") === String(last.intent || "");
    const dt = Number(t.ts) - Number(last.ts);
    if (sameIntent && dt >= 0 && dt <= windowMs) cluster.push(t);
    else {
      flush();
      cluster = [t];
    }
  }
  flush();

  return episodes.slice(-MAX_EPISODES);
}
