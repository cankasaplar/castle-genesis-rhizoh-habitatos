/**
 * Rhizoh agent turn runner — intents → dry-run guard → dispatch → causal append + audit.
 * Budget, confidence gate, cooldowns, rationale log (Historian).
 */
import {
  accumulateEconomy,
  assertEconomyAllowsAppend,
  estimateEconomyForNodeType,
  withEconomyPayload
} from "./causalEconomy.js";
import { CAUSAL_GENESIS_NODE_ID, CAUSAL_MAIN_BRANCH_ID, defaultCausalGraphRegistry, ensureBranchRecord } from "./causalGraph";
import { appendCausalNode } from "./graphReducer";
import { KernelGuardRun } from "./kernelGuard";
import { buildRhizohAgentIntentCommitCausalNode } from "./agentIntentCausalFactory";
import type { RhizohAgentRationaleEntryV0, RhizohAgentToolIntentV0, StudioKernelState } from "../types/rskOntology";
import { defaultAgentRuntime, defaultCausalEconomy } from "../store/initialState";
import { getStudioKernelState, setStudioKernelState } from "../store/internalStore";
import { moveAvatarInRoom } from "../store/presenceSpatialSlice";
import { presenceAvatarSpeakStart, presenceAvatarSpeakStop } from "../store/presenceProtocolSlice";

const RATIONALE_LOG_CAP = 220;
export const RHIZOH_TURN_MAX_INTENTS_DEFAULT = 3;
export const RHIZOH_TURN_MIN_CONFIDENCE_DEFAULT = 0.45;

export interface RhizohTurnRunnerOptions {
  turnId?: string;
  maxIntentsPerTurn?: number;
  minConfidence?: number;
  cooldownMsByToolId?: Record<string, number>;
}

export interface RhizohTurnRunnerResult {
  ok: boolean;
  turnId: string;
  attempted: number;
  committed: number;
  log: RhizohAgentRationaleEntryV0[];
}

function newTurnId(): string {
  return `turn:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeToolKey(intent: RhizohAgentToolIntentV0): string {
  return intent.toolId.trim().toLowerCase().replace(/\s+/g, "_");
}

function defaultCooldownMs(intent: RhizohAgentToolIntentV0): number {
  const a = (intent.kernelAction ?? "").toLowerCase();
  const t = intent.toolId.toLowerCase();
  if (a.includes("speak") || t.includes("speak")) return 2000;
  if (a.includes("move") || t.includes("move")) return 1000;
  if (a.includes("broadcast") || t.includes("broadcast")) return 5000;
  return 800;
}

function resolveKernelAction(intent: RhizohAgentToolIntentV0): string | undefined {
  if (intent.kernelAction && String(intent.kernelAction).trim()) {
    return String(intent.kernelAction).trim();
  }
  const t = intent.toolId.toLowerCase();
  if (t === "move" || t.endsWith(".move")) return "presence.avatar.move";
  if (t.includes("speak_start") || t === "speak.start") return "presence.avatar.speak.start";
  if (t.includes("speak_stop") || t === "speak.stop") return "presence.avatar.speak.stop";
  return undefined;
}

function appendRationale(
  log: RhizohAgentRationaleEntryV0[],
  entry: RhizohAgentRationaleEntryV0
): RhizohAgentRationaleEntryV0[] {
  const next = [...log, entry];
  if (next.length > RATIONALE_LOG_CAP) return next.slice(-RATIONALE_LOG_CAP);
  return next;
}

function monotonicTick(
  s: StudioKernelState,
  graph: StudioKernelState["registry"]["causalGraph"],
  branchId: string,
  writer: string,
  causeIds: readonly string[]
): number {
  const nodes = graph.nodes;
  const tailKey = `${branchId}::${writer}`;
  const lastTipId = graph.writerHeads[tailKey];
  const lastTip = lastTipId ? nodes[lastTipId] : undefined;
  let maxCause = -1;
  for (const cid of causeIds) {
    const c = nodes[cid];
    if (c && Number.isFinite(c.tickIndex) && c.tickIndex > maxCause) maxCause = c.tickIndex;
  }
  return Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1, maxCause + 1);
}

function dispatchCommitted(
  action: string,
  sanitized: unknown
): { ok: true; causalNodeId?: string } | { ok: false; error: string } {
  switch (action) {
    case "presence.avatar.move": {
      const r = moveAvatarInRoom(sanitized as Parameters<typeof moveAvatarInRoom>[0]);
      return r.ok ? { ok: true, causalNodeId: r.value.causalNodeId } : { ok: false, error: r.error };
    }
    case "presence.avatar.speak.start": {
      const r = presenceAvatarSpeakStart(sanitized as { avatarUid: string });
      return r.ok ? { ok: true, causalNodeId: r.value.causalNodeId } : { ok: false, error: r.error };
    }
    case "presence.avatar.speak.stop": {
      const r = presenceAvatarSpeakStop(sanitized as { avatarUid: string });
      return r.ok ? { ok: true, causalNodeId: r.value.causalNodeId } : { ok: false, error: r.error };
    }
    default:
      return { ok: false, error: "agent_dispatch_unhandled" };
  }
}

/**
 * Process up to N intents: confidence gate → cooldown → dry-run KernelGuard → economy check → live guard → dispatch → bridge causal node.
 */
export function runRhizohAgentTurn(intents: RhizohAgentToolIntentV0[], opts?: RhizohTurnRunnerOptions): RhizohTurnRunnerResult {
  const turnId = opts?.turnId ?? newTurnId();
  const maxN = Math.max(1, Math.min(8, opts?.maxIntentsPerTurn ?? RHIZOH_TURN_MAX_INTENTS_DEFAULT));
  const minConf = opts?.minConfidence ?? RHIZOH_TURN_MIN_CONFIDENCE_DEFAULT;
  const slice = intents.slice(0, maxN);

  const outLog: RhizohAgentRationaleEntryV0[] = [];
  let rationaleLog = [...(getStudioKernelState().agentRuntime?.rationaleLog ?? [])];
  let cooldowns = { ...(getStudioKernelState().agentRuntime?.toolCooldownUntilByToolId ?? {}) };
  let lastFocus = getStudioKernelState().agentRuntime?.lastAttentionFocus;
  let committed = 0;
  const now0 = Date.now();

  for (let i = 0; i < slice.length; i++) {
    const intent = slice[i]!;
    const baseEntry = {
      ts: now0,
      turnId,
      intentIndex: i,
      toolId: intent.toolId,
      kernelAction: intent.kernelAction,
      confidence: intent.confidence,
      rationale: intent.rationale,
      attentionFocus: intent.attentionFocus
    };

    if (typeof intent.confidence !== "number" || !Number.isFinite(intent.confidence)) {
      const e: RhizohAgentRationaleEntryV0 = { ...baseEntry, phase: "dry_run", ok: false, error: "confidence_required" };
      outLog.push(e);
      rationaleLog = appendRationale(rationaleLog, e);
      continue;
    }
    if (intent.confidence < minConf) {
      const e: RhizohAgentRationaleEntryV0 = { ...baseEntry, phase: "dry_run", ok: false, error: "confidence_below_gate" };
      outLog.push(e);
      rationaleLog = appendRationale(rationaleLog, e);
      continue;
    }

    const toolKey = normalizeToolKey(intent);
    const cdUntil = cooldowns[toolKey] ?? 0;
    if (Date.now() < cdUntil) {
      const e: RhizohAgentRationaleEntryV0 = { ...baseEntry, phase: "dry_run", ok: false, error: "tool_cooldown" };
      outLog.push(e);
      rationaleLog = appendRationale(rationaleLog, e);
      continue;
    }

    const action = resolveKernelAction(intent);
    if (!action) {
      const e: RhizohAgentRationaleEntryV0 = { ...baseEntry, phase: "dry_run", ok: false, error: "kernel_action_unresolved" };
      outLog.push(e);
      rationaleLog = appendRationale(rationaleLog, e);
      continue;
    }

    const s0 = getStudioKernelState();
    const dry = KernelGuardRun({
      identity: s0.identity,
      action,
      payload: intent.payload,
      dryRun: true
    });
    if (!dry.allowed) {
      const e: RhizohAgentRationaleEntryV0 = {
        ...baseEntry,
        phase: "dry_run",
        ok: false,
        error: dry.error ?? "guard_dry_reject"
      };
      outLog.push(e);
      rationaleLog = appendRationale(rationaleLog, e);
      continue;
    }

    const bridgeCharge = estimateEconomyForNodeType("system");
    const econProbe = assertEconomyAllowsAppend(s0.causalEconomy ?? defaultCausalEconomy(), bridgeCharge);
    if (!econProbe.ok) {
      const e: RhizohAgentRationaleEntryV0 = { ...baseEntry, phase: "dry_run", ok: false, error: econProbe.error };
      outLog.push(e);
      rationaleLog = appendRationale(rationaleLog, e);
      continue;
    }

    const dryOk: RhizohAgentRationaleEntryV0 = { ...baseEntry, phase: "dry_run", ok: true };
    outLog.push(dryOk);
    rationaleLog = appendRationale(rationaleLog, dryOk);

    const live = KernelGuardRun({
      identity: s0.identity,
      action,
      payload: intent.payload,
      dryRun: false
    });
    if (!live.allowed || live.sanitizedPayload === undefined) {
      const e: RhizohAgentRationaleEntryV0 = {
        ...baseEntry,
        phase: "commit",
        ok: false,
        error: live.error ?? "guard_live_reject"
      };
      outLog.push(e);
      rationaleLog = appendRationale(rationaleLog, e);
      continue;
    }

    const disp = dispatchCommitted(action, live.sanitizedPayload);
    let dispatchCausalId: string | undefined;
    let dispatchOk = disp.ok;
    let dispatchErr: string | undefined;
    if (disp.ok) {
      dispatchCausalId = disp.causalNodeId;
      committed += 1;
      const e: RhizohAgentRationaleEntryV0 = { ...baseEntry, phase: "commit", ok: true };
      outLog.push(e);
      rationaleLog = appendRationale(rationaleLog, e);
    } else {
      dispatchErr = disp.error;
      const e: RhizohAgentRationaleEntryV0 = { ...baseEntry, phase: "commit", ok: false, error: dispatchErr };
      outLog.push(e);
      rationaleLog = appendRationale(rationaleLog, e);
    }

    const cdMs = opts?.cooldownMsByToolId?.[toolKey] ?? defaultCooldownMs(intent);
    cooldowns = { ...cooldowns, [toolKey]: Date.now() + cdMs };
    if (intent.attentionFocus) lastFocus = intent.attentionFocus;

    let s = getStudioKernelState();
    const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
    let causalGraph = s.registry.causalGraph ?? defaultCausalGraphRegistry();
    if (branchId !== CAUSAL_MAIN_BRANCH_ID && !causalGraph.branches[branchId]) {
      const trunkDepth = causalGraph.branches[CAUSAL_MAIN_BRANCH_ID]?.lineageDepth ?? 0;
      causalGraph = ensureBranchRecord(causalGraph, {
        id: branchId,
        parentBranchId: CAUSAL_MAIN_BRANCH_ID,
        forkTick: s.worldPhysics.globalTick,
        forkCauseNodeId: CAUSAL_GENESIS_NODE_ID,
        status: "active",
        lineageDepth: trunkDepth + 1
      });
    }

    const writer = `agent:bridge:${turnId}`;
    const causeTail = dispatchCausalId ? [dispatchCausalId] : [CAUSAL_GENESIS_NODE_ID];
    const tick = monotonicTick(s, causalGraph, branchId, writer, causeTail);
    const wall = Date.now();
    const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
    const econ0 = s.causalEconomy ?? defaultCausalEconomy();
    const gate2 = assertEconomyAllowsAppend(econ0, bridgeCharge);
    if (!gate2.ok) {
      const e: RhizohAgentRationaleEntryV0 = { ...baseEntry, phase: "commit", ok: false, error: gate2.error };
      outLog.push(e);
      rationaleLog = appendRationale(rationaleLog, e);
      continue;
    }

    const bridgeNode = withEconomyPayload(
      buildRhizohAgentIntentCommitCausalNode({
        intent,
        branchId,
        tickIndex: tick,
        timestamp: wall,
        actorId,
        causeIds: causeTail,
        dispatchOk,
        dispatchError: dispatchErr
      })
    );
    const appended = appendCausalNode(causalGraph, bridgeNode, writer);
    if (!appended.ok) {
      const e: RhizohAgentRationaleEntryV0 = { ...baseEntry, phase: "commit", ok: false, error: appended.error };
      outLog.push(e);
      rationaleLog = appendRationale(rationaleLog, e);
      continue;
    }

    s = getStudioKernelState();
    setStudioKernelState({
      ...s,
      registry: { ...s.registry, causalGraph: appended.graph },
      causalEconomy: accumulateEconomy(econ0, bridgeCharge)
    });
  }

  const sEnd = getStudioKernelState();
  setStudioKernelState({
    ...sEnd,
    agentRuntime: {
      ...(sEnd.agentRuntime ?? defaultAgentRuntime()),
      toolCooldownUntilByToolId: cooldowns,
      rationaleLog,
      lastAttentionFocus: lastFocus
    }
  });

  return {
    ok: committed > 0,
    turnId,
    attempted: slice.length,
    committed,
    log: outLog
  };
}
