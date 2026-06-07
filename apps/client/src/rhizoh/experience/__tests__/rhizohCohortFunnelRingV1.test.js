import { afterEach, describe, expect, it } from "vitest";
import {
  __resetCohortFunnelForTestV1,
  exportCohortFunnelSnapshotV1,
  hasCohortFunnelStepV1,
  recordCohortFunnelStepOnceV1,
  recordCohortFunnelStepV1,
  RHIZOH_COHORT_FUNNEL_STEP_V1
} from "../rhizohCohortFunnelRingV1.js";

describe("rhizohCohortFunnelRingV1", () => {
  afterEach(() => {
    __resetCohortFunnelForTestV1();
  });

  it("records append-only funnel steps", () => {
    recordCohortFunnelStepV1(RHIZOH_COHORT_FUNNEL_STEP_V1.LINK_OPEN);
    recordCohortFunnelStepV1(RHIZOH_COHORT_FUNNEL_STEP_V1.INVITE_JOIN, { eventId: "evt_1" });
    const snap = exportCohortFunnelSnapshotV1();
    expect(snap.count).toBe(2);
    expect(snap.ring[1].step).toBe("invite_join");
  });

  it("recordCohortFunnelStepOnceV1 dedupes steps", () => {
    recordCohortFunnelStepOnceV1(RHIZOH_COHORT_FUNNEL_STEP_V1.FIRST_MESSAGE);
    recordCohortFunnelStepOnceV1(RHIZOH_COHORT_FUNNEL_STEP_V1.FIRST_MESSAGE);
    expect(hasCohortFunnelStepV1(RHIZOH_COHORT_FUNNEL_STEP_V1.FIRST_MESSAGE)).toBe(true);
    expect(exportCohortFunnelSnapshotV1().count).toBe(1);
  });
});
