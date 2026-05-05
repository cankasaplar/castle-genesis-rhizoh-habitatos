/**
 * Wire Green Room (`greenroom:main`) to gateway presence mesh: SSE ingest + causal tip publish.
 */
import {
  GREENROOM_MAIN_HALL_ROOM_UID,
  ensureGreenRoomMainHallBound
} from "../lib/greenRoomRouteBinding.js";
import { getStudioKernelState, subscribeStudioKernel } from "../store/internalStore";
import { ingestPresenceMeshDelta } from "../store/presenceMeshIngestSlice";
import { CAUSAL_MAIN_BRANCH_ID } from "./causalGraph";
import { PresenceMeshClient, resolvePresenceMeshHttpBase, type PresenceMeshDeltaEvent } from "./presenceMeshClient";

let client: PresenceMeshClient | null = null;
let unsubKernel: (() => void) | null = null;
let unsubMesh: (() => void) | null = null;
let raf = 0;
const lastPubByWriter: Record<string, string> = {};

function applyReplayTail(roomUid: string, raw: unknown) {
  if (!raw || typeof raw !== "object") return;
  const entries = (raw as { entries?: unknown[] }).entries;
  if (!Array.isArray(entries)) return;
  for (const ent of entries) {
    if (!ent || typeof ent !== "object") continue;
    const e = ent as Record<string, unknown>;
    if (e.node == null) continue;
    const ev: PresenceMeshDeltaEvent = {
      kind: "delta",
      seq: Number(e.seq) || 0,
      roomUid,
      node: e.node,
      projectionPatch: e.projectionPatch,
      serverAt: Number(e.ts) || Date.now(),
      clientUid: typeof e.clientUid === "string" ? e.clientUid : undefined,
      writerSubject: e.writerSubject != null ? String(e.writerSubject) : null
    };
    ingestPresenceMeshDelta(ev);
  }
}

function schedulePublishTips() {
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(runPublishTips);
}

/** Call after local causal writes so mesh SSE fans out new tips (incl. `agent:bridge:*`). */
export function scheduleGreenRoomMeshCausalPublish(): void {
  schedulePublishTips();
}

function runPublishTips() {
  raf = 0;
  const c = client;
  if (!c?.getRoomUid()) return;
  const s = getStudioKernelState();
  const ownerId = s.identity?.ownerId;
  if (!ownerId) return;
  const avatarUid = `avatar:${ownerId}`;
  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  const graph = s.registry?.causalGraph;
  if (!graph?.nodes) return;
  const writers = new Set<string>([`presence:${avatarUid}`, `room:${GREENROOM_MAIN_HALL_ROOM_UID}`]);
  for (const tailKey of Object.keys(graph.writerHeads ?? {})) {
    const idx = tailKey.indexOf("::");
    if (idx === -1) continue;
    const w = tailKey.slice(idx + 2);
    if (w.startsWith("agent:bridge:")) writers.add(w);
  }
  for (const writerSubject of writers) {
    const tailKey = `${branchId}::${writerSubject}`;
    const tipId = graph.writerHeads[tailKey];
    if (!tipId || lastPubByWriter[writerSubject] === tipId) continue;
    const node = graph.nodes[tipId];
    if (!node) continue;
    lastPubByWriter[writerSubject] = tipId;
    void c.publish(node, undefined, { writerSubject });
  }
}

/**
 * Connects mesh for the canonical Green Room hall. No-op if `VITE_GATEWAY_HTTP` / health base is unset.
 * @returns disposer
 */
export function startGreenRoomPresenceMesh(): () => void {
  if (!resolvePresenceMeshHttpBase()) return () => {};

  ensureGreenRoomMainHallBound();
  const roomUid = GREENROOM_MAIN_HALL_ROOM_UID;
  for (const k of Object.keys(lastPubByWriter)) delete lastPubByWriter[k];

  if (client) client.disconnect();
  client = new PresenceMeshClient();

  void (async () => {
    const ok = await client!.connect(roomUid);
    if (!ok) return;
    const raw = await client!.replay({ fromSeq: 1 });
    applyReplayTail(roomUid, raw);
  })();

  unsubMesh?.();
  unsubMesh = client.subscribe((ev) => {
    if (ev.kind !== "delta") return;
    ingestPresenceMeshDelta(ev);
  });

  unsubKernel?.();
  unsubKernel = subscribeStudioKernel(schedulePublishTips);

  return () => {
    unsubMesh?.();
    unsubMesh = null;
    unsubKernel?.();
    unsubKernel = null;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    client?.disconnect();
    client = null;
    for (const k of Object.keys(lastPubByWriter)) delete lastPubByWriter[k];
  };
}
