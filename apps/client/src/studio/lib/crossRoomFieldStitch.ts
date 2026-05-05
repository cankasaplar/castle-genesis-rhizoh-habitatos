import type { PresenceLayerState, RenderBiasField } from "../types/rskOntology";

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

function zoneIntensity(bias: RenderBiasField, zone: string): number {
  return bias.emissiveMap.find((e) => e.key === `zone:${zone}`)?.intensity ?? 0;
}

function withZoneIntensity(bias: RenderBiasField, zone: string, add: number): RenderBiasField {
  const em = [...bias.emissiveMap];
  const i = em.findIndex((e) => e.key === `zone:${zone}`);
  const v = clamp01((i >= 0 ? em[i]!.intensity : 0) + add);
  if (i >= 0) em[i] = { ...em[i]!, intensity: v };
  else if (add > 0.002) em.push({ key: `zone:${zone}`, intensity: v });
  return {
    ...bias,
    emissiveMap: em,
    stageIntensity: clamp01(bias.stageIntensity + (zone === "stage" ? add * 0.55 : 0))
  };
}

export type CrossRoomStitchOptions = {
  /** Upper bound on bleed per edge (default 0.11). */
  maxBleed?: number;
  /** Temporal echo half-life for ended broadcasts (ms). */
  echoHalfLifeMs?: number;
};

/**
 * Residual audience “temperature” from recently ended broadcasts in each room (temporal echo).
 */
export function computeBroadcastEchoByRoom(
  pres: PresenceLayerState | undefined,
  wallMs: number,
  echoHalfLifeMs = 48_000
): Record<string, { audienceEcho: number }> {
  const out: Record<string, { audienceEcho: number }> = {};
  if (!pres?.broadcastProjections) return out;
  for (const p of Object.values(pres.broadcastProjections)) {
    const ru = p.roomUid;
    if (!ru) continue;
    if (p.state !== "ended") continue;
    const t = p.lastEventAt ?? 0;
    const age = wallMs - t;
    if (age < 0 || age > 180_000) continue;
    const decay = Math.exp(-age / echoHalfLifeMs);
    const add = clamp01((p.audienceEnergy ?? 0) * decay * 0.3);
    if (!out[ru]) out[ru] = { audienceEcho: 0 };
    out[ru].audienceEcho = clamp01(out[ru].audienceEcho + add);
  }
  return out;
}

export type CrossRoomLeak = { audienceBleed: number; stageBleed: number };

/**
 * Partitioned cross-room leak: only `roomFieldEdges`; each edge contributes at most `coupling * maxBleed * sourceScalar`.
 */
export function computeCrossRoomLeaks(
  pres: PresenceLayerState | undefined,
  localBiasByRoom: Record<string, RenderBiasField>,
  maxBleed: number
): Record<string, CrossRoomLeak> {
  const leaks: Record<string, CrossRoomLeak> = {};
  for (const r of Object.keys(localBiasByRoom)) leaks[r] = { audienceBleed: 0, stageBleed: 0 };
  const cap = clamp01(maxBleed);
  const edges = pres?.roomFieldEdges ?? [];
  for (const e of edges) {
    const fromBias = localBiasByRoom[e.fromRoomUid];
    if (!fromBias || !leaks[e.toRoomUid]) continue;
    const w = clamp01(e.coupling);
    const aud = zoneIntensity(fromBias, "audience");
    const src = clamp01(fromBias.stageIntensity * 0.42 + aud * 0.58);
    const bleed = src * w * cap;
    leaks[e.toRoomUid].audienceBleed += bleed * 0.72;
    leaks[e.toRoomUid].stageBleed += bleed * 0.28;
  }
  for (const r of Object.keys(leaks)) {
    leaks[r].audienceBleed = clamp01(leaks[r].audienceBleed);
    leaks[r].stageBleed = clamp01(leaks[r].stageBleed);
  }
  return leaks;
}

export function mergeEchoAndLeakIntoBias(
  bias: RenderBiasField,
  leak: CrossRoomLeak,
  echo: { audienceEcho: number }
): RenderBiasField {
  let next = withZoneIntensity(bias, "audience", leak.audienceBleed + echo.audienceEcho * 0.85);
  next = withZoneIntensity(next, "stage", leak.stageBleed + echo.audienceEcho * 0.12);
  next = {
    ...next,
    cameraFocusWeight: clamp01(next.cameraFocusWeight + leak.stageBleed * 0.15 + echo.audienceEcho * 0.08)
  };
  return next;
}

/**
 * Rooms that participate in cross-room stitch: members + any endpoint of `roomFieldEdges`.
 */
export function collectRoomsForCrossRoomStitch(pres: PresenceLayerState | undefined): string[] {
  const ids = new Set<string>();
  for (const e of pres?.roomFieldEdges ?? []) {
    if (e.fromRoomUid) ids.add(e.fromRoomUid);
    if (e.toRoomUid) ids.add(e.toRoomUid);
  }
  for (const a of Object.values(pres?.avatars ?? {})) {
    const r = a.projection?.roomUid;
    if (r && a.currentRoomUid === r) ids.add(r);
  }
  return [...ids];
}

/**
 * Multi-room: per-room propagated bias + bounded cross-edge leak + temporal echo.
 */
export function stitchCrossRoomBiasMap(
  pres: PresenceLayerState | undefined,
  localBiasByRoom: Record<string, RenderBiasField>,
  wallMs: number,
  opts?: CrossRoomStitchOptions
): Record<string, RenderBiasField> {
  const maxBleed = Math.min(0.22, Math.max(0, opts?.maxBleed ?? 0.11));
  const echoHalf = opts?.echoHalfLifeMs ?? 48_000;
  const echo = computeBroadcastEchoByRoom(pres, wallMs, echoHalf);
  const leaks = computeCrossRoomLeaks(pres, localBiasByRoom, maxBleed);
  const out: Record<string, RenderBiasField> = {};
  for (const [room, b] of Object.entries(localBiasByRoom)) {
    const lk = leaks[room] ?? { audienceBleed: 0, stageBleed: 0 };
    const ec = echo[room] ?? { audienceEcho: 0 };
    out[room] = mergeEchoAndLeakIntoBias(b, lk, ec);
  }
  return out;
}
