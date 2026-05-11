/**
 * RHIZOH cluster θ sync — multi-node constitution alignment (same law, shared θ consensus).
 * Does not imply Byzantine consensus; use for gossip / coordinator merges only.
 */

export const RHIZOH_CLUSTER_THETA_SYNC_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @typedef {'mean' | 'max' | 'min' | 'median' | 'conservative_max'} RhizohClusterThetaSyncPolicy
 */

/**
 * @param {{
 *   localTheta: number,
 *   peerThetas: ReadonlyArray<number>,
 *   policy?: RhizohClusterThetaSyncPolicy,
 * }} p
 */
export function syncRhizohClusterTheta(p) {
  const policy = p.policy || "mean";
  const local = clamp01(p.localTheta);
  const peers = (p.peerThetas || []).map(clamp01).filter((x) => Number.isFinite(x));
  const all = [local, ...peers];

  let synced = local;
  if (policy === "mean") {
    synced = all.reduce((a, b) => a + b, 0) / all.length;
  } else if (policy === "max") {
    synced = Math.max(...all);
  } else if (policy === "min") {
    synced = Math.min(...all);
  } else if (policy === "median") {
    const s = [...all].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    synced = s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  } else if (policy === "conservative_max") {
    synced = Math.max(...all);
  }

  synced = Math.round(clamp01(synced) * 10000) / 10000;
  const dispersion =
    all.length > 1
      ? Math.round(
          Math.sqrt(all.reduce((acc, x) => acc + (x - synced) * (x - synced), 0) / all.length) * 10000
        ) / 10000
      : 0;

  return {
    syncedTheta: synced,
    policy,
    peerCount: peers.length,
    dispersion,
    inputs: { localTheta: local, peerThetas: peers }
  };
}

/**
 * Stable fingerprint for replay packages across nodes (not cryptographic hash).
 * @param {{
 *   thetas: ReadonlyArray<number>,
 *   constitutionVersions?: Record<string, string>
 * }} p
 */
export function computeRhizohClusterConstitutionFingerprint(p) {
  const vers = p.constitutionVersions && typeof p.constitutionVersions === "object" ? p.constitutionVersions : {};
  const keys = Object.keys(vers).sort();
  const vPart = keys.map((k) => `${k}:${vers[k]}`).join("|");
  const tPart = [...p.thetas].map(clamp01).sort((a, b) => a - b).map((x) => x.toFixed(4)).join(",");
  const raw = `θ-sync:v1|${vPart}|θ:[${tPart}]`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = Math.imul(h, 33) ^ raw.charCodeAt(i);
  return {
    fingerprint: `ccf_${(h >>> 0).toString(16)}`,
    canonical: raw
  };
}
