/**
 * Octo Observation Report v0 — Sprint D: keşif (discovery), olay değil.
 * Octo görür, dolaşır, ilgilenir, raporlar. Kullanıcıyı yorumlamaz.
 * Rhizoh observationInbox'a biriktirir; Sprint E soft coupling ayrı adımda.
 * @see octoJournalV0.js · rhizohMemoryV0.js
 */

import { OCTO_GEOMETRY_KIND_V0 } from "./octoJournalV0.js";
import { auditCubeTopologyOwnershipV0 } from "./cubeTopologyOwnershipInvariantV0.js";
import {
  OBSERVER_SPECIES_OCTO_V1,
  resolveObserverSpeciesV0
} from "./observerSpeciesRegistryV0.js";
import { computeRegimeDistanceFromLastCheckpointV0 } from "./regimeDistanceMetricV0.js";

export const OCTO_OBSERVATION_REPORT_SCHEMA_V0 = "castle.octo_observation_report.v0";
export const OCTO_OBSERVATION_DISCOVERY_TICK_SCHEMA_V0 = "castle.octo_observation_discovery_tick.v0";

export const OCTO_DISCOVERY_MIN_VISITS_V0 = 5;
export const OCTO_DISCOVERY_MIN_CONFIDENCE_V0 = 0.6;
export const OCTO_DISCOVERY_REEMIT_CONFIDENCE_DELTA_V0 = 0.12;

/** Sprint E adayı — düşük confidence + yüksek çeşitlilik için merak drift. Henüz kapalı. */
export const OCTO_NOISE_CURIOSITY_FLOOR_V0 = 0.28;

export const COMPANION_BASELINE_SCHEMA_V0 = "castle.companion_baseline.v0";
export const COMPANION_BASELINE_WINDOW_V0 = 48;
/** Üzerinde rejim geçişi adayı sayılır (E öncesi gözlem eşiği). */
export const COMPANION_BASELINE_REGIME_DRIFT_V0 = 0.18;

const UNACK_MIN_VISITS_V0 = 2;
const UNACK_MIN_DWELL_MS_V0 = 2500;
const UNACK_PATTERN_LIMIT_V0 = 12;

const WORLD_GEOMETRY_KINDS_V0 = new Set([
  OCTO_GEOMETRY_KIND_V0.SPIRAL,
  OCTO_GEOMETRY_KIND_V0.BRANCHING,
  OCTO_GEOMETRY_KIND_V0.SPIKE,
  OCTO_GEOMETRY_KIND_V0.STRETCH
]);

const FORBIDDEN_OBSERVATION_RE_V0 =
  /user_|prefers_|personality|topic_|basketball|map_topic|likes_|_seen$/i;

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {{ dwellTimeMs?: number, visits?: number, lastSeenAtMs?: number, curiosityScore?: number }} entry
 * @param {number} nowMs
 */
export function computeOctoDiscoveryConfidenceV0(entry, nowMs = Date.now()) {
  const dwellWeight = clamp01((entry?.dwellTimeMs ?? 0) / 28000);
  const visitFrequency = clamp01((entry?.visits ?? 0) / 12);
  const ageMs = Math.max(0, nowMs - (entry?.lastSeenAtMs ?? nowMs));
  const recency = clamp01(1 - ageMs / (12 * 60 * 1000));
  const curiosity = clamp01(entry?.curiosityScore ?? 0);

  const core = dwellWeight * visitFrequency * Math.max(0.32, recency);
  return clamp01(core * 0.88 + curiosity * 0.12);
}

/**
 * @param {string} kind
 * @param {{ visits?: number, dwellTimeMs?: number }} entry
 */
export function buildOctoDiscoveryObservationV0(kind, entry) {
  const key = String(kind || "").trim().toLowerCase();
  if (!key || key === OCTO_GEOMETRY_KIND_V0.NEUTRAL) return null;

  const visits = entry?.visits ?? 0;
  const dwell = entry?.dwellTimeMs ?? 0;

  if (visits >= 8 && dwell >= 18000) {
    return `persistent_interest_in_${key}`;
  }
  if (visits >= 6 && dwell >= 12000) {
    return `persistent_${key}_interest`;
  }
  return `${key}_geometry_engagement`;
}

/**
 * @param {string} observation
 */
export function assertOctoWorldObservationV0(observation) {
  const text = String(observation || "").trim();
  if (!text) return false;
  if (FORBIDDEN_OBSERVATION_RE_V0.test(text)) return false;
  return true;
}

/**
 * @param {import("./octoJournalV0.js").ReturnType<typeof import("./octoJournalV0.js").createOctoJournalV0>} journal
 * @param {string} storeName
 * @param {string} kind
 * @param {{ key: string, visits: number, dwellTimeMs: number, curiosityScore: number, lastSeenAtMs: number }} entry
 * @param {number} nowMs
 */
function tryDiscoverFromJournalEntryV0(journal, storeName, kind, entry, nowMs) {
  if (!WORLD_GEOMETRY_KINDS_V0.has(kind)) return null;

  const visits = entry?.visits ?? 0;
  const confidence = computeOctoDiscoveryConfidenceV0(entry, nowMs);
  if (visits < OCTO_DISCOVERY_MIN_VISITS_V0 || confidence < OCTO_DISCOVERY_MIN_CONFIDENCE_V0) {
    return null;
  }

  const observation = buildOctoDiscoveryObservationV0(kind, entry);
  if (!observation || !assertOctoWorldObservationV0(observation)) return null;

  const discoveryKey = `${storeName}::${observation}`;
  const prev = journal.discoveryEmitted?.[discoveryKey];
  if (prev && confidence < prev.confidence + OCTO_DISCOVERY_REEMIT_CONFIDENCE_DELTA_V0) {
    return null;
  }

  const report = Object.freeze({
    schema: OCTO_OBSERVATION_REPORT_SCHEMA_V0,
    source: "octo",
    observation,
    confidence,
    geometry: kind,
    visits,
    dwellTimeMs: entry.dwellTimeMs ?? 0,
    curiosityScore: clamp01(entry.curiosityScore ?? 0),
    atMs: nowMs
  });

  if (!journal.discoveryEmitted) journal.discoveryEmitted = {};
  journal.discoveryEmitted[discoveryKey] = { atMs: nowMs, confidence };
  journal.observationReports.push(report);
  if (journal.observationReports.length > 24) {
    journal.observationReports.splice(0, journal.observationReports.length - 24);
  }

  return report;
}

/**
 * Journal snapshot → keşif raporu (threshold + dedupe).
 * @param {import("./octoJournalV0.js").ReturnType<typeof import("./octoJournalV0.js").createOctoJournalV0>} journal
 * @param {number} [nowMs]
 */
export function discoverOctoObservationReportsV0(journal, nowMs = Date.now()) {
  /** @type {ReturnType<typeof tryDiscoverFromJournalEntryV0>[]} */
  const reports = [];

  for (const entry of Object.values(journal.favoriteGeometries ?? {})) {
    const report = tryDiscoverFromJournalEntryV0(
      journal,
      "geometry",
      entry.key,
      entry,
      nowMs
    );
    if (report) reports.push(report);
  }

  for (const entry of Object.values(journal.visitedShapes ?? {})) {
    if (journal.favoriteGeometries?.[entry.key]) continue;
    const report = tryDiscoverFromJournalEntryV0(
      journal,
      "shape",
      entry.key,
      entry,
      nowMs
    );
    if (report) reports.push(report);
  }

  return Object.freeze(reports);
}

/**
 * @param {import("./octoJournalV0.js").ReturnType<typeof import("./octoJournalV0.js").createOctoJournalV0>} journal
 * @param {string} storeName
 * @param {string} kind
 * @param {{ key: string, visits: number, dwellTimeMs: number, curiosityScore: number, lastSeenAtMs: number }} entry
 * @param {number} nowMs
 */
function resolveUnacknowledgedPatternV0(journal, storeName, kind, entry, nowMs) {
  if (!WORLD_GEOMETRY_KINDS_V0.has(kind)) return null;

  const visits = entry?.visits ?? 0;
  const dwellTimeMs = entry?.dwellTimeMs ?? 0;
  if (visits < UNACK_MIN_VISITS_V0 && dwellTimeMs < UNACK_MIN_DWELL_MS_V0) return null;

  const confidence = computeOctoDiscoveryConfidenceV0(entry, nowMs);
  const candidateObservation = buildOctoDiscoveryObservationV0(kind, entry);
  if (!candidateObservation || !assertOctoWorldObservationV0(candidateObservation)) return null;

  const discoveryKey = `${storeName}::${candidateObservation}`;
  if (journal.discoveryEmitted?.[discoveryKey]) return null;

  let blockReason = "forming";
  if (visits < OCTO_DISCOVERY_MIN_VISITS_V0) blockReason = "below_visit_threshold";
  else if (confidence < OCTO_DISCOVERY_MIN_CONFIDENCE_V0) blockReason = "below_confidence_threshold";
  else blockReason = "awaiting_reemit_delta";

  return Object.freeze({
    geometry: kind,
    visits,
    dwellTimeMs,
    confidence,
    curiosityScore: clamp01(entry.curiosityScore ?? 0),
    blockReason,
    candidateObservation
  });
}

/**
 * Octo görüp henüz raporlamadığı dünya sinyalleri — karakter burada gizlenir.
 * @param {import("./octoJournalV0.js").ReturnType<typeof import("./octoJournalV0.js").createOctoJournalV0>} journal
 * @param {number} [nowMs]
 */
export function discoverOctoUnacknowledgedPatternsV0(journal, nowMs = Date.now()) {
  /** @type {ReturnType<typeof resolveUnacknowledgedPatternV0>[]} */
  const patterns = [];

  for (const entry of Object.values(journal.favoriteGeometries ?? {})) {
    const row = resolveUnacknowledgedPatternV0(journal, "geometry", entry.key, entry, nowMs);
    if (row) patterns.push(row);
  }

  for (const entry of Object.values(journal.visitedShapes ?? {})) {
    if (journal.favoriteGeometries?.[entry.key]) continue;
    const row = resolveUnacknowledgedPatternV0(journal, "shape", entry.key, entry, nowMs);
    if (row) patterns.push(row);
  }

  patterns.sort((a, b) => b.confidence - a.confidence || b.visits - a.visits);

  const diversityCount = patterns.filter((p) => p.visits >= UNACK_MIN_VISITS_V0).length;
  const diversitySignal =
    diversityCount >= 3 &&
    patterns.every((p) => p.blockReason !== "awaiting_reemit_delta");

  return Object.freeze({
    patterns: Object.freeze(patterns.slice(0, UNACK_PATTERN_LIMIT_V0)),
    diversitySignal,
    diversityCount,
    noiseCuriosityFloor: OCTO_NOISE_CURIOSITY_FLOOR_V0
  });
}

/**
 * Keşif Octo'dan mı geliyor, Rhizoh itiyor mu?
 * explorationIntegrityScore ≈ novelty / (novelty + rhizohInfluence)
 * @param {{
 *   cubeNovelty?: number,
 *   ecologyInterest?: number,
 *   attentionHintBias?: number,
 *   attentionFieldMatch?: number,
 *   journalCuriosity?: number,
 *   inboxSize?: number
 * }} ctx
 */
export function computeExplorationIntegrityV0(ctx = {}) {
  const cubeNovelty = clamp01(ctx.cubeNovelty ?? 0);
  const ecologyInterest = clamp01(ctx.ecologyInterest ?? 0);
  const attentionHintBias = clamp01(ctx.attentionHintBias ?? 0);
  const attentionFieldMatch = clamp01(ctx.attentionFieldMatch ?? 0);
  const journalCuriosity = clamp01(ctx.journalCuriosity ?? 0);
  const inboxPressure = clamp01((ctx.inboxSize ?? 0) / 14);

  const noveltyContribution = clamp01(
    cubeNovelty * 0.44 +
      journalCuriosity * 0.28 +
      Math.max(0, ecologyInterest - attentionHintBias) * 0.28
  );

  const rhizohInfluenceFactor = clamp01(
    attentionHintBias * 0.52 + attentionFieldMatch * 0.34 + inboxPressure * 0.08
  );

  const explorationIntegrityScore = clamp01(
    noveltyContribution / Math.max(0.05, noveltyContribution + rhizohInfluenceFactor)
  );

  return Object.freeze({
    explorationIntegrityScore,
    noveltyContribution,
    rhizohInfluenceFactor,
    ledBy:
      explorationIntegrityScore >= 0.72
        ? "octo"
        : explorationIntegrityScore >= 0.45
          ? "mixed"
          : "rhizoh"
  });
}

/**
 * @param {object} [seed]
 */
export function createCompanionBaselineV0(seed = {}) {
  const samples = Array.isArray(seed.integritySamples)
    ? seed.integritySamples.map((v) => clamp01(v)).slice(-COMPANION_BASELINE_WINDOW_V0)
    : [];
  const rollingIntegrityMean =
    samples.length > 0
      ? samples.reduce((sum, value) => sum + value, 0) / samples.length
      : clamp01(seed.rollingIntegrityMean ?? 0.5);

  return {
    schema: COMPANION_BASELINE_SCHEMA_V0,
    integritySamples: samples,
    rollingIntegrityMean
  };
}

/**
 * @param {ReturnType<typeof createCompanionBaselineV0>} baseline
 * @param {number} explorationIntegrityScore
 * @param {{ windowSize?: number, minSamplesForRegime?: number }} [opts]
 */
export function stepCompanionBaselineV0(baseline, explorationIntegrityScore, opts = {}) {
  const score = clamp01(explorationIntegrityScore);
  const windowSize = opts.windowSize ?? COMPANION_BASELINE_WINDOW_V0;
  const minSamples = opts.minSamplesForRegime ?? 8;

  baseline.integritySamples.push(score);
  if (baseline.integritySamples.length > windowSize) {
    baseline.integritySamples.shift();
  }

  const rollingIntegrityMean =
    baseline.integritySamples.reduce((sum, value) => sum + value, 0) /
    baseline.integritySamples.length;
  baseline.rollingIntegrityMean = rollingIntegrityMean;

  const baselineDriftIndex = Math.abs(score - rollingIntegrityMean);
  const regimeShift =
    baseline.integritySamples.length >= minSamples &&
    baselineDriftIndex >= COMPANION_BASELINE_REGIME_DRIFT_V0;

  return Object.freeze({
    baselineDriftIndex,
    rollingIntegrityMean,
    currentIntegrity: score,
    sampleCount: baseline.integritySamples.length,
    regimeShift,
    stable: baselineDriftIndex < COMPANION_BASELINE_REGIME_DRIFT_V0 * 0.55
  });
}

function resolveTopJournalCuriosityV0(journal) {
  let top = 0;
  for (const entry of Object.values(journal.favoriteGeometries ?? {})) {
    top = Math.max(top, clamp01(entry?.curiosityScore ?? 0));
  }
  return top;
}

/**
 * Studio gözlemi — çift kanal snapshot (inbox + attentionField + integrity).
 * @param {import("./octoJournalV0.js").ReturnType<typeof import("./octoJournalV0.js").createOctoJournalV0>} journal
 * @param {import("./rhizohMemoryV0.js").ReturnType<typeof import("./rhizohMemoryV0.js").createRhizohMemoryV0>} memory
 * @param {number} [nowMs]
 * @param {{
 *   ecologyTick?: ReturnType<typeof import("./octoReactionEcologyV0.js").stepOctoReactionEcologyV0>,
 *   attentionHintBias?: number,
 *   geometryKind?: string,
 *   baseline?: ReturnType<typeof createCompanionBaselineV0>,
 *   engine?: ReturnType<typeof import("./octoCognitiveGeometryCompilerV1.js").createCognitiveGeometryEngineV1>,
 *   observerSpeciesId?: string
 * }} [ctx]
 */
export function snapshotCompanionObservabilityV0(journal, memory, nowMs = Date.now(), ctx = {}) {
  const inboxCouplingTick = ctx.inboxCouplingTick ?? null;
  const softInboxCoupling = inboxCouplingTick?.enabled === true;
  const unacknowledged = discoverOctoUnacknowledgedPatternsV0(journal, nowMs);
  const geometryKind = String(ctx.geometryKind || "").toLowerCase();
  const attentionFieldMatch = clamp01(memory.attentionField?.[geometryKind] ?? 0);

  const explorationIntegrity = computeExplorationIntegrityV0({
    cubeNovelty: ctx.ecologyTick?.signal?.cubeNovelty,
    ecologyInterest: ctx.ecologyTick?.ecology?.interest,
    attentionHintBias: ctx.attentionHintBias,
    attentionFieldMatch,
    journalCuriosity: resolveTopJournalCuriosityV0(journal),
    inboxSize: memory.observationInbox.length
  });

  const baselineDrift = ctx.baseline
    ? stepCompanionBaselineV0(ctx.baseline, explorationIntegrity.explorationIntegrityScore)
    : null;

  const topologyOwnership = ctx.engine ? auditCubeTopologyOwnershipV0(ctx.engine) : null;
  const softInboxCouplingFlag = softInboxCoupling;
  const passiveCouplingFlag = !softInboxCoupling;
  const observationInboxSlice = memory.observationInbox.slice(-16);

  const regimeDistanceFromLastCheckpoint = computeRegimeDistanceFromLastCheckpointV0({
    explorationIntegrity,
    softInboxCoupling: softInboxCouplingFlag,
    passiveCoupling: passiveCouplingFlag,
    topologyOwnership,
    observationInbox: observationInboxSlice,
    unacknowledgedPatterns: unacknowledged.patterns
  });

  return Object.freeze({
    attentionField: Object.freeze({ ...memory.attentionField }),
    observationInbox: Object.freeze(memory.observationInbox.slice(-16)),
    observationReports: Object.freeze(journal.observationReports.slice(-8)),
    unacknowledgedPatterns: unacknowledged.patterns,
    diversitySignal: unacknowledged.diversitySignal,
    diversityCount: unacknowledged.diversityCount,
    explorationIntegrity: Object.freeze({
      ...explorationIntegrity,
      baselineDriftIndex: baselineDrift?.baselineDriftIndex ?? null,
      rollingIntegrityMean: baselineDrift?.rollingIntegrityMean ?? null,
      regimeShift: baselineDrift?.regimeShift ?? false,
      stable: baselineDrift?.stable ?? null
    }),
    baseline: baselineDrift,
    passiveCoupling: !softInboxCoupling,
    softInboxCoupling,
    inboxCouplingApplied: inboxCouplingTick?.applied ?? 0,
    lastInboxCouplings: Object.freeze((inboxCouplingTick?.deposits ?? []).slice(-4)),
    baselineRef: "docs/academic/companion-observation-baseline-v0-sprint-e-verified-staging.json",
    regimeCheckpointRef:
      "docs/academic/regime-checkpoints/sprint-e/companion-observation-sprint-e-regime-verified-checkpoint-v0.json",
    regimeDistanceFromLastCheckpoint,
    topologyOwnership,
    observerSpecies: resolveObserverSpeciesV0(ctx.observerSpeciesId ?? OBSERVER_SPECIES_OCTO_V1.id)
  });
}

/**
 * Sprint D — sadece inbox'a biriktir; attentionField / topic / behavior dokunma.
 * @param {import("./rhizohMemoryV0.js").ReturnType<typeof import("./rhizohMemoryV0.js").createRhizohMemoryV0>} memory
 * @param {ReturnType<typeof tryDiscoverFromJournalEntryV0>} report
 */
export function receiveOctoObservationInboxV0(memory, report) {
  if (!report?.observation) return null;

  const entry = Object.freeze({
    source: report.source ?? "octo",
    observation: report.observation,
    confidence: clamp01(report.confidence ?? 0),
    geometry: report.geometry ?? null,
    visits: report.visits ?? 0,
    dwellTimeMs: report.dwellTimeMs ?? 0,
    reportedAtMs: report.atMs ?? Date.now(),
    receivedAtMs: Date.now()
  });

  memory.observationInbox.push(entry);
  if (memory.observationInbox.length > 32) {
    memory.observationInbox.splice(0, memory.observationInbox.length - 32);
  }
  return entry;
}

/**
 * @param {import("./octoJournalV0.js").ReturnType<typeof import("./octoJournalV0.js").createOctoJournalV0>} journal
 * @param {import("./rhizohMemoryV0.js").ReturnType<typeof import("./rhizohMemoryV0.js").createRhizohMemoryV0>} memory
 * @param {{ nowMs?: number }} [opts]
 */
export function stepOctoObservationDiscoveryV0(journal, memory, opts = {}) {
  const nowMs = opts.nowMs ?? Date.now();
  const discovered = discoverOctoObservationReportsV0(journal, nowMs);

  /** @type {ReturnType<typeof receiveOctoObservationInboxV0>[]} */
  const inboxEntries = [];
  for (const report of discovered) {
    const received = receiveOctoObservationInboxV0(memory, report);
    if (received) inboxEntries.push(received);
  }

  const unacknowledged = discoverOctoUnacknowledgedPatternsV0(journal, nowMs);

  return Object.freeze({
    schema: OCTO_OBSERVATION_DISCOVERY_TICK_SCHEMA_V0,
    discovered: Object.freeze(discovered),
    inboxEntries: Object.freeze(inboxEntries),
    inboxSize: memory.observationInbox.length,
    unacknowledgedPatterns: unacknowledged.patterns,
    diversitySignal: unacknowledged.diversitySignal
  });
}
