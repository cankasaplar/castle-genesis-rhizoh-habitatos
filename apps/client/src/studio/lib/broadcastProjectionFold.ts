import { CAUSAL_GENESIS_NODE_ID } from "../runtime/causalGraph";
import type {
  BroadcastCameraMode,
  BroadcastOverlayEntry,
  BroadcastProjection,
  BroadcastProjectionState,
  CausalGraphRegistry,
  CausalNode,
  DirectorClipMarker,
  DirectorState
} from "../types/rskOntology.js";

const CLIP_CAP = 64;

function emptyProjection(uid: string, roomUid: string): BroadcastProjection {
  return {
    uid,
    roomUid,
    state: "idle",
    stageAvatarUids: [],
    audienceCount: 0,
    cameraMode: "auto",
    overlayStack: []
  };
}

function emptyDirector(): DirectorState {
  return { sceneMode: "show", clipMarkers: [] };
}

/** Walk writer tip → genesis via `causeIds[0]` (linear broadcast writer chain). */
export function collectBroadcastWriterChain(
  graph: CausalGraphRegistry,
  branchId: string,
  broadcastUid: string
): CausalNode[] {
  const tailKey = `${branchId}::broadcast:${broadcastUid}`;
  let id: string | undefined = graph.writerHeads[tailKey];
  const rev: CausalNode[] = [];
  const guardMax = 50000;
  let guard = 0;
  while (id && guard++ < guardMax) {
    const n: CausalNode | undefined = graph.nodes[id];
    if (!n) break;
    rev.push(n);
    const c0: string | undefined = n.causeIds[0];
    if (!c0 || c0 === CAUSAL_GENESIS_NODE_ID) break;
    id = c0;
  }
  return rev.reverse();
}

function asRecord(d: unknown): Record<string, unknown> | null {
  return d && typeof d === "object" ? (d as Record<string, unknown>) : null;
}

function broadcastUidFromDelta(d: Record<string, unknown>): string | undefined {
  const u = d.broadcastUid ?? d.channelUid;
  return typeof u === "string" && u.trim() ? u : undefined;
}

/**
 * Deterministic fold: broadcast writer chain → `BroadcastProjection` + per-room `DirectorState` fragments.
 */
export function foldBroadcastWriterChain(
  graph: CausalGraphRegistry,
  branchId: string,
  broadcastUid: string
): { projection: BroadcastProjection; directorByRoomUid: Record<string, DirectorState> } {
  const chain = collectBroadcastWriterChain(graph, branchId, broadcastUid);
  let roomUid = "";
  let proj = emptyProjection(broadcastUid, roomUid);
  const directors: Record<string, DirectorState> = {};
  /** Join/leave deltas do not always carry role on leave — track from joins. */
  const membership = new Map<string, "speaker" | "audience">();

  const ensureDir = (r: string) => {
    if (!r) return null;
    if (!directors[r]) directors[r] = emptyDirector();
    return directors[r];
  };

  for (const n of chain) {
    const raw = n.payload?.delta;
    const d = asRecord(raw);
    if (!d || typeof d.kind !== "string") continue;
    const kind = d.kind;
    const uid = broadcastUidFromDelta(d) ?? broadcastUid;
    if (uid !== broadcastUid) continue;
    const ts = typeof n.timestamp === "number" ? n.timestamp : Date.now();

    if (kind === "presence.broadcast.created") {
      const ru = typeof d.roomUid === "string" ? d.roomUid : "";
      roomUid = ru;
      proj = {
        ...emptyProjection(broadcastUid, roomUid),
        lastEventAt: ts
      };
      continue;
    }

    if (kind === "presence.broadcast.join") {
      const avatarUid = typeof d.avatarUid === "string" ? d.avatarUid : "";
      const role = d.role === "speaker" ? "speaker" : "audience";
      if (avatarUid && membership.has(avatarUid)) continue;
      if (avatarUid) membership.set(avatarUid, role);
      if (role === "speaker") {
        if (avatarUid && !proj.stageAvatarUids.includes(avatarUid)) {
          proj = { ...proj, stageAvatarUids: [...proj.stageAvatarUids, avatarUid], lastEventAt: ts };
        }
      } else if (avatarUid) {
        proj = { ...proj, audienceCount: proj.audienceCount + 1, lastEventAt: ts };
      }
      continue;
    }

    if (kind === "presence.broadcast.leave") {
      const avatarUid = typeof d.avatarUid === "string" ? d.avatarUid : "";
      const role = membership.get(avatarUid) ?? (d.role === "speaker" ? "speaker" : "audience");
      membership.delete(avatarUid);
      if (role === "speaker") {
        proj = {
          ...proj,
          stageAvatarUids: proj.stageAvatarUids.filter((x) => x !== avatarUid),
          lastEventAt: ts
        };
      } else {
        proj = {
          ...proj,
          audienceCount: Math.max(0, proj.audienceCount - 1),
          lastEventAt: ts
        };
      }
      continue;
    }

    if (kind === "broadcast.start") {
      const host = typeof d.hostAvatarUid === "string" ? d.hostAvatarUid : undefined;
      const ru = typeof d.roomUid === "string" ? d.roomUid : proj.roomUid;
      const sceneMode = typeof d.sceneMode === "string" ? d.sceneMode : undefined;
      proj = {
        ...proj,
        roomUid: ru || proj.roomUid,
        state: "live" as BroadcastProjectionState,
        hostAvatarUid: host ?? proj.hostAvatarUid,
        startedAt: proj.startedAt ?? ts,
        lastEventAt: ts
      };
      if (ru) {
        const dir = ensureDir(ru);
        if (dir) {
          dir.currentBroadcastUid = broadcastUid;
          if (sceneMode) dir.sceneMode = sceneMode;
        }
      }
      continue;
    }

    if (kind === "broadcast.pause") {
      proj = { ...proj, state: "paused", lastEventAt: ts };
      continue;
    }
    if (kind === "broadcast.resume") {
      proj = { ...proj, state: "live", lastEventAt: ts };
      continue;
    }
    if (kind === "broadcast.stop") {
      proj = { ...proj, state: "ended", lastEventAt: ts };
      for (const dir of Object.values(directors)) {
        if (dir.currentBroadcastUid === broadcastUid) dir.currentBroadcastUid = undefined;
      }
      continue;
    }

    if (kind === "segment.open") {
      const seg = typeof d.segmentId === "string" ? d.segmentId : "";
      proj = { ...proj, activeSegmentId: seg || proj.activeSegmentId, lastEventAt: ts };
      continue;
    }
    if (kind === "segment.close") {
      proj = { ...proj, activeSegmentId: undefined, lastEventAt: ts };
      continue;
    }

    if (kind === "spotlight.assign") {
      const t = typeof d.targetAvatarUid === "string" ? d.targetAvatarUid : undefined;
      proj = { ...proj, spotlightTargetUid: t, lastEventAt: ts };
      continue;
    }
    if (kind === "spotlight.release") {
      proj = { ...proj, spotlightTargetUid: undefined, lastEventAt: ts };
      continue;
    }

    if (kind === "camera.focus") {
      proj = { ...proj, cameraMode: "focus" as BroadcastCameraMode, lastEventAt: ts };
      continue;
    }
    if (kind === "camera.follow") {
      proj = { ...proj, cameraMode: "follow" as BroadcastCameraMode, lastEventAt: ts };
      continue;
    }
    if (kind === "camera.cut") {
      proj = { ...proj, cameraMode: "cut" as BroadcastCameraMode, lastEventAt: ts };
      continue;
    }

    if (kind === "overlay.push") {
      const oid = typeof d.overlayId === "string" ? d.overlayId : "";
      const ok = typeof d.overlayKind === "string" ? d.overlayKind : "generic";
      const payload = typeof d.payload === "string" ? d.payload : undefined;
      if (!oid) continue;
      const entry: BroadcastOverlayEntry = { id: oid, kind: ok, payload };
      const stack = proj.overlayStack.filter((x) => x.id !== oid).concat(entry);
      proj = { ...proj, overlayStack: stack.slice(-32), lastEventAt: ts };
      continue;
    }
    if (kind === "overlay.remove") {
      const oid = typeof d.overlayId === "string" ? d.overlayId : "";
      proj = {
        ...proj,
        overlayStack: proj.overlayStack.filter((x) => x.id !== oid),
        lastEventAt: ts
      };
      continue;
    }

    if (
      kind === "audience.wave" ||
      kind === "audience.applause" ||
      kind === "audience.cheer" ||
      kind === "audience.emojiRain"
    ) {
      const intensity = typeof d.intensity === "number" && Number.isFinite(d.intensity) ? d.intensity : 0.55;
      proj = { ...proj, audienceEnergy: Math.min(1, Math.max(0, intensity)), lastEventAt: ts };
      continue;
    }

    if (kind === "broadcast.clip.mark") {
      const ru = typeof d.roomUid === "string" ? d.roomUid : "";
      const label = typeof d.label === "string" ? d.label : "clip";
      const atMs = typeof d.atMs === "number" ? d.atMs : ts;
      const dir = ensureDir(ru);
      if (dir) {
        const next: DirectorClipMarker = { atMs, label, causalNodeId: n.id };
        dir.clipMarkers = [...dir.clipMarkers, next].slice(-CLIP_CAP);
      }
      proj = { ...proj, lastEventAt: ts };
      continue;
    }

    if (kind === "broadcast.scene.set") {
      const ru = typeof d.roomUid === "string" ? d.roomUid : "";
      const sm = typeof d.sceneMode === "string" ? d.sceneMode : "show";
      const dir = ensureDir(ru);
      if (dir) dir.sceneMode = sm;
      proj = { ...proj, lastEventAt: ts };
      continue;
    }
  }

  return { projection: proj, directorByRoomUid: directors };
}
