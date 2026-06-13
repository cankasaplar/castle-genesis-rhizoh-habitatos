import { describe, expect, it, beforeEach } from "vitest";
import {
  readRhizohTowerLiveStatusV0,
  resetRhizohTowerLiveStatusForTestV0,
  resolveTowerLiveStatusV0,
  setRhizohTowerGatewayReachableV0,
  setRhizohTowerSyncActiveV0,
  TOWER_LIVE_STATUS_V0
} from "../rhizohTowerLiveStatusV0.js";

describe("rhizohTowerLiveStatusV0", () => {
  beforeEach(() => {
    resetRhizohTowerLiveStatusForTestV0();
  });

  it("prioritizes THINKING over SYNCING and ONLINE", () => {
    expect(
      resolveTowerLiveStatusV0({
        gatewayReachable: true,
        syncActive: true,
        llmInFlight: true
      })
    ).toBe(TOWER_LIVE_STATUS_V0.THINKING);
  });

  it("shows SYNCING when cloud sync active", () => {
    setRhizohTowerGatewayReachableV0(true);
    setRhizohTowerSyncActiveV0(true);
    expect(readRhizohTowerLiveStatusV0().status).toBe(TOWER_LIVE_STATUS_V0.SYNCING);
  });

  it("shows OFFLINE when gateway unreachable", () => {
    setRhizohTowerGatewayReachableV0(false);
    expect(readRhizohTowerLiveStatusV0().status).toBe(TOWER_LIVE_STATUS_V0.OFFLINE);
  });
});
