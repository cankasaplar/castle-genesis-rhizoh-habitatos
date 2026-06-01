import { describe, it, expect, beforeEach } from "vitest";
import {
  pushT0ContinuityPulseV0,
  readT0ContinuityPulseStreamV0,
  resetT0ContinuityPulseStreamV0,
  seedT0ContinuityPulseStreamV0
} from "../t0ContinuitySurfaceStreamV0.js";

describe("t0ContinuitySurfaceStreamV0", () => {
  beforeEach(() => {
    resetT0ContinuityPulseStreamV0();
  });

  it("pushes and reads pulse lines", () => {
    pushT0ContinuityPulseV0("Estetik güncelleme yüklendi", "aesthetic");
    const stream = readT0ContinuityPulseStreamV0();
    expect(stream.length).toBe(1);
    expect(stream[0].line).toMatch(/Estetik/);
  });

  it("seeds ready affordance lines once", () => {
    seedT0ContinuityPulseStreamV0();
    seedT0ContinuityPulseStreamV0();
    expect(readT0ContinuityPulseStreamV0().length).toBe(2);
  });
});
