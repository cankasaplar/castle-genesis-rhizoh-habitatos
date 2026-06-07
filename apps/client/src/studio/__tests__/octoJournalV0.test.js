import { describe, expect, it } from "vitest";
import {
  OCTO_GEOMETRY_KIND_V0,
  classifyCubeGeometryV0,
  createOctoJournalV0,
  formatCubeColorKeyV0,
  resolveOctoJournalTopGeometryV0,
  snapshotOctoJournalV0,
  stepOctoJournalV0
} from "../octoJournalV0.js";
import {
  OCTO_BEHAVIOR_V0,
  createOctoReactionEcologyV0,
  extractCubeObserveSignalV0,
  stepOctoReactionEcologyV0,
  thinkOctoReactionV0
} from "../octoReactionEcologyV0.js";
import { createCognitiveGeometryEngineV1, ingestCognitiveDraftV1 } from "../octoCognitiveGeometryCompilerV1.js";

function buildEcologyTick(engine, behavior, interest = 0.62) {
  const ecology = createOctoReactionEcologyV0({ interest, energy: 0.55 });
  const signal = extractCubeObserveSignalV0(engine, { nowMs: Date.now(), userEnergy: 0.2 });
  const intent = thinkOctoReactionV0(ecology, signal, () => 0.42);
  return {
    schema: "castle.octo_reaction_ecology_tick.v0",
    signal,
    intent: Object.freeze({ ...intent, behavior }),
    ecology: { interest, energy: 0.55, lastBehavior: behavior }
  };
}

describe("octoJournalV0", () => {
  it("classifies spiral geometry from high twist topology", () => {
    const classified = classifyCubeGeometryV0({ twist: 1.8, fold: 0.1, spikes: 0.05, stretchY: 1.05 });
    expect(classified.geometry).toBe(OCTO_GEOMETRY_KIND_V0.SPIRAL);
  });

  it("classifies branching from fold-heavy topology", () => {
    const classified = classifyCubeGeometryV0({ twist: 0.2, fold: 0.72, spikes: 0.1, stretchY: 1.02 });
    expect(classified.geometry).toBe(OCTO_GEOMETRY_KIND_V0.BRANCHING);
  });

  it("formats cube palette color as hex key", () => {
    expect(formatCubeColorKeyV0({ rgb: { r: 66, g: 217, b: 255 } })).toBe("#42d9ff");
    expect(formatCubeColorKeyV0({ base: 0x42d9ff })).toBe("#42d9ff");
  });

  it("records geometry visits and dwell time for attentive behaviors", () => {
    const journal = createOctoJournalV0();
    const engine = createCognitiveGeometryEngineV1(12);
    ingestCognitiveDraftV1(engine, "neden mantık çözüm");
    const palette = { rgb: { r: 66, g: 217, b: 255 } };

    const tick = buildEcologyTick(engine, OCTO_BEHAVIOR_V0.LOOK);
    stepOctoJournalV0(journal, tick, engine, palette, { nowMs: 1000, deltaMs: 500 });
    stepOctoJournalV0(journal, tick, engine, palette, { nowMs: 1500, deltaMs: 500 });

    const snap = snapshotOctoJournalV0(journal);
    expect(snap.favoriteGeometries.length).toBeGreaterThan(0);
    expect(snap.favoriteGeometries[0].visits).toBe(1);
    expect(snap.favoriteGeometries[0].dwellTimeMs).toBeGreaterThan(900);
    expect(snap.favoriteColors[0].key).toBe("#42d9ff");
    expect(snap.totalDwellTimeMs).toBeGreaterThan(900);
  });

  it("increments visits when geometry changes", () => {
    const journal = createOctoJournalV0();
    const engine = createCognitiveGeometryEngineV1(12);
    const palette = { base: 0x112233 };

    ingestCognitiveDraftV1(engine, "neden mantık");
    const reasoningTick = buildEcologyTick(engine, OCTO_BEHAVIOR_V0.APPROACH);
    stepOctoJournalV0(journal, reasoningTick, engine, palette, { deltaMs: 400 });

    ingestCognitiveDraftV1(engine, "korku tehlike kaç");
    const actionTick = buildEcologyTick(engine, OCTO_BEHAVIOR_V0.TOUCH);
    stepOctoJournalV0(journal, actionTick, engine, palette, { deltaMs: 400 });

    const top = resolveOctoJournalTopGeometryV0(journal);
    expect(top.visits).toBeGreaterThanOrEqual(1);
    expect(Object.keys(journal.favoriteGeometries).length).toBeGreaterThan(1);
  });

  it("does not accrue dwell on retreat or sleep", () => {
    const journal = createOctoJournalV0();
    const engine = createCognitiveGeometryEngineV1(8);
    ingestCognitiveDraftV1(engine, "merhaba");

    stepOctoJournalV0(
      journal,
      buildEcologyTick(engine, OCTO_BEHAVIOR_V0.RETREAT),
      engine,
      { base: 0xffffff },
      { deltaMs: 600 }
    );
    stepOctoJournalV0(
      journal,
      buildEcologyTick(engine, OCTO_BEHAVIOR_V0.SLEEP),
      engine,
      { base: 0xffffff },
      { deltaMs: 600 }
    );

    expect(journal.totalDwellTimeMs).toBe(0);
  });

  it("ranks favorites by dwell time and exposes visited shapes", () => {
    const journal = createOctoJournalV0();
    const engine = createCognitiveGeometryEngineV1(12);

    ingestCognitiveDraftV1(engine, "hatırla geçmiş bellek");
    const memoryTick = buildEcologyTick(engine, OCTO_BEHAVIOR_V0.LOOK);
    for (let i = 0; i < 6; i += 1) {
      stepOctoJournalV0(journal, memoryTick, engine, { rgb: { r: 10, g: 200, b: 120 } }, { deltaMs: 300 });
    }

    ingestCognitiveDraftV1(engine, "neden mantık çözüm");
    const reasoningTick = buildEcologyTick(engine, OCTO_BEHAVIOR_V0.TOUCH);
    stepOctoJournalV0(journal, reasoningTick, engine, { rgb: { r: 200, g: 80, b: 255 } }, { deltaMs: 120 });

    const snap = snapshotOctoJournalV0(journal);
    expect(snap.visitedShapes.length).toBeGreaterThan(0);
    expect(snap.favoriteGeometries[0].dwellTimeMs).toBeGreaterThanOrEqual(
      snap.favoriteGeometries[1]?.dwellTimeMs ?? 0
    );
  });

  it("integrates with ecology step without user-topic storage", () => {
    const journal = createOctoJournalV0();
    const ecology = createOctoReactionEcologyV0();
    const engine = createCognitiveGeometryEngineV1(12);
    ingestCognitiveDraftV1(engine, "harita basketbol spiral");

    const ecologyTick = stepOctoReactionEcologyV0(ecology, engine, {
      nowMs: Date.now(),
      userEnergy: 0.7,
      thinkIntervalMs: 0
    });
    const journalTick = stepOctoJournalV0(journal, ecologyTick, engine, { rgb: { r: 66, g: 217, b: 255 } }, {
      deltaMs: 500
    });

    expect(journalTick.geometry).toBeTruthy();
    expect(journalTick.snapshot.favoriteGeometries.length).toBeGreaterThan(0);
    expect(journal.favoriteGeometries.maps).toBeUndefined();
    expect(journal.favoriteGeometries.basketball).toBeUndefined();
  });
});
