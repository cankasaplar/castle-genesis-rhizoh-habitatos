/**
 * 5A — Broadcast causal layer: lifecycle atoms on `broadcast:${uid}` writer + folded `BroadcastProjection`.
 */

import {
  accumulateEconomy,
  assertEconomyAllowsAppend,
  estimateEconomyForNodeType,
  withEconomyPayload
} from "../runtime/causalEconomy.js";
import {
  buildBroadcastAudienceApplauseCausalNode,
  buildBroadcastAudienceCheerCausalNode,
  buildBroadcastAudienceEmojiRainCausalNode,
  buildBroadcastAudienceWaveCausalNode,
  buildBroadcastCameraCutCausalNode,
  buildBroadcastCameraFocusCausalNode,
  buildBroadcastCameraFollowCausalNode,
  buildBroadcastClipMarkCausalNode,
  buildBroadcastOverlayPushCausalNode,
  buildBroadcastOverlayRemoveCausalNode,
  buildBroadcastPauseCausalNode,
  buildBroadcastResumeCausalNode,
  buildBroadcastSceneSetCausalNode,
  buildBroadcastSegmentCloseCausalNode,
  buildBroadcastSegmentOpenCausalNode,
  buildBroadcastSpotlightAssignCausalNode,
  buildBroadcastSpotlightReleaseCausalNode,
  buildBroadcastStartCausalNode,
  buildBroadcastStopCausalNode
} from "../runtime/broadcastCausalFactory.js";
import {
  CAUSAL_GENESIS_NODE_ID,
  CAUSAL_MAIN_BRANCH_ID,
  defaultCausalGraphRegistry,
  ensureBranchRecord
} from "../runtime/causalGraph.js";
import { appendCausalNode } from "../runtime/graphReducer";
import { KernelGuardRun } from "../runtime/kernelGuard";
import { foldBroadcastWriterChain } from "../lib/broadcastProjectionFold";
import type {
  BroadcastChannel,
  BroadcastProjection,
  CausalGraphRegistry,
  CausalNode,
  DirectorState,
  PresenceLayerState,
  StudioKernelState,
  StudioResult
} from "../types/rskOntology.js";
import { defaultCausalEconomy, defaultPresence } from "./initialState";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";

function ensureBranch(
  s: StudioKernelState,
  branchId: string,
  causalGraph: ReturnType<typeof defaultCausalGraphRegistry>
) {
  let cg = causalGraph;
  if (branchId !== CAUSAL_MAIN_BRANCH_ID && !cg.branches[branchId]) {
    const trunkDepth = cg.branches[CAUSAL_MAIN_BRANCH_ID]?.lineageDepth ?? 0;
    cg = ensureBranchRecord(cg, {
      id: branchId,
      parentBranchId: CAUSAL_MAIN_BRANCH_ID,
      forkTick: s.worldPhysics.globalTick,
      forkCauseNodeId: CAUSAL_GENESIS_NODE_ID,
      status: "active",
      lineageDepth: trunkDepth + 1
    });
  }
  return cg;
}

function appendToolForWriter(input: {
  s: StudioKernelState;
  writerSubject: string;
  node: CausalNode;
  charge: ReturnType<typeof estimateEconomyForNodeType>;
}): StudioResult<{ causalGraph: CausalGraphRegistry }> {
  const econBase = input.s.causalEconomy ?? defaultCausalEconomy();
  const gate = assertEconomyAllowsAppend(econBase, input.charge);
  if (!gate.ok) return { ok: false, error: gate.error };
  const appended = appendCausalNode(input.s.registry.causalGraph, input.node, input.writerSubject);
  if (!appended.ok) return { ok: false, error: appended.error };
  return { ok: true, value: { causalGraph: appended.graph } };
}

function syncChannelStreamState(ch: BroadcastChannel, proj: BroadcastProjection): BroadcastChannel {
  let streamState = ch.streamState;
  if (proj.state === "ended") streamState = "ended";
  else if (proj.state === "live" || proj.state === "paused" || proj.state === "prelive") streamState = "live";
  else streamState = "idle";
  return { ...ch, streamState };
}

function mergeDirectorByRoom(
  prev: Record<string, DirectorState> | undefined,
  foldDirs: Record<string, DirectorState>
): Record<string, DirectorState> {
  const base = { ...(prev ?? {}) };
  for (const [room, fd] of Object.entries(foldDirs)) {
    const cur = base[room] ?? { sceneMode: "show", clipMarkers: [] };
    base[room] = {
      sceneMode: fd.sceneMode ?? cur.sceneMode,
      currentBroadcastUid: "currentBroadcastUid" in fd ? fd.currentBroadcastUid : cur.currentBroadcastUid,
      clipMarkers: fd.clipMarkers.length > 0 ? fd.clipMarkers : cur.clipMarkers
    };
  }
  return base;
}

/** Recompute folded projections after any change to the broadcast writer chain. */
export function patchPresenceWithBroadcastFold(input: {
  pres: PresenceLayerState;
  causalGraph: CausalGraphRegistry;
  branchId: string;
  broadcastUid: string;
}): PresenceLayerState {
  const { projection, directorByRoomUid } = foldBroadcastWriterChain(
    input.causalGraph,
    input.branchId,
    input.broadcastUid
  );
  const ch = input.pres.broadcasts[input.broadcastUid];
  const broadcasts =
    ch != null
      ? {
          ...input.pres.broadcasts,
          [input.broadcastUid]: syncChannelStreamState(ch, projection)
        }
      : input.pres.broadcasts;
  return {
    ...input.pres,
    broadcastProjections: {
      ...(input.pres.broadcastProjections ?? {}),
      [input.broadcastUid]: projection
    },
    directorByRoomUid: mergeDirectorByRoom(input.pres.directorByRoomUid, directorByRoomUid),
    broadcasts
  };
}

function requireBroadcast(input: {
  broadcastUid: string;
}): StudioResult<{ s: StudioKernelState; pres: PresenceLayerState; branchId: string; causalGraph: CausalGraphRegistry }> {
  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  if (!pres.broadcasts[input.broadcastUid]) return { ok: false, error: "broadcast_not_found" };
  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  return { ok: true, value: { s, pres, branchId, causalGraph } };
}

function commitBroadcastAppend(input: {
  s: StudioKernelState;
  pres: PresenceLayerState;
  branchId: string;
  causalGraph: CausalGraphRegistry;
  broadcastUid: string;
  charge: ReturnType<typeof estimateEconomyForNodeType>;
}): void {
  const econBase = input.s.causalEconomy ?? defaultCausalEconomy();
  const nextPres = patchPresenceWithBroadcastFold({
    pres: input.pres,
    causalGraph: input.causalGraph,
    branchId: input.branchId,
    broadcastUid: input.broadcastUid
  });
  setStudioKernelState({
    ...input.s,
    registry: { ...input.s.registry, causalGraph: input.causalGraph },
    causalEconomy: accumulateEconomy(econBase, input.charge),
    presence: nextPres
  });
}

function appendBroadcastNode(
  action: string,
  broadcastUid: string,
  build: (
    uid: string,
    args: {
      branchId: string;
      tickIndex: number;
      timestamp: number;
      actorId: string;
      causeIds: string[];
    }
  ) => CausalNode
): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action, payload: { broadcastUid } });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { broadcastUid: string };

  const ctx = requireBroadcast({ broadcastUid: p.broadcastUid });
  if (!ctx.ok) return ctx;
  const { s, pres, branchId, causalGraph: cg0 } = ctx.value;
  let causalGraph = cg0;

  const writerSubject = `broadcast:${p.broadcastUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");

  const args = {
    branchId,
    tickIndex,
    timestamp: wall,
    actorId,
    causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
  };
  const node = withEconomyPayload(build(p.broadcastUid, args));

  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;
  commitBroadcastAppend({ s, pres, branchId, causalGraph, broadcastUid: p.broadcastUid, charge });
  return { ok: true, value: { causalNodeId: node.id } };
}

export function broadcastLifecycleStart(payload: {
  broadcastUid: string;
  roomUid?: string;
  hostAvatarUid?: string;
  sceneMode?: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.start", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as {
    broadcastUid: string;
    roomUid?: string;
    hostAvatarUid?: string;
    sceneMode?: string;
  };

  const ctx = requireBroadcast({ broadcastUid: p.broadcastUid });
  if (!ctx.ok) return ctx;
  const { s, pres, branchId, causalGraph: cg0 } = ctx.value;
  let causalGraph = cg0;
  const writerSubject = `broadcast:${p.broadcastUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");

  const node = withEconomyPayload(
    buildBroadcastStartCausalNode({
      broadcastUid: p.broadcastUid,
      roomUid: p.roomUid,
      hostAvatarUid: p.hostAvatarUid,
      sceneMode: p.sceneMode,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;
  commitBroadcastAppend({ s, pres, branchId, causalGraph, broadcastUid: p.broadcastUid, charge });
  return { ok: true, value: { causalNodeId: node.id } };
}

export function broadcastLifecyclePause(payload: { broadcastUid: string }): StudioResult<{ causalNodeId: string }> {
  return appendBroadcastNode("presence.broadcast.pause", payload.broadcastUid, (uid, args) =>
    buildBroadcastPauseCausalNode({ broadcastUid: uid, ...args })
  );
}

export function broadcastLifecycleResume(payload: { broadcastUid: string }): StudioResult<{ causalNodeId: string }> {
  return appendBroadcastNode("presence.broadcast.resume", payload.broadcastUid, (uid, args) =>
    buildBroadcastResumeCausalNode({ broadcastUid: uid, ...args })
  );
}

export function broadcastLifecycleStop(payload: { broadcastUid: string }): StudioResult<{ causalNodeId: string }> {
  return appendBroadcastNode("presence.broadcast.stop", payload.broadcastUid, (uid, args) =>
    buildBroadcastStopCausalNode({ broadcastUid: uid, ...args })
  );
}

export function broadcastSegmentOpen(payload: {
  broadcastUid: string;
  segmentId: string;
  label?: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.segment.open", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { broadcastUid: string; segmentId: string; label?: string };
  const ctx = requireBroadcast({ broadcastUid: p.broadcastUid });
  if (!ctx.ok) return ctx;
  const { s, pres, branchId, causalGraph: cg0 } = ctx.value;
  let causalGraph = cg0;
  const writerSubject = `broadcast:${p.broadcastUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildBroadcastSegmentOpenCausalNode({
      broadcastUid: p.broadcastUid,
      segmentId: p.segmentId,
      label: p.label,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );
  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;
  commitBroadcastAppend({ s, pres, branchId, causalGraph, broadcastUid: p.broadcastUid, charge });
  return { ok: true, value: { causalNodeId: node.id } };
}

export function broadcastSegmentClose(payload: {
  broadcastUid: string;
  segmentId: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.segment.close", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { broadcastUid: string; segmentId: string };
  const ctx = requireBroadcast({ broadcastUid: p.broadcastUid });
  if (!ctx.ok) return ctx;
  const { s, pres, branchId, causalGraph: cg0 } = ctx.value;
  let causalGraph = cg0;
  const writerSubject = `broadcast:${p.broadcastUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildBroadcastSegmentCloseCausalNode({
      broadcastUid: p.broadcastUid,
      segmentId: p.segmentId,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );
  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;
  commitBroadcastAppend({ s, pres, branchId, causalGraph, broadcastUid: p.broadcastUid, charge });
  return { ok: true, value: { causalNodeId: node.id } };
}

export function broadcastSpotlightAssign(payload: {
  broadcastUid: string;
  targetAvatarUid: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.spotlight.assign", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { broadcastUid: string; targetAvatarUid: string };
  const ctx = requireBroadcast({ broadcastUid: p.broadcastUid });
  if (!ctx.ok) return ctx;
  const { s, pres, branchId, causalGraph: cg0 } = ctx.value;
  let causalGraph = cg0;
  const writerSubject = `broadcast:${p.broadcastUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildBroadcastSpotlightAssignCausalNode({
      broadcastUid: p.broadcastUid,
      targetAvatarUid: p.targetAvatarUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );
  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;
  commitBroadcastAppend({ s, pres, branchId, causalGraph, broadcastUid: p.broadcastUid, charge });
  return { ok: true, value: { causalNodeId: node.id } };
}

export function broadcastSpotlightRelease(payload: { broadcastUid: string }): StudioResult<{ causalNodeId: string }> {
  return appendBroadcastNode("presence.broadcast.spotlight.release", payload.broadcastUid, (uid, args) =>
    buildBroadcastSpotlightReleaseCausalNode({ broadcastUid: uid, ...args })
  );
}

export function broadcastCameraFocus(payload: {
  broadcastUid: string;
  targetUid?: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.camera.focus", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { broadcastUid: string; targetUid?: string };
  const ctx = requireBroadcast({ broadcastUid: p.broadcastUid });
  if (!ctx.ok) return ctx;
  const { s, pres, branchId, causalGraph: cg0 } = ctx.value;
  let causalGraph = cg0;
  const writerSubject = `broadcast:${p.broadcastUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildBroadcastCameraFocusCausalNode({
      broadcastUid: p.broadcastUid,
      targetUid: p.targetUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );
  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;
  commitBroadcastAppend({ s, pres, branchId, causalGraph, broadcastUid: p.broadcastUid, charge });
  return { ok: true, value: { causalNodeId: node.id } };
}

export function broadcastCameraFollow(payload: {
  broadcastUid: string;
  targetUid: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.camera.follow", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { broadcastUid: string; targetUid: string };
  const ctx = requireBroadcast({ broadcastUid: p.broadcastUid });
  if (!ctx.ok) return ctx;
  const { s, pres, branchId, causalGraph: cg0 } = ctx.value;
  let causalGraph = cg0;
  const writerSubject = `broadcast:${p.broadcastUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildBroadcastCameraFollowCausalNode({
      broadcastUid: p.broadcastUid,
      targetUid: p.targetUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );
  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;
  commitBroadcastAppend({ s, pres, branchId, causalGraph, broadcastUid: p.broadcastUid, charge });
  return { ok: true, value: { causalNodeId: node.id } };
}

export function broadcastCameraCut(payload: { broadcastUid: string }): StudioResult<{ causalNodeId: string }> {
  return appendBroadcastNode("presence.broadcast.camera.cut", payload.broadcastUid, (uid, args) =>
    buildBroadcastCameraCutCausalNode({ broadcastUid: uid, ...args })
  );
}

export function broadcastOverlayPush(payload: {
  broadcastUid: string;
  overlayId: string;
  overlayKind: string;
  payload?: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.overlay.push", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { broadcastUid: string; overlayId: string; overlayKind: string; payload?: string };
  const ctx = requireBroadcast({ broadcastUid: p.broadcastUid });
  if (!ctx.ok) return ctx;
  const { s, pres, branchId, causalGraph: cg0 } = ctx.value;
  let causalGraph = cg0;
  const writerSubject = `broadcast:${p.broadcastUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildBroadcastOverlayPushCausalNode({
      broadcastUid: p.broadcastUid,
      overlayId: p.overlayId,
      overlayKind: p.overlayKind,
      payload: p.payload,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );
  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;
  commitBroadcastAppend({ s, pres, branchId, causalGraph, broadcastUid: p.broadcastUid, charge });
  return { ok: true, value: { causalNodeId: node.id } };
}

export function broadcastOverlayRemove(payload: {
  broadcastUid: string;
  overlayId: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.overlay.remove", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { broadcastUid: string; overlayId: string };
  const ctx = requireBroadcast({ broadcastUid: p.broadcastUid });
  if (!ctx.ok) return ctx;
  const { s, pres, branchId, causalGraph: cg0 } = ctx.value;
  let causalGraph = cg0;
  const writerSubject = `broadcast:${p.broadcastUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildBroadcastOverlayRemoveCausalNode({
      broadcastUid: p.broadcastUid,
      overlayId: p.overlayId,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );
  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;
  commitBroadcastAppend({ s, pres, branchId, causalGraph, broadcastUid: p.broadcastUid, charge });
  return { ok: true, value: { causalNodeId: node.id } };
}

export function broadcastAudienceWave(payload: {
  broadcastUid: string;
  intensity?: number;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.audience.wave", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { broadcastUid: string; intensity?: number };
  const ctx = requireBroadcast({ broadcastUid: p.broadcastUid });
  if (!ctx.ok) return ctx;
  const { s, pres, branchId, causalGraph: cg0 } = ctx.value;
  let causalGraph = cg0;
  const writerSubject = `broadcast:${p.broadcastUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildBroadcastAudienceWaveCausalNode({
      broadcastUid: p.broadcastUid,
      intensity: p.intensity,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );
  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;
  commitBroadcastAppend({ s, pres, branchId, causalGraph, broadcastUid: p.broadcastUid, charge });
  return { ok: true, value: { causalNodeId: node.id } };
}

export function broadcastAudienceApplause(payload: {
  broadcastUid: string;
  intensity?: number;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.audience.applause", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { broadcastUid: string; intensity?: number };
  const ctx = requireBroadcast({ broadcastUid: p.broadcastUid });
  if (!ctx.ok) return ctx;
  const { s, pres, branchId, causalGraph: cg0 } = ctx.value;
  let causalGraph = cg0;
  const writerSubject = `broadcast:${p.broadcastUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildBroadcastAudienceApplauseCausalNode({
      broadcastUid: p.broadcastUid,
      intensity: p.intensity,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );
  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;
  commitBroadcastAppend({ s, pres, branchId, causalGraph, broadcastUid: p.broadcastUid, charge });
  return { ok: true, value: { causalNodeId: node.id } };
}

export function broadcastAudienceCheer(payload: {
  broadcastUid: string;
  intensity?: number;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.audience.cheer", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { broadcastUid: string; intensity?: number };
  const ctx = requireBroadcast({ broadcastUid: p.broadcastUid });
  if (!ctx.ok) return ctx;
  const { s, pres, branchId, causalGraph: cg0 } = ctx.value;
  let causalGraph = cg0;
  const writerSubject = `broadcast:${p.broadcastUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildBroadcastAudienceCheerCausalNode({
      broadcastUid: p.broadcastUid,
      intensity: p.intensity,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );
  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;
  commitBroadcastAppend({ s, pres, branchId, causalGraph, broadcastUid: p.broadcastUid, charge });
  return { ok: true, value: { causalNodeId: node.id } };
}

export function broadcastAudienceEmojiRain(payload: {
  broadcastUid: string;
  emoji?: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.audience.emojiRain", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { broadcastUid: string; emoji?: string };
  const ctx = requireBroadcast({ broadcastUid: p.broadcastUid });
  if (!ctx.ok) return ctx;
  const { s, pres, branchId, causalGraph: cg0 } = ctx.value;
  let causalGraph = cg0;
  const writerSubject = `broadcast:${p.broadcastUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildBroadcastAudienceEmojiRainCausalNode({
      broadcastUid: p.broadcastUid,
      emoji: p.emoji,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );
  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;
  commitBroadcastAppend({ s, pres, branchId, causalGraph, broadcastUid: p.broadcastUid, charge });
  return { ok: true, value: { causalNodeId: node.id } };
}

export function broadcastClipMark(payload: {
  broadcastUid: string;
  roomUid: string;
  label: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.clip.mark", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { broadcastUid: string; roomUid: string; label: string };
  const ctx = requireBroadcast({ broadcastUid: p.broadcastUid });
  if (!ctx.ok) return ctx;
  const { s, pres, branchId, causalGraph: cg0 } = ctx.value;
  let causalGraph = cg0;
  const writerSubject = `broadcast:${p.broadcastUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildBroadcastClipMarkCausalNode({
      broadcastUid: p.broadcastUid,
      roomUid: p.roomUid,
      label: p.label,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );
  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;
  commitBroadcastAppend({ s, pres, branchId, causalGraph, broadcastUid: p.broadcastUid, charge });
  return { ok: true, value: { causalNodeId: node.id } };
}

export function broadcastSceneSet(payload: {
  broadcastUid: string;
  roomUid: string;
  sceneMode: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.scene.set", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { broadcastUid: string; roomUid: string; sceneMode: string };
  const ctx = requireBroadcast({ broadcastUid: p.broadcastUid });
  if (!ctx.ok) return ctx;
  const { s, pres, branchId, causalGraph: cg0 } = ctx.value;
  let causalGraph = cg0;
  const writerSubject = `broadcast:${p.broadcastUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildBroadcastSceneSetCausalNode({
      broadcastUid: p.broadcastUid,
      roomUid: p.roomUid,
      sceneMode: p.sceneMode,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );
  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;
  commitBroadcastAppend({ s, pres, branchId, causalGraph, broadcastUid: p.broadcastUid, charge });
  return { ok: true, value: { causalNodeId: node.id } };
}
