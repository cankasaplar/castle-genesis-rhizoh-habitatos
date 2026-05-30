import { describe, expect, it } from "vitest";
import {
  advancePersonaContinuityV0,
  createInitialPersonaContinuityStateV0,
  mapRuntimeRoleToPersonaContinuityBandV0
} from "../personaContinuityV0.js";

describe("mapRuntimeRoleToPersonaContinuityBandV0", () => {
  it("maps interpreter / observer / host family", () => {
    expect(mapRuntimeRoleToPersonaContinuityBandV0("INTERPRETER")).toBe("INTERPRETER");
    expect(mapRuntimeRoleToPersonaContinuityBandV0("ARBITER")).toBe("OBSERVER");
    expect(mapRuntimeRoleToPersonaContinuityBandV0("GUIDE")).toBe("HOST");
    expect(mapRuntimeRoleToPersonaContinuityBandV0("MEDIATOR")).toBe("BRIDGE");
  });
});

describe("advancePersonaContinuityV0", () => {
  it("accumulates ticks within the same band", () => {
    let s = createInitialPersonaContinuityStateV0();
    s = advancePersonaContinuityV0(s, { rhizohRuntimeRole: "GUIDE", socialMode: "IDLE" });
    s = advancePersonaContinuityV0(s, { rhizohRuntimeRole: "CONDUCTOR", socialMode: "HOST" });
    expect(s.band).toBe("HOST");
    expect(s.ticksInBand).toBe(2);
    expect(s.directorBrief).toContain("Host");
  });

  it("resets tick ladder on band change", () => {
    let s = createInitialPersonaContinuityStateV0();
    s = advancePersonaContinuityV0(s, { rhizohRuntimeRole: "GUIDE", socialMode: "IDLE" });
    s = advancePersonaContinuityV0(s, { rhizohRuntimeRole: "INTERPRETER", socialMode: "IDLE" });
    expect(s.band).toBe("INTERPRETER");
    expect(s.ticksInBand).toBe(1);
  });
});
