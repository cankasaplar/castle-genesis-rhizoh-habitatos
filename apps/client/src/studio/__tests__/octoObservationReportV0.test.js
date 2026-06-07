import { describe, expect, it } from "vitest";
import {
  OCTO_DISCOVERY_MIN_CONFIDENCE_V0,
  OCTO_DISCOVERY_MIN_VISITS_V0,
  assertOctoWorldObservationV0,
  buildOctoDiscoveryObservationV0,
  computeOctoDiscoveryConfidenceV0,
  discoverOctoObservationReportsV0,
  COMPANION_BASELINE_REGIME_DRIFT_V0,
  computeExplorationIntegrityV0,
  createCompanionBaselineV0,
  discoverOctoUnacknowledgedPatternsV0,
  stepCompanionBaselineV0,
  receiveOctoObservationInboxV0,
  snapshotCompanionObservabilityV0,
  stepOctoObservationDiscoveryV0
} from "../octoObservationReportV0.js";
import { createOctoJournalV0 } from "../octoJournalV0.js";
import { createRhizohMemoryV0 } from "../rhizohMemoryV0.js";
import { depositRhizohAttentionFieldV0 } from "../rhizohAttentionFieldV0.js";
import { stepRhizohObservationInboxCouplingV0 } from "../rhizohObservationInboxCouplingV0.js";

const NOW = 1_700_000_000_000;

function seedSpiralJournal(overrides = {}) {
  const journal = createOctoJournalV0();
  journal.favoriteGeometries.spiral = {
    key: "spiral",
    visits: overrides.visits ?? 18,
    dwellTimeMs: overrides.dwellTimeMs ?? 42000,
    curiosityScore: overrides.curiosityScore ?? 0.74,
    lastSeenAtMs: overrides.lastSeenAtMs ?? NOW
  };
  return journal;
}

describe("octoObservationReportV0", () => {
  it("computes confidence from dwell, visits, and recency", () => {
    const confidence = computeOctoDiscoveryConfidenceV0(
      { visits: 18, dwellTimeMs: 42000, lastSeenAtMs: NOW - 1000, curiosityScore: 0.74 },
      NOW
    );
    expect(confidence).toBeGreaterThanOrEqual(OCTO_DISCOVERY_MIN_CONFIDENCE_V0);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  it("builds discovery observations not raw events", () => {
    expect(buildOctoDiscoveryObservationV0("spiral", { visits: 18, dwellTimeMs: 42000 })).toBe(
      "persistent_interest_in_spiral"
    );
    expect(buildOctoDiscoveryObservationV0("branching", { visits: 5, dwellTimeMs: 9000 })).toBe(
      "branching_geometry_engagement"
    );
    expect(assertOctoWorldObservationV0("spiral_seen")).toBe(false);
    expect(assertOctoWorldObservationV0("user_prefers_spiral_topics")).toBe(false);
  });

  it("does not emit below discovery threshold", () => {
    const journal = seedSpiralJournal({ visits: 3, dwellTimeMs: 4000 });
    const reports = discoverOctoObservationReportsV0(journal, NOW);
    expect(reports).toHaveLength(0);
  });

  it("emits discovery report when visits and confidence thresholds pass", () => {
    const journal = seedSpiralJournal();
    const [report] = discoverOctoObservationReportsV0(journal, NOW);

    expect(report.source).toBe("octo");
    expect(report.observation).toBe("persistent_interest_in_spiral");
    expect(report.confidence).toBeGreaterThanOrEqual(OCTO_DISCOVERY_MIN_CONFIDENCE_V0);
    expect(report.visits).toBeGreaterThanOrEqual(OCTO_DISCOVERY_MIN_VISITS_V0);
  });

  it("does not spam duplicate reports on repeated discovery passes", () => {
    const journal = seedSpiralJournal();
    const first = discoverOctoObservationReportsV0(journal, NOW);
    const second = discoverOctoObservationReportsV0(journal, NOW + 500);
    const third = discoverOctoObservationReportsV0(journal, NOW + 1000);

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
    expect(third).toHaveLength(0);
    expect(journal.observationReports).toHaveLength(1);
  });

  it("delivers reports to rhizoh observationInbox without side effects", () => {
    const journal = seedSpiralJournal();
    const memory = createRhizohMemoryV0();
    depositRhizohAttentionFieldV0(memory.attentionField, "spiral", 0.11);
    const fieldBefore = { ...memory.attentionField };
    const topicsBefore = { ...memory.topicSignals };

    const tick = stepOctoObservationDiscoveryV0(journal, memory, { nowMs: NOW });

    expect(tick.inboxEntries).toHaveLength(1);
    expect(memory.observationInbox[0].observation).toBe("persistent_interest_in_spiral");
    expect(memory.observationInbox[0].confidence).toBeGreaterThanOrEqual(0.6);
    expect(memory.attentionField).toEqual(fieldBefore);
    expect(memory.topicSignals).toEqual(topicsBefore);
  });

  it("rejects user-interpretation style observations", () => {
    expect(assertOctoWorldObservationV0("persistent_spiral_interest")).toBe(true);
    expect(assertOctoWorldObservationV0("user_likes_spiral")).toBe(false);
    expect(assertOctoWorldObservationV0("user_personality_explorer")).toBe(false);
  });

  it("surfaces unacknowledged patterns below discovery threshold", () => {
    const journal = createOctoJournalV0();
    journal.favoriteGeometries.spiral = {
      key: "spiral",
      visits: 3,
      dwellTimeMs: 9000,
      curiosityScore: 0.55,
      lastSeenAtMs: NOW
    };
    journal.favoriteGeometries.spike = {
      key: "spike",
      visits: 2,
      dwellTimeMs: 6000,
      curiosityScore: 0.48,
      lastSeenAtMs: NOW
    };

    const unack = discoverOctoUnacknowledgedPatternsV0(journal, NOW);
    expect(unack.patterns.length).toBeGreaterThan(0);
    expect(unack.patterns[0].blockReason).toBe("below_visit_threshold");
    expect(discoverOctoObservationReportsV0(journal, NOW)).toHaveLength(0);
  });

  it("flags diversity signal when many geometries form without report", () => {
    const journal = createOctoJournalV0();
    for (const key of ["spiral", "spike", "stretch"]) {
      journal.favoriteGeometries[key] = {
        key,
        visits: 3,
        dwellTimeMs: 7000,
        curiosityScore: 0.5,
        lastSeenAtMs: NOW
      };
    }

    const unack = discoverOctoUnacknowledgedPatternsV0(journal, NOW);
    expect(unack.diversitySignal).toBe(true);
    expect(unack.diversityCount).toBeGreaterThanOrEqual(3);
  });

  it("baselineDriftIndex stays low under stable integrity samples", () => {
    const baseline = createCompanionBaselineV0();
    for (let i = 0; i < 12; i += 1) {
      stepCompanionBaselineV0(baseline, 0.74);
    }
    const drift = stepCompanionBaselineV0(baseline, 0.76);
    expect(drift.baselineDriftIndex).toBeLessThan(0.05);
    expect(drift.stable).toBe(true);
    expect(drift.regimeShift).toBe(false);
  });

  it("baselineDriftIndex flags regime shift on integrity jump", () => {
    const baseline = createCompanionBaselineV0();
    for (let i = 0; i < 10; i += 1) {
      stepCompanionBaselineV0(baseline, 0.78);
    }
    const drift = stepCompanionBaselineV0(baseline, 0.38);
    expect(drift.baselineDriftIndex).toBeGreaterThan(COMPANION_BASELINE_REGIME_DRIFT_V0);
    expect(drift.regimeShift).toBe(true);
    expect(drift.stable).toBe(false);
  });

  it("explorationIntegrityScore rises when novelty dominates rhizoh influence", () => {
    const octoLed = computeExplorationIntegrityV0({
      cubeNovelty: 0.82,
      ecologyInterest: 0.7,
      attentionHintBias: 0.04,
      attentionFieldMatch: 0.05,
      journalCuriosity: 0.65
    });
    const rhizohLed = computeExplorationIntegrityV0({
      cubeNovelty: 0.18,
      ecologyInterest: 0.42,
      attentionHintBias: 0.22,
      attentionFieldMatch: 0.36,
      journalCuriosity: 0.2
    });

    expect(octoLed.explorationIntegrityScore).toBeGreaterThan(0.7);
    expect(octoLed.ledBy).toBe("octo");
    expect(rhizohLed.explorationIntegrityScore).toBeLessThan(octoLed.explorationIntegrityScore);
    expect(rhizohLed.rhizohInfluenceFactor).toBeGreaterThan(octoLed.rhizohInfluenceFactor);
  });

  it("snapshot observability passive when inbox coupling disabled", () => {
    const journal = seedSpiralJournal();
    const memory = createRhizohMemoryV0();
    stepOctoObservationDiscoveryV0(journal, memory, { nowMs: NOW });

    const baseline = createCompanionBaselineV0();
    const snap = snapshotCompanionObservabilityV0(journal, memory, NOW, {
      ecologyTick: {
        signal: { cubeNovelty: 0.55 },
        ecology: { interest: 0.62 }
      },
      attentionHintBias: 0.08,
      geometryKind: "spiral",
      baseline,
      inboxCouplingTick: { enabled: false, applied: 0, deposits: [] }
    });
    expect(snap.passiveCoupling).toBe(true);
    expect(snap.softInboxCoupling).toBe(false);
    expect(snap.observationInbox.length).toBe(1);
    expect(snap.unacknowledgedPatterns).toBeDefined();
    expect(snap.explorationIntegrity.explorationIntegrityScore).toBeGreaterThan(0);
    expect(snap.explorationIntegrity.baselineDriftIndex).toBeGreaterThanOrEqual(0);
    expect(snap.baseline?.rollingIntegrityMean).toBeGreaterThan(0);
  });

  it("Sprint E soft coupling feeds attentionField once from inbox", () => {
    const journal = seedSpiralJournal();
    const memory = createRhizohMemoryV0();
    stepOctoObservationDiscoveryV0(journal, memory, { nowMs: NOW });
    const stretchBefore = memory.attentionField.spiral ?? 0;

    const coupling = stepRhizohObservationInboxCouplingV0(memory, { nowMs: NOW });
    const snap = snapshotCompanionObservabilityV0(journal, memory, NOW, {
      ecologyTick: { signal: { cubeNovelty: 0.5 }, ecology: { interest: 0.55 } },
      attentionHintBias: 0.06,
      geometryKind: "spiral",
      inboxCouplingTick: coupling
    });

    expect(coupling.applied).toBe(1);
    expect(memory.attentionField.spiral ?? 0).toBeGreaterThan(stretchBefore);
    expect(snap.passiveCoupling).toBe(false);
    expect(snap.softInboxCoupling).toBe(true);
    expect(snap.inboxCouplingApplied).toBe(1);
  });

  it("receiveOctoObservationInbox only appends to inbox", () => {
    const memory = createRhizohMemoryV0();
    const received = receiveOctoObservationInboxV0(memory, {
      source: "octo",
      observation: "spiral_geometry_engagement",
      confidence: 0.68,
      geometry: "spiral",
      visits: 7,
      dwellTimeMs: 15000,
      atMs: NOW
    });

    expect(received?.observation).toBe("spiral_geometry_engagement");
    expect(memory.observationInbox).toHaveLength(1);
  });
});
