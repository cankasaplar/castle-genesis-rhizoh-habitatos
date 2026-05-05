import { assertEconomyAllowsAppend, estimateEconomyForNodeType } from "./causalEconomy";
import { getStudioKernelState, setStudioKernelState } from "../store/internalStore";
import { tickMind } from "../store/mindRuntimeSlice";
import { defaultAgentRuntime, defaultCausalEconomy } from "../store/initialState";

let timer: number | null = null;

function chooseActiveMindUid(): string | undefined {
  const s = getStudioKernelState();
  if (s.runtime.activeMind && s.registry.mind.instance[s.runtime.activeMind]) return s.runtime.activeMind;
  const first = Object.keys(s.registry.mind.instance)[0];
  return first || undefined;
}

function runtimeBeat(): void {
  const s = getStudioKernelState();
  const cur = s.agentRuntime ?? defaultAgentRuntime();
  if (!cur.enabled || cur.schedulerState === "paused") return;

  const mindUid = chooseActiveMindUid();
  if (mindUid) {
    const econBase = s.causalEconomy ?? defaultCausalEconomy();
    const mindCharge = estimateEconomyForNodeType("mind");
    if (assertEconomyAllowsAppend(econBase, mindCharge).ok) {
      tickMind(mindUid, {
        source: "agent_runtime_loop",
        worldTick: s.worldPhysics.globalTick,
        roomCount: Object.keys(s.presence.rooms ?? {}).length,
        activeAvatars: Object.keys(s.presence.avatars ?? {}).length
      });
    }
  }

  const s2 = getStudioKernelState();
  setStudioKernelState({
    ...s2,
    agentRuntime: {
      ...(s2.agentRuntime ?? cur),
      activeMindUid: mindUid,
      lastTickAt: Date.now(),
      schedulerState: "running"
    }
  });
}

export function startRhizohAgentRuntime(opts?: { heartbeatMs?: number }): () => void {
  stopRhizohAgentRuntime();
  const s = getStudioKernelState();
  const cur = s.agentRuntime ?? defaultAgentRuntime();
  const heartbeatMs = Math.max(1500, Number(opts?.heartbeatMs ?? cur.heartbeatMs ?? 4500));
  setStudioKernelState({
    ...s,
    agentRuntime: {
      ...cur,
      enabled: true,
      heartbeatMs,
      schedulerState: "running"
    }
  });
  timer = window.setInterval(runtimeBeat, heartbeatMs);
  runtimeBeat();
  return stopRhizohAgentRuntime;
}

export function stopRhizohAgentRuntime(): void {
  if (timer != null) {
    window.clearInterval(timer);
    timer = null;
  }
  const s = getStudioKernelState();
  if (!s.agentRuntime) return;
  setStudioKernelState({
    ...s,
    agentRuntime: { ...s.agentRuntime, schedulerState: "paused" }
  });
}
