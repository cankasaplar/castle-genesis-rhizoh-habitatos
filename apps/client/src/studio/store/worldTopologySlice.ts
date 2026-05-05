import type {
  PresenceRoomMapBinding,
  StudioResult,
  WorldPortalEdge,
  WorldRegion,
  WorldTopologyState
} from "../types/rskOntology.js";
import { defaultWorldChunks, defaultWorldEcology, defaultWorldTopology } from "./initialState";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";

function nextTopology(): WorldTopologyState {
  return getStudioKernelState().worldTopology ?? defaultWorldTopology();
}

export function upsertWorldRegion(region: WorldRegion): StudioResult<WorldRegion> {
  if (!region.uid) return { ok: false, error: "region_uid_required" };
  const s = getStudioKernelState();
  const top = nextTopology();
  const prev = top.regions[region.uid];
  setStudioKernelState({
    ...s,
    worldTopology: {
      ...top,
      regions: { ...top.regions, [region.uid]: { ...prev, ...region } }
    }
  });
  return { ok: true, value: region };
}

export function upsertWorldPortal(edge: WorldPortalEdge): StudioResult<WorldPortalEdge> {
  if (!edge.uid || !edge.fromRegionUid || !edge.toRegionUid) return { ok: false, error: "portal_uid_or_region_required" };
  const s = getStudioKernelState();
  const top = nextTopology();
  setStudioKernelState({
    ...s,
    worldTopology: {
      ...top,
      edges: { ...top.edges, [edge.uid]: edge }
    }
  });
  return { ok: true, value: edge };
}

export function bindPresenceRoomToRegion(binding: PresenceRoomMapBinding): StudioResult<PresenceRoomMapBinding> {
  if (!binding.roomUid || !binding.regionUid) return { ok: false, error: "room_or_region_required" };
  const s = getStudioKernelState();
  const top = nextTopology();
  setStudioKernelState({
    ...s,
    worldTopology: {
      ...top,
      roomBindings: { ...top.roomBindings, [binding.roomUid]: binding }
    }
  });
  return { ok: true, value: binding };
}

export function resolveWorldRoute(fromRegionUid: string, toRegionUid: string): StudioResult<string[]> {
  const top = nextTopology();
  if (!top.regions[fromRegionUid] || !top.regions[toRegionUid]) {
    return { ok: false, error: "region_not_found" };
  }
  if (fromRegionUid === toRegionUid) return { ok: true, value: [fromRegionUid] };

  const q: string[] = [fromRegionUid];
  const prev = new Map<string, string | null>();
  prev.set(fromRegionUid, null);
  while (q.length > 0) {
    const cur = q.shift()!;
    if (cur === toRegionUid) break;
    for (const e of Object.values(top.edges)) {
      if (e.fromRegionUid === cur && !prev.has(e.toRegionUid)) {
        prev.set(e.toRegionUid, cur);
        q.push(e.toRegionUid);
      }
      if (e.bidirectional && e.toRegionUid === cur && !prev.has(e.fromRegionUid)) {
        prev.set(e.fromRegionUid, cur);
        q.push(e.fromRegionUid);
      }
    }
  }
  if (!prev.has(toRegionUid)) return { ok: false, error: "route_not_found" };
  const route: string[] = [];
  let cur: string | null = toRegionUid;
  while (cur) {
    route.push(cur);
    cur = prev.get(cur) ?? null;
  }
  route.reverse();
  return { ok: true, value: route };
}

export function patchRegionChunkRuntime(input: {
  regionUid: string;
  loaded: boolean;
  ownerId?: string;
  occupancy?: number;
}): void {
  const s = getStudioKernelState();
  const chunks = s.worldChunks ?? defaultWorldChunks();
  const now = Date.now();
  const prev = chunks.chunks[input.regionUid];
  const next = {
    regionUid: input.regionUid,
    loaded: input.loaded,
    ownerId: input.ownerId ?? prev?.ownerId,
    occupancy: input.occupancy ?? prev?.occupancy ?? 0,
    lastLoadedAt: input.loaded ? now : prev?.lastLoadedAt,
    lastUnloadedAt: input.loaded ? prev?.lastUnloadedAt : now
  };
  setStudioKernelState({
    ...s,
    worldChunks: { ...chunks, chunks: { ...chunks.chunks, [input.regionUid]: next } }
  });
}

export function patchRegionEcology(input: {
  regionUid: string;
  weather?: string;
  biome?: string;
  ecologyHealth?: number;
}): void {
  const s = getStudioKernelState();
  const eco = s.worldEcology ?? defaultWorldEcology();
  setStudioKernelState({
    ...s,
    worldEcology: {
      weatherByRegionUid: {
        ...eco.weatherByRegionUid,
        ...(input.weather ? { [input.regionUid]: input.weather } : {})
      },
      biomeByRegionUid: {
        ...eco.biomeByRegionUid,
        ...(input.biome ? { [input.regionUid]: input.biome } : {})
      },
      healthByRegionUid: {
        ...eco.healthByRegionUid,
        ...(typeof input.ecologyHealth === "number" ? { [input.regionUid]: Math.max(0, Math.min(1, input.ecologyHealth)) } : {})
      }
    }
  });
}
