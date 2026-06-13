import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetDrawerTransitionQueueForTestV0,
  closeProductSurfaceDrawerV0,
  computeDrawerShellTransitionV0,
  DRAWER_SHELL_ACTION_V0,
  enqueueDrawerShellTransitionV0,
  executeDrawerShellTransitionV0,
  getDrawerStateSnapshotV0,
  handleProductShellSelectV0,
  verifyDrawerTransitionDeterminismV0
} from "../rhizohDrawerStateMachineV0.js";
import { resetDrawerAwakeningForTestV0 } from "../rhizohDrawerAwakeningV0.js";
import { setRhizohProductSurfacePanelExclusiveV0 } from "../rhizohProductChromePanelsV0.js";
import {
  __resetDomainGraphForTestV0,
  getActiveFederationOverlayNodeV0,
  RHIZOH_FEDERATION_NODE_V0
} from "../rhizohDomainGraphV0.js";
import { __resetRhizohDomainCoreStoreForTestV0 } from "../rhizohDomainCoreStoreV0.js";
import { __resetContextIntentSnapshotForTestV0 } from "../rhizohContextIntentSnapshotV0.js";
import { getLatestContextIntentSnapshotV0 } from "../rhizohContextIntentSnapshotV0.js";

describe("rhizohDrawerStateMachineV0", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDrawerAwakeningForTestV0();
    __resetDrawerTransitionQueueForTestV0();
    __resetDomainGraphForTestV0();
    __resetRhizohDomainCoreStoreForTestV0();
    __resetContextIntentSnapshotForTestV0();
  });

  afterEach(() => {
    localStorage.clear();
    resetDrawerAwakeningForTestV0();
    __resetDrawerTransitionQueueForTestV0();
    __resetDomainGraphForTestV0();
    __resetRhizohDomainCoreStoreForTestV0();
    __resetContextIntentSnapshotForTestV0();
  });

  it("handleProductShellSelectV0 commits intent before domain overlay", () => {
    const r1 = handleProductShellSelectV0("studio", { pathname: "/world/space", inPlace: true });
    expect(r1.action).toBe(DRAWER_SHELL_ACTION_V0.CONTEXT_SHIFT);
    expect(r1.intent?.targetNode).toBe(RHIZOH_FEDERATION_NODE_V0.STUDIO);
    expect(getLatestContextIntentSnapshotV0()?.intentId).toBe(r1.intent?.intentId);
    expect(getActiveFederationOverlayNodeV0()).toBe(RHIZOH_FEDERATION_NODE_V0.STUDIO);
    expect(getDrawerStateSnapshotV0().openDrawerId).toBe("studio");

    const r2 = handleProductShellSelectV0("studio", { pathname: "/world/space", inPlace: true });
    expect(r2.action).toBe(DRAWER_SHELL_ACTION_V0.CONTEXT_SHIFT);
    expect(r2.toggled?.closed).toBe(true);
    expect(getDrawerStateSnapshotV0().openDrawerId).toBeNull();
    expect(getActiveFederationOverlayNodeV0()).toBeNull();
  });

  it("computeDrawerShellTransitionV0 is deterministic for same snapshot", () => {
    const snapshot = getDrawerStateSnapshotV0();
    const check = verifyDrawerTransitionDeterminismV0("hall", snapshot, {
      pathname: "/world/space",
      inPlace: true
    });
    expect(check.ok).toBe(true);
  });

  it("same input sequence always reaches same final state", () => {
    const runSequence = () => {
      localStorage.clear();
      resetDrawerAwakeningForTestV0();
      __resetDomainGraphForTestV0();
      __resetRhizohDomainCoreStoreForTestV0();
      handleProductShellSelectV0("studio", { pathname: "/world/space", inPlace: true });
      handleProductShellSelectV0("hall", { pathname: "/world/space", inPlace: true });
      handleProductShellSelectV0("world", { pathname: "/world/space", inPlace: true });
      return getDrawerStateSnapshotV0().openDrawerId;
    };
    expect(runSequence()).toBeNull();
    expect(runSequence()).toBeNull();
  });

  it("enqueueDrawerShellTransitionV0 serializes concurrent transitions", async () => {
    const results = await Promise.all([
      enqueueDrawerShellTransitionV0("studio", { pathname: "/world/space", inPlace: true }),
      enqueueDrawerShellTransitionV0("hall", { pathname: "/world/space", inPlace: true }),
      enqueueDrawerShellTransitionV0("broadcast", { pathname: "/world/space", inPlace: true })
    ]);
    const seqs = results.map((r) => r.seq);
    expect(seqs[0]).toBeLessThan(seqs[1]);
    expect(seqs[1]).toBeLessThan(seqs[2]);
    expect(getDrawerStateSnapshotV0().openDrawerId).toBe("broadcast");
  });

  it("closeProductSurfaceDrawerV0 closes open drawer and overlay", () => {
    handleProductShellSelectV0("hall", { pathname: "/world/space", inPlace: true });
    expect(getDrawerStateSnapshotV0().openDrawerId).toBe("hall");
    closeProductSurfaceDrawerV0();
    expect(getDrawerStateSnapshotV0().openDrawerId).toBeNull();
    expect(getActiveFederationOverlayNodeV0()).toBeNull();
  });

  it("world selection closes all panels", () => {
    setRhizohProductSurfacePanelExclusiveV0("broadcast", true);
    const r = handleProductShellSelectV0("world", { pathname: "/world/space", inPlace: true });
    expect(r.action).toBe(DRAWER_SHELL_ACTION_V0.CLOSE_ALL);
    expect(getDrawerStateSnapshotV0().openDrawerId).toBeNull();
  });

  it("execute matches compute+apply plan", () => {
    const snapshot = getDrawerStateSnapshotV0();
    const planned = computeDrawerShellTransitionV0("greenroom", snapshot, {
      pathname: "/world/space",
      inPlace: true
    });
    executeDrawerShellTransitionV0("greenroom", { pathname: "/world/space", inPlace: true });
    expect(getDrawerStateSnapshotV0().openDrawerId).toBe(planned.nextOpenDrawerId);
  });
});
