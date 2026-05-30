/**
 * Wires minimum real simulation kernel handlers to concrete solvers (nav, flock, FSM, gaze, integrator)
 * + simulation completion (rollback queue, determinism hash, prediction, WS desync blend).
 *
 * Opt-in: `installRealSimulationEngineCouplingV0()` from studio shell (e.g. PresenceStudioViewport).
 * Sets `PetProjection.simulationPoseAuthoritative` so orbit slice does not overwrite transforms.
 */

import type { AvatarEntity, PresenceLayerState, StudioKernelState } from "../types/rskOntology";
import { PRESENCE_HALL_HALF } from "../store/presenceSpatialSlice";
import { getStudioKernelState, setStudioKernelState } from "../store/internalStore";
import { registerMinimumRealSimulationKernelHandlersV0 } from "./minimumRealSimulationKernelRegistrationV0";
import { clearSomaticExecutionCouplingHandlersV0 } from "./somaticExecutionCouplingLayerV0";
import {
  buildBlockedGridV0,
  bfsPathOnGridV0,
  nextWaypointWorldV0,
  worldToCellV0,
  type DiscObstacleV0,
  type NavGridSpecV0
} from "./realSimulation/minimalPathGridNavV0";
import { rebuildNavGridWithIncrementalInvalidationV0 } from "../../rhizoh/runtime/navInvalidationIncrementalV0.js";
import { pathTouchesInvalidatedCellsV0 } from "../../rhizoh/runtime/navInvalidationIncrementalV0.js";
import { separationAccelerationV0 } from "./realSimulation/flockSteeringV0";
import {
  createLocomotionFsmRuntimeV0,
  tickLocomotionFsmGraphV0,
  velocityTowardPointV0
} from "./realSimulation/locomotionFsmRuntimeV0";
import { stableYawTowardV0, yawTowardPointV0 } from "./realSimulation/stableGazeQuaternionV0";
import {
  createFixedTimestepAccumulatorV0,
  createRollbackQueueV0,
  pumpFixedTimestepV0
} from "./realSimulation/fixedTimestepIntegratorV0";
import { rewindRollbackQueueV0 } from "./realSimulation/fixedTimestepIntegratorV0";
import {
  hashPetTransformsDeterminismV0,
  recordRollbackPetTransformsV0,
  extrapolateXZLinearV0,
  blendXZTowardAuthorityV0
} from "./realSimulation/simulationCompletionLayerV0";

export const REAL_SIMULATION_ENGINE_COUPLING_SCHEMA_V0 = "castle.rhizoh.real_simulation_engine_coupling.v0";

export type RealSimulationEngineCouplingOptionsV0 = {
  hallHalf?: number;
  navResolution?: number;
  fixedDtMs?: number;
  rollbackFrames?: number;
  predictionFrames?: number;
  /** 0 = disabled; otherwise local xz lerps toward authority each outer frame. */
  wsDesyncAlpha?: number;
  /** Optional authority xz per pet slot (e.g. WS snapshot). */
  getWsAuthorityXZForSlot?: (slotUid: string) => { x: number; z: number } | undefined;
};

type PetBodyV0 = {
  flockAcc: { x: number; z: number };
  baseVel: { x: number; z: number };
  lastVx: number;
  lastVz: number;
  fsm: ReturnType<typeof createLocomotionFsmRuntimeV0>;
  pathKey: string;
  path: { ix: number; iz: number }[] | null;
};

const petBodies: Record<string, PetBodyV0> = {};
let lastNavRebuildMs = 0;
let blockedGrid: Uint8Array | null = null;
let navSpec: NavGridSpecV0 = { halfExtent: PRESENCE_HALL_HALF, resolution: 40 };
const defaultObstacles: DiscObstacleV0[] = [{ x: 0, z: 0, r: 2.35 }];
let obstacles: DiscObstacleV0[] = defaultObstacles;
const lastSealedEpochByRoom: Record<string, number> = {};
let lastInvalidationCellCount = 0;
const accum = createFixedTimestepAccumulatorV0(1000 / 60);
let rollbackQ = createRollbackQueueV0<Record<string, { x: number; y: number; z: number; rotY: number }>>(90);

let opts: Required<
  Pick<
    RealSimulationEngineCouplingOptionsV0,
    "hallHalf" | "navResolution" | "fixedDtMs" | "rollbackFrames" | "predictionFrames" | "wsDesyncAlpha"
  >
> & {
  getWsAuthorityXZForSlot?: RealSimulationEngineCouplingOptionsV0["getWsAuthorityXZForSlot"];
} = {
  hallHalf: PRESENCE_HALL_HALF,
  navResolution: 40,
  fixedDtMs: 1000 / 60,
  rollbackFrames: 90,
  predictionFrames: 2,
  wsDesyncAlpha: 0,
  getWsAuthorityXZForSlot: undefined
};

let lastDeterminismHash = "";
let installed = false;

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

function hallPosForAvatar(
  av: AvatarEntity | undefined,
  hallRoomUid: string | null
): { x: number; y: number; z: number } | null {
  if (!av || !hallRoomUid) return null;
  const rp = av.projection;
  const useHall = !!(rp && av.currentRoomUid === rp.roomUid && rp.roomUid === hallRoomUid);
  if (!useHall || !rp) return null;
  return { x: rp.transform.x, y: rp.transform.y + 0.36, z: rp.transform.z };
}

function ensurePetBody(slot: string, nowMs: number): PetBodyV0 {
  let b = petBodies[slot];
  if (!b) {
    b = {
      flockAcc: { x: 0, z: 0 },
      baseVel: { x: 0, z: 0 },
      lastVx: 0,
      lastVz: 0,
      fsm: createLocomotionFsmRuntimeV0(nowMs),
      pathKey: "",
      path: null
    };
    petBodies[slot] = b;
  }
  return b;
}

function clampHall(x: number, z: number, half: number): { x: number; z: number } {
  const m = half - 0.35;
  return {
    x: Math.max(-m, Math.min(m, x)),
    z: Math.max(-m, Math.min(m, z))
  };
}

function resolveDiscs(x: number, z: number, list: DiscObstacleV0[]): { x: number; z: number } {
  let px = x;
  let pz = z;
  for (const o of list) {
    const dx = px - o.x;
    const dz = pz - o.z;
    const d = Math.hypot(dx, dz);
    if (d < o.r - 0.02 && d > 1e-8) {
      const nx = dx / d;
      const nz = dz / d;
      px = o.x + nx * (o.r + 0.06);
      pz = o.z + nz * (o.r + 0.06);
    }
  }
  return { x: px, z: pz };
}

function syncSealedDiscObstaclesFromKernelV0(
  s: StudioKernelState,
  hallRoomUid: string | null
): { discs: DiscObstacleV0[]; sealedEpoch: number; invalidationCells: number } {
  if (!hallRoomUid) {
    return { discs: obstacles, sealedEpoch: -1, invalidationCells: 0 };
  }
  const sealed = s.worldAuthorityRuntime?.sealedObstacleByRoomUid?.[hallRoomUid];
  if (!sealed?.discs?.length) {
    return { discs: obstacles, sealedEpoch: sealed?.sealedEpoch ?? -1, invalidationCells: 0 };
  }
  return {
    discs: sealed.discs,
    sealedEpoch: sealed.sealedEpoch,
    invalidationCells: sealed.invalidationCellKeys?.length ?? 0
  };
}

function onNavMeshRuntimeFeed(ctx: { dtMs: number; nowMs: number; getState: () => StudioKernelState }): void {
  const s = ctx.getState();
  const hall = pickPrimaryHallRoomUid(s.presence);
  markPetsAuthoritative(s.presence, hall);

  navSpec = { halfExtent: opts.hallHalf, resolution: opts.navResolution };

  const sealedSync = syncSealedDiscObstaclesFromKernelV0(s, hall);
  const priorEpoch = hall ? (lastSealedEpochByRoom[hall] ?? -1) : -1;
  const epochAdvanced = hall != null && sealedSync.sealedEpoch > priorEpoch;
  const invalidationBurst =
    sealedSync.invalidationCells > 0 && sealedSync.invalidationCells !== lastInvalidationCellCount;
  if (hall && sealedSync.sealedEpoch >= 0) {
    lastSealedEpochByRoom[hall] = sealedSync.sealedEpoch;
  }
  lastInvalidationCellCount = sealedSync.invalidationCells;

  if (epochAdvanced && sealedSync.discs.length) {
    obstacles = sealedSync.discs;
    blockedGrid = null;
  }

  const hallSealed = hall ? s.worldAuthorityRuntime?.sealedObstacleByRoomUid?.[hall] : undefined;
  const cellKeys = hallSealed?.invalidationCellKeys ?? [];

  if (
    blockedGrid &&
    !epochAdvanced &&
    invalidationBurst &&
    cellKeys.length > 0
  ) {
    const inc = rebuildNavGridWithIncrementalInvalidationV0(
      blockedGrid,
      { discs: obstacles, invalidationCellKeys: cellKeys },
      navSpec
    );
    blockedGrid = inc.grid;
    lastNavRebuildMs = ctx.nowMs;
    return;
  }

  const forceRebuild = epochAdvanced || (invalidationBurst && !cellKeys.length);
  if (blockedGrid && !forceRebuild && ctx.nowMs - lastNavRebuildMs < 200) return;
  lastNavRebuildMs = ctx.nowMs;
  blockedGrid = buildBlockedGridV0(navSpec, obstacles);
}

function onFlockSolverStep(ctx: { dtMs: number; nowMs: number; getState: () => StudioKernelState }): void {
  const s = ctx.getState();
  const pres = s.presence;
  const hallRoomUid = pickPrimaryHallRoomUid(pres);
  if (!hallRoomUid || !pres?.pets) return;

  const positions: { slot: string; x: number; z: number }[] = [];
  for (const [slot, pet] of Object.entries(pres.pets)) {
    if (pet.kind !== "ghost" || pet.roomUid !== hallRoomUid || !pet.simulationPoseAuthoritative) continue;
    positions.push({ slot, x: pet.transform.x, z: pet.transform.z });
  }
  for (const p of positions) {
    const neighbors = positions.filter((o) => o.slot !== p.slot).map((o) => ({ x: o.x, z: o.z }));
    const b = ensurePetBody(p.slot, ctx.nowMs);
    b.flockAcc = separationAccelerationV0({ x: p.x, z: p.z }, neighbors, 1.15, 5.5);
  }
}

function onFsmToTransform(ctx: { dtMs: number; nowMs: number; getState: () => StudioKernelState }): void {
  const s = ctx.getState();
  const pres = s.presence;
  const hallRoomUid = pickPrimaryHallRoomUid(pres);
  if (!hallRoomUid || !pres?.pets || !blockedGrid) return;

  for (const [slot, pet] of Object.entries(pres.pets)) {
    if (pet.kind !== "ghost" || pet.roomUid !== hallRoomUid || !pet.simulationPoseAuthoritative) continue;
    const owner = pres.avatars?.[pet.ownerAvatarUid];
    const oh = hallPosForAvatar(owner, hallRoomUid);
    if (!oh) continue;

    const phase = ctx.nowMs * 0.00011;
    const anchor = {
      x: oh.x + Math.sin(phase) * 1.65,
      z: oh.z + Math.cos(phase) * 1.65
    };
    const key = `${anchor.x.toFixed(2)}|${anchor.z.toFixed(2)}`;
    const b = ensurePetBody(slot, ctx.nowMs);
    const start = worldToCellV0(pet.transform.x, pet.transform.z, navSpec);
    const goal = worldToCellV0(anchor.x, anchor.z, navSpec);
    const invalidationKeys = s.worldAuthorityRuntime?.sealedObstacleByRoomUid?.[hallRoomUid]?.invalidationCellKeys ?? [];
    const pathStale =
      b.path &&
      invalidationKeys.length > 0 &&
      pathTouchesInvalidatedCellsV0(b.path, invalidationKeys, navSpec.resolution);

    if (b.pathKey !== key || !b.path || pathStale) {
      b.pathKey = key;
      b.path = bfsPathOnGridV0(navSpec, blockedGrid, start, goal);
    }
    const wp =
      b.path && b.path.length > 1
        ? nextWaypointWorldV0(b.path, navSpec, 2)
        : anchor;
    const goalXZ = wp ?? anchor;
    const dist = Math.hypot(goalXZ.x - pet.transform.x, goalXZ.z - pet.transform.z);
    const fsmOut = tickLocomotionFsmGraphV0(b.fsm, dist, ctx.nowMs, {
      seekSpeed: 2.85,
      arriveRadius: 1.55,
      idleRadius: 0.38
    });
    b.fsm = fsmOut.next;
    b.baseVel = velocityTowardPointV0(
      { x: pet.transform.x, z: pet.transform.z },
      { x: goalXZ.x, z: goalXZ.z },
      fsmOut.speed
    );
  }
}

function onLookAtQuaternionSolve(ctx: { dtMs: number; nowMs: number; getState: () => StudioKernelState }): void {
  const s = ctx.getState();
  const pres = s.presence;
  const hallRoomUid = pickPrimaryHallRoomUid(pres);
  if (!hallRoomUid || !pres?.pets) return;
  const dtSec = Math.min(0.05, Math.max(1e-4, ctx.dtMs / 1000));

  let next = s;
  let changed = false;
  const pets = { ...(pres.pets ?? {}) };

  for (const [slot, pet] of Object.entries(pres.pets ?? {})) {
    if (pet.kind !== "ghost" || pet.roomUid !== hallRoomUid || !pet.simulationPoseAuthoritative) continue;
    const owner = pres.avatars?.[pet.ownerAvatarUid];
    const pr = owner?.projection;
    if (!pr) continue;
    const tgtUid = pr.lookAtTargetUid ?? pet.ownerAvatarUid;
    const tgtAv = pres.avatars?.[tgtUid];
    const th = hallPosForAvatar(tgtAv, hallRoomUid);
    if (!th) continue;
    const ty = yawTowardPointV0({ x: pet.transform.x, z: pet.transform.z }, { x: th.x, z: th.z });
    const ry = stableYawTowardV0(pet.transform.rotY, ty, dtSec, 3.1);
    if (Math.abs(ry - pet.transform.rotY) < 1e-6) continue;
    pets[slot] = { ...pet, transform: { ...pet.transform, rotY: ry } };
    changed = true;
  }
  if (changed) {
    next = { ...s, presence: { ...pres, pets } };
    setStudioKernelState(next);
  }
}

function onFrameIntegratorPost(ctx: { dtMs: number; nowMs: number; getState: () => StudioKernelState }): void {
  accum.fixedDtMs = opts.fixedDtMs;
  const steps = pumpFixedTimestepV0(accum, ctx.dtMs, 5);
  if (steps === 0) return;

  let s = ctx.getState();
  const hallRoomUid = pickPrimaryHallRoomUid(s.presence);
  if (!hallRoomUid || !s.presence?.pets) return;

  const fixedDtSec = opts.fixedDtMs / 1000;

  for (let step = 0; step < steps; step++) {
    const pres = s.presence!;
    const pets = { ...(pres.pets ?? {}) };
    let changed = false;
    for (const [slot, pet] of Object.entries(pets)) {
      if (pet.kind !== "ghost" || pet.roomUid !== hallRoomUid || !pet.simulationPoseAuthoritative) continue;
      const b = ensurePetBody(slot, ctx.nowMs);
      const vx = b.baseVel.x + b.flockAcc.x * 0.24;
      const vz = b.baseVel.z + b.flockAcc.z * 0.24;
      let x = pet.transform.x + vx * fixedDtSec;
      let z = pet.transform.z + vz * fixedDtSec;
      const c = clampHall(x, z, opts.hallHalf);
      x = c.x;
      z = c.z;
      const r = resolveDiscs(x, z, obstacles);
      x = r.x;
      z = r.z;
      let y = pet.transform.y;
      const owner = pres.avatars?.[pet.ownerAvatarUid];
      const oh = hallPosForAvatar(owner, hallRoomUid);
      if (oh) y = oh.y * 0.12 + 0.22;

      if (opts.wsDesyncAlpha > 0 && opts.getWsAuthorityXZForSlot) {
        const auth = opts.getWsAuthorityXZForSlot(slot);
        if (auth) {
          const bl = blendXZTowardAuthorityV0({ x, z }, auth, opts.wsDesyncAlpha);
          x = bl.x;
          z = bl.z;
        }
      }

      b.lastVx = vx;
      b.lastVz = vz;

      if (
        Math.abs(x - pet.transform.x) > 1e-6 ||
        Math.abs(z - pet.transform.z) > 1e-6 ||
        Math.abs(y - pet.transform.y) > 1e-6
      ) {
        pets[slot] = { ...pet, transform: { ...pet.transform, x, y, z } };
        changed = true;
      }
    }
    if (changed) {
      s = { ...s, presence: { ...pres, pets } };
      setStudioKernelState(s);
    }
  }

  const s2 = getStudioKernelState();
  recordRollbackPetTransformsV0(rollbackQ, s2.presence?.pets ?? {});
  lastDeterminismHash = hashPetTransformsDeterminismV0(s2.worldPhysics.globalTick, s2.presence?.pets ?? {});
}

function markPetsAuthoritative(pres: PresenceLayerState | undefined, hallRoomUid: string | null): void {
  if (!pres?.pets || !hallRoomUid) return;
  const pets = { ...pres.pets };
  let changed = false;
  for (const [slot, pet] of Object.entries(pets)) {
    if (pet.kind !== "ghost" || pet.roomUid !== hallRoomUid) continue;
    if (pet.simulationPoseAuthoritative) continue;
    pets[slot] = { ...pet, simulationPoseAuthoritative: true };
    changed = true;
    ensurePetBody(slot, performance.now());
  }
  if (changed) {
    const s = getStudioKernelState();
    setStudioKernelState({ ...s, presence: { ...pres, pets } });
  }
}

export function installRealSimulationEngineCouplingV0(
  nextOpts?: RealSimulationEngineCouplingOptionsV0
): void {
  if (installed) return;
  installed = true;
  opts = {
    hallHalf: nextOpts?.hallHalf ?? PRESENCE_HALL_HALF,
    navResolution: nextOpts?.navResolution ?? 40,
    fixedDtMs: nextOpts?.fixedDtMs ?? 1000 / 60,
    rollbackFrames: nextOpts?.rollbackFrames ?? 90,
    predictionFrames: nextOpts?.predictionFrames ?? 2,
    wsDesyncAlpha: nextOpts?.wsDesyncAlpha ?? 0,
    getWsAuthorityXZForSlot: nextOpts?.getWsAuthorityXZForSlot
  };
  rollbackQ = createRollbackQueueV0(opts.rollbackFrames);
  accum.fixedDtMs = opts.fixedDtMs;
  accum.accMs = 0;
  lastNavRebuildMs = 0;
  blockedGrid = null;

  const boot = () => {
    const s = getStudioKernelState();
    const hall = pickPrimaryHallRoomUid(s.presence);
    markPetsAuthoritative(s.presence, hall);
  };
  boot();

  registerMinimumRealSimulationKernelHandlersV0({
    navSolverRuntimeBind: onNavMeshRuntimeFeed,
    flockSolverHook: onFlockSolverStep,
    fsmGraphTick: onFsmToTransform,
    lookAtSolverInject: onLookAtQuaternionSolve,
    integratorFrameOwner: onFrameIntegratorPost
  });
}

export function uninstallRealSimulationEngineCouplingV0(): void {
  if (!installed) return;
  installed = false;
  clearSomaticExecutionCouplingHandlersV0();
  for (const k of Object.keys(petBodies)) delete petBodies[k];
  blockedGrid = null;
  lastDeterminismHash = "";

  const s = getStudioKernelState();
  const pres = s.presence;
  if (!pres?.pets) return;
  const pets = { ...pres.pets };
  let changed = false;
  for (const [slot, pet] of Object.entries(pets)) {
    if (!pet.simulationPoseAuthoritative) continue;
    pets[slot] = { ...pet, simulationPoseAuthoritative: false };
    changed = true;
  }
  if (changed) setStudioKernelState({ ...s, presence: { ...pres, pets } });
}

export function getRealSimulationEngineDebugV0(): {
  schema: typeof REAL_SIMULATION_ENGINE_COUPLING_SCHEMA_V0;
  installed: boolean;
  lastDeterminismHash: string;
  rollbackDepth: number;
  navSpec: NavGridSpecV0;
} {
  return {
    schema: REAL_SIMULATION_ENGINE_COUPLING_SCHEMA_V0,
    installed,
    lastDeterminismHash,
    rollbackDepth: rollbackQ.frames.length,
    navSpec: { ...navSpec }
  };
}

export function applyRealSimulationRewindV0(steps: number): boolean {
  const snapshot = rewindRollbackQueueV0(rollbackQ, steps);
  if (!snapshot) return false;
  const s = getStudioKernelState();
  const pres = s.presence;
  if (!pres?.pets) return false;
  const pets = { ...pres.pets };
  for (const [slot, t] of Object.entries(snapshot)) {
    const pet = pets[slot];
    if (!pet || pet.kind !== "ghost") continue;
    pets[slot] = { ...pet, transform: { ...pet.transform, ...t } };
  }
  setStudioKernelState({ ...s, presence: { ...pres, pets } });
  return true;
}

export function getPredictedPetXZForSlotV0(
  slotUid: string,
  framesAhead?: number
): { x: number; z: number } | null {
  const fa = framesAhead ?? opts.predictionFrames ?? 2;
  const s = getStudioKernelState();
  const pet = s.presence?.pets?.[slotUid];
  const b = petBodies[slotUid];
  if (!pet?.transform || !b) return null;
  return extrapolateXZLinearV0(
    { x: pet.transform.x, z: pet.transform.z },
    { x: b.lastVx, z: b.lastVz },
    fa,
    opts.fixedDtMs / 1000
  );
}

export function setRealSimulationDiscObstaclesV0(next: DiscObstacleV0[]): void {
  obstacles = next.length ? next : defaultObstacles;
  blockedGrid = null;
}
