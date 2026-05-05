import { bindPresenceRoomToRegion, upsertWorldPortal, upsertWorldRegion } from "../store/worldTopologySlice";
import { getStudioKernelState } from "../store/internalStore";

const GREENROOM_MAIN_HALL_ROOM_UID = "greenroom:main";
/** Aligns with `PRESENCE_HALL_HALF` (presence hall xz); topology must not overlap hall unless intentional (priority). */
const HALL_HALF = 11;
const STRIP_BASE_X = 520;
const STRIP_HALF_W = 42;

const REGION_LIST = [
  { uid: "region:castle-district", kind: "district", title: "Castle District" },
  { uid: "region:academy", kind: "academy", title: "Academy" },
  { uid: "region:garden", kind: "garden", title: "Garden" },
  { uid: "region:lab", kind: "lab", title: "Lab" },
  { uid: "region:watch-tower", kind: "watch_tower", title: "Watch Tower" },
  { uid: "region:hall", kind: "hall", title: "Hall" },
  { uid: "region:green-room", kind: "green_room", title: "Green Room" },
  { uid: "region:marketplace", kind: "marketplace", title: "Marketplace" },
  { uid: "region:arena", kind: "arena", title: "Arena" },
  { uid: "region:dream-spiral", kind: "dream_spiral", title: "Dream Spiral" },
  { uid: "region:wild-zone", kind: "wild_zone", title: "Wild Zone" }
] as const;

const EDGE_LIST = [
  ["edge:district-hall", "region:castle-district", "region:hall"],
  ["edge:hall-greenroom", "region:hall", "region:green-room"],
  ["edge:district-academy", "region:castle-district", "region:academy"],
  ["edge:district-garden", "region:castle-district", "region:garden"],
  ["edge:district-lab", "region:castle-district", "region:lab"],
  ["edge:district-market", "region:castle-district", "region:marketplace"],
  ["edge:district-arena", "region:castle-district", "region:arena"],
  ["edge:tower-wild", "region:watch-tower", "region:wild-zone"],
  ["edge:academy-dream", "region:academy", "region:dream-spiral"]
] as const;

export function ensureCastleWorldTopology(): void {
  const s = getStudioKernelState();
  if (Object.keys(s.worldTopology?.regions ?? {}).length >= REGION_LIST.length) return;

  for (let i = 0; i < REGION_LIST.length; i++) {
    const r = REGION_LIST[i];
    const stripX = STRIP_BASE_X + i * 95;
    const isGreenRoom = r.uid === "region:green-room";
    const bounds = isGreenRoom
      ? {
          minX: -HALL_HALF - 1,
          maxX: HALL_HALF + 1,
          minZ: -HALL_HALF - 1,
          maxZ: HALL_HALF + 1
        }
      : {
          minX: stripX - STRIP_HALF_W,
          maxX: stripX + STRIP_HALF_W,
          minZ: -90,
          maxZ: 90
        };
    upsertWorldRegion({
      uid: r.uid,
      kind: r.kind,
      title: r.title,
      bounds,
      priority: isGreenRoom ? 100 : r.uid === "region:hall" ? 8 : 0,
      portals: [],
      density: 0.5,
      weather: "clear",
      biome: r.kind === "garden" ? "lush" : r.kind === "wild_zone" ? "wild" : "urban",
      ecologyHealth: 0.72
    });
  }
  for (const [uid, from, to] of EDGE_LIST) {
    upsertWorldPortal({
      uid,
      fromRegionUid: from,
      toRegionUid: to,
      cost: 1,
      bidirectional: true
    });
  }

  bindPresenceRoomToRegion({ roomUid: GREENROOM_MAIN_HALL_ROOM_UID, regionUid: "region:green-room" });
}
