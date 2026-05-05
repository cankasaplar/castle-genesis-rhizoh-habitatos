import type {
  AttentionField,
  AttentionRenderPack,
  PresenceLayerState,
  PresenceZoneId,
  RenderBiasEmissiveMapEntry,
  RenderBiasField
} from "../types/rskOntology.js";
import { deriveAttentionRenderPack } from "./deriveRenderBiasField";

const ZONE_IDS: PresenceZoneId[] = ["stage", "audience", "lounge", "backstage", "vip", "sandbox"];

/** Social topology: energy bleeds across adjacent zones (5B-C). */
const ZONE_ADJ: Record<PresenceZoneId, PresenceZoneId[]> = {
  stage: ["audience", "backstage"],
  audience: ["stage", "lounge", "sandbox"],
  lounge: ["audience", "vip", "sandbox"],
  backstage: ["stage", "audience"],
  vip: ["lounge"],
  sandbox: ["audience", "lounge"]
};

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

function initZoneScalars(pack: AttentionRenderPack): Partial<Record<PresenceZoneId, number>> {
  const { attention, renderBias: b } = pack;
  const s: Partial<Record<PresenceZoneId, number>> = {};
  for (const z of ZONE_IDS) {
    const fromMap = b.emissiveMap.find((e) => e.key === `zone:${z}`)?.intensity ?? 0;
    const h = attention.focusHeatmap[z];
    const fromHeat = h != null ? h * 0.82 : 0;
    s[z] = Math.max(fromMap, fromHeat, 0);
  }
  s.stage = Math.max(s.stage ?? 0, b.stageIntensity * 0.92);
  s.audience = Math.max(s.audience ?? 0, attention.audienceField.energy * 0.88);
  return s;
}

/** Jacobi-like diffusion on zone scalars. */
function diffuseZones(
  s: Partial<Record<PresenceZoneId, number>>,
  iterations: number,
  neighborMix: number
): Partial<Record<PresenceZoneId, number>> {
  let cur = { ...s };
  const mix = clamp01(neighborMix);
  for (let it = 0; it < iterations; it++) {
    const next: Partial<Record<PresenceZoneId, number>> = {};
    for (const z of ZONE_IDS) {
      const nbrs = ZONE_ADJ[z] ?? [];
      let sum = 0;
      let c = 0;
      for (const n of nbrs) {
        const v = cur[n];
        if (v != null && v > 0) {
          sum += v;
          c++;
        }
      }
      const avg = c > 0 ? sum / c : 0;
      const self = cur[z] ?? 0;
      next[z] = clamp01(self * (1 - mix) + avg * mix);
    }
    cur = next;
  }
  return cur;
}

/** Spotlight acts as attenuation + local gain (non-assign heuristic: bias dampens far zones). */
function applySpotlightAttenuation(
  zones: Partial<Record<PresenceZoneId, number>>,
  attn: AttentionField
): Partial<Record<PresenceZoneId, number>> {
  const b = attn.spotlightField.bias;
  if (b < 0.04) return zones;
  const out: Partial<Record<PresenceZoneId, number>> = { ...zones };
  const damp = (z: PresenceZoneId, factor: number) => {
    const v = out[z];
    if (v == null) return;
    out[z] = clamp01(v * (1 - factor * b));
  };
  damp("lounge", 0.14);
  damp("sandbox", 0.1);
  damp("vip", 0.12);
  const st = out.stage ?? 0;
  out.stage = clamp01(st + 0.12 * b);
  return out;
}

/** Gaze toward spotlight target pulls secondary glow (attention convergence bleed). */
function spreadAvatarGlow(attn: AttentionField, avatarGlow: Record<string, number>): Record<string, number> {
  const out = { ...avatarGlow };
  const spot = attn.spotlightField.targetUid;
  if (!spot) return out;
  const seed = clamp01(out[spot] ?? 0.45);
  for (const e of attn.gazeGraph) {
    if (e.kind !== "avatar_lookAt" || e.toUid !== spot) continue;
    const g = out[e.fromUid] ?? 0;
    out[e.fromUid] = clamp01(Math.max(g, seed * 0.38));
  }
  return out;
}

/** Pet glow couples to owner social body (relational tether). */
function tetherPetGlow(
  petGlow: Record<string, number>,
  petLinks: AttentionField["petLinks"],
  ownerGlow: Record<string, number>
): Record<string, number> {
  const out = { ...petGlow };
  for (const { petUid, ownerAvatarUid } of petLinks) {
    const og = ownerGlow[ownerAvatarUid] ?? 0.1;
    out[petUid] = clamp01(Math.max(out[petUid] ?? 0, (out[petUid] ?? 0) * 0.55 + og * 0.42));
  }
  return out;
}

/** Shared attention target → pulse coupling (one propagation step). */
function waveRhizohPulse(
  pres: PresenceLayerState | undefined,
  roomUid: string,
  rhizohPulse: Record<string, number>
): Record<string, number> {
  const out = { ...rhizohPulse };
  const comps = pres?.companionAgents ?? {};
  const byTarget = new Map<string, string[]>();
  for (const [id, ag] of Object.entries(comps)) {
    if (ag.roomUid !== roomUid) continue;
    const t = ag.attentionTargetUid ?? ag.ownerAvatarUid;
    if (!t) continue;
    if (!byTarget.has(t)) byTarget.set(t, []);
    byTarget.get(t)!.push(id);
  }
  for (const ids of byTarget.values()) {
    if (ids.length < 2) continue;
    let mx = 0;
    for (const id of ids) mx = Math.max(mx, out[id] ?? 0);
    const spread = mx * 0.2;
    for (const id of ids) out[id] = clamp01((out[id] ?? 0) + spread);
  }
  return out;
}

function zonesToEmissiveMap(zones: Partial<Record<PresenceZoneId, number>>): RenderBiasEmissiveMapEntry[] {
  const list: RenderBiasEmissiveMapEntry[] = [];
  for (const z of ZONE_IDS) {
    const v = zones[z];
    if (v != null && v > 0.02) list.push({ key: `zone:${z}`, intensity: clamp01(v) });
  }
  return list;
}

export type PropagateRenderBiasOptions = {
  /** Zone diffusion iterations (default 2). */
  zoneIterations?: number;
  /** 0..1 neighbor blend per iteration (default 0.38). */
  neighborMix?: number;
};

/**
 * 5B-C — Spatial diffusion + wave propagation on top of point-sampled `RenderBiasField`.
 * Pure function: safe for replay/shadow; viewport samples the returned field.
 */
export function propagateRenderBiasField(
  pack: AttentionRenderPack,
  pres: PresenceLayerState | undefined,
  opts?: PropagateRenderBiasOptions
): RenderBiasField {
  const iterations = Math.max(0, Math.min(6, opts?.zoneIterations ?? 2));
  const neighborMix = clamp01(opts?.neighborMix ?? 0.38);
  const { attention, renderBias: base } = pack;
  const roomUid = base.roomUid;

  let zones = initZoneScalars(pack);
  zones = diffuseZones(zones, iterations, neighborMix);
  zones = applySpotlightAttenuation(zones, attention);

  const mergedZoneEmissive = zonesToEmissiveMap(zones);
  const avatarSpot = base.emissiveMap.filter((e) => e.key.startsWith("avatar:"));
  const emissiveMap = [...mergedZoneEmissive, ...avatarSpot];

  const diffusedStage = zones.stage ?? base.stageIntensity;
  const stageIntensity = clamp01(base.stageIntensity * 0.35 + diffusedStage * 0.65);

  let avatarGlow = spreadAvatarGlow(attention, base.avatarGlow);
  let petGlow = tetherPetGlow(base.petGlow, attention.petLinks, avatarGlow);
  const rhizohPulse = waveRhizohPulse(pres, roomUid, base.rhizohPulse);

  return {
    roomUid,
    emissiveMap,
    cameraFocusWeight: clamp01(base.cameraFocusWeight * 0.88 + stageIntensity * 0.12),
    stageIntensity,
    avatarGlow,
    petGlow,
    rhizohPulse
  };
}

export function derivePropagatedRenderBiasField(
  pres: PresenceLayerState | undefined,
  roomUid: string,
  opts?: PropagateRenderBiasOptions
): RenderBiasField {
  const pack = deriveAttentionRenderPack(pres, roomUid);
  return propagateRenderBiasField(pack, pres, opts);
}
