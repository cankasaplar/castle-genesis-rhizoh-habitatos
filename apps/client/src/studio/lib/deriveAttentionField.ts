import type {
  AttentionField,
  AttentionGazeEdge,
  AttentionResonancePair,
  PresenceLayerState,
  PresenceZoneId
} from "../types/rskOntology.js";

function emptyField(roomUid: string): AttentionField {
  return {
    roomUid,
    gazeTargets: {},
    gazeGraph: [],
    focusHeatmap: {},
    resonancePairs: [],
    spotlightField: { bias: 0 },
    audienceField: { energy: 0 },
    companionLinks: [],
    petLinks: []
  };
}

function pushEdge(edges: AttentionGazeEdge[], fromUid: string, toUid: string, kind: AttentionGazeEdge["kind"]) {
  if (!fromUid || !toUid || fromUid === toUid) return;
  if (edges.some((e) => e.fromUid === fromUid && e.toUid === toUid && e.kind === kind)) return;
  edges.push({ fromUid, toUid, kind });
}

function pushPair(pairs: AttentionResonancePair[], a: string, b: string, kind: AttentionResonancePair["kind"]) {
  if (!a || !b || a === b) return;
  const x = a < b ? a : b;
  const y = a < b ? b : a;
  if (pairs.some((p) => p.a === x && p.b === y && p.kind === kind)) return;
  pairs.push({ a: x, b: y, kind });
}

/**
 * Derive a room-scoped attention field from presence + broadcast projections (no mutable UI state).
 */
export function deriveAttentionField(pres: PresenceLayerState | undefined, roomUid: string): AttentionField {
  if (!pres || !roomUid.trim()) return emptyField(roomUid);
  const room = pres.rooms[roomUid];
  if (!room) return emptyField(roomUid);

  const memberSet = new Set(room.memberAvatarUids);
  const gazeTargets: Record<string, string | undefined> = {};
  const gazeGraph: AttentionGazeEdge[] = [];
  const resonancePairs: AttentionResonancePair[] = [];

  const zoneWeights: Partial<Record<PresenceZoneId, number>> = {};
  const bumpZone = (z: PresenceZoneId | undefined, w: number) => {
    if (!z) return;
    zoneWeights[z] = (zoneWeights[z] ?? 0) + w;
  };

  for (const uid of room.memberAvatarUids) {
    const av = pres.avatars[uid];
    const pr = av?.projection;
    if (!pr || pr.roomUid !== roomUid) continue;
    const lt = pr.lookAtTargetUid;
    gazeTargets[uid] = lt;
    if (lt && memberSet.has(lt)) {
      pushEdge(gazeGraph, uid, lt, "avatar_lookAt");
      pushPair(resonancePairs, uid, lt, "gaze");
    }
    const z = pr.zoneId;
    bumpZone(z, 0.12);
    if (pr.status === "talking" || pr.status === "broadcasting") bumpZone(z, 0.38);
  }

  const companions = pres.companionAgents ?? {};
  for (const [cUid, ag] of Object.entries(companions)) {
    if (ag.roomUid !== roomUid) continue;
    gazeTargets[cUid] = ag.attentionTargetUid ?? ag.ownerAvatarUid;
    if (ag.attentionTargetUid) {
      pushEdge(gazeGraph, cUid, ag.attentionTargetUid, "companion_attention");
      pushPair(resonancePairs, cUid, ag.attentionTargetUid, "companion");
    } else if (ag.ownerAvatarUid) {
      pushEdge(gazeGraph, cUid, ag.ownerAvatarUid, "companion_attention");
      pushPair(resonancePairs, cUid, ag.ownerAvatarUid, "companion");
    }
  }

  const pets = pres.pets ?? {};
  const petLinks: AttentionField["petLinks"] = [];
  for (const [pUid, pet] of Object.entries(pets)) {
    if (pet.roomUid !== roomUid) continue;
    petLinks.push({ petUid: pUid, ownerAvatarUid: pet.ownerAvatarUid });
    gazeTargets[pUid] = pet.ownerAvatarUid;
    pushEdge(gazeGraph, pUid, pet.ownerAvatarUid, "pet_anchor");
    pushPair(resonancePairs, pUid, pet.ownerAvatarUid, "pet_owner");
  }

  const director = pres.directorByRoomUid?.[roomUid];
  const bcUid = director?.currentBroadcastUid;
  const bproj = bcUid ? pres.broadcastProjections?.[bcUid] : undefined;
  const broadcastMatchesRoom = bproj && bproj.roomUid === roomUid;

  let spotlightBias = 0;
  let spotlightTarget: string | undefined;
  if (broadcastMatchesRoom && bproj) {
    if (bproj.state === "live" || bproj.state === "paused" || bproj.state === "prelive") spotlightBias = 0.28;
    if (bproj.spotlightTargetUid) {
      spotlightTarget = bproj.spotlightTargetUid;
      spotlightBias = Math.max(spotlightBias, 0.82);
      const anchor = bproj.hostAvatarUid ?? bproj.stageAvatarUids[0];
      if (anchor && bproj.spotlightTargetUid !== anchor) {
        pushPair(resonancePairs, bproj.spotlightTargetUid, anchor, "spotlight");
      }
    }
  }

  const audienceEnergy =
    broadcastMatchesRoom && typeof bproj?.audienceEnergy === "number" && Number.isFinite(bproj.audienceEnergy)
      ? Math.min(1, Math.max(0, bproj.audienceEnergy))
      : 0;

  let maxZ = 0;
  for (const w of Object.values(zoneWeights)) maxZ = Math.max(maxZ, w);
  const focusHeatmap: Partial<Record<PresenceZoneId, number>> = {};
  if (maxZ > 0) {
    for (const [z, w] of Object.entries(zoneWeights)) {
      focusHeatmap[z as PresenceZoneId] = Math.min(1, w / maxZ);
    }
  }

  const companionLinks = Object.entries(companions)
    .filter(([, ag]) => ag.roomUid === roomUid)
    .map(([companionUid, ag]) => ({
      companionUid,
      ownerAvatarUid: ag.ownerAvatarUid,
      attentionTargetUid: ag.attentionTargetUid
    }));

  return {
    roomUid,
    gazeTargets,
    gazeGraph,
    focusHeatmap,
    resonancePairs,
    spotlightField: {
      broadcastUid: broadcastMatchesRoom ? bcUid : undefined,
      targetUid: spotlightTarget,
      bias: spotlightBias
    },
    audienceField: { energy: audienceEnergy, broadcastUid: broadcastMatchesRoom ? bcUid : undefined },
    companionLinks,
    petLinks
  };
}
