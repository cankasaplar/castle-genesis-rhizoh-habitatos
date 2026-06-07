import { afterEach, describe, expect, it } from "vitest";
import {
  digestPerceptionAlignmentRuntimeV0,
  __resetAlignmentSnapshotHookForTestV0
} from "../usePerceptionAlignmentSnapshotV0.js";
import {
  __resetPerceptionAlignmentPublishForTestV0,
  readPerceptionAlignmentFromRuntimeV0
} from "../perceptionAlignmentSnapshotV0.js";
import {
  summarizePerceptionAlignmentDriftV0,
  summarizePerceptionAlignmentLensesV0
} from "../perceptionAlignmentSnapshotV0.js";

describe("usePerceptionAlignmentSnapshotV0 helpers", () => {
  afterEach(() => {
    __resetAlignmentSnapshotHookForTestV0();
    __resetPerceptionAlignmentPublishForTestV0();
  });

  it("digests runtime fields deterministically", () => {
    const a = digestPerceptionAlignmentRuntimeV0({
      fieldState: "LISTENING",
      replyText: "hello",
      mountId: "t0_shell_unified_dock"
    });
    const b = digestPerceptionAlignmentRuntimeV0({
      fieldState: "LISTENING",
      replyText: "hello",
      mountId: "t0_shell_unified_dock"
    });
    expect(a).toBe(b);
  });

  it("summarizes lenses for T0 strip", () => {
    const snap = readPerceptionAlignmentFromRuntimeV0({
      atMs: 1_700_000_000_000,
      fieldState: "LISTENING",
      mountId: "t0_shell_unified_dock",
      productSurface: "world",
      realityMode: "GLOBE",
      worldMapTool: "globe"
    });
    const lenses = summarizePerceptionAlignmentLensesV0(snap.contract);
    expect(lenses.octo).toContain("t0_shell_unified_dock");
    expect(lenses.habitat).toContain("px");
  });

  it("summarizes drift without causality claim", () => {
    const snap = readPerceptionAlignmentFromRuntimeV0({
      atMs: 1_700_000_000_000,
      fieldState: "LISTENING",
      mountId: "t0_shell_unified_dock"
    });
    const drift = summarizePerceptionAlignmentDriftV0(snap.contract.alignment);
    expect(drift).toHaveProperty("risk");
    expect(drift).toHaveProperty("explanationCount");
  });
});
