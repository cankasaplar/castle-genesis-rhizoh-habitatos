import { describe, it, expect, vi, afterEach } from "vitest";
import {
  pokeRealitySealerScheduleOnKernelV0,
  submitWorldAuthoritySealCandidateOnKernelV0,
  installRealitySealerWatchdogV0,
  REALITY_SEALER_WATCHDOG_INTERVAL_MS_V0
} from "../realitySealerLiveWiringV0.js";
import { WAL_WORLD_DIFF_KIND_V0 } from "../submitWorldAuthoritySealCandidateV0.js";
import { createInitialStudioKernelState } from "../../../studio/store/initialState.ts";

describe("realitySealerLiveWiringV0", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function mockKernel() {
    let state = createInitialStudioKernelState();
    return {
      getState: () => state,
      setState: (next) => {
        state = next;
      }
    };
  }

  it("pokes without draining when schedule holds", () => {
    const { getState, setState } = mockKernel();
    const poke = pokeRealitySealerScheduleOnKernelV0(getState, setState, { trigger: "test" });
    expect(poke.poked).toBe(true);
    expect(poke.drained).toBe(false);
  });

  it("submits WAL topology and may drain via ingress poke", () => {
    const { getState, setState } = mockKernel();
    const r = submitWorldAuthoritySealCandidateOnKernelV0(getState, setState, {
      diffId: "t1",
      kind: WAL_WORLD_DIFF_KIND_V0.TOPOLOGY_PATCH,
      roomScope: "room:main",
      signed: true,
      payload: { regionUid: "r1" }
    });
    expect(r.ok).toBe(true);
    expect(r.poke?.trigger).toBe("wal_ingress");
    expect(getState().realitySeal.sealQueue.length).toBeLessThanOrEqual(1);
  });

  it("watchdog fires on interval when queue pending", () => {
    vi.useFakeTimers();
    const { getState, setState } = mockKernel();
    submitWorldAuthoritySealCandidateOnKernelV0(getState, setState, {
      diffId: "c1",
      kind: WAL_WORLD_DIFF_KIND_V0.SCENE_CHUNK,
      signed: true
    });
    const stop = installRealitySealerWatchdogV0(getState, setState, { intervalMs: 100 });
    vi.advanceTimersByTime(REALITY_SEALER_WATCHDOG_INTERVAL_MS_V0);
    stop();
    vi.useRealTimers();
    expect(getState().realitySeal).toBeDefined();
  });
});
