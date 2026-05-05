/**
 * Context builder — derive-only. Kernel snapshot → tier digests → RhizohMemoryContextPackV0.
 * No I/O, no mutation. Pair with salienceScorer + promptComposer + agentBridge.
 */
import { CAUSAL_GENESIS_NODE_ID, CAUSAL_MAIN_BRANCH_ID } from "./causalGraph";
import type { CausalNode, RhizohMemoryContextPackV0, StudioKernelState } from "../types/rskOntology";

export interface BuildRhizohMemoryContextPackOptions {
  /** Cap causal clips taken as episodic anchors */
  episodicClipLimit?: number;
  /** Prefer this mind writer chain when resolving episodic clips */
  mindInstanceId?: string;
  /** Injected distilled memory (historian / continuity); empty if unknown */
  longTermHint?: string;
}

function summarizeWorldRegions(s: StudioKernelState): Record<string, string> {
  const out: Record<string, string> = {};
  const topo = s.worldTopology?.regions ?? {};
  const loc = s.worldLocomotion;
  const chunks = s.worldChunks?.chunks ?? {};
  const health = s.worldEcology?.healthByRegionUid ?? {};
  const active = loc?.activeRegionUid;
  for (const r of Object.values(topo)) {
    const ch = chunks[r.uid];
    const loaded = ch?.loaded !== false;
    const occ = ch?.occupancy ?? 0;
    const h = health[r.uid] ?? r.ecologyHealth ?? 0;
    const isActive = r.uid === active;
    out[r.uid] = [
      r.title,
      `kind:${r.kind}`,
      loaded ? "loaded" : "unloaded",
      `occ:${occ}`,
      `eco:${h.toFixed(2)}`,
      isActive ? "ACTIVE" : ""
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return out;
}

function summarizeRooms(s: StudioKernelState): Record<string, string> {
  const out: Record<string, string> = {};
  const rooms = s.presence?.rooms ?? {};
  for (const room of Object.values(rooms)) {
    const n = room.memberAvatarUids?.length ?? 0;
    const zones = room.zones ? Object.keys(room.zones).length : 0;
    out[room.uid] = `${room.title ?? room.uid} · members:${n} · zones:${zones}`;
  }
  return out;
}

function summarizeBroadcasts(s: StudioKernelState): Record<string, string> {
  const out: Record<string, string> = {};
  const br = s.presence?.broadcasts ?? {};
  for (const b of Object.values(br)) {
    const sp = b.speakerAvatarUids?.length ?? 0;
    const au = b.audienceAvatarUids?.length ?? 0;
    out[b.uid] = `${b.title ?? b.uid} · stream:${b.streamState} · sp:${sp} aud:${au}`;
  }
  return out;
}

function summarizeSocial(s: StudioKernelState): string[] {
  const edges = s.presence?.roomFieldEdges ?? [];
  return edges.slice(0, 48).map(
    (e) => `${e.fromRoomUid}→${e.toRoomUid}·κ${e.coupling.toFixed(2)}`
  );
}

function collectEpisodicClipIds(s: StudioKernelState, limit: number, mindInstanceId?: string): string[] {
  const nodes = Object.values(s.registry?.causalGraph?.nodes ?? {}) as CausalNode[];
  const branchId = s.runtime?.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let pool = nodes.filter((n) => n.id !== CAUSAL_GENESIS_NODE_ID && n.branchId === branchId);
  if (mindInstanceId) {
    const heads = s.registry.causalGraph?.writerHeads ?? {};
    const tailKey = `${branchId}::${mindInstanceId}`;
    const tip = heads[tailKey];
    if (tip) {
      const nodeMap = s.registry.causalGraph?.nodes ?? {};
      const chain: string[] = [];
      let cur: string | undefined = tip;
      const seen = new Set<string>();
      while (cur && !seen.has(cur)) {
        seen.add(cur);
        const cn: CausalNode | undefined = nodeMap[cur];
        if (!cn) break;
        chain.push(cn.id);
        cur = cn.causeIds?.[0];
        if (cur === CAUSAL_GENESIS_NODE_ID) break;
      }
      return chain.slice(0, limit);
    }
  }
  return pool
    .sort((a, b) => b.tickIndex - a.tickIndex || b.timestamp - a.timestamp)
    .slice(0, limit)
    .map((n) => n.id);
}

function defaultLongTerm(s: StudioKernelState, hint?: string): string {
  if (hint && hint.trim()) return hint.trim();
  const profiles = Object.values(s.registry?.memoryProfile ?? {});
  if (!profiles.length) return "";
  return profiles
    .slice(0, 3)
    .map((p) => p.label ?? p.uid)
    .join("; ");
}

/**
 * Pure: builds memory pack without salience (use `scoreRhizohSalience` then merge).
 */
export function buildRhizohMemoryContextPack(
  s: StudioKernelState,
  opts?: BuildRhizohMemoryContextPackOptions
): RhizohMemoryContextPackV0 {
  const limit = Math.max(1, Math.min(32, opts?.episodicClipLimit ?? 8));
  return {
    episodicClipIds: collectEpisodicClipIds(s, limit, opts?.mindInstanceId),
    roomDigestByRoomUid: summarizeRooms(s),
    regionDigestByRegionUid: summarizeWorldRegions(s),
    socialEdgeDigests: summarizeSocial(s),
    broadcastDigestByBroadcastUid: summarizeBroadcasts(s),
    longTermDistilled: defaultLongTerm(s, opts?.longTermHint)
  };
}
