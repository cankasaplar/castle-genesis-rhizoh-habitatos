import type {
  Branch,
  CausalFractureHint,
  CausalGraphRegistry,
  CausalNode,
  CausalShadowPack,
  MindInstance,
  RSKMindRuntimeState,
  SimulationDiff,
  StudioKernelState
} from "../types/rskOntology.js";
import { KernelGuardRun } from "./kernelGuard";
import {
  CAUSAL_DEFAULT_MERGE_POLICY,
  CAUSAL_GENESIS_NODE_ID,
  CAUSAL_MAIN_BRANCH_ID,
  defaultCausalGraphRegistry
} from "./causalGraph.js";
import {
  accumulateEconomy,
  assertEconomyAllowsAppend,
  estimateShadowPackCharge
} from "./causalEconomy.js";
import { appendCausalNode } from "./graphReducer";
import { buildMindTickCausalNode } from "./mindCausalFactory";
import { buildTickSeed, computeMindTick, defaultMindRuntimeState, hashSeed } from "./mindRuntime";
import { defaultCausalEconomy } from "../store/initialState";
import { getStudioKernelState, setStudioKernelState } from "../store/internalStore";
import { setSimulationDiff } from "../store/simulationSlice";

export interface ShadowRunInput {
  mindInstanceId: string;
  input?: string;
  ticks?: number;
}

export interface ShadowRunResult {
  trace: Array<{ tick: number; runtime: RSKMindRuntimeState }>;
  cost: number;
  risk: number;
  output: string;
  diff: {
    structuralFork: { instanceUid: string };
    runtimeFork: { before: RSKMindRuntimeState | undefined; after: RSKMindRuntimeState };
    causalFork?: CausalShadowPack;
  };
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

/**
 * Dual fork: structural (mind instance snapshot) vs runtime (pulse state).
 * Never commits to live registry; discards after diff.
 */
export function runShadow(input: ShadowRunInput): ShadowRunResult | { error: string } {
  const s = getStudioKernelState();
  const res = KernelGuardRun({
    identity: s.identity,
    action: "sim.shadow.execute",
    payload: input
  });
  if (!res.allowed) return { error: res.error ?? "shadow_denied" };

  const p = res.sanitizedPayload as ShadowRunInput;
  const id = p.mindInstanceId;
  const instance = s.registry.mind.instance[id] as MindInstance | undefined;
  if (!instance) return { error: "mind_instance_not_found" };

  const structuralFork = clone({ instance: { [id]: instance } });

  const liveRt = s.mindRuntime[id] ?? defaultMindRuntimeState();
  let shadowRt: RSKMindRuntimeState = clone(liveRt);
  const soul = instance.soulUid ? s.registry.soul[instance.soulUid] : undefined;
  const continuity = soul?.continuityHash ?? instance.uid;
  const ticks = Math.max(1, Math.min(32, p.ticks ?? 1));
  const trace: ShadowRunResult["trace"] = [];
  const shadowBucket = hashSeed(`shadow|${continuity}|${p.input ?? ""}`) % 86_400_000;

  const parentBranchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  const liveCg = s.registry.causalGraph ?? defaultCausalGraphRegistry();
  const liveWriterTipId = liveCg.writerHeads[`${parentBranchId}::${id}`] ?? CAUSAL_GENESIS_NODE_ID;
  const forkTick = s.worldPhysics.globalTick;
  const parentBr = liveCg.branches[parentBranchId] ?? liveCg.branches[CAUSAL_MAIN_BRANCH_ID]!;
  const shadowBranchId = `branch:shadow:c${hashSeed(`${continuity}|${p.input ?? ""}|${id}|${forkTick}`).toString(36)}`;
  const shadowBranch: Branch = {
    id: shadowBranchId,
    parentBranchId: parentBranchId,
    forkTick,
    forkCauseNodeId: liveWriterTipId,
    status: "active",
    lineageDepth: parentBr.lineageDepth + 1
  };

  const econ0 = s.causalEconomy ?? defaultCausalEconomy();
  const shadowPreCharge = estimateShadowPackCharge(ticks, shadowBranch.lineageDepth);
  const shadowEconGate = assertEconomyAllowsAppend(econ0, shadowPreCharge);
  if (!shadowEconGate.ok) {
    return { error: shadowEconGate.error };
  }

  const causeLookup: Record<string, CausalNode> = { ...liveCg.nodes };
  let sg: CausalGraphRegistry = {
    nodes: {},
    branches: { [shadowBranchId]: shadowBranch },
    writerHeads: {}
  };
  let shadowCauseId = liveWriterTipId;
  let prevRt = clone(liveRt);

  for (let i = 0; i < ticks; i++) {
    const seed = buildTickSeed({
      continuityHash: continuity,
      explicitSeed: `shadow|${p.input ?? ""}`,
      tickIndex: i,
      timeBucketMs: shadowBucket
    });
    const wall = shadowBucket + i * 997 + (hashSeed(seed) % 1000);
    const nextRt = computeMindTick(prevRt, instance, soul, {
      context: p.input,
      seed,
      tickIndex: i,
      nowMs: wall
    });
    shadowRt = nextRt;
    trace.push({ tick: i, runtime: clone(shadowRt) });

    const node = buildMindTickCausalNode({
      branchId: shadowBranchId,
      mindInstanceId: id,
      tickIndex: forkTick + i + 1,
      timestamp: wall,
      actorId: "shadow",
      causeIds: [shadowCauseId],
      prev: prevRt,
      next: nextRt,
      inputContext: p.input ?? null,
      outputContext: undefined
    });
    const lookup = { ...causeLookup, ...sg.nodes };
    const ar = appendCausalNode(sg, node, id, { causeLookup: lookup });
    if (!ar.ok) break;
    sg = ar.graph;
    shadowCauseId = node.id;
    prevRt = nextRt;
  }

  const shadowCausalNodes = sg.nodes;
  const shadowTipId = sg.writerHeads[`${shadowBranchId}::${id}`];

  const risk = Math.max(shadowRt.internal.load, shadowRt.internal.entropy);
  const output = shadowRt.cognition.thoughtBuffer[shadowRt.cognition.thoughtBuffer.length - 1] ?? "";

  const fractures: CausalFractureHint[] = [];
  const liveNode = liveCg.nodes[liveWriterTipId];
  const lastShadow = shadowTipId ? sg.nodes[shadowTipId] : undefined;
  const ent = (n: CausalNode | undefined): number | undefined => {
    const d = n?.payload?.delta;
    if (d && typeof d === "object" && "entropy" in (d as object)) return Number((d as { entropy: number }).entropy);
    return undefined;
  };
  const le = ent(liveNode);
  const se = ent(lastShadow);
  if (typeof le === "number" && typeof se === "number" && le * se < 0) {
    fractures.push({
      tickIndex: lastShadow?.tickIndex ?? forkTick,
      reason: "entropy_delta_sign_divergence",
      shadowBranchId
    });
  }

  const causalFork: CausalShadowPack = {
    branch: shadowBranch,
    nodes: shadowCausalNodes,
    mergePolicy: CAUSAL_DEFAULT_MERGE_POLICY,
    nodeCount: Object.keys(shadowCausalNodes).length,
    liveWriterTipId,
    shadowWriterTipId: shadowTipId,
    fractures: fractures.length ? fractures : undefined
  };

  const diff: ShadowRunResult["diff"] = {
    structuralFork: { instanceUid: id },
    runtimeFork: { before: liveRt, after: shadowRt },
    causalFork
  };

  const simDiff: SimulationDiff = {
    ok: true,
    notes: [
      `shadow ticks=${ticks}`,
      `structural fork instance=${id}`,
      `runtime Δentropy ${(shadowRt.internal.entropy - liveRt.internal.entropy).toFixed(3)}`,
      `causal shadow branch=${shadowBranchId} nodes=${causalFork.nodeCount}`
    ],
    costs: { ticks },
    riskScore: risk,
    trace,
    output,
    causalShadow: causalFork,
    causalFractures: causalFork.fractures
  };
  setSimulationDiff(simDiff);

  const actualShadowCharge = estimateShadowPackCharge(causalFork.nodeCount, shadowBranch.lineageDepth);
  const liveAfter = getStudioKernelState();
  const econLive = liveAfter.causalEconomy ?? defaultCausalEconomy();
  setStudioKernelState({
    ...liveAfter,
    causalEconomy: {
      ...accumulateEconomy(econLive, actualShadowCharge),
      lastShadowCharge: {
        computeWeight: actualShadowCharge.computeWeight,
        entropyImpact: actualShadowCharge.entropyImpact,
        shadowBranchId,
        shadowNodeCount: causalFork.nodeCount
      }
    }
  });

  void structuralFork;

  return { trace, cost: ticks, risk, output, diff };
}

export function forkMindRuntimeForTest(state: StudioKernelState, instanceId: string): RSKMindRuntimeState {
  const rt = state.mindRuntime[instanceId] ?? defaultMindRuntimeState();
  return clone(rt);
}
