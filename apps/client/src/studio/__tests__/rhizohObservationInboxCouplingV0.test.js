import { describe, expect, it } from "vitest";
import {
  buildInboxCouplingKeyV0,
  INBOX_COUPLING_MAX_DEPOSIT_V0,
  stepRhizohObservationInboxCouplingV0
} from "../rhizohObservationInboxCouplingV0.js";
import { createRhizohMemoryV0 } from "../rhizohMemoryV0.js";
import { receiveOctoObservationInboxV0 } from "../octoObservationReportV0.js";

const NOW = 1_700_000_000_000;

function seedInbox(memory, items) {
  for (const item of items) {
    receiveOctoObservationInboxV0(memory, { ...item, atMs: item.atMs ?? NOW });
  }
}

describe("rhizohObservationInboxCouplingV0", () => {
  it("buildInboxCouplingKey is stable per inbox entry", () => {
    const key = buildInboxCouplingKeyV0({
      receivedAtMs: 100,
      observation: "stretch_geometry_engagement"
    });
    expect(key).toBe("100::stretch_geometry_engagement");
  });

  it("deposits soft attention from inbox without re-applying", () => {
    const memory = createRhizohMemoryV0();
    seedInbox(memory, [
      {
        source: "octo",
        observation: "persistent_stretch_interest",
        confidence: 0.63,
        geometry: "stretch",
        visits: 7,
        dwellTimeMs: 120000
      }
    ]);
    const first = stepRhizohObservationInboxCouplingV0(memory, { nowMs: NOW });
    const second = stepRhizohObservationInboxCouplingV0(memory, { nowMs: NOW + 500 });

    expect(first.applied).toBe(1);
    expect(first.deposits[0].target).toBe("stretch");
    expect(first.deposits[0].weight).toBeLessThanOrEqual(INBOX_COUPLING_MAX_DEPOSIT_V0);
    expect(memory.attentionField.stretch).toBeGreaterThan(0);
    expect(second.applied).toBe(0);
  });

  it("skips below-confidence inbox entries", () => {
    const memory = createRhizohMemoryV0();
    seedInbox(memory, [
      {
        source: "octo",
        observation: "stretch_geometry_engagement",
        confidence: 0.45,
        geometry: "stretch",
        visits: 4
      }
    ]);
    const tick = stepRhizohObservationInboxCouplingV0(memory, { nowMs: NOW });
    expect(tick.applied).toBe(0);
    expect(memory.attentionField.stretch ?? 0).toBe(0);
  });

  it("respects enabled=false (baseline passive mode)", () => {
    const memory = createRhizohMemoryV0();
    seedInbox(memory, [
      {
        source: "octo",
        observation: "persistent_interest_in_spiral",
        confidence: 0.72,
        geometry: "spiral",
        visits: 8
      }
    ]);
    const tick = stepRhizohObservationInboxCouplingV0(memory, { enabled: false, nowMs: NOW });
    expect(tick.enabled).toBe(false);
    expect(tick.applied).toBe(0);
  });
});
