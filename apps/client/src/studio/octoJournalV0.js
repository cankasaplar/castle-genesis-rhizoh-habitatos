/**
 * Octo Journal v0 — Katman 2: dünya gözlem defteri (hafıza değil).
 * Octo kullanıcıyı değil; geometri, renk, örüntü ve kalış süresini kaydeder.
 * @see octoReactionEcologyV0.js
 */

import { OCTO_BEHAVIOR_V0 } from "./octoReactionEcologyV0.js";

export const OCTO_JOURNAL_SCHEMA_V0 = "castle.octo_journal.v0";
export const OCTO_JOURNAL_TICK_SCHEMA_V0 = "castle.octo_journal_tick.v0";

export const OCTO_GEOMETRY_KIND_V0 = Object.freeze({
  SPIRAL: "spiral",
  BRANCHING: "branching",
  SPIKE: "spike",
  STRETCH: "stretch",
  NEUTRAL: "neutral"
});

export const OCTO_GEOMETRY_KIND_LIST_V0 = Object.freeze([
  OCTO_GEOMETRY_KIND_V0.SPIRAL,
  OCTO_GEOMETRY_KIND_V0.BRANCHING,
  OCTO_GEOMETRY_KIND_V0.SPIKE,
  OCTO_GEOMETRY_KIND_V0.STRETCH,
  OCTO_GEOMETRY_KIND_V0.NEUTRAL
]);

/** Cube-attentive behaviors accrue dwell time. */
export const OCTO_JOURNAL_DWELL_WEIGHT_V0 = Object.freeze({
  [OCTO_BEHAVIOR_V0.LOOK]: 1,
  [OCTO_BEHAVIOR_V0.APPROACH]: 0.88,
  [OCTO_BEHAVIOR_V0.TOUCH]: 1.15,
  [OCTO_BEHAVIOR_V0.WAIT]: 0.58,
  [OCTO_BEHAVIOR_V0.RETREAT]: 0,
  [OCTO_BEHAVIOR_V0.SLEEP]: 0
});

const JOURNAL_ENTRY_LIMIT_V0 = 24;

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function readTopology(engine) {
  const current = engine?.currentTopology ?? {};
  const target = engine?.targetTopology ?? {};
  return {
    twist: Math.max(current.twist ?? 0, target.twist ?? 0),
    fold: Math.max(current.fold ?? 0, target.fold ?? 0),
    spikes: Math.max(current.spikes ?? 0, target.spikes ?? 0),
    stretchY: Math.max(current.stretchY ?? 1, target.stretchY ?? 1)
  };
}

/**
 * @param {{ base?: number, rgb?: { r: number, g: number, b: number } }} palette
 */
export function formatCubeColorKeyV0(palette) {
  const rgb = palette?.rgb;
  if (rgb && Number.isFinite(rgb.r) && Number.isFinite(rgb.g) && Number.isFinite(rgb.b)) {
    const hex = (channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0");
    return `#${hex(rgb.r)}${hex(rgb.g)}${hex(rgb.b)}`;
  }
  const base = Number(palette?.base ?? 0) & 0xffffff;
  return `#${base.toString(16).padStart(6, "0")}`;
}

/**
 * Topology → Octo'nun dünya dili (kullanıcı konusu değil).
 * @param {{ twist?: number, fold?: number, spikes?: number, stretchY?: number }} topology
 */
export function classifyCubeGeometryV0(topology = {}) {
  const twist = topology.twist ?? 0;
  const fold = topology.fold ?? 0;
  const spikes = topology.spikes ?? 0;
  const stretch = Math.max(0, (topology.stretchY ?? 1) - 1);

  const ranked = [
    { kind: OCTO_GEOMETRY_KIND_V0.SPIRAL, score: twist },
    { kind: OCTO_GEOMETRY_KIND_V0.BRANCHING, score: fold * 0.92 + twist * 0.28 },
    { kind: OCTO_GEOMETRY_KIND_V0.SPIKE, score: spikes },
    { kind: OCTO_GEOMETRY_KIND_V0.STRETCH, score: stretch }
  ].sort((a, b) => b.score - a.score);

  const primary = ranked[0];
  const secondary = ranked[1];
  const primaryKind = primary.score > 0.14 ? primary.kind : OCTO_GEOMETRY_KIND_V0.NEUTRAL;
  const nodePattern =
    secondary.score > 0.18 && secondary.kind !== primaryKind ? secondary.kind : primaryKind;

  return Object.freeze({
    geometry: primaryKind,
    nodePattern,
    scores: Object.freeze({
      spiral: twist,
      branching: fold * 0.92 + twist * 0.28,
      spike: spikes,
      stretch
    })
  });
}

/**
 * @param {object} [seed]
 */
export function createOctoJournalV0(seed = {}) {
  const nowMs = Date.now();
  return {
    schema: OCTO_JOURNAL_SCHEMA_V0,
    favoriteGeometries: { ...(seed.favoriteGeometries ?? {}) },
    favoriteColors: { ...(seed.favoriteColors ?? {}) },
    visitedShapes: { ...(seed.visitedShapes ?? {}) },
    totalDwellTimeMs: Math.max(0, Number(seed.totalDwellTimeMs) || 0),
    lastGeometryKey: seed.lastGeometryKey ?? null,
    lastColorKey: seed.lastColorKey ?? null,
    lastShapeKey: seed.lastShapeKey ?? null,
    lastObservationAtMs: seed.lastObservationAtMs ?? nowMs,
    observationCount: Math.max(0, Number(seed.observationCount) || 0),
    observationReports: Array.isArray(seed.observationReports) ? [...seed.observationReports] : [],
    discoveryEmitted: { ...(seed.discoveryEmitted ?? {}) }
  };
}

/**
 * @param {Record<string, { key: string, visits: number, dwellTimeMs: number, curiosityScore: number, lastSeenAtMs: number }>} store
 * @param {string} key
 * @param {{ nowMs: number, deltaMs: number, visit: boolean, curiosityDelta: number }} patch
 */
function upsertJournalEntryV0(store, key, patch) {
  if (!key) return null;
  const prev = store[key];
  const entry = prev
    ? { ...prev }
    : {
        key,
        visits: 0,
        dwellTimeMs: 0,
        curiosityScore: 0,
        lastSeenAtMs: patch.nowMs
      };

  if (patch.visit) entry.visits += 1;
  entry.dwellTimeMs += Math.max(0, patch.deltaMs);
  entry.curiosityScore = clamp01(entry.curiosityScore * 0.96 + patch.curiosityDelta);
  entry.lastSeenAtMs = patch.nowMs;
  store[key] = entry;
  return entry;
}

/**
 * @param {ReturnType<typeof createOctoJournalV0>} journal
 * @param {Record<string, object>} store
 * @param {string} sortKey
 */
function rankJournalEntriesV0(store, sortKey = "dwellTimeMs") {
  return Object.values(store)
    .sort((a, b) => {
      const primary = (b[sortKey] ?? 0) - (a[sortKey] ?? 0);
      if (primary !== 0) return primary;
      return (b.visits ?? 0) - (a.visits ?? 0);
    })
    .slice(0, JOURNAL_ENTRY_LIMIT_V0);
}

/**
 * @param {ReturnType<typeof createOctoJournalV0>} journal
 */
export function snapshotOctoJournalV0(journal) {
  return Object.freeze({
    schema: OCTO_JOURNAL_SCHEMA_V0,
    favoriteGeometries: Object.freeze(rankJournalEntriesV0(journal.favoriteGeometries)),
    favoriteColors: Object.freeze(rankJournalEntriesV0(journal.favoriteColors)),
    visitedShapes: Object.freeze(rankJournalEntriesV0(journal.visitedShapes, "visits")),
    totalDwellTimeMs: journal.totalDwellTimeMs,
    observationCount: journal.observationCount,
    lastObservationAtMs: journal.lastObservationAtMs,
    observationReports: Object.freeze(journal.observationReports.slice(-16))
  });
}

/**
 * @param {ReturnType<typeof createOctoJournalV0>} journal
 */
export function resolveOctoJournalTopGeometryV0(journal) {
  const [top] = rankJournalEntriesV0(journal.favoriteGeometries);
  return top ?? null;
}

/**
 * Ecology tick + cube engine + palette → journal kaydı.
 * @param {ReturnType<typeof createOctoJournalV0>} journal
 * @param {ReturnType<typeof import("./octoReactionEcologyV0.js").stepOctoReactionEcologyV0>} ecologyTick
 * @param {ReturnType<typeof import("./octoCognitiveGeometryCompilerV1.js").createCognitiveGeometryEngineV1>} engine
 * @param {{ base?: number, rgb?: { r: number, g: number, b: number } }} [palette]
 * @param {{ nowMs?: number, deltaMs?: number }} [opts]
 */
export function stepOctoJournalV0(journal, ecologyTick, engine, palette = null, opts = {}) {
  const nowMs = opts.nowMs ?? Date.now();
  const deltaMs = Math.max(0, Number(opts.deltaMs) || 0);
  const intent = ecologyTick?.intent;
  const signal = ecologyTick?.signal;
  const behavior = intent?.behavior ?? OCTO_BEHAVIOR_V0.WAIT;
  const dwellWeight = OCTO_JOURNAL_DWELL_WEIGHT_V0[behavior] ?? 0;

  const classified = classifyCubeGeometryV0(readTopology(engine));
  const geometryKey = classified.geometry;
  const shapeKey = classified.nodePattern;
  const colorKey = palette ? formatCubeColorKeyV0(palette) : journal.lastColorKey;

  const curiosityDelta = clamp01(
    (ecologyTick?.ecology?.interest ?? 0) * 0.45 +
      (intent?.confidence ?? 0) * 0.35 +
      (signal?.cubeNovelty ?? 0) * 0.2
  );
  const weightedDwellMs = deltaMs * dwellWeight;

  const geometryVisit = geometryKey !== journal.lastGeometryKey;
  const shapeVisit = shapeKey !== journal.lastShapeKey;
  const colorVisit = colorKey && colorKey !== journal.lastColorKey;

  if (weightedDwellMs > 0 || geometryVisit || shapeVisit || colorVisit) {
    journal.observationCount += 1;
    journal.lastObservationAtMs = nowMs;
  }

  const geometryEntry = upsertJournalEntryV0(journal.favoriteGeometries, geometryKey, {
    nowMs,
    deltaMs: weightedDwellMs,
    visit: geometryVisit,
    curiosityDelta: geometryVisit ? curiosityDelta : curiosityDelta * 0.35
  });

  const shapeEntry = upsertJournalEntryV0(journal.visitedShapes, shapeKey, {
    nowMs,
    deltaMs: weightedDwellMs * 0.65,
    visit: shapeVisit,
    curiosityDelta: shapeVisit ? curiosityDelta * 0.8 : curiosityDelta * 0.2
  });

  let colorEntry = null;
  if (colorKey) {
    colorEntry = upsertJournalEntryV0(journal.favoriteColors, colorKey, {
      nowMs,
      deltaMs: weightedDwellMs * 0.42,
      visit: colorVisit,
      curiosityDelta: colorVisit ? curiosityDelta * 0.55 : curiosityDelta * 0.15
    });
    journal.lastColorKey = colorKey;
  }

  journal.totalDwellTimeMs += weightedDwellMs;
  journal.lastGeometryKey = geometryKey;
  journal.lastShapeKey = shapeKey;

  return Object.freeze({
    schema: OCTO_JOURNAL_TICK_SCHEMA_V0,
    geometry: geometryKey,
    nodePattern: shapeKey,
    color: colorKey,
    behavior,
    dwellMs: weightedDwellMs,
    geometryEntry,
    shapeEntry,
    colorEntry,
    snapshot: snapshotOctoJournalV0(journal)
  });
}
