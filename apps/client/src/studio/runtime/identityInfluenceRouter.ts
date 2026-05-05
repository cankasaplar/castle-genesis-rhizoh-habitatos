import type { IdentityCausalEventV0, RhizohAgentRationaleEntryV0, StudioKernelState } from "../types/rskOntology";
import { appendInfluenceTrace } from "./influenceTraceRegistry";

type InfluenceTarget = "presence" | "broadcast" | "rhizoh";
type InfluencePatch = Record<string, unknown>;
type InfluenceProjector = (event: IdentityCausalEventV0, s: StudioKernelState) => InfluencePatch;
type InfluenceTargetMap = Partial<Record<InfluenceTarget, InfluenceProjector>>;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function applyPresencePatch(s: StudioKernelState, e: IdentityCausalEventV0, patch: InfluencePatch): StudioKernelState {
  const pres = s.presence;
  if (!pres) return s;
  if (e.type === "identity.avatar.update") {
    const av = pres.avatars[e.targetUid];
    if (!av?.projection) return s;
    return {
      ...s,
      presence: {
        ...pres,
        avatars: {
          ...pres.avatars,
          [e.targetUid]: {
            ...av,
            projection: {
              ...av.projection,
              rigMood: String(patch.rigMood || av.projection.rigMood || "signal-lattice"),
              rigGesture: String(patch.rigGesture || av.projection.rigGesture || "wave"),
              lastRigEventAt: Number(patch.lastRigEventAt || e.timestamp)
            }
          }
        }
      }
    };
  }
  if (e.type === "identity.companion.update") {
    const next = { ...pres.companionAgents };
    for (const [uid, ag] of Object.entries(next)) {
      if (ag.ownerAvatarUid !== e.targetUid && uid !== e.targetUid) continue;
      next[uid] = {
        ...ag,
        state: String(patch.companionState || "guiding") as typeof ag.state,
        attentionTargetUid: String(patch.attentionTargetUid || ag.ownerAvatarUid),
        lastStateAt: Number(patch.lastStateAt || e.timestamp)
      };
    }
    return { ...s, presence: { ...pres, companionAgents: next } };
  }
  if (e.type === "identity.ghostpet.update") {
    const next = { ...pres.pets };
    for (const [uid, pet] of Object.entries(next)) {
      if (uid !== e.targetUid && pet.uid !== e.targetUid) continue;
      next[uid] = {
        ...pet,
        state: String(patch.petState || "observing") as typeof pet.state,
        lastStateAt: Number(patch.lastStateAt || e.timestamp)
      };
    }
    return { ...s, presence: { ...pres, pets: next } };
  }
  return s;
}

function applyBroadcastPatch(s: StudioKernelState, e: IdentityCausalEventV0, patch: InfluencePatch): StudioKernelState {
  const pres = s.presence;
  if (!pres) return s;
  if (e.type === "identity.signature.update") {
    const tint = String(patch.tint || "indigo-cyan");
    const projections = Object.fromEntries(
      Object.entries(pres.broadcastProjections || {}).map(([uid, p]) => [
        uid,
        {
          ...p,
          overlayStack: [...p.overlayStack, { id: `sig:${e.timestamp}:${uid}`, kind: String(patch.overlayKind || "identity.signature"), payload: tint }].slice(-32),
          lastEventAt: e.timestamp
        }
      ])
    );
    const dirs = Object.fromEntries(
      Object.entries(pres.directorByRoomUid || {}).map(([roomUid, d]) => [
        roomUid,
        { ...d, sceneMode: String(patch.sceneMode || `signature:${tint}`) }
      ])
    );
    return { ...s, presence: { ...pres, broadcastProjections: projections, directorByRoomUid: dirs } };
  }
  if (e.type === "identity.vault.unlock") {
    const energyDelta = Number(patch.audienceEnergyDelta || 0.08);
    const projections = Object.fromEntries(
      Object.entries(pres.broadcastProjections || {}).map(([uid, p]) => [
        uid,
        { ...p, audienceEnergy: clamp01((p.audienceEnergy ?? 0.4) + energyDelta), lastEventAt: e.timestamp }
      ])
    );
    return { ...s, presence: { ...pres, broadcastProjections: projections } };
  }
  if (e.type === "identity.journal.append") {
    const projections = Object.fromEntries(
      Object.entries(pres.broadcastProjections || {}).map(([uid, p]) => [
        uid,
        {
          ...p,
          overlayStack: [...p.overlayStack, { id: `jnl:${e.timestamp}:${uid}`, kind: String(patch.overlayKind || "identity.journal"), payload: String(e.patch?.clip || "") }].slice(-32),
          lastEventAt: e.timestamp
        }
      ])
    );
    return { ...s, presence: { ...pres, broadcastProjections: projections } };
  }
  return s;
}

function applyRhizohPatch(s: StudioKernelState, e: IdentityCausalEventV0, patch: InfluencePatch): StudioKernelState {
  const focus = patch.lastAttentionFocus as "memory" | "social" | undefined;
  if (!focus) return s;
  let rationaleLog = s.agentRuntime.rationaleLog || [];
  if (focus === "memory") {
    const clip = String(e.patch?.clip || "").trim();
    const entry: RhizohAgentRationaleEntryV0 = {
      ts: e.timestamp,
      turnId: `identity:${e.timestamp}`,
      intentIndex: 0,
      toolId: "identity.journal.append",
      kernelAction: "identity.causal.journal.append",
      confidence: 0.9,
      rationale: clip ? `journal clip appended: ${clip.slice(0, 120)}` : "journal clip appended",
      attentionFocus: "memory",
      phase: "commit",
      ok: true
    };
    rationaleLog = [...rationaleLog, entry].slice(-64);
  }
  return {
    ...s,
    agentRuntime: {
      ...s.agentRuntime,
      lastAttentionFocus: focus,
      rationaleLog
    }
  };
}

const targetHandlers: Record<InfluenceTarget, (s: StudioKernelState, e: IdentityCausalEventV0, patch: InfluencePatch) => StudioKernelState> = {
  presence: applyPresencePatch,
  broadcast: applyBroadcastPatch,
  rhizoh: applyRhizohPatch
};

export const IdentityInfluenceMap: Record<IdentityCausalEventV0["type"], InfluenceTargetMap> = {
  "identity.avatar.update": {
    presence: (event) => {
      const motion = String(event.patch?.motionStyle || "orbit-calm");
      const gesture = motion.includes("drift") ? "think" : motion.includes("pulse") ? "cheer" : "wave";
      return { rigMood: String(event.patch?.aura || "social"), rigGesture: gesture, lastRigEventAt: event.timestamp };
    },
    rhizoh: () => ({ lastAttentionFocus: "social" })
  },
  "identity.companion.update": {
    presence: (event) => ({
      companionState: "guiding",
      attentionTargetUid: event.targetUid,
      lastStateAt: event.timestamp
    })
  },
  "identity.ghostpet.update": {
    presence: (event) => ({ petState: "observing", lastStateAt: event.timestamp })
  },
  "identity.signature.update": {
    broadcast: (event) => ({
      overlayKind: "identity.signature",
      tint: String(event.patch?.colorSystem || "indigo-cyan"),
      sceneMode: `signature:${String(event.patch?.colorSystem || "indigo-cyan")}`
    })
  },
  "identity.vault.unlock": {
    broadcast: () => ({ audienceEnergyDelta: 0.08 })
  },
  "identity.journal.append": {
    broadcast: () => ({ overlayKind: "identity.journal" }),
    rhizoh: () => ({ lastAttentionFocus: "memory" })
  }
};

/** P2-D declarative router: event type -> target map -> registered handlers. */
export function routeIdentityInfluence(s: StudioKernelState, e: IdentityCausalEventV0): StudioKernelState {
  const map = IdentityInfluenceMap[e.type];
  if (!map) return s;
  let next = s;
  for (const [target, projector] of Object.entries(map) as Array<[InfluenceTarget, InfluenceProjector | undefined]>) {
    if (!projector) continue;
    const handler = targetHandlers[target];
    if (!handler) continue;
    const patch = projector(e, next);
    appendInfluenceTrace({
      timestamp: e.timestamp,
      eventType: e.type,
      actorUid: e.actorUid,
      targetUid: e.targetUid,
      rule: `${e.type}.${target}`,
      handler: target,
      patch
    });
    next = handler(next, e, patch);
  }
  return next;
}

function stableStringify(input: unknown): string {
  if (input === null || typeof input !== "object") return JSON.stringify(input);
  if (Array.isArray(input)) return `[${input.map((v) => stableStringify(v)).join(",")}]`;
  const obj = input as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

function influenceFingerprint(s: StudioKernelState): string {
  return stableStringify({
    presence: s.presence,
    agentRuntime: {
      lastAttentionFocus: s.agentRuntime.lastAttentionFocus,
      rationaleLog: s.agentRuntime.rationaleLog
    }
  });
}

/** P2-F deterministic replay validator for influence chain output. */
export function validateInfluenceReplayDeterminism(initial: StudioKernelState, events: IdentityCausalEventV0[]): {
  ok: boolean;
  fingerprintA: string;
  fingerprintB: string;
} {
  const run = () => events.reduce((acc, ev) => routeIdentityInfluence(acc, ev), initial);
  const a = run();
  const b = run();
  const fingerprintA = influenceFingerprint(a);
  const fingerprintB = influenceFingerprint(b);
  return { ok: fingerprintA === fingerprintB, fingerprintA, fingerprintB };
}
