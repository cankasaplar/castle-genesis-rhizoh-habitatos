import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ensureRhizohCoreSubsystemsBootV0,
  readRhizohGuestSessionIdV0,
  resetRhizohCoreSubsystemBootForTestV0
} from "../rhizohCoreSubsystemBootV0.js";
import { publishIngressRouteV0 } from "../spatialSinkRoutePolicyV0.js";
import { stopSpatialExecutionTickV0 } from "../spatialExecutionTickV0.js";
import { __resetSpatialWorldAdapterForTestV0 } from "../spatialWorldAdapterV0.js";

vi.mock("../rhizohDomainNervousSystemV0.js", () => ({
  runDomainGateForPathV0: vi.fn()
}));

vi.mock("../rhizohLearningCoreBootV0.js", () => ({
  bootRhizohLearningCoreV0: vi.fn(() => ({ booted: true, knowledgeSeeded: true }))
}));

vi.mock("../rhizohLegalPendingWaitLoopV0.js", () => ({
  startRhizohLegalPendingWaitLoopV0: vi.fn(() => () => {}),
  isRhizohLegalPendingHoldV0: vi.fn(() => false)
}));

import { runDomainGateForPathV0 } from "../rhizohDomainNervousSystemV0.js";
import { bootRhizohLearningCoreV0 } from "../rhizohLearningCoreBootV0.js";

describe("rhizohCoreSubsystemBootV0", () => {
  beforeEach(() => {
    resetRhizohCoreSubsystemBootForTestV0();
    stopSpatialExecutionTickV0();
    __resetSpatialWorldAdapterForTestV0();
    window.__rhizoh = {};
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetRhizohCoreSubsystemBootForTestV0();
    delete window.__rhizoh;
    localStorage.clear();
  });

  it("boots learning with guest session during ingress", () => {
    publishIngressRouteV0("legal_preamble");
    const out = ensureRhizohCoreSubsystemsBootV0();
    expect(out.ok).toBe(true);
    expect(runDomainGateForPathV0).toHaveBeenCalledWith("/", { coreOnly: true });
    expect(bootRhizohLearningCoreV0).toHaveBeenCalledWith({
      userId: readRhizohGuestSessionIdV0()
    });
  });

  it("is idempotent", () => {
    ensureRhizohCoreSubsystemsBootV0();
    ensureRhizohCoreSubsystemsBootV0();
    expect(runDomainGateForPathV0).toHaveBeenCalledTimes(1);
  });

  it("mounts matchmaking console during core boot", () => {
    ensureRhizohCoreSubsystemsBootV0();
    expect(typeof window.__rhizoh?.matchmaking?.emitBeacon).toBe("function");
    expect(typeof window.__rhizoh?.matchmaking?.tryMatch).toBe("function");
    expect(window.__rhizoh?.matchmakingConsole?.mounted).toBe(true);
  });

  it("publishes spatial renderer registry and world layer status on boot", () => {
    ensureRhizohCoreSubsystemsBootV0();
    expect(window.__rhizoh?.spatialRendererRegistry?.plugins?.length).toBeGreaterThan(0);
    expect(window.__rhizoh?.worldLayerStatus?.phase).toBeTruthy();
  });
});
