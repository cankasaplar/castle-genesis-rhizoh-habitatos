import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { CAUSAL_MAIN_BRANCH_ID } from "../runtime/causalGraph";
import { ENTITY_CACHE_KEY, projectEntity } from "../runtime/projectionReducer";
import { collectRoomsForCrossRoomStitch, stitchCrossRoomBiasMap } from "../lib/crossRoomFieldStitch";
import { GREENROOM_MAIN_HALL_ROOM_UID } from "../lib/greenRoomRouteBinding";
import { derivePropagatedRenderBiasField } from "../lib/propagateRenderBiasField";
import { getStudioKernelState, setStudioKernelState, subscribeStudioKernel } from "../store/internalStore";
import { ingestGltfSceneGraphStreamOnKernelV0 } from "../../rhizoh/runtime/sceneGraphStreamV0.js";
import { isWalGeometryIngressEnabledV0 } from "../../rhizoh/runtime/walWorldAuthorityGateV0.js";
import { tickSomaticExecutionCouplingV0 } from "../lib/somaticExecutionCouplingLayerV0";
import {
  installRealSimulationEngineCouplingV0,
  uninstallRealSimulationEngineCouplingV0
} from "../lib/realSimulationEngineCouplingV0";
import { PRESENCE_HALL_HALF } from "../store/presenceSpatialSlice";
import type { CompanionAgentArchetype, PresenceLayerState } from "../types/rskOntology";
import { getCompanionArchetypeDefinitionV1 } from "../runtime/companionAgentRegistryV1.js";

type AvatarBundle = { body: THREE.Mesh; ring: THREE.Mesh; mat: THREE.MeshStandardMaterial };

type CompanionBundle = { group: THREE.Group; core: THREE.Mesh; halo: THREE.Mesh; mat: THREE.MeshStandardMaterial };

type PetGhostBundle = { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial };

/** Dominant hall room for single-viewport field sampling (5B-B). */
function pickPrimaryHallRoomUid(pres: PresenceLayerState | undefined): string | null {
  if (!pres?.avatars) return null;
  const counts = new Map<string, number>();
  for (const a of Object.values(pres.avatars)) {
    const r = a.projection;
    if (!r?.roomUid || a.currentRoomUid !== r.roomUid) continue;
    counts.set(r.roomUid, (counts.get(r.roomUid) ?? 0) + 1);
  }
  let best: string | null = null;
  let max = 0;
  for (const [id, c] of counts) {
    if (c > max) {
      max = c;
      best = id;
    }
  }
  return best;
}

function PresenceZoneHud() {
  const [label, setLabel] = useState("—");
  useEffect(() => {
    const sync = () => {
      const s = getStudioKernelState();
      const bits = Object.entries(s.presence?.avatars ?? {})
        .map(([id, a]) => {
          const pr = a.projection;
          if (!pr?.roomUid || !pr.zoneId) return null;
          const proto = [
            pr.raisedHand ? "✋" : null,
            pr.lastReactionKind ? `:${pr.lastReactionKind}` : null,
            pr.summonedPetUid ? "pet" : null,
            a.ghostPetSlotUid ? "ghost" : null,
            pr.lastAgentInvokeUid ? "@agent" : null
          ]
            .filter(Boolean)
            .join("");
          return `${id.replace(/^avatar:/, "").slice(0, 12)} · ${pr.zoneId} · ${pr.role}${proto ? ` ${proto}` : ""}`;
        })
        .filter(Boolean) as string[];
      setLabel(bits.length ? bits.join("   ") : "—");
    };
    sync();
    return subscribeStudioKernel(sync);
  }, []);
  return (
    <div className="border-t border-white/10 px-2 py-1 text-[7px] font-mono text-cyan-200/85 tracking-tight">
      CONTEXT · {label}
    </div>
  );
}

/**
 * P1 entity shell + P2 room spatial: `AvatarEntity.projection` drives hall pose when active;
 * otherwise linked `EntityProjection` offset (legacy nudge).
 */
export function PresenceStudioViewport() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    entityMeshes: Map<string, THREE.Mesh>;
    avatarBundles: Map<string, AvatarBundle>;
    companionBundles: Map<string, CompanionBundle>;
    petGhostBundles: Map<string, PetGhostBundle>;
    geoEntity: THREE.BoxGeometry;
    geoAvatar: THREE.BoxGeometry;
    geoCompanion: THREE.IcosahedronGeometry;
    geoPetGhost: THREE.TetrahedronGeometry;
    matEntity: THREE.MeshStandardMaterial;
    matAvatar: THREE.MeshStandardMaterial;
    matRing: THREE.MeshBasicMaterial;
    matHalo: THREE.MeshBasicMaterial;
  } | null>(null);

  useEffect(() => {
    const w = typeof window !== "undefined" ? (window as unknown as { __rskRealSim?: boolean }) : undefined;
    if (!w?.__rskRealSim) return undefined;
    installRealSimulationEngineCouplingV0();
    return () => uninstallRealSimulationEngineCouplingV0();
  }, []);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const w = Math.max(260, el.clientWidth || 280);
    const h = 200;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050a14);

    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 400);
    camera.position.set(0, 14, 18);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    el.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0x8899bb, 0x080410, 0.85);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.55);
    dir.position.set(3, 8, 4);
    scene.add(dir);

    const grid = new THREE.GridHelper(PRESENCE_HALL_HALF * 2, 22, 0x1e3a4a, 0x0f172a);
    scene.add(grid);

    const stageGeo = new THREE.PlaneGeometry(8, 4);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x4c1d95,
      emissive: 0x2e1065,
      emissiveIntensity: 0.35,
      metalness: 0.2,
      roughness: 0.75,
      transparent: true,
      opacity: 0.88
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.rotation.x = -Math.PI / 2;
    stage.position.set(0, 0.02, -7);
    scene.add(stage);

    const loungeGeo = new THREE.PlaneGeometry(PRESENCE_HALL_HALF * 1.6, PRESENCE_HALL_HALF * 1.2);
    const loungeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x0c1524,
      emissiveIntensity: 0.2,
      metalness: 0.1,
      roughness: 0.9,
      transparent: true,
      opacity: 0.75
    });
    const lounge = new THREE.Mesh(loungeGeo, loungeMat);
    lounge.rotation.x = -Math.PI / 2;
    lounge.position.set(0, 0.015, 3);
    scene.add(lounge);

    const geoEntity = new THREE.BoxGeometry(0.4, 0.55, 0.4);
    const geoAvatar = new THREE.BoxGeometry(0.32, 0.72, 0.32);
    const matEntity = new THREE.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.15, roughness: 0.65 });
    const matAvatar = new THREE.MeshStandardMaterial({ color: 0xf472b6, metalness: 0.2, roughness: 0.55 });
    const matRing = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const geoCompanion = new THREE.IcosahedronGeometry(0.2, 0);
    const matHalo = new THREE.MeshBasicMaterial({
      color: 0xe879f9,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const geoPetGhost = new THREE.TetrahedronGeometry(0.12, 0);

    const entityMeshes = new Map<string, THREE.Mesh>();
    const avatarBundles = new Map<string, AvatarBundle>();
    const companionBundles = new Map<string, CompanionBundle>();
    const petGhostBundles = new Map<string, PetGhostBundle>();

    sceneRef.current = {
      scene,
      camera,
      renderer,
      entityMeshes,
      avatarBundles,
      companionBundles,
      petGhostBundles,
      geoEntity,
      geoAvatar,
      geoCompanion,
      geoPetGhost,
      matEntity,
      matAvatar,
      matRing,
      matHalo
    };

    if (isWalGeometryIngressEnabledV0()) {
      const hallHalf = PRESENCE_HALL_HALF;
      ingestGltfSceneGraphStreamOnKernelV0(getStudioKernelState, setStudioKernelState, {
        roomScope: GREENROOM_MAIN_HALL_ROOM_UID,
        frameId: "viewport:hall:static:v0",
        gltfOrNodes: [
          {
            nodeUid: "hall:stage",
            transform: { x: 0, y: 0.02, z: -7, rotY: 0 },
            bounds: { hx: 4, hy: 0.02, hz: 2 }
          },
          {
            nodeUid: "hall:lounge",
            transform: { x: 0, y: 0.015, z: 3, rotY: 0 },
            bounds: { hx: hallHalf * 0.8, hy: 0.02, hz: hallHalf * 0.6 }
          },
          {
            nodeUid: "hall:floor_grid",
            transform: { x: 0, y: 0, z: 0, rotY: 0 },
            bounds: { hx: hallHalf, hy: 0.01, hz: hallHalf }
          }
        ]
      });
    }

    const ringGeo = new THREE.RingGeometry(0.42, 0.58, 28);
    const haloRingGeo = new THREE.RingGeometry(0.28, 0.38, 24);

    let lastCouplingMs = performance.now();

    const sync = () => {
      const ctx = sceneRef.current;
      if (!ctx) return;
      const nowMs = performance.now();
      const dtMs = Math.min(250, Math.max(0, nowMs - lastCouplingMs));
      lastCouplingMs = nowMs;
      tickSomaticExecutionCouplingV0({ dtMs, nowMs, getState: getStudioKernelState });
      const s = getStudioKernelState();
      const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
      const graph = s.registry.causalGraph;

      for (const uid of Object.keys(s.registry.entity)) {
        const key = ENTITY_CACHE_KEY(branchId, uid);
        const cached = s.entityProjectionCache[key];
        const proj = cached ?? projectEntity(graph, uid, branchId, { soulUid: s.registry.entity[uid]?.soulUid });
        const pos = proj?.state?.physical?.pos ?? { x: 0, y: 0, z: 0 };
        let mesh = ctx.entityMeshes.get(uid);
        if (!mesh) {
          mesh = new THREE.Mesh(ctx.geoEntity, ctx.matEntity);
          ctx.scene.add(mesh);
          ctx.entityMeshes.set(uid, mesh);
        }
        mesh.position.set(pos.x, pos.y + 0.28, pos.z);
      }

      const avatars = s.presence?.avatars ?? {};
      const companions = s.presence?.companionAgents ?? {};
      const pets = s.presence?.pets ?? {};

      const frameSec = nowMs / 1000;
      const pres = s.presence;
      const hallRoomUid = pickPrimaryHallRoomUid(pres);
      const propOpts = { zoneIterations: 2, neighborMix: 0.38 } as const;
      let bias = null;
      if (hallRoomUid) {
        const rooms = collectRoomsForCrossRoomStitch(pres);
        const roomList = rooms.length > 0 ? rooms : [hallRoomUid];
        const local: Record<string, ReturnType<typeof derivePropagatedRenderBiasField>> = {};
        for (const r of roomList) {
          local[r] = derivePropagatedRenderBiasField(pres, r, propOpts);
        }
        const stitched = stitchCrossRoomBiasMap(pres, local, Date.now(), { maxBleed: 0.11 });
        bias = stitched[hallRoomUid] ?? local[hallRoomUid] ?? null;
      }
      let greenRoomBackstageDim = 1;
      if (hallRoomUid === GREENROOM_MAIN_HALL_ROOM_UID) {
        for (const a of Object.values(pres?.avatars ?? {})) {
          const pr = a.projection;
          if (pr?.roomUid === GREENROOM_MAIN_HALL_ROOM_UID && pr.zoneId === "backstage") {
            greenRoomBackstageDim = 0.66;
            break;
          }
        }
      }
      const zoneEm = (z: string) => bias?.emissiveMap.find((e) => e.key === `zone:${z}`)?.intensity ?? 0;
      stageMat.emissiveIntensity =
        (0.32 + zoneEm("stage") * 0.55 + (bias?.stageIntensity ?? 0) * 0.52) * greenRoomBackstageDim;
      loungeMat.emissiveIntensity =
        (0.17 + zoneEm("lounge") * 0.42 + zoneEm("audience") * 0.28) * greenRoomBackstageDim;
      dir.intensity =
        (0.52 + (bias?.stageIntensity ?? 0) * 0.42 + (bias?.cameraFocusWeight ?? 0) * 0.22) * greenRoomBackstageDim;
      const cfw = bias?.cameraFocusWeight ?? 0;
      camera.lookAt(0, -0.12 * cfw, -2.2 * cfw);

      for (const uid of [...ctx.avatarBundles.keys()]) {
        if (!avatars[uid]) {
          const b = ctx.avatarBundles.get(uid)!;
          ctx.scene.remove(b.body, b.ring);
          b.mat.dispose();
          ctx.avatarBundles.delete(uid);
        }
      }

      const hallPosForAvatar = (av: (typeof avatars)[string]): { x: number; y: number; z: number } | null => {
        const rp = av.projection;
        const useHall = !!(rp && av.currentRoomUid === rp.roomUid);
        if (useHall && rp) {
          return { x: rp.transform.x, y: rp.transform.y + 0.36, z: rp.transform.z };
        }
        if (av.linkedEntityUid) {
          const key = ENTITY_CACHE_KEY(branchId, av.linkedEntityUid);
          const cached = s.entityProjectionCache[key];
          const proj =
            cached ??
            projectEntity(graph, av.linkedEntityUid, branchId, {
              soulUid: s.registry.entity[av.linkedEntityUid]?.soulUid
            });
          const pos = proj?.state?.physical?.pos ?? { x: 0, y: 0, z: 0 };
          return { x: pos.x + 0.35, y: pos.y + 0.45, z: pos.z + 0.12 };
        }
        return null;
      };

      for (const [avUid, av] of Object.entries(avatars)) {
        const rp = av.projection;
        const useHall = !!(rp && av.currentRoomUid === rp.roomUid);
        let px = 0;
        let py = 0;
        let pz = 0;
        let status: string | undefined;

        const hp = hallPosForAvatar(av);
        if (!hp) continue;
        px = hp.x;
        py = hp.y;
        pz = hp.z;
        status = av.projection?.status;

        let bundle = ctx.avatarBundles.get(avUid);
        if (!bundle) {
          const mat = ctx.matAvatar.clone();
          mat.emissive = new THREE.Color(0x4a0a28);
          const body = new THREE.Mesh(ctx.geoAvatar, mat);
          const ring = new THREE.Mesh(ringGeo, ctx.matRing);
          ring.rotation.x = -Math.PI / 2;
          ctx.scene.add(body, ring);
          bundle = { body, ring, mat };
          ctx.avatarBundles.set(avUid, bundle);
        }

        const rig = rp?.rigAnimation ?? "idle";
        const rigAge = typeof rp?.lastRigEventAt === "number" ? nowMs - rp.lastRigEventAt : 99999;
        const reactAge = typeof rp?.lastReactionAt === "number" ? nowMs - rp.lastReactionAt : 99999;
        const reactFlash = reactAge < 400 ? 1 - reactAge / 400 : 0;
        const sway = Math.sin(frameSec * 1.65 + avUid.length * 0.31) * 0.055;
        const idleSwayX = (rig === "idle" || rigAge > 900) ? Math.sin(frameSec * 1.2) * 0.025 : Math.sin(frameSec * 2.4) * 0.012;
        const walkBob = rig === "walk" ? Math.abs(Math.sin(frameSec * 9)) * 0.09 : 0;
        const thinkFloat = rig === "think" ? Math.sin(frameSec * 2.05) * 0.04 : 0;
        const reactBob =
          ["clap", "cheer", "laugh"].includes(rig) && rigAge < 620 ? Math.abs(Math.sin(frameSec * 14)) * 0.05 * (1 - rigAge / 620) : 0;
        const handLift = useHall && (rp?.raisedHand || rp?.rigGesture === "hand_raise") ? 0.11 : 0;
        const talkPulse = rig === "talk" || status === "talking" || status === "broadcasting" ? 0.04 * Math.sin(frameSec * 11.5) : 0;

        let faceY = py;
        let faceX = px;
        let faceZ = pz;
        const ltUid = rp?.lookAtTargetUid;
        if (ltUid) {
          const ltAv = avatars[ltUid];
          const lth = ltAv ? hallPosForAvatar(ltAv) : null;
          if (lth) {
            faceX = lth.x;
            faceY = lth.y;
            faceZ = lth.z;
          }
        }
        const bodyY =
          py +
          handLift +
          walkBob +
          thinkFloat +
          reactBob +
          talkPulse +
          (rig === "idle" ? Math.sin(frameSec * 1.9) * 0.015 : 0);
        bundle.body.position.set(px + idleSwayX, bodyY, pz);
        bundle.ring.position.set(px + idleSwayX, bodyY - 0.34 + 0.02, pz);

        let rotY = (rp?.transform.rotY ?? 0) + (rig === "walk" ? sway * 0.45 : sway);
        if (ltUid && (faceX !== px || faceZ !== pz)) {
          rotY = Math.atan2(faceX - px, faceZ - pz);
        }
        bundle.body.rotation.y = rotY;

        const sc =
          1 +
          (rig === "talk" || status === "talking" ? 0.045 * (0.5 + 0.5 * Math.sin(frameSec * 10.2)) : 0) +
          reactFlash * 0.12;
        bundle.body.scale.setScalar(sc);

        const voice = status === "talking" || status === "broadcasting";
        const hand = useHall && rp?.raisedHand;
        bundle.ring.visible = voice || !!hand;

        let em = 0.08;
        if (rig === "talk" || voice) em += 0.2 * (0.5 + 0.5 * Math.sin(frameSec * 12));
        if (reactFlash > 0) em += reactFlash * 0.95;
        if (["clap", "cheer", "laugh"].includes(rig) && rigAge < 700) em += (1 - rigAge / 700) * 0.28;
        const inBiasRoom = !!(bias && useHall && rp?.roomUid && rp.roomUid === bias.roomUid);
        const socialGlow = inBiasRoom && bias ? (bias.avatarGlow[avUid] ?? 0.1) : 0.11;
        const activityPulse =
          inBiasRoom && bias
            ? 0.14 * (bias.stageIntensity * 0.55 + bias.cameraFocusWeight * 0.45) * (0.5 + 0.5 * Math.sin(frameSec * 6.8))
            : 0;
        const grPocket =
          rp?.roomUid === GREENROOM_MAIN_HALL_ROOM_UID && rp.zoneId === "backstage" ? 0.84 : 1;
        em = Math.min(2.35, (em + socialGlow * 0.58 + activityPulse) * (0.72 + socialGlow * 0.38) * grPocket);
        bundle.mat.emissiveIntensity = em;
      }

      for (const cid of [...ctx.companionBundles.keys()]) {
        if (!companions[cid]) {
          const b = ctx.companionBundles.get(cid)!;
          ctx.scene.remove(b.group);
          b.mat.dispose();
          ctx.companionBundles.delete(cid);
        }
      }

      for (const [cUid, ag] of Object.entries(companions)) {
        const archetypeDef = getCompanionArchetypeDefinitionV1(
          ag.archetype as CompanionAgentArchetype
        );
        if (!archetypeDef) continue;
        const owner = avatars[ag.ownerAvatarUid];
        if (!owner) continue;
        if (!hallPosForAvatar(owner)) continue;

        let cb = ctx.companionBundles.get(cUid);
        if (!cb) {
          const mat = new THREE.MeshStandardMaterial({
            color: archetypeDef.meshColor,
            emissive: archetypeDef.meshEmissive,
            emissiveIntensity: 0.35,
            metalness: 0.35,
            roughness: 0.45
          });
          const core = new THREE.Mesh(ctx.geoCompanion, mat);
          const halo = new THREE.Mesh(haloRingGeo, ctx.matHalo);
          halo.rotation.x = -Math.PI / 2;
          const group = new THREE.Group();
          group.add(core, halo);
          ctx.scene.add(group);
          cb = { group, core, halo, mat };
          ctx.companionBundles.set(cUid, cb);
        }

        const wobble = 0.08;
        const cx = ag.transform.x + Math.cos(frameSec * 1.15) * wobble;
        const cy = ag.transform.y + Math.sin(frameSec * 2.4) * 0.05;
        const cz = ag.transform.z + Math.sin(frameSec * 1.15) * wobble;
        cb.group.position.set(cx, cy, cz);

        const st = ag.state;
        const pulse =
          st === "orbiting" || st === "idle" ? 1 + 0.06 * Math.sin(frameSec * 3.1) : 1 + 0.02 * Math.sin(frameSec * 2);
        const rb = bias && hallRoomUid && ag.roomUid === hallRoomUid ? (bias.rhizohPulse[cUid] ?? 0.12) : 0.1;
        cb.core.scale.setScalar(pulse * (1 + rb * 0.1 * Math.sin(frameSec * 5.5)));

        const ownerPr = owner.projection;
        const ownerVoice = ownerPr?.status === "talking" || ownerPr?.status === "broadcasting";
        const op = hallPosForAvatar(owner);
        const ownerReactAt = ownerPr?.lastReactionAt;
        const reactEcho =
          typeof ownerReactAt === "number" ? Math.max(0, 1 - (performance.now() - ownerReactAt) / 480) : 0;

        const haloOn = st === "speaking" || st === "responding" || st === "guiding";
        cb.halo.visible = haloOn;
        let emBase = haloOn ? 0.75 : st === "listening" ? 0.5 : 0.28;
        emBase += reactEcho * 0.55;
        cb.mat.emissiveIntensity = emBase * (0.52 + rb * 0.95) * greenRoomBackstageDim;
        cb.mat.color.setHex(st === "listening" ? 0x7dd3fc : 0xa78bfa);

        if (ownerVoice && op) {
          cb.group.lookAt(op.x, op.y - 0.08, op.z);
        } else if (st === "listening" && ag.attentionTargetUid) {
          const tgt = avatars[ag.attentionTargetUid];
          const tp = tgt ? hallPosForAvatar(tgt) : null;
          if (tp) cb.group.lookAt(tp.x, tp.y - 0.15, tp.z);
          else cb.group.rotation.set(0, ag.transform.rotY, 0);
        } else {
          cb.group.rotation.set(0, ag.transform.rotY, 0);
        }
      }

      for (const pid of [...ctx.petGhostBundles.keys()]) {
        if (!pets[pid]) {
          const pb = ctx.petGhostBundles.get(pid)!;
          ctx.scene.remove(pb.mesh);
          pb.mat.dispose();
          ctx.petGhostBundles.delete(pid);
        }
      }

      for (const [pUid, pet] of Object.entries(pets)) {
        if (pet.kind !== "ghost") continue;
        const owner = avatars[pet.ownerAvatarUid];
        if (!owner || !hallPosForAvatar(owner)) continue;

        let pb = ctx.petGhostBundles.get(pUid);
        if (!pb) {
          const mat = new THREE.MeshStandardMaterial({
            color: 0x5eead4,
            emissive: 0x0f766e,
            emissiveIntensity: 0.45,
            metalness: 0.25,
            roughness: 0.5,
            transparent: true,
            opacity: 0.88
          });
          const mesh = new THREE.Mesh(ctx.geoPetGhost, mat);
          ctx.scene.add(mesh);
          pb = { mesh, mat };
          ctx.petGhostBundles.set(pUid, pb);
        }

        const ownerRig = owner.projection?.rigAnimation;
        const orbitMul =
          (ownerRig === "clap" ? 1.85 : ownerRig === "think" ? 0.42 : 1) *
          (greenRoomBackstageDim < 1 ? 0.88 : 1);
        const bob = 0.05 * orbitMul;
        pb.mesh.position.set(
          pet.transform.x + Math.sin(frameSec * 2.8 * orbitMul) * bob,
          pet.transform.y + Math.abs(Math.sin(frameSec * 3.5 * orbitMul)) * 0.06,
          pet.transform.z + Math.cos(frameSec * 2.6 * orbitMul) * bob
        );
        pb.mesh.rotation.y = frameSec * 1.2 * orbitMul + pet.transform.rotY;
        const pulse = pet.state === "react" ? 1.15 : 1 + 0.08 * Math.sin(frameSec * 4);
        pb.mesh.scale.setScalar(pulse);
        const pg = bias && hallRoomUid && pet.roomUid === hallRoomUid ? (bias.petGlow[pUid] ?? 0.07) : 0.06;
        pb.mat.emissiveIntensity = (pet.rhizohAgentUid ? 0.62 : 0.38) * (0.42 + pg * 0.95) * greenRoomBackstageDim;
      }

      ctx.renderer.render(ctx.scene, ctx.camera);
    };

    sync();
    const unsub = subscribeStudioKernel(sync);

    return () => {
      unsub();
      const ctx = sceneRef.current;
      sceneRef.current = null;
      if (!ctx) return;
      for (const m of ctx.entityMeshes.values()) ctx.scene.remove(m);
      for (const b of ctx.avatarBundles.values()) {
        ctx.scene.remove(b.body, b.ring);
        b.mat.dispose();
      }
      for (const c of ctx.companionBundles.values()) {
        ctx.scene.remove(c.group);
        c.mat.dispose();
      }
      for (const p of ctx.petGhostBundles.values()) {
        ctx.scene.remove(p.mesh);
        p.mat.dispose();
      }
      ctx.entityMeshes.clear();
      ctx.avatarBundles.clear();
      ctx.companionBundles.clear();
      ctx.petGhostBundles.clear();
      haloRingGeo.dispose();
      ctx.geoCompanion.dispose();
      ctx.geoPetGhost.dispose();
      ctx.matHalo.dispose();
      stageGeo.dispose();
      stageMat.dispose();
      loungeGeo.dispose();
      loungeMat.dispose();
      ringGeo.dispose();
      ctx.geoEntity.dispose();
      ctx.geoAvatar.dispose();
      ctx.matEntity.dispose();
      ctx.matAvatar.dispose();
      ctx.matRing.dispose();
      ctx.renderer.dispose();
      if (ctx.renderer.domElement.parentNode === el) {
        el.removeChild(ctx.renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="rounded-xl border border-fuchsia-500/25 bg-[#080512]/90 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-2 py-1">
        <div className="text-[8px] font-black tracking-[0.28em] text-fuchsia-200/90">PRESENCE · HALL (P2)</div>
        <div className="text-[7px] text-white/40">
          field sample → propagated + stitched RenderBias (partitioned cross-room + echo) · hall · Rhizoh · entity
        </div>
      </div>
      <div ref={mountRef} className="w-full min-h-[200px]" />
      <PresenceZoneHud />
    </div>
  );
}
