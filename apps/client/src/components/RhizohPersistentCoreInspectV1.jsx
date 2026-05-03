import { memo, useEffect, useState } from "react";
import { readIdentityGraph } from "../kernel/rhizohIdentityKernelV1.js";
import {
  TCEE_PHASE,
  peekCastleRuntimeTransactionQueueDepth,
  getLastRuntimeMergeId
} from "../rhizoh/boot/index.js";

function readContinuityMeta() {
  try {
    const raw = window.localStorage.getItem("rhizoh.continuity.v1") || "";
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed?.meta && typeof parsed.meta === "object" ? parsed.meta : {};
  } catch {
    return {};
  }
}

export const RhizohPersistentCoreInspectV1 = memo(function RhizohPersistentCoreInspectV1({
  gatewayPhase = "—",
  socialRegistry = null
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 400);
    return () => window.clearInterval(id);
  }, []);

  void tick;
  const meta = readContinuityMeta();
  const tcee = meta.tceeBoot && typeof meta.tceeBoot === "object" ? meta.tceeBoot : {};
  const phase = String(tcee.phase || "—");
  const wakeLabel =
    phase === TCEE_PHASE.AWAKE ? "awake" : phase === TCEE_PHASE.PRE_BREATH ? "pre_breath" : phase;

  let rtqDepth = 0;
  try {
    rtqDepth = peekCastleRuntimeTransactionQueueDepth();
  } catch {
    rtqDepth = 0;
  }

  let mergeId = "—";
  try {
    mergeId = getLastRuntimeMergeId() || "—";
  } catch {
    mergeId = "—";
  }

  const ig = readIdentityGraph();
  const rh = ig.rhizoh && typeof ig.rhizoh === "object" ? ig.rhizoh : {};
  const trust = Number(rh.trust ?? 0);
  const fam = Number(rh.familiarity ?? 0);
  const idAt = typeof ig.updatedAt === "number" ? ig.updatedAt : null;
  const idDelta = `${trust.toFixed(2)} / ${fam.toFixed(2)}`;

  const wturns = Array.isArray(meta.rhizohWeightedTurns) ? meta.rhizohWeightedTurns.length : 0;
  const episodes = Array.isArray(meta.rhizohMemoryEpisodes) ? meta.rhizohMemoryEpisodes.length : 0;

  const phys =
    socialRegistry?.socialPhysics && typeof socialRegistry.socialPhysics === "object"
      ? socialRegistry.socialPhysics
      : {};
  const flux = Number(phys.trustFlux ?? 0);
  const stab = String(phys.phase ?? "—");

  const cst = socialRegistry?.contextTimeline?.cognitiveSubThreads;
  const subN = Array.isArray(cst) ? cst.length : 0;

  const idleDecayAt = meta.rhizohIdleDecayAt;
  const idlePruneAt = meta.rhizohIdlePruneAt;

  return (
    <div className="mt-3 rounded-xl border border-violet-400/25 bg-violet-950/25 p-2 text-[8px] text-white/85 normal-case">
      <div className="mb-1.5 text-[9px] tracking-[0.28em] text-violet-200/90">PERSISTENT CORE · INSPECT</div>
      <div className="grid grid-cols-[7rem_1fr] gap-x-2 gap-y-0.5 font-mono leading-tight">
        <span className="text-white/45">WAKE</span>
        <span className="text-violet-200">{wakeLabel}</span>
        <span className="text-white/45">RTQ depth</span>
        <span className="text-cyan-200/90">{rtqDepth}</span>
        <span className="text-white/45">merge id</span>
        <span className="truncate text-amber-100/90" title={String(mergeId)}>
          {String(mergeId).length > 32 ? `${String(mergeId).slice(0, 30)}…` : String(mergeId)}
        </span>
        <span className="text-white/45">identity Δ</span>
        <span className="text-emerald-200/90">{idDelta}</span>
        <span className="text-white/45">identity ts</span>
        <span className="text-white/70">{idAt ? new Date(idAt).toLocaleTimeString() : "—"}</span>
        <span className="text-white/45">memory W / E</span>
        <span className="text-amber-200/85">
          {wturns} turns · {episodes} ep
        </span>
        <span className="text-white/45">trust flux</span>
        <span className="text-fuchsia-200/85">{Number.isFinite(flux) ? flux.toFixed(3) : "—"}</span>
        <span className="text-white/45">physics</span>
        <span className="text-white/70">{stab}</span>
        <span className="text-white/45">subthreads</span>
        <span className="text-sky-200/90">{subN}</span>
        <span className="text-white/45">gateway</span>
        <span className="text-cyan-200/85">{String(gatewayPhase || "—")}</span>
        <span className="text-white/45">idle decay</span>
        <span className="text-white/55">{idleDecayAt != null ? String(idleDecayAt) : "—"}</span>
        <span className="text-white/45">idle prune</span>
        <span className="text-white/55">{idlePruneAt != null ? String(idlePruneAt) : "—"}</span>
      </div>
    </div>
  );
});
