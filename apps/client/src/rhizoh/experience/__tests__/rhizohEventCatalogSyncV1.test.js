import { afterEach, describe, expect, it } from "vitest";
import {
  __resetRhizohEventCatalogSyncForTestV1,
  buildRhizohEventInviteLinkWithSyncV1,
  compactEventRecordForSyncV1,
  decodeEventPayloadParamV1,
  detectInviteJoinDegradeV1,
  encodeEventPayloadParamV1,
  expandEventRecordFromSyncV1,
  hydrateEventCatalogFromJoinV1,
  mergeEventRecordIntoLocalCatalogV1,
  parseEventJoinBundleV1
} from "../rhizohEventCatalogSyncV1.js";
import {
  __resetRhizohEventSurfaceForTestV12,
  createRhizohEventV12
} from "../rhizohEventSurfaceV12.js";
import { __resetRhizohExperienceSessionContextForTestV0 } from "../rhizohExperienceSessionContextV0.js";

describe("rhizohEventCatalogSyncV1", () => {
  afterEach(() => {
    __resetRhizohEventCatalogSyncForTestV1();
    __resetRhizohEventSurfaceForTestV12();
    __resetRhizohExperienceSessionContextForTestV0();
  });

  it("round-trips compact payload for cross-device invite hydrate", () => {
    const created = createRhizohEventV12({
      title: "Friday concert",
      type: "concert",
      experienceSessionId: "exp_host"
    });
    const encoded = encodeEventPayloadParamV1(created.record);
    const decoded = decodeEventPayloadParamV1(encoded, created.eventId);
    expect(decoded?.title).toBe("Friday concert");
    expect(decoded?.type).toBe("concert");
    expect(decoded?.inviteToken).toBe(created.inviteToken);
  });

  it("parseEventJoinBundleV1 hydrates record from evp query param", () => {
    const created = createRhizohEventV12({ title: "Remote join", type: "live" });
    const evp = encodeEventPayloadParamV1(created.record);
    const bundle = parseEventJoinBundleV1(
      `?event=${created.eventId}&invite=${created.inviteToken}&evp=${evp}`
    );
    expect(bundle.eventId).toBe(created.eventId);
    expect(bundle.hydratedRecord?.title).toBe("Remote join");
  });

  it("hydrateEventCatalogFromJoinV1 merges into local catalog on fresh device", () => {
    const created = createRhizohEventV12({ title: "Fresh device", type: "scheduled" });
    const evp = encodeEventPayloadParamV1(created.record);
    const search = `?event=${created.eventId}&invite=${created.inviteToken}&evp=${evp}`;
    const merged = hydrateEventCatalogFromJoinV1(search);
    expect(merged?.eventId).toBe(created.eventId);
    expect(merged?.title).toBe("Fresh device");
  });

  it("mergeEventRecordIntoLocalCatalogV1 prefers newer updatedAtMs", () => {
    mergeEventRecordIntoLocalCatalogV1(
      expandEventRecordFromSyncV1(
        compactEventRecordForSyncV1({
          title: "Old",
          type: "live",
          lifecycle: "LIVE",
          inviteToken: "tok",
          updatedAtMs: 100
        }),
        "evt_merge"
      )
    );
    const newer = mergeEventRecordIntoLocalCatalogV1(
      expandEventRecordFromSyncV1(
        compactEventRecordForSyncV1({
          title: "New",
          type: "live",
          lifecycle: "LIVE",
          inviteToken: "tok",
          updatedAtMs: 500
        }),
        "evt_merge"
      )
    );
    expect(newer?.title).toBe("New");
  });

  it("detectInviteJoinDegradeV1 flags broken payload and missing catalog", () => {
    expect(detectInviteJoinDegradeV1("?event=evt_x&evp=garbage")).toBe("invite_broken");
    expect(detectInviteJoinDegradeV1("?event=evt_missing")).toBe("event_not_found");
  });
});
