import type {
  AttentionField,
  AttentionRenderPack,
  PresenceLayerState,
  PresenceZoneId,
  RenderBiasEmissiveMapEntry,
  RenderBiasField
} from "../types/rskOntology.js";
import { deriveAttentionField } from "./deriveAttentionField";

const ZONE_IDS: PresenceZoneId[] = ["stage", "audience", "lounge", "backstage", "vip", "sandbox"];
const OWNER_EMOTION_RIGS = new Set(["clap", "cheer", "laugh"]);

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

/**
 * Expand `AttentionField` + room presence into lighting / focus biases (5B-A).
 */
export function deriveRenderBiasFromAttention(
  attention: AttentionField,
  pres: PresenceLayerState | undefined,
  roomUid: string
): RenderBiasField {
  const room = pres?.rooms[roomUid];
  const spot = attention.spotlightField;
  const audienceE = attention.audienceField.energy;

  const emissiveMap: RenderBiasEmissiveMapEntry[] = [];
  for (const z of ZONE_IDS) {
    const h = attention.focusHeatmap[z];
    if (h != null && h > 0.02) {
      emissiveMap.push({ key: `zone:${z}`, intensity: clamp01(0.2 + h * 0.7) });
    }
  }
  if (spot.targetUid) {
    emissiveMap.push({
      key: `avatar:${spot.targetUid}`,
      intensity: clamp01(0.32 + spot.bias * 0.58)
    });
  }

  const stageHeat = attention.focusHeatmap.stage ?? 0;
  const audHeat = attention.focusHeatmap.audience ?? 0;
  const stageIntensity = clamp01(
    0.24 * stageHeat + 0.5 * spot.bias + 0.36 * audienceE + 0.14 * audHeat
  );

  const cameraFocusWeight = clamp01(
    0.38 * spot.bias + 0.4 * stageHeat + 0.26 * audienceE + (spot.targetUid ? 0.16 : 0)
  );

  const avatarGlow: Record<string, number> = {};
  if (room && pres) {
    for (const uid of room.memberAvatarUids) {
      const av = pres.avatars[uid];
      const pr = av?.projection;
      if (!pr || pr.roomUid !== roomUid) continue;
      const zh = attention.focusHeatmap[pr.zoneId] ?? 0.12;
      let g = 0.08 + zh * 0.38;
      if (spot.targetUid === uid) g += 0.34 + spot.bias * 0.22;
      if (pr.status === "talking" || pr.status === "broadcasting") g += 0.3;
      if (pr.zoneId === "audience") g += audienceE * 0.24;
      avatarGlow[uid] = clamp01(g);
    }
  }

  const petGlow: Record<string, number> = {};
  for (const { petUid, ownerAvatarUid } of attention.petLinks) {
    const own = pres?.avatars[ownerAvatarUid]?.projection;
    const rig = own?.rigAnimation;
    let g = 0.05 + audienceE * 0.18 + spot.bias * 0.1;
    if (rig && OWNER_EMOTION_RIGS.has(rig)) g += 0.45;
    else if (rig === "talk") g += 0.2;
    petGlow[petUid] = clamp01(g);
  }

  const rhizohPulse: Record<string, number> = {};
  const comps = pres?.companionAgents ?? {};
  for (const [cUid, ag] of Object.entries(comps)) {
    if (ag.roomUid !== roomUid) continue;
    let p = 0.1;
    if (ag.state === "speaking" || ag.state === "responding") p = 0.74;
    else if (ag.state === "guiding") p = 0.5;
    else if (ag.state === "listening") p = 0.26;
    const pairBoost = attention.resonancePairs.filter((x) => x.a === cUid || x.b === cUid).length * 0.045;
    rhizohPulse[cUid] = clamp01(p + pairBoost + audienceE * 0.12);
  }

  return {
    roomUid,
    emissiveMap,
    cameraFocusWeight,
    stageIntensity,
    avatarGlow,
    petGlow,
    rhizohPulse
  };
}

export function deriveRenderBiasField(pres: PresenceLayerState | undefined, roomUid: string): RenderBiasField {
  const attention = deriveAttentionField(pres, roomUid);
  return deriveRenderBiasFromAttention(attention, pres, roomUid);
}

export function deriveAttentionRenderPack(pres: PresenceLayerState | undefined, roomUid: string): AttentionRenderPack {
  const attention = deriveAttentionField(pres, roomUid);
  return {
    attention,
    renderBias: deriveRenderBiasFromAttention(attention, pres, roomUid)
  };
}
