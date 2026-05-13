import { describe, expect, it } from "vitest";
import { formatGenesisContinuityEventLine } from "./genesisContinuityEventFormatV0.js";

describe("formatGenesisContinuityEventLine", () => {
  it("formats TickAdvanced", () => {
    expect(
      formatGenesisContinuityEventLine({ type: "TickAdvanced", id: "tick:3", payload: { value: 3 } })
    ).toContain("tick · 3");
  });

  it("formats LedgerAdvanced", () => {
    expect(
      formatGenesisContinuityEventLine({
        type: "LedgerAdvanced",
        id: "ledger:10",
        payload: { delta: 2, total: 10 }
      })
    ).toContain("ledger · +2");
  });

  it("prefixes seq when present", () => {
    const s = formatGenesisContinuityEventLine({
      seq: 441992,
      type: "TickAdvanced",
      id: "tick:1",
      payload: { value: 1 }
    });
    expect(s.startsWith("#441992 ·")).toBe(true);
  });
});
