import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CausalNode, IdentityState, SimulationMode } from "../types/rskOntology";
import { useStudioKernel } from "../hooks/useStudioKernel";
import { patchSimulation } from "../store/simulationSlice";
import { setActiveBranchId, setActiveMind } from "../store/runtimeSlice";
import { tickMind } from "../store/mindRuntimeSlice";
import { applyAvatarMoveIntent, bindAvatarToEntity, emitAvatarEmote } from "../store/presenceSlice";
import {
  assignPresenceRole,
  getStudioKernelState,
  moderateMute,
  nudgeAvatarInHall,
  presenceAvatarAgentInvoke,
  presenceAvatarPetSummon,
  presenceAvatarRaiseHand,
  presenceAvatarReact,
  presenceAvatarSpeakStart,
  presenceAvatarSpeakStop,
  rhizohCompanionDepart,
  ghostPetDepart,
  stagePin,
  transitionPresenceZone
} from "../store/studioStore.js";
import {
  createBroadcastChannel,
  createPresenceRoom,
  joinBroadcastChannel,
  joinPresenceRoom
} from "../store/roomBroadcastSlice.js";
import { runShadow } from "../runtime/shadowEngine";
import { PresenceStudioViewport } from "./PresenceStudioViewport";

const tabBtn = (active: boolean) =>
  `rounded-t-lg border border-b-0 px-2 py-1.5 text-[8px] font-black tracking-wide uppercase ${
    active ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-100" : "border-white/10 text-white/45 hover:text-white/70"
  }`;

function SovereignBadge({
  identity,
  simulationMode
}: {
  identity: IdentityState;
  simulationMode: SimulationMode;
}) {
  const id = identity;
  const tone = useMemo(() => {
    if (!id?.ownerId) return { ring: "border-white/25", dot: "bg-slate-500", label: "guest" };
    const k = id.actor?.kind ?? "human";
    if (k === "delegate") return { ring: "border-amber-400/55", dot: "bg-amber-400", label: "delegate" };
    if (k === "system") return { ring: "border-violet-400/55", dot: "bg-violet-400", label: "system" };
    if (k === "agent") return { ring: "border-fuchsia-400/50", dot: "bg-fuchsia-400", label: "agent" };
    if (id.session?.token) return { ring: "border-emerald-400/55", dot: "bg-emerald-400", label: "authenticated" };
    return { ring: "border-white/30", dot: "bg-slate-400", label: "human" };
  }, [id]);

  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${tone.ring} bg-black/30`}>
      <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} aria-hidden />
      <div className="text-[9px] leading-tight">
        <div className="font-black tracking-[0.2em] text-white/80">SOVEREIGN</div>
        <div className="text-white/55 normal-case">
          owner {id?.ownerId ?? "—"} · {tone.label}
        </div>
        <div className="text-[8px] text-cyan-200/70 normal-case">sim · {simulationMode}</div>
      </div>
    </div>
  );
}

function ModeSwitcher({ current }: { current: SimulationMode }) {
  const modes: SimulationMode[] = ["draft", "shadow", "sim", "observe", "live", "archive"];
  return (
    <div className="flex flex-wrap gap-1">
      {modes.map((m) => (
        <button
          key={m}
          type="button"
          className={`rounded-md border px-2 py-0.5 text-[8px] font-bold uppercase ${
            m === current ? "border-cyan-400/50 text-cyan-100 bg-cyan-500/10" : "border-white/10 text-white/40"
          }`}
          onClick={() => patchSimulation({ mode: m })}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

function ListBlock({
  title,
  rows,
  empty
}: {
  title: string;
  rows: { key: string; text: string }[];
  empty: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-2">
      <div className="text-[8px] font-black tracking-[0.2em] text-white/40 mb-1">{title}</div>
      {rows.length === 0 ? (
        <div className="text-[9px] text-white/45">{empty}</div>
      ) : (
        <ul className="max-h-32 list-disc pl-4 text-[9px] text-white/70 space-y-0.5 overflow-y-auto">
          {rows.map((r) => (
            <li key={r.key} className="normal-case">
              {r.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VitalBar({ label, value, min, max }: { label: string; value: number; min: number; max: number }) {
  const t = (value - min) / (max - min);
  const pct = Math.max(0, Math.min(100, t * 100));
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[7px] font-bold uppercase tracking-wide text-white/45">
        <span>{label}</span>
        <span className="tabular-nums text-cyan-200/80">{value.toFixed(2)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-600/80 to-emerald-400/90" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MindEcgStrip({
  samples,
  color,
  label,
  normalize
}: {
  samples: number[];
  color: string;
  label: string;
  normalize: (v: number) => number;
}) {
  const w = 100;
  const h = 14;
  const n = samples.length;
  const pts =
    n < 2
      ? `M0,${h / 2} L${w},${h / 2}`
      : samples
          .map((v, i) => {
            const x = (i / Math.max(1, n - 1)) * w;
            const y = h - normalize(v) * (h - 2) - 1;
            return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(" ");
  return (
    <div className="flex items-center gap-1">
      <span className="w-12 shrink-0 text-[6px] font-black uppercase tracking-tight text-white/35">{label}</span>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="max-w-[7rem]" preserveAspectRatio="none">
        <path d={pts} fill="none" stroke={color} strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

type TabId = "souls" | "mind-lab" | "ontology" | "graph" | "shadow" | "presence";

type CausalChainView = "linear" | "graph" | "fracture";

function formatEntropyDelta(n: CausalNode): string {
  const d = n.payload?.delta;
  if (d && typeof d === "object" && "entropy" in d) {
    const e = (d as { entropy: number }).entropy;
    return Number.isFinite(e) ? e.toFixed(3) : "?";
  }
  return "?";
}

/** Minimum surface for collision resolution artifacts (spatial kernel). */
function formatCollisionFractureLine(n: CausalNode): string | null {
  const d = n.payload?.delta;
  if (!d || typeof d !== "object" || (d as { kind?: string }).kind !== "collision.resolution") return null;
  const c = d as {
    initiatorEntityUid: string;
    targetEntityUid: string;
    resolutionType: string;
    impactVector: { x: number; y: number; z: number };
  };
  const iv = c.impactVector;
  const ix = Number.isFinite(iv?.x) ? iv.x.toFixed(2) : "?";
  const iy = Number.isFinite(iv?.y) ? iv.y.toFixed(2) : "?";
  const iz = Number.isFinite(iv?.z) ? iv.z.toFixed(2) : "?";
  return `${c.initiatorEntityUid} ↔ ${c.targetEntityUid} · type ${c.resolutionType} · impact (${ix},${iy},${iz}) · branch ${n.branchId} · tick ${n.tickIndex}`;
}

function formatPresenceBrief(n: CausalNode): string | null {
  const d = n.payload?.delta;
  if (!d || typeof d !== "object") return null;
  const k = (d as { kind?: string }).kind;
  if (k === "presence.join") {
    const o = d as { avatarUid?: string; linkedEntityUid?: string };
    return `presence.join ${o.avatarUid ?? "?"} → entity ${o.linkedEntityUid ?? "?"}`;
  }
  if (k === "avatar.emote") {
    const o = d as { avatarUid?: string; emoteId?: string };
    return `avatar.emote ${o.avatarUid ?? "?"} · ${o.emoteId ?? "?"}`;
  }
  if (k === "presence.room.created") {
    const o = d as { roomUid?: string; title?: string };
    return `room.created ${o.roomUid ?? "?"} · ${o.title ?? ""}`;
  }
  if (k === "presence.room.member_join") {
    const o = d as { roomUid?: string; avatarUid?: string };
    return `room.join ${o.roomUid ?? "?"} ← ${o.avatarUid ?? "?"}`;
  }
  if (k === "presence.room.member_leave") {
    const o = d as { roomUid?: string; avatarUid?: string };
    return `room.leave ${o.roomUid ?? "?"} · ${o.avatarUid ?? "?"}`;
  }
  if (k === "presence.broadcast.created") {
    const o = d as { channelUid?: string; title?: string };
    return `broadcast.created ${o.channelUid ?? "?"} · ${o.title ?? ""}`;
  }
  if (k === "presence.broadcast.join") {
    const o = d as { channelUid?: string; avatarUid?: string; role?: string };
    return `broadcast.join ${o.channelUid ?? "?"} · ${o.avatarUid ?? "?"} (${o.role ?? "?"})`;
  }
  if (k === "presence.broadcast.leave") {
    const o = d as { channelUid?: string; avatarUid?: string };
    return `broadcast.leave ${o.channelUid ?? "?"} · ${o.avatarUid ?? "?"}`;
  }
  if (k === "avatar.spawn") {
    const o = d as { avatarUid?: string; roomUid?: string; zoneId?: string; x?: number; z?: number };
    return `avatar.spawn ${o.avatarUid ?? "?"} @ ${o.roomUid ?? "?"} · ${o.zoneId ?? "?"} (${o.x?.toFixed?.(1) ?? "?"}, ${o.z?.toFixed?.(1) ?? "?"})`;
  }
  if (k === "avatar.move") {
    const o = d as {
      avatarUid?: string;
      roomUid?: string;
      zoneId?: string;
      x?: number;
      z?: number;
      status?: string;
    };
    return `avatar.move ${o.avatarUid ?? "?"} · ${o.roomUid ?? "?"} · ${o.zoneId ?? "?"} (${o.x?.toFixed?.(1) ?? "?"}, ${o.z?.toFixed?.(1) ?? "?"})${o.status ? ` · ${o.status}` : ""}`;
  }
  if (k === "avatar.zone.enter") {
    const o = d as { avatarUid?: string; roomUid?: string; zoneId?: string };
    return `zone.enter ${o.avatarUid ?? "?"} → ${o.zoneId ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "avatar.zone.leave") {
    const o = d as { avatarUid?: string; roomUid?: string; zoneId?: string };
    return `zone.leave ${o.avatarUid ?? "?"} ← ${o.zoneId ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "avatar.zone.transition") {
    const o = d as { avatarUid?: string; roomUid?: string; fromZoneId?: string; toZoneId?: string };
    return `zone.transition ${o.avatarUid ?? "?"} · ${o.fromZoneId ?? "?"} ⇒ ${o.toZoneId ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "role.assign") {
    const o = d as { targetAvatarUid?: string; roomUid?: string; role?: string };
    return `role.assign ${o.targetAvatarUid ?? "?"} → ${o.role ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "role.revoke") {
    const o = d as { targetAvatarUid?: string; roomUid?: string };
    return `role.revoke ${o.targetAvatarUid ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "moderate.kick") {
    const o = d as { targetAvatarUid?: string; roomUid?: string };
    return `moderate.kick ${o.targetAvatarUid ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "moderate.mute") {
    const o = d as { targetAvatarUid?: string; roomUid?: string; muted?: boolean };
    return `moderate.mute ${o.targetAvatarUid ?? "?"} @ ${o.roomUid ?? "?"} · ${o.muted ? "on" : "off"}`;
  }
  if (k === "stage.pin") {
    const o = d as { actorAvatarUid?: string; roomUid?: string; summary?: string };
    return `stage.pin ${o.actorAvatarUid ?? "?"} · ${(o.summary ?? "").slice(0, 40)}`;
  }
  if (k === "stage.invite") {
    const o = d as { fromAvatarUid?: string; toAvatarUid?: string; roomUid?: string };
    return `stage.invite ${o.fromAvatarUid ?? "?"} → ${o.toAvatarUid ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "avatar.speak.start" || k === "avatar.speak.stop") {
    const o = d as { avatarUid?: string; roomUid?: string };
    return `${k} ${o.avatarUid ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "avatar.react") {
    const o = d as { avatarUid?: string; reactKind?: string; kind?: string; roomUid?: string };
    const rk = o.reactKind ?? o.kind;
    return `avatar.react ${o.avatarUid ?? "?"} · ${rk ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "avatar.raise_hand") {
    const o = d as { avatarUid?: string; raised?: boolean; roomUid?: string };
    return `avatar.raise_hand ${o.avatarUid ?? "?"} · ${o.raised ? "up" : "down"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "avatar.pet.summon") {
    const o = d as { avatarUid?: string; petUid?: string; roomUid?: string };
    return `avatar.pet.summon ${o.avatarUid ?? "?"} · ${o.petUid ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "avatar.agent.invoke") {
    const o = d as { avatarUid?: string; agentUid?: string; intent?: string; roomUid?: string };
    return `avatar.agent.invoke ${o.avatarUid ?? "?"} · ${o.agentUid ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "agent.spawn") {
    const o = d as { agentUid?: string; ownerAvatarUid?: string; roomUid?: string; archetype?: string };
    return `agent.spawn ${o.agentUid ?? "?"} · owner ${o.ownerAvatarUid ?? "?"} · ${o.archetype ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "agent.listen") {
    const o = d as { agentUid?: string; roomUid?: string; attentionTargetUid?: string };
    return `agent.listen ${o.agentUid ?? "?"} → ${o.attentionTargetUid ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "agent.respond") {
    const o = d as { agentUid?: string; roomUid?: string; summary?: string };
    return `agent.respond ${o.agentUid ?? "?"} · ${(o.summary ?? "").slice(0, 48)} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "agent.depart") {
    const o = d as { agentUid?: string; roomUid?: string };
    return `agent.depart ${o.agentUid ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "agent.follow" || k === "agent.observe") {
    const o = d as { agentUid?: string; roomUid?: string };
    return `${k} ${o.agentUid ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "pet.spawn") {
    const o = d as { petSlotUid?: string; petUid?: string; ownerAvatarUid?: string; roomUid?: string };
    return `pet.spawn ${o.petUid ?? "?"} · ${o.petSlotUid?.slice(0, 18) ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "pet.follow") {
    const o = d as { petSlotUid?: string; ownerAvatarUid?: string; roomUid?: string };
    return `pet.follow ${o.ownerAvatarUid ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "pet.observe") {
    const o = d as { petSlotUid?: string; roomUid?: string; rhizohAgentUid?: string };
    return `pet.observe ${o.petSlotUid?.slice(0, 14) ?? "?"} · rhizoh ${o.rhizohAgentUid ? "yes" : "—"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "pet.react") {
    const o = d as { petSlotUid?: string; echoKind?: string; roomUid?: string };
    return `pet.react echo:${o.echoKind ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  if (k === "pet.depart") {
    const o = d as { petSlotUid?: string; roomUid?: string };
    return `pet.depart ${o.petSlotUid?.slice(0, 18) ?? "?"} @ ${o.roomUid ?? "?"}`;
  }
  return null;
}

/**
 * Kernel Console — temporal cognitive surface (runtime vitals, shadow fork, ontology registry).
 */
export function KernelConsolePanel() {
  const [tab, setTab] = useState<TabId>("souls");
  const [shadowInput, setShadowInput] = useState("");
  const [shadowTicks, setShadowTicks] = useState(3);
  const [shadowMsg, setShadowMsg] = useState<string | null>(null);
  const [presenceMsg, setPresenceMsg] = useState<string | null>(null);
  const [causalView, setCausalView] = useState<CausalChainView>("linear");
  const ecgRef = useRef<Array<{ mood: number; focus: number; energy: number; entropy: number }>>([]);

  const identity = useStudioKernel((s) => s.identity);
  const simulationMode = useStudioKernel((s) => s.simulation.mode);
  const simDiff = useStudioKernel((s) => s.simulation.diff);
  const activeMind = useStudioKernel((s) => s.runtime.activeMind);
  const activeBranchId = useStudioKernel((s) => s.runtime.activeBranchId ?? "branch:main");
  const causalGraph = useStudioKernel((s) => s.registry.causalGraph);
  const firstEntityUid = useStudioKernel((s) => Object.keys(s.registry.entity)[0] ?? null);
  const roomCount = useStudioKernel((s) => Object.keys(s.presence?.rooms ?? {}).length);
  const broadcastCount = useStudioKernel((s) => Object.keys(s.presence?.broadcasts ?? {}).length);
  const voiceStubSegments = useStudioKernel((s) => {
    const roomUid = s.presence?.avatars["avatar:stage:1"]?.projection?.roomUid;
    if (!roomUid) return [];
    return s.presence?.voiceStubByRoomUid?.[roomUid]?.segments ?? [];
  });
  const voiceStubRows = useMemo(() => {
    return [...voiceStubSegments].reverse().slice(0, 14).map((seg, i) => {
      const live = seg.endMs === undefined;
      const durS =
        !live && seg.endMs !== undefined ? Math.max(0, (seg.endMs - seg.startMs) / 1000).toFixed(1) : null;
      const who = seg.avatarUid.replace(/^avatar:/, "").slice(0, 16);
      return {
        key: `${seg.causalStartNodeId}-${i}`,
        text: `${who} · ${live ? "live · ···" : `${durS}s`} · start ${String(seg.causalStartNodeId).slice(0, 12)}…`
      };
    });
  }, [voiceStubSegments]);

  const souls = useStudioKernel((s) =>
    s.identity.ownerId ? Object.values(s.registry.soul).filter((x) => x.ownerId === s.identity.ownerId) : []
  );
  const defs = useStudioKernel((s) => Object.values(s.registry.mind.definition));
  const inst = useStudioKernel((s) => Object.values(s.registry.mind.instance));
  const tools = useStudioKernel((s) => Object.values(s.registry.tool));
  const mem = useStudioKernel((s) => Object.values(s.registry.memoryProfile));
  const pol = useStudioKernel((s) => Object.values(s.registry.policy));
  const links = useStudioKernel((s) => Object.values(s.registry.link));
  const soulBinds = useStudioKernel((s) => Object.values(s.registry.soulMind));

  const selectedId = activeMind && inst.some((m) => m.uid === activeMind) ? activeMind : inst[0]?.uid ?? null;
  const rt = useStudioKernel((s) => (selectedId ? s.mindRuntime[selectedId] : undefined));

  useEffect(() => {
    if (!rt) return;
    ecgRef.current = [
      ...ecgRef.current,
      {
        mood: rt.internal.mood,
        focus: rt.internal.focus,
        energy: rt.internal.energy,
        entropy: rt.internal.entropy
      }
    ].slice(-48);
  }, [rt?.cognition.lastThoughtAt]);

  const moodSamples = ecgRef.current.map((x) => x.mood);
  const focusSamples = ecgRef.current.map((x) => x.focus);
  const energySamples = ecgRef.current.map((x) => x.energy);
  const entropySamples = ecgRef.current.map((x) => x.entropy);

  const soulRows = souls.map((x) => ({
    key: x.uid,
    text: `${x.uid} · ${x.metadata?.name ?? "—"} · hash ${String(x.continuityHash).slice(0, 12)}…`
  }));
  const defRows = defs.map((d) => ({ key: d.uid, text: `${d.uid} · ${String(d.metadata?.alias ?? "")}` }));
  const instRows = inst.map((m) => ({
    key: m.uid,
    text: `${m.uid} ← ${m.definitionUid}${m.soulUid ? ` · soul ${m.soulUid}` : ""}`
  }));
  const toolRows = tools.map((t) => ({ key: t.uid, text: `${t.name} · ${t.category} · ${t.fn}` }));
  const memRows = mem.map((p) => ({ key: p.uid, text: `${p.uid} · short ${p.short} · dream ${p.dream}` }));
  const polRows = pol.map((p) => ({ key: p.uid, text: `${p.uid} · safety ${p.safety}` }));
  const linkRows = links.map((l) => ({
    key: l.uid,
    text: `${l.entityId} ⇄ ${l.mindInstanceId} · ${l.state}`
  }));
  const smbRows = soulBinds.map((b) => ({
    key: b.uid,
    text: `${b.soulUid} → ${b.mindInstanceUid} · ${b.state}`
  }));

  const linearCausalRows = useMemo(() => {
    const nodes = Object.values(causalGraph.nodes).filter((n) => n.branchId === activeBranchId);
    nodes.sort((a, b) => b.tickIndex - a.tickIndex);
    return nodes.slice(0, 24).map((n) => {
      const collision = formatCollisionFractureLine(n);
      const presence = formatPresenceBrief(n);
      const tail = collision ?? presence ?? `Δe ${formatEntropyDelta(n)}`;
      return {
        key: n.id,
        text: `t${n.tickIndex} · ${n.type} · ${n.actorId} · ${tail} · ← ${n.causeIds.length} cause(s) · ${n.id.slice(0, 20)}…`
      };
    });
  }, [causalGraph.nodes, activeBranchId]);

  const dagEdgeRows = useMemo(() => {
    const nodes = Object.values(causalGraph.nodes).filter((n) => n.branchId === activeBranchId);
    const rows: { key: string; text: string }[] = [];
    for (const n of nodes) {
      for (const c of n.causeIds) {
        rows.push({
          key: `${n.id}|from|${c}`,
          text: `${c.slice(0, 24)}… ⇒ ${n.id.slice(0, 24)}… (t${n.tickIndex})`
        });
      }
    }
    return rows.slice(0, 36);
  }, [causalGraph.nodes, activeBranchId]);

  const fractureRows = useMemo(() => {
    const src = simDiff?.causalFractures ?? simDiff?.causalShadow?.fractures;
    if (!src?.length) return [];
    return src.map((f, i) => ({
      key: `frac-${i}-${f.tickIndex}`,
      text: `t${f.tickIndex} · ${f.reason}${f.shadowBranchId ? ` · ${f.shadowBranchId}` : ""}`
    }));
  }, [simDiff]);

  const branchIds = useMemo(() => Object.keys(causalGraph.branches).sort(), [causalGraph.branches]);

  const branchMetaRows = useMemo(() => {
    return branchIds.map((bid) => {
      const b = causalGraph.branches[bid];
      return {
        key: bid,
        text: `${bid} · depth ${b?.lineageDepth ?? "?"} · fork@${b?.forkTick ?? "?"} · parent ${b?.parentBranchId ?? "—"} · ${b?.status ?? ""}`
      };
    });
  }, [branchIds, causalGraph.branches]);

  const onTick = useCallback(() => {
    if (!selectedId) return;
    const r = tickMind(selectedId, shadowInput || undefined);
    if (!r.ok) setShadowMsg(`tick: ${r.error}`);
    else setShadowMsg(null);
  }, [selectedId, shadowInput]);

  const onShadow = useCallback(() => {
    if (!selectedId) return;
    patchSimulation({ mode: "shadow" });
    const out = runShadow({
      mindInstanceId: selectedId,
      input: shadowInput || undefined,
      ticks: shadowTicks
    });
    if ("error" in out) setShadowMsg(`shadow: ${out.error}`);
    else setShadowMsg(`shadow ok · risk ${out.risk.toFixed(2)} · ticks ${out.cost}`);
  }, [selectedId, shadowInput, shadowTicks]);

  const onBindDemoAvatar = useCallback(() => {
    if (!firstEntityUid) {
      setPresenceMsg("Önce registry.entity ile en az bir entity oluşturun.");
      return;
    }
    const r = bindAvatarToEntity({
      avatarUid: "avatar:stage:1",
      linkedEntityUid: firstEntityUid
    });
    if (!r.ok) setPresenceMsg(`bind: ${r.error}`);
    else setPresenceMsg(`bind ok · ${r.value.uid} → ${r.value.linkedEntityUid}`);
  }, [firstEntityUid]);

  const onEmoteWave = useCallback(() => {
    const r = emitAvatarEmote({ avatarUid: "avatar:stage:1", emoteId: "wave" });
    if (!r.ok) setPresenceMsg(`emote: ${r.error}`);
    else setPresenceMsg(`emote ok · node ${r.value.causalNodeId.slice(0, 18)}…`);
  }, []);

  const onAvatarNudge = useCallback(() => {
    const r = applyAvatarMoveIntent({ avatarUid: "avatar:stage:1", dpos: { x: 0.15, y: 0, z: 0 } });
    if (!r.ok) setPresenceMsg(`move: ${r.error}${r.rejectionTrace ? ` · ${r.rejectionTrace[0]}` : ""}`);
    else if (r.value.outcome === "collision_stop") setPresenceMsg("move blocked · collision_stop");
    else setPresenceMsg("move ok");
  }, []);

  const onCreateMainHall = useCallback(() => {
    const r = createPresenceRoom({
      roomUid: "room:main_hall",
      title: "Main Hall",
      topic: "castle-hub"
    });
    if (!r.ok) setPresenceMsg(`room: ${r.error}`);
    else setPresenceMsg(`room ok · ${r.value.uid} · ${r.value.title}`);
  }, []);

  const onJoinMainHall = useCallback(() => {
    const r = joinPresenceRoom({ roomUid: "room:main_hall", avatarUid: "avatar:stage:1" });
    if (!r.ok) setPresenceMsg(`room join: ${r.error}`);
    else setPresenceMsg(`room join ok · spawn node ${r.value.causalNodeId ? `${r.value.causalNodeId.slice(0, 14)}…` : "—"}`);
  }, []);

  const onHallNudge = useCallback(() => {
    const r = nudgeAvatarInHall({ avatarUid: "avatar:stage:1", roomUid: "room:main_hall", dx: 0.55, dz: 0.12 });
    if (!r.ok) setPresenceMsg(`hall move: ${r.error}`);
    else setPresenceMsg(`hall move ok · ${r.value.causalNodeId.slice(0, 16)}…`);
  }, []);

  const onGotoStage = useCallback(() => {
    const r = transitionPresenceZone({
      avatarUid: "avatar:stage:1",
      roomUid: "room:main_hall",
      toZoneId: "stage"
    });
    if (!r.ok) setPresenceMsg(`zone: ${r.error}`);
    else setPresenceMsg(`zone → stage · ${r.value.causalNodeId ? r.value.causalNodeId.slice(0, 14) + "…" : "noop"}`);
  }, []);

  const onAssignMod = useCallback(() => {
    const r = assignPresenceRole({
      roomUid: "room:main_hall",
      targetAvatarUid: "avatar:stage:1",
      role: "moderator",
      assignedByAvatarUid: "avatar:stage:1"
    });
    if (!r.ok) setPresenceMsg(`role assign: ${r.error}`);
    else setPresenceMsg("role → moderator (self as owner)");
  }, []);

  const onMuteDemo = useCallback(() => {
    const r = moderateMute({
      roomUid: "room:main_hall",
      targetAvatarUid: "avatar:stage:1",
      muted: true,
      actorAvatarUid: "avatar:stage:1"
    });
    if (!r.ok) setPresenceMsg(`mute: ${r.error}`);
    else setPresenceMsg("muted (try hall nudge — should fail)");
  }, []);

  const onUnmuteDemo = useCallback(() => {
    const r = moderateMute({
      roomUid: "room:main_hall",
      targetAvatarUid: "avatar:stage:1",
      muted: false,
      actorAvatarUid: "avatar:stage:1"
    });
    if (!r.ok) setPresenceMsg(`unmute: ${r.error}`);
    else setPresenceMsg("unmuted");
  }, []);

  const onSpeakStart = useCallback(() => {
    const r = presenceAvatarSpeakStart({ avatarUid: "avatar:stage:1" });
    if (!r.ok) setPresenceMsg(`speak.start: ${r.error}`);
    else setPresenceMsg("speak.start (protocol)");
  }, []);

  const onSpeakStop = useCallback(() => {
    const r = presenceAvatarSpeakStop({ avatarUid: "avatar:stage:1" });
    if (!r.ok) setPresenceMsg(`speak.stop: ${r.error}`);
    else setPresenceMsg("speak.stop (protocol)");
  }, []);

  const onReactClap = useCallback(() => {
    const r = presenceAvatarReact({ avatarUid: "avatar:stage:1", kind: "applaud" });
    if (!r.ok) setPresenceMsg(`react: ${r.error}`);
    else setPresenceMsg("react · applaud");
  }, []);

  const onRaiseHand = useCallback(() => {
    const r = presenceAvatarRaiseHand({ avatarUid: "avatar:stage:1", raised: true });
    if (!r.ok) setPresenceMsg(`raise_hand: ${r.error}`);
    else setPresenceMsg("raise_hand ↑");
  }, []);

  const onLowerHand = useCallback(() => {
    const r = presenceAvatarRaiseHand({ avatarUid: "avatar:stage:1", raised: false });
    if (!r.ok) setPresenceMsg(`raise_hand: ${r.error}`);
    else setPresenceMsg("raise_hand ↓");
  }, []);

  const onPetSummon = useCallback(() => {
    const r = presenceAvatarPetSummon({ avatarUid: "avatar:stage:1", petUid: "ghost:shane:1" });
    if (!r.ok) setPresenceMsg(`pet: ${r.error}`);
    else setPresenceMsg("pet.summon + ghost orbit chain");
  }, []);

  const onAgentInvoke = useCallback(() => {
    const r = presenceAvatarAgentInvoke({
      avatarUid: "avatar:stage:1",
      agentUid: "rhizoh:companion:1",
      intent: "@Rhizoh summarize hall"
    });
    if (!r.ok) setPresenceMsg(`agent: ${r.error}`);
    else setPresenceMsg("agent.invoke → Rhizoh companion chain");
  }, []);

  const onRhizohDepart = useCallback(() => {
    const r = rhizohCompanionDepart({ ownerAvatarUid: "avatar:stage:1" });
    if (!r.ok) setPresenceMsg(`companion depart: ${r.error}`);
    else setPresenceMsg("Rhizoh companion depart");
  }, []);

  const onGhostPetDepart = useCallback(() => {
    const r = ghostPetDepart({ ownerAvatarUid: "avatar:stage:1" });
    if (!r.ok) setPresenceMsg(`ghost pet depart: ${r.error}`);
    else setPresenceMsg("ghost pet depart");
  }, []);

  const onStagePinDemo = useCallback(() => {
    const r = stagePin({
      roomUid: "room:main_hall",
      actorAvatarUid: "avatar:stage:1",
      summary: "Castle keynote · causal spine",
      actorAuthorityAvatarUid: "avatar:stage:1"
    });
    if (!r.ok) setPresenceMsg(`pin: ${r.error}`);
    else setPresenceMsg("stage pin ok");
  }, []);

  const onGotoAudience = useCallback(() => {
    const r = transitionPresenceZone({
      avatarUid: "avatar:stage:1",
      roomUid: "room:main_hall",
      toZoneId: "audience"
    });
    if (!r.ok) setPresenceMsg(`zone: ${r.error}`);
    else setPresenceMsg(`zone → audience`);
  }, []);

  const onVoiceRingToggle = useCallback(() => {
    const s = getStudioKernelState();
    const av = s.presence?.avatars["avatar:stage:1"];
    const roomUid = av?.currentRoomUid;
    const pr = av?.projection;
    if (!roomUid || !pr || pr.roomUid !== roomUid) {
      setPresenceMsg("Önce Main Hall’a katılın (P2 projection).");
      return;
    }
    if (pr.status === "talking") {
      const r = presenceAvatarSpeakStop({ avatarUid: "avatar:stage:1" });
      if (!r.ok) setPresenceMsg(`voice stub: ${r.error}`);
      else setPresenceMsg("voice stub · speak.stop (ring off)");
    } else {
      const r = presenceAvatarSpeakStart({ avatarUid: "avatar:stage:1" });
      if (!r.ok) setPresenceMsg(`voice stub: ${r.error}`);
      else setPresenceMsg("voice stub · speak.start (ring on)");
    }
  }, []);

  const onCreateLiveStream = useCallback(() => {
    const r = createBroadcastChannel({
      channelUid: "bc:live:1",
      title: "Castle Live"
    });
    if (!r.ok) setPresenceMsg(`broadcast: ${r.error}`);
    else setPresenceMsg(`broadcast ok · ${r.value.uid}`);
  }, []);

  const onJoinStreamAudience = useCallback(() => {
    const r = joinBroadcastChannel({
      channelUid: "bc:live:1",
      avatarUid: "avatar:stage:1",
      role: "audience"
    });
    if (!r.ok) setPresenceMsg(`broadcast join: ${r.error}`);
    else setPresenceMsg(`broadcast join ok`);
  }, []);

  const tabs: { id: TabId; label: string }[] = [
    { id: "souls", label: "Souls" },
    { id: "mind-lab", label: "Mind Lab" },
    { id: "ontology", label: "Ontology" },
    { id: "graph", label: "Graph" },
    { id: "shadow", label: "Shadow" },
    { id: "presence", label: "Presence" }
  ];

  return (
    <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-[#050d0a]/90 p-3 text-[10px] text-white/85 normal-case backdrop-blur-md">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-2 mb-2">
        <div>
          <div className="text-[9px] font-black tracking-[0.35em] text-emerald-200/90">KERNEL CONSOLE</div>
          <div className="text-[8px] text-white/45 mt-0.5">Rhizoh Studio Kernel · runtime + ontology</div>
        </div>
        <SovereignBadge identity={identity} simulationMode={simulationMode} />
      </div>
      <div className="mb-2">
        <div className="text-[8px] text-white/40 mb-1">simulation lane</div>
        <ModeSwitcher current={simulationMode} />
      </div>
      <nav className="flex flex-wrap gap-0.5 border-b border-white/10 pb-2 mb-2">
        {tabs.map((t) => (
          <button key={t.id} type="button" className={tabBtn(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <main className="space-y-2 min-h-[8rem]">
        {tab === "souls" ? <ListBlock title="Souls (continuity roots)" rows={soulRows} empty="Henüz soul yok." /> : null}

        {tab === "mind-lab" ? (
          <div className="space-y-2 rounded-lg border border-cyan-500/20 bg-cyan-950/15 p-2">
            <div className="text-[8px] font-black tracking-[0.25em] text-cyan-200/90">MIND LAB · vitals + ECG</div>
            {!selectedId ? (
              <div className="text-[9px] text-white/45">Önce bir MindInstance oluşturun (bootstrap veya registry).</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1">
                  {inst.map((m) => (
                    <button
                      key={m.uid}
                      type="button"
                      onClick={() => setActiveMind(m.uid)}
                      className={`rounded border px-1.5 py-0.5 text-[7px] font-bold uppercase ${
                        m.uid === selectedId ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-100" : "border-white/10 text-white/50"
                      }`}
                    >
                      {m.uid.slice(-18)}
                    </button>
                  ))}
                </div>
                {rt ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-2">
                      <VitalBar label="mood (−1…1)" value={rt.internal.mood} min={-1} max={1} />
                      <VitalBar label="focus" value={rt.internal.focus} min={0} max={1} />
                      <VitalBar label="energy" value={rt.internal.energy} min={0} max={1} />
                      <VitalBar label="entropy" value={rt.internal.entropy} min={0} max={1} />
                      <VitalBar label="signal" value={rt.perception.signalStrength} min={0} max={1} />
                    </div>
                    <div className="rounded border border-white/10 bg-black/30 p-2 space-y-1">
                      <div className="text-[7px] font-black tracking-[0.2em] text-white/35">MIND ECG</div>
                      <MindEcgStrip
                        label="mood"
                        samples={moodSamples}
                        color="#22d3ee"
                        normalize={(v) => (v + 1) / 2}
                      />
                      <MindEcgStrip label="focus" samples={focusSamples} color="#a78bfa" normalize={(v) => v} />
                      <MindEcgStrip label="energy" samples={energySamples} color="#34d399" normalize={(v) => v} />
                      <MindEcgStrip label="entropy" samples={entropySamples} color="#fbbf24" normalize={(v) => v} />
                    </div>
                  </div>
                ) : null}
                <div className="space-y-1">
                  <label className="block text-[7px] font-bold uppercase text-white/40">perception / shadow input</label>
                  <textarea
                    value={shadowInput}
                    onChange={(e) => setShadowInput(e.target.value)}
                    rows={2}
                    className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-[9px] text-white/80"
                    placeholder="Opsiyonel bağlam — tick ve shadow trace’e düşer."
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onTick}
                    className="rounded-md border border-emerald-500/40 bg-emerald-950/40 px-2 py-1 text-[8px] font-black uppercase text-emerald-100"
                  >
                    Tick mind
                  </button>
                  <label className="flex items-center gap-1 text-[8px] text-white/50">
                    shadow ticks
                    <input
                      type="number"
                      min={1}
                      max={32}
                      value={shadowTicks}
                      onChange={(e) => setShadowTicks(Number(e.target.value) || 1)}
                      className="w-12 rounded border border-white/15 bg-black/40 px-1 text-[9px]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={onShadow}
                    className="rounded-md border border-amber-500/45 bg-amber-950/35 px-2 py-1 text-[8px] font-black uppercase text-amber-100"
                  >
                    Shadow run
                  </button>
                </div>
                {shadowMsg ? <div className="text-[8px] text-amber-200/90">{shadowMsg}</div> : null}
              </>
            )}
          </div>
        ) : null}

        {tab === "graph" ? (
          <div className="space-y-2 rounded-lg border border-violet-500/25 bg-violet-950/15 p-2">
            <div className="text-[8px] font-black tracking-[0.25em] text-violet-200/90">CAUSAL CHAIN VIEW</div>
            <div className="text-[7px] text-white/45">
              laws: no future causes · append-only · branch past immutable · merge policy: deterministic-diff-resolution
            </div>
            <div className="flex flex-wrap gap-0.5">
              {(
                [
                  ["linear", "Linear"],
                  ["graph", "Graph"],
                  ["fracture", "Fracture"]
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCausalView(id)}
                  className={`rounded border px-1.5 py-0.5 text-[7px] font-black uppercase ${
                    causalView === id ? "border-violet-400/60 bg-violet-500/20 text-violet-100" : "border-white/10 text-white/45"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {branchIds.map((bid) => (
                <button
                  key={bid}
                  type="button"
                  onClick={() => setActiveBranchId(bid)}
                  className={`rounded border px-1.5 py-0.5 text-[7px] font-bold uppercase ${
                    bid === activeBranchId ? "border-violet-400/60 bg-violet-500/25 text-violet-100" : "border-white/10 text-white/50"
                  }`}
                >
                  {bid.replace(/^branch:/, "")}
                </button>
              ))}
            </div>
            {causalView === "linear" ? (
              <ListBlock
                title={`Linear · ${activeBranchId}`}
                rows={linearCausalRows}
                empty="Bu branch üzerinde henüz olay yok."
              />
            ) : null}
            {causalView === "graph" ? (
              <div className="space-y-2">
                <ListBlock title="Branches (DAG meta)" rows={branchMetaRows} empty="Branch yok." />
                <ListBlock title={`Edges · ${activeBranchId}`} rows={dagEdgeRows} empty="Kenar yok." />
              </div>
            ) : null}
            {causalView === "fracture" ? (
              <ListBlock
                title="Fracture hints (shadow vs trunk heuristics)"
                rows={fractureRows}
                empty="Bekleyen çatlak yok — shadow çalıştırın veya trunk/shadow entropy işaretini karşılaştırın."
              />
            ) : null}
            {simDiff?.causalShadow ? (
              <div className="rounded border border-amber-500/30 bg-black/30 p-2 text-[8px] text-amber-100/85">
                <div className="font-black tracking-[0.15em] text-amber-200/80">LAST SHADOW FORK</div>
                <div className="mt-1 normal-case text-white/70">
                  branch {simDiff.causalShadow.branch.id} · depth {simDiff.causalShadow.branch.lineageDepth} · nodes{" "}
                  {simDiff.causalShadow.nodeCount} · live tip {simDiff.causalShadow.liveWriterTipId?.slice(0, 28) ?? "—"}…
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === "ontology" ? (
          <div className="space-y-2">
            <div className="text-[8px] font-black tracking-[0.2em] text-white/40">ONTOLOGY · registry</div>
            <ListBlock title="Definitions" rows={defRows} empty="Tanım yok." />
            <ListBlock title="Instances" rows={instRows} empty="Instance yok." />
            <ListBlock title="Tools" rows={toolRows} empty="Tool kaydı yok." />
            <ListBlock title="Memory profiles" rows={memRows} empty="Profil yok." />
            <ListBlock title="Policies" rows={polRows} empty="Policy yok." />
            <ListBlock title="Entity ↔ Mind (MindLink)" rows={linkRows} empty="Link yok." />
            <ListBlock title="Soul ↔ Mind (cognitive bind)" rows={smbRows} empty="Soul-mind bind yok." />
          </div>
        ) : null}

        {tab === "presence" ? (
          <div className="space-y-2">
            <PresenceStudioViewport />
            <div className="rounded-lg border border-fuchsia-500/20 bg-black/30 p-2 space-y-2">
              <div className="text-[8px] font-black tracking-[0.2em] text-fuchsia-200/85">PHASE P1 · AVATAR SHELL</div>
              <div className="text-[8px] text-white/50">
                Soul → AvatarEntity → linkedEntityUid; move delegates to `physics.entity.move.apply` on that entity.
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={onBindDemoAvatar}
                  className="rounded border border-fuchsia-400/40 bg-fuchsia-950/35 px-2 py-1 text-[8px] font-black uppercase text-fuchsia-100"
                >
                  Bind demo avatar
                </button>
                <button
                  type="button"
                  onClick={onEmoteWave}
                  className="rounded border border-pink-400/35 bg-pink-950/30 px-2 py-1 text-[8px] font-black uppercase text-pink-100"
                >
                  Emote wave
                </button>
                <button
                  type="button"
                  onClick={onAvatarNudge}
                  className="rounded border border-cyan-400/35 bg-cyan-950/25 px-2 py-1 text-[8px] font-black uppercase text-cyan-100"
                >
                  Avatar nudge +X
                </button>
              </div>
              {presenceMsg ? <div className="text-[8px] text-fuchsia-200/90">{presenceMsg}</div> : null}
            </div>
            <div className="rounded-lg border border-cyan-500/25 bg-cyan-950/15 p-2 space-y-2">
              <div className="text-[8px] font-black tracking-[0.2em] text-cyan-200/90">PRESENCE PROTOCOL (atoms)</div>
              <div className="text-[7px] text-white/45">Transport-agnostic causal events — voice/pet/agent bind here first.</div>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={onSpeakStart}
                  className="rounded border border-cyan-400/40 bg-cyan-950/30 px-2 py-1 text-[8px] font-black uppercase text-cyan-100"
                >
                  speak.start
                </button>
                <button
                  type="button"
                  onClick={onSpeakStop}
                  className="rounded border border-slate-400/35 bg-slate-950/30 px-2 py-1 text-[8px] font-black uppercase text-slate-100"
                >
                  speak.stop
                </button>
                <button
                  type="button"
                  onClick={onReactClap}
                  className="rounded border border-pink-400/35 bg-pink-950/25 px-2 py-1 text-[8px] font-black uppercase text-pink-100"
                >
                  react applaud
                </button>
                <button
                  type="button"
                  onClick={onRaiseHand}
                  className="rounded border border-lime-400/35 bg-lime-950/20 px-2 py-1 text-[8px] font-black uppercase text-lime-100"
                >
                  hand ↑
                </button>
                <button
                  type="button"
                  onClick={onLowerHand}
                  className="rounded border border-lime-500/25 bg-black/35 px-2 py-1 text-[8px] font-black uppercase text-lime-100/80"
                >
                  hand ↓
                </button>
                <button
                  type="button"
                  onClick={onPetSummon}
                  className="rounded border border-violet-400/35 bg-violet-950/25 px-2 py-1 text-[8px] font-black uppercase text-violet-100"
                >
                  pet summon (ghost)
                </button>
                <button
                  type="button"
                  onClick={onGhostPetDepart}
                  className="rounded border border-teal-500/25 bg-black/35 px-2 py-1 text-[8px] font-black uppercase text-teal-100/85"
                >
                  ghost pet depart
                </button>
                <button
                  type="button"
                  onClick={onAgentInvoke}
                  className="rounded border border-fuchsia-400/40 bg-fuchsia-950/25 px-2 py-1 text-[8px] font-black uppercase text-fuchsia-100"
                >
                  @Rhizoh invoke
                </button>
                <button
                  type="button"
                  onClick={onRhizohDepart}
                  className="rounded border border-fuchsia-500/25 bg-black/35 px-2 py-1 text-[8px] font-black uppercase text-fuchsia-100/80"
                >
                  Rhizoh depart
                </button>
              </div>
            </div>
            <div className="rounded-lg border border-teal-500/25 bg-teal-950/15 p-2 space-y-2">
              <div className="text-[8px] font-black tracking-[0.2em] text-teal-200/90">VOICE TRANSPORT STUB</div>
              <div className="text-[7px] text-white/45">
                No RTP/WebRTC — ring and “talking” posture follow avatar.speak.*; timeline is kernel-local replay sugar.
              </div>
              <ListBlock
                title="Speak timeline (demo avatar room)"
                rows={voiceStubRows}
                empty="Hall’a katılıp speak.start/stop veya Voice ring deneyin."
              />
            </div>
            <div className="rounded-lg border border-violet-500/25 bg-violet-950/15 p-2 space-y-2">
              <div className="text-[8px] font-black tracking-[0.2em] text-violet-200/90">ROOM · BROADCAST (causal)</div>
              <div className="text-[8px] text-white/45">
                rooms: {roomCount} · broadcasts: {broadcastCount} · writers room:* / broadcast:* + presence:* spawn/move
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={onCreateMainHall}
                  className="rounded border border-violet-400/40 bg-violet-950/35 px-2 py-1 text-[8px] font-black uppercase text-violet-100"
                >
                  Create Main Hall
                </button>
                <button
                  type="button"
                  onClick={onJoinMainHall}
                  className="rounded border border-violet-400/30 bg-black/35 px-2 py-1 text-[8px] font-black uppercase text-violet-100/90"
                >
                  Join hall (demo avatar)
                </button>
                <button
                  type="button"
                  onClick={onHallNudge}
                  className="rounded border border-emerald-400/35 bg-emerald-950/25 px-2 py-1 text-[8px] font-black uppercase text-emerald-100"
                >
                  Hall nudge +X
                </button>
                <button
                  type="button"
                  onClick={onVoiceRingToggle}
                  className="rounded border border-teal-400/35 bg-teal-950/25 px-2 py-1 text-[8px] font-black uppercase text-teal-100"
                >
                  Voice ring
                </button>
                <button
                  type="button"
                  onClick={onGotoStage}
                  className="rounded border border-amber-400/40 bg-amber-950/30 px-2 py-1 text-[8px] font-black uppercase text-amber-100"
                >
                  Zone → stage
                </button>
                <button
                  type="button"
                  onClick={onGotoAudience}
                  className="rounded border border-slate-400/35 bg-slate-950/30 px-2 py-1 text-[8px] font-black uppercase text-slate-100"
                >
                  Zone → audience
                </button>
                <button
                  type="button"
                  onClick={onAssignMod}
                  className="rounded border border-amber-500/40 bg-amber-950/25 px-2 py-1 text-[8px] font-black uppercase text-amber-100"
                >
                  Role → mod
                </button>
                <button
                  type="button"
                  onClick={onMuteDemo}
                  className="rounded border border-rose-500/35 bg-rose-950/25 px-2 py-1 text-[8px] font-black uppercase text-rose-100"
                >
                  Mute self
                </button>
                <button
                  type="button"
                  onClick={onUnmuteDemo}
                  className="rounded border border-emerald-500/35 bg-emerald-950/25 px-2 py-1 text-[8px] font-black uppercase text-emerald-100"
                >
                  Unmute self
                </button>
                <button
                  type="button"
                  onClick={onStagePinDemo}
                  className="rounded border border-yellow-500/35 bg-yellow-950/20 px-2 py-1 text-[8px] font-black uppercase text-yellow-100"
                >
                  Stage pin
                </button>
                <button
                  type="button"
                  onClick={onCreateLiveStream}
                  className="rounded border border-rose-400/40 bg-rose-950/30 px-2 py-1 text-[8px] font-black uppercase text-rose-100"
                >
                  Create live stream
                </button>
                <button
                  type="button"
                  onClick={onJoinStreamAudience}
                  className="rounded border border-rose-400/30 bg-black/35 px-2 py-1 text-[8px] font-black uppercase text-rose-100/90"
                >
                  Join stream (audience)
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "shadow" ? (
          <div className="space-y-2 rounded-lg border border-amber-500/25 bg-amber-950/20 p-3 text-[9px] text-amber-100/90">
            <div className="font-black tracking-[0.2em] text-amber-200/80">SHADOW DIFF</div>
            {simDiff ? (
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded border border-amber-500/20 bg-black/40 p-2 text-[8px] leading-relaxed text-amber-50/90">
                {JSON.stringify(
                  {
                    ok: simDiff.ok,
                    riskScore: simDiff.riskScore,
                    output: simDiff.output,
                    notes: simDiff.notes,
                    traceLen: Array.isArray(simDiff.trace) ? simDiff.trace.length : 0,
                    causalShadow: simDiff.causalShadow
                      ? {
                          branch: simDiff.causalShadow.branch.id,
                          depth: simDiff.causalShadow.branch.lineageDepth,
                          nodeCount: simDiff.causalShadow.nodeCount,
                          mergePolicy: simDiff.causalShadow.mergePolicy,
                          fractures: simDiff.causalShadow.fractures
                        }
                      : undefined,
                    causalFractures: simDiff.causalFractures
                  },
                  null,
                  2
                )}
              </pre>
            ) : (
              <div className="text-white/45">Mind Lab’den Shadow run çalıştırın; diff burada görünür.</div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

/** @deprecated use KernelConsolePanel */
export const KernelConsole = KernelConsolePanel;
