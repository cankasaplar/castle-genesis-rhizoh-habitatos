/**
 * Feature-bag cluster memory — learns canonical intent from signal composition (not surface string).
 */

export const RHIZOH_CANONICAL_CLUSTER_MEMORY_SCHEMA_V1 =
  "castle.rhizoh.canonical_cluster_memory.v1";

const STORAGE_KEY_V1 = "rhizoh.canonical_cluster_memory.v1";
const MAX_CLUSTERS_V1 = 96;
const MIN_USES_TO_RECALL_V1 = 2;

/** @internal */
let memoryStoreV1 = null;

function emptyStoreV1() {
  return Object.freeze({
    schema: RHIZOH_CANONICAL_CLUSTER_MEMORY_SCHEMA_V1,
    clusters: Object.create(null)
  });
}

function readStoreV1() {
  if (memoryStoreV1) return memoryStoreV1;
  if (typeof window === "undefined") return emptyStoreV1();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V1);
    if (!raw) return emptyStoreV1();
    const parsed = JSON.parse(raw);
    if (!parsed?.clusters || typeof parsed.clusters !== "object") return emptyStoreV1();
    memoryStoreV1 = Object.freeze({
      schema: RHIZOH_CANONICAL_CLUSTER_MEMORY_SCHEMA_V1,
      clusters: parsed.clusters
    });
    return memoryStoreV1;
  } catch {
    return emptyStoreV1();
  }
}

function writeStoreV1(store) {
  memoryStoreV1 = store;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

/**
 * @param {{ features: Set<string>, entity?: string | null }} bag
 */
export function buildCanonicalFeatureSignatureV1(bag) {
  const parts = Array.from(bag.features || []).sort();
  if (bag.entity) parts.push(`entity:${bag.entity}`);
  return parts.join("|");
}

/**
 * @param {{ features: Set<string>, entity?: string | null }} bag
 * @param {string} canonicalIntent
 */
export function recordCanonicalClusterHitV1(bag, canonicalIntent) {
  const intent = String(canonicalIntent || "").trim();
  const signature = buildCanonicalFeatureSignatureV1(bag);
  if (!intent || !signature) return;

  const store = readStoreV1();
  const clusters = { ...store.clusters };
  const prev = clusters[signature];
  clusters[signature] = {
    canonicalIntent: intent,
    uses: Number(prev?.uses || 0) + 1,
    lastMs: Date.now()
  };

  const keys = Object.keys(clusters);
  if (keys.length > MAX_CLUSTERS_V1) {
    const sorted = keys
      .map((k) => ({ k, uses: clusters[k]?.uses || 0, lastMs: clusters[k]?.lastMs || 0 }))
      .sort((a, b) => b.uses - a.uses || b.lastMs - a.lastMs);
    const keep = new Set(sorted.slice(0, MAX_CLUSTERS_V1 - 8).map((x) => x.k));
    for (const k of keys) {
      if (!keep.has(k)) delete clusters[k];
    }
  }

  writeStoreV1(
    Object.freeze({
      schema: RHIZOH_CANONICAL_CLUSTER_MEMORY_SCHEMA_V1,
      clusters
    })
  );
}

/**
 * @param {{ features: Set<string>, entity?: string | null }} bag
 */
export function probeCanonicalClusterMemoryV1(bag) {
  const signature = buildCanonicalFeatureSignatureV1(bag);
  if (!signature) return null;
  const row = readStoreV1().clusters[signature];
  if (!row?.canonicalIntent || Number(row.uses) < MIN_USES_TO_RECALL_V1) return null;
  return Object.freeze({
    canonicalIntent: row.canonicalIntent,
    confidence: Math.min(0.88, 0.72 + Number(row.uses) * 0.04),
    clusterSignature: signature,
    clusterUses: Number(row.uses),
    fromClusterMemory: true
  });
}

/** @internal vitest */
export function clearCanonicalClusterMemoryForTestV1() {
  memoryStoreV1 = null;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY_V1);
    } catch {
      /* noop */
    }
  }
}
