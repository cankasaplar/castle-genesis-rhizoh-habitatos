import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  runRhizohLivingLoopTickV0,
  deriveLivingLoopRibbonFrameV0,
  deriveCastleInteractionFrameV0,
  clearRhizohLivingLoopSnapshotForTestsV0,
  getRhizohLivingLoopSnapshotV0,
  RHIZOH_LIVING_LOOP_ORCHESTRATOR_SCHEMA_V0
} from "../rhizohLivingLoopOrchestratorV0.js";
import { resetLiveRuntimeOrchestratorForTestsV0 } from "../liveRuntimeOrchestratorV0.js";
import { resetWorldPresenceWeatherCacheForTestsV0 } from "../worldPresenceStoreV0.js";
import { resolveLocationSeedV0 } from "../locationSeedV0.js";
import { clearWorldInstanceForTestV0 } from "../worldInstanceFromLocationSeedV0.js";
import { resetLivingLoopMemoryWalForTestsV0 } from "../livingLoopMemoryWalV0.js";

describe("rhizohLivingLoopOrchestratorV0", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_WORLD_EXECUTION_MODE", "active");
    vi.stubEnv("VITE_WORLD_LAYER", "1");
    resetWorldPresenceWeatherCacheForTestsV0();
    resetLiveRuntimeOrchestratorForTestsV0();
    clearRhizohLivingLoopSnapshotForTestsV0();
    clearWorldInstanceForTestV0();
    resetLivingLoopMemoryWalForTestsV0();
    document.documentElement.innerHTML = "";
    document.documentElement.setAttribute("data-rhizoh-atmosphere-castle-surface", "1");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("runRhizohLivingLoopTickV0 chains seed → instance → atmosphere → ribbon → castle", async () => {
    const frame = await runRhizohLivingLoopTickV0({ ttlMs: 60_000, skipMemoryWal: true });
    expect(frame.schema).toBe(RHIZOH_LIVING_LOOP_ORCHESTRATOR_SCHEMA_V0);
    expect(frame.locationSeed.schema).toBe("castle.rhizoh.location_seed.v0");
    expect(frame.worldInstance.instanceId).toMatch(/^wi_/);
    expect(frame.atmosphere.state.schema).toBe("worldPresence.v0");
    expect(frame.atmosphere.state.living?.worldInstanceId).toBe(frame.worldInstance.instanceId);
    expect(frame.ribbon.atmosphereLead.length).toBeGreaterThan(0);
    expect(frame.castle.affordanceId).toMatch(/^castle\.interact\./);
    expect(frame.castle.surfaceReady).toBe(true);
    expect(getRhizohLivingLoopSnapshotV0()).toBe(frame);
  });

  it("deriveLivingLoopRibbonFrameV0 is deterministic for fixed inputs", () => {
    const seed = resolveLocationSeedV0();
    const ribbon = deriveLivingLoopRibbonFrameV0({
      locationSeed: seed,
      worldInstance: { instanceId: "wi_test", timeZone: seed.timeZone, locale: seed.locale },
      state: {
        ambient: { weatherType: "clear", luminosity: 0.8, localTime: { hour: 14 } }
      },
      hints: { castleMetabolicPulse: 0.5 }
    });
    expect(ribbon.worldEcho).toContain("wi_test");
    expect(ribbon.atmosphereLead).toContain("öğle");
  });

  it("deriveCastleInteractionFrameV0 maps pulse to affordance bands", () => {
    const high = deriveCastleInteractionFrameV0({
      hints: { castleMetabolicPulse: 0.7, castleAuraIntensity: 0.6 },
      surfaceReady: false
    });
    expect(high.affordanceId).toBe("castle.interact.focus");
    const low = deriveCastleInteractionFrameV0({
      hints: { castleMetabolicPulse: 0.2, castleAuraIntensity: 0.3 },
      surfaceReady: true
    });
    expect(low.affordanceId).toBe("castle.interact.rest");
    expect(low.surfaceReady).toBe(true);
  });
});
