import { describe, expect, it } from "vitest";
import { buildCompanionTimelineV0 } from "../companionTimelineV0.js";
import {
  patchCastlePwePresenceStateV0,
  spawnObservationCompanionV0
} from "../castlePersistentWorldEntityV0.js";

describe("companionTimelineV0", () => {
  it("builds rows from PWE event log", () => {
    spawnObservationCompanionV0("tl-user");
    patchCastlePwePresenceStateV0("training", { source: "test" });
    const pwe = patchCastlePwePresenceStateV0("exploring", { source: "test" });
    const tl = buildCompanionTimelineV0(pwe, { limit: 8 });
    expect(tl.rows.length).toBeGreaterThan(0);
    expect(tl.rows.some((r) => r.kind === "training" || r.kind === "exploration")).toBe(true);
  });
});
