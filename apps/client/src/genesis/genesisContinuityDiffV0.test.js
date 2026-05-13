import { describe, expect, it } from "vitest";
import { diffGenesisRuntimeSnapshots } from "./genesisContinuityDiffV0.js";

describe("diffGenesisRuntimeSnapshots", () => {
  it("emits binding line on first snapshot", () => {
    const next = { serverTime: 1_700_000_000_000, ok: true };
    const d = diffGenesisRuntimeSnapshots(null, next);
    expect(d.length).toBe(1);
    expect(d[0].line).toContain("observer bound");
  });

  it("emits tick delta", () => {
    const prev = { serverTime: 1, canonicalTick: { value: 5 } };
    const next = { serverTime: 2, canonicalTick: { value: 7 } };
    const d = diffGenesisRuntimeSnapshots(prev, next);
    expect(d.some((x) => x.line.includes("tick"))).toBe(true);
  });

  it("emits ledger append", () => {
    const prev = { serverTime: 1, epistemicLedger: { entriesPersistedTotal: 10 } };
    const next = { serverTime: 2, epistemicLedger: { entriesPersistedTotal: 13 } };
    const d = diffGenesisRuntimeSnapshots(prev, next);
    expect(d.some((x) => x.line.includes("ledger"))).toBe(true);
  });
});
