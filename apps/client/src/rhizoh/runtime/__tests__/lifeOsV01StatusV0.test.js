import { describe, expect, it, beforeEach } from "vitest";
import {
  buildLifeOsV01StatusSnapshotV0,
  LIFE_OS_V01_SCOPE_DELIVERED_V0,
  LIFE_OS_V01_SCOPE_EXCLUDED_V0,
  RHIZOH_LIFE_OS_V01_STATUS_SCHEMA_V0
} from "../lifeOsV01StatusV0.js";
import { resetCalendarEventAdapterForTestV0 } from "../calendarEventAdapterV0.js";
import { resetMediaEventAdapterForTestV0 } from "../mediaEventAdapterV0.js";

describe("lifeOsV01StatusV0", () => {
  beforeEach(() => {
    resetCalendarEventAdapterForTestV0();
    resetMediaEventAdapterForTestV0();
  });

  it("returns frozen closure snapshot with scope lists", () => {
    const status = buildLifeOsV01StatusSnapshotV0();
    expect(status.schema).toBe(RHIZOH_LIFE_OS_V01_STATUS_SCHEMA_V0);
    expect(status.interpretationOnly).toBe(true);
    expect(status.nonExecutive).toBe(true);
    expect(status.honestLabel).toContain("observation layer");
    expect(status.scope.delivered).toEqual(LIFE_OS_V01_SCOPE_DELIVERED_V0);
    expect(status.scope.excluded).toEqual(LIFE_OS_V01_SCOPE_EXCLUDED_V0);
    expect(status.governance.mutationPermitted).toBe(false);
    expect(["ACHIEVED", "DORMANT"]).toContain(status.status);
  });

  it("reports academy go and checkers parity flags", () => {
    const status = buildLifeOsV01StatusSnapshotV0();
    expect(typeof status.academy.goParity).toBe("boolean");
    expect(typeof status.academy.checkersParity).toBe("boolean");
  });
});
