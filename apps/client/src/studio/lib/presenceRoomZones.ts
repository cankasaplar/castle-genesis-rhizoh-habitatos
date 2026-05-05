import type { PresenceRoom, PresenceRoomZones, PresenceZoneDef, PresenceZoneId } from "../types/rskOntology";

/** Canonical zone keys — social physics (who sits where) before body collision. */
export const PRESENCE_ZONE_IDS: PresenceZoneId[] = [
  "stage",
  "audience",
  "lounge",
  "backstage",
  "vip",
  "sandbox"
];

/** Default Main Hall layout (XZ hall plane, Y up). Non-overlapping tiles. */
export function defaultMainHallZones(): PresenceRoomZones {
  return {
    stage: {
      bounds: { minX: -5, maxX: 5, minZ: -10, maxZ: -6 },
      semantics: { broadcastingSurface: true, defaultStatus: "broadcasting" }
    },
    audience: {
      bounds: { minX: -8, maxX: 8, minZ: -5.5, maxZ: 2 },
      semantics: { spectatorTier: true, defaultStatus: "watching" }
    },
    lounge: {
      bounds: { minX: -8, maxX: 8, minZ: 2.5, maxZ: 9 },
      semantics: { defaultStatus: "quiet" }
    },
    backstage: {
      bounds: { minX: 5, maxX: 10, minZ: -10, maxZ: -5.5 },
      semantics: {
        backstageHidden: true,
        broadcastingSurface: false,
        toolAccess: true,
        defaultStatus: "quiet",
        agentAllowed: true,
        petAllowed: true
      }
    },
    vip: {
      bounds: { minX: -10, maxX: -5.5, minZ: 3, maxZ: 9 },
      semantics: { vipGated: true, defaultStatus: "quiet" }
    },
    sandbox: {
      bounds: { minX: 5.5, maxX: 9.5, minZ: -1, maxZ: 3 },
      semantics: { toolAccess: true, defaultStatus: "quiet" }
    }
  };
}

export function ensureRoomZones(room: PresenceRoom): PresenceRoomZones {
  return room.zones ?? defaultMainHallZones();
}

export function randomPointInZone(z: PresenceZoneDef): { x: number; y: number; z: number; rotY: number } {
  const { minX, maxX, minZ, maxZ } = z.bounds;
  const x = minX + Math.random() * (maxX - minX);
  const z1 = minZ + Math.random() * (maxZ - minZ);
  return { x, y: 0, z: z1, rotY: (Math.random() * 2 - 1) * Math.PI };
}

export function clampToZoneBounds(
  p: { x: number; y: number; z: number },
  z: PresenceZoneDef
): { x: number; y: number; z: number } {
  const { minX, maxX, minZ, maxZ } = z.bounds;
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
  return {
    x: clamp(p.x, minX, maxX),
    y: clamp(p.y, -0.5, 4),
    z: clamp(p.z, minZ, maxZ)
  };
}

export function isPointInZone(p: { x: number; z: number }, z: PresenceZoneDef): boolean {
  const b = z.bounds;
  return p.x >= b.minX && p.x <= b.maxX && p.z >= b.minZ && p.z <= b.maxZ;
}
