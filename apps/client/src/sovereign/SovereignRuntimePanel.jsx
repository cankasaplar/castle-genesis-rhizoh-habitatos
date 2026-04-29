import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Shield, Zap, Leaf, Copy, PlayCircle } from "lucide-react";
import {
  SOVEREIGN_RUNTIME_STACK,
  SOVEREIGN_API_KEYS,
  FIREBASE_PATH_KEYS,
  CHRONOS_CLOCK_IDS,
  PHYSICS_WORKER_ROLES,
  BOOT_SEQUENCE_PHASES,
  sovereignRuntimeSingleton,
  DEFAULT_BIOME_STATE
} from "./sovereignRuntimeSpec.js";
import { WORLD_OS_PILLARS, REGION_SHARD_IDS, GLOBAL_WORLD_TOPOLOGY } from "./worldOsArchitecture.js";
import { SOVEREIGNTY_FLOW } from "./llmSovereigntyFlow.js";
import { ROBOTICS_FLOW_ORDER } from "../kernel/roboticsClosedLoop.js";
import { getRhizohRoadmapManifest } from "../kernel/rhizohExecutionRoadmap.js";
import { verificationLaneForRisk, VERIFIER_FLOW_ORDER, QUARANTINE_LIFECYCLE_ORDER } from "../kernel/sovereignVerifierTiers.js";
import { warmSwarmGpu } from "../kernel/swarmGpuBridge.js";

function stressToHeatBg(stress0to100) {
  const s = Math.max(0, Math.min(100, stress0to100));
  const hue = 125 - s * 1.15;
  return `hsla(${hue}, 72%, 38%, 0.92)`;
}

/** Gözle debug: sıralama, hücre, yoğunluk, kuyruk. Çarpışma / neighbor — Pass 4. */
const RhizohGpuValidateHeatmap = memo(function RhizohGpuValidateHeatmap({
  gpuShadowResult,
  executionModeTrace,
  modeDwellMs
}) {
  if (!gpuShadowResult?.res) return null;
  const res = gpuShadowResult.res;
  const prediction = gpuShadowResult.prediction;
  const m = res?.metrics;
  const passed = gpuShadowResult.ok === true;
  const stage = res?.stage;
  const errCode = res?.code;

  const sortFail = !passed && stage === "sort";
  const cellFail = !passed && (stage === "cell" || stage === "cell_bounds");
  const stats = res?.cellDensityStats ?? m?.cellDensityStats;
  const sortStress = sortFail || errCode === "SORT_ORDER" ? 100 : passed ? 6 : 14;
  const cellStress = cellFail ? 100 : passed ? 8 : 16;
  const skewFail = !passed && (errCode === "CELL_SKEW" || res?.stage === "cell_skew");
  const skewStress = skewFail
    ? 100
    : passed && stats?.ratioMaxAvg
      ? Math.min(100, (stats.ratioMaxAvg / 32) * 45)
      : 10;

  const p95 = stats?.p95 ?? 0;
  const densityStress = passed ? Math.min(100, (p95 / 96) * 100) : 48;
  const qMs = m?.gpuQueueIdleMs ?? 0;
  const queueStress = Math.min(100, qMs * 5);

  const np = m?.neighborPolicy ?? res?.neighborPolicy;
  const partSig = m?.skewPartitionSignal ?? res?.skewPartitionSignal;
  const frame = res?.rhizohFrameState ?? m?.rhizohFrameState;
  const lock = frame?.spatialLock;
  const rv = m?.riskVector ?? res?.riskVector ?? frame?.riskVector;
  const tiles = [
    { id: "sort", label: "Sort correctness", sub: "SORT_ORDER", stress: sortStress },
    { id: "cell", label: "Cell chain / coverage", sub: "CELL_* · ∑count=N", stress: cellStress },
    { id: "density", label: "Cell density (p95)", sub: `hotspot ${p95.toFixed(0)}`, stress: densityStress },
    {
      id: "skew",
      label: "Partition signal",
      sub: `${partSig?.action ?? "tier"} · r=${stats?.ratioMaxAvg?.toFixed(2) ?? "—"}${
        partSig?.hysteresisApplied ? ` · lock T${partSig?.lockedTierIndex ?? "?"}≠raw T${partSig?.rawInstantTier ?? "?"}` : ""
      }`,
      stress: skewStress
    },
    { id: "queue", label: "Queue latency", sub: `${qMs.toFixed(2)}ms idle`, stress: queueStress }
  ];

  const hist = stats?.histogram16;

  return (
    <div className="mt-3 space-y-2 normal-case">
      <div className="text-[7px] text-lime-200/80 font-semibold tracking-wide">Debug heatmap (stress → red)</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
        {tiles.map((t) => (
          <div
            key={t.id}
            className="rounded-lg px-1.5 py-1.5 border border-white/10 text-[7px] leading-tight"
            style={{ background: stressToHeatBg(t.stress) }}
          >
            <div className="font-black text-white/95">{t.label}</div>
            <div className="text-white/75 font-mono">{t.sub}</div>
          </div>
        ))}
      </div>
      {hist && passed ? (
        <div>
          <div className="text-[7px] text-white/40 mb-0.5">Cell count histogram (16 bins)</div>
          <div className="flex items-end gap-px h-8">
            {hist.map((v, i) => (
              <div
                key={i}
                title={`bin ${i}: ${v}`}
                className="flex-1 min-w-0 bg-lime-400/80 rounded-t-[1px]"
                style={{ height: `${Math.max(8, (v / Math.max(1, Math.max(...hist))) * 100)}%` }}
              />
            ))}
          </div>
        </div>
      ) : null}
      {!passed && errCode ? (
        <div className="text-[7px] font-mono text-rose-300/95 break-all">
          {errCode}
          {res?.detail ? ` · ${res.detail}` : ""}
        </div>
      ) : null}
      {passed && np?.mode ? (
        <div className="text-[7px] font-mono text-cyan-200/90">
          neighborPolicy: {np.mode} · p50 {np.p50?.toFixed(1) ?? "—"} · skew(max/p50) {np.skewMaxP50?.toFixed(2) ?? "—"}
          {m?.neighborPolicySmoothing?.hysteresisPending ? " · hysteresis…" : ""}
          {m?.neighborPolicySmoothing?.lockedDuringCooldown
            ? ` · cooldown ${m.neighborPolicySmoothing.cooldownRemaining ?? 0}f (${m.neighborPolicySmoothing.cooldownPhase ?? "?"})`
            : ""}
        </div>
      ) : null}
      {passed && stats?.absoluteDeviationEstimate != null ? (
        <div className="text-[7px] font-mono text-slate-300/85">
          anchor · MAD/μ: {stats.absoluteDeviationEstimate.toFixed(2)}
          {stats.avg > 0 ? ` (norm ${(stats.absoluteDeviationEstimate / stats.avg).toFixed(3)})` : ""}
          {m?.softRiskProxy != null ? ` · L∞ ${m.softRiskProxy.toFixed(3)}` : ""}
          {rv
            ? ` · risk[skew ${(rv.skewRisk ?? 0).toFixed(2)} · samp ${(rv.samplingRisk ?? 0).toFixed(2)} · occ ${(rv.occupancyRisk ?? 0).toFixed(2)}]`
            : ""}
        </div>
      ) : null}
      {passed && lock ? (
        <div className="text-[7px] font-mono text-fuchsia-200/80">
          spatialLock: neighbor {lock.neighborPolicyLocked ? "🔒" : "○"} · persist {lock.executionModePersistenceActive ? "🔒" : "○"} ·
          sampling {lock.samplingLocked ? "🔒" : "○"}
        </div>
      ) : null}
      {passed && frame?.executionTopology ? (
        <div className="text-[7px] font-mono text-sky-200/75">
          topology: {frame.executionTopology}
          {frame.decisionFeedbackLoop ? ` · feedback ${frame.decisionFeedbackLoop}` : ""}
          {frame.contractKind ? ` · ${frame.contractKind}` : ""}
          {frame.contractId ? ` · ${frame.contractId}` : ""}
        </div>
      ) : null}
      {passed && (m?.executionModeHint ?? res?.executionModeHint)?.executionMode ? (
        <div className="text-[7px] font-mono text-violet-200/90 space-y-0.5">
          <div>
            Pass 4.5 executionMode: {(m?.executionModeHint ?? res?.executionModeHint).executionMode}
            {(m?.executionModeHint ?? res?.executionModeHint)?.decisionPath
              ? ` · ${(m?.executionModeHint ?? res?.executionModeHint).decisionPath}`
              : ""}
            {" · "}
            {(m?.executionModeHint ?? res?.executionModeHint).reason}
            {(m?.executionModeHint ?? res?.executionModeHint)?.inputSnapshotHash
              ? ` · #${(m?.executionModeHint ?? res?.executionModeHint).inputSnapshotHash}`
              : ""}
          </div>
          {(m?.executionModeHint ?? res?.executionModeHint)?.instantExecutionMode !=
          (m?.executionModeHint ?? res?.executionModeHint)?.executionMode ? (
            <div className="text-violet-300/80">
              instant {(m?.executionModeHint ?? res?.executionModeHint).instantExecutionMode} → persisted{" "}
              {(m?.executionModeHint ?? res?.executionModeHint).executionMode} · persist{" "}
              {(m?.executionModeHint ?? res?.executionModeHint).persistenceStableFrames ?? 0}/
              {(m?.executionModeHint ?? res?.executionModeHint).persistenceFramesRequired ?? "—"}f · pending{" "}
              {(m?.executionModeHint ?? res?.executionModeHint).persistencePendingTarget ?? "—"}
            </div>
          ) : null}
        </div>
      ) : null}
      {passed && executionModeTrace?.length ? (
        <div className="text-[7px] font-mono text-white/55">
          <div className="text-white/40 mb-0.5 tracking-wide">executionMode trace</div>
          <div className="flex flex-wrap gap-0.5">
            {executionModeTrace.map((e, i) => (
              <span
                key={`${e.t}-${i}`}
                title={`${e.reason ?? ""}${e.instant && e.instant !== e.mode ? ` · instant ${e.instant}` : ""}`}
                className="px-1 rounded bg-violet-600/25 text-violet-100/95 border border-violet-500/20"
              >
                {e.mode}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {passed && modeDwellMs && Object.keys(modeDwellMs).length > 0 ? (
        <div className="text-[7px] font-mono text-white/50 mt-1">
          <div className="text-white/40 mb-0.5">mode dwell (ms, wall between validates)</div>
          <div className="flex flex-wrap gap-1 items-end">
            {Object.entries(modeDwellMs).map(([mode, ms]) => {
              const max = Math.max(1, ...Object.values(modeDwellMs));
              const px = Math.min(36, 6 + (ms / max) * 30);
              return (
                <div key={mode} className="flex flex-col items-center gap-px" title={`${mode}: ${Math.round(ms)}ms`}>
                  <div
                    className="w-4 bg-violet-500/70 rounded-t-[1px] min-h-[6px]"
                    style={{ height: `${px}px` }}
                  />
                  <span className="text-[6px] text-violet-200/90">{mode.slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {prediction?.nextSkewEstimate != null ? (
        <div
          className={`text-[7px] font-mono border rounded px-1 py-0.5 mt-1 ${
            prediction.confidenceBand === "high"
              ? "text-amber-200/90 border-amber-500/35"
              : prediction.confidenceBand === "medium"
                ? "text-amber-200/75 border-amber-500/20"
                : "text-amber-200/60 border-amber-500/15"
          }`}
        >
          {`cortex predict (${prediction.confidenceBand ?? "low"}${
            prediction.skewVelocity != null ? ` · d ${prediction.skewVelocity.toFixed(2)}` : ""
          }${prediction.skewAccel != null ? ` · d² ${prediction.skewAccel.toFixed(2)}` : ""}${
            prediction.skewJerk != null ? ` · d³ ${prediction.skewJerk.toFixed(2)}` : ""
          }): next skew ≈ ${prediction.nextSkewEstimate.toFixed(2)}`}
          {prediction.occupancyDriftDelta != null
            ? ` · Δlogical occ ${(prediction.occupancyDriftDelta * 100).toFixed(2)}%`
            : ""}
        </div>
      ) : null}
      {passed && m?.meanFieldAdaptiveHint ? (
        <div className="text-[7px] font-mono text-white/50">hint: {m.meanFieldAdaptiveHint}</div>
      ) : null}
    </div>
  );
});

function CopyRow({ label, value }) {
  const [ok, setOk] = useState(false);
  const onCopy = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setOk(true);
      setTimeout(() => setOk(false), 1200);
    });
  };
  return (
    <div className="flex items-start gap-2 py-1 border-b border-white/5 text-[8px] font-mono normal-case">
      <button type="button" onClick={onCopy} className="shrink-0 p-1 rounded bg-white/10 hover:bg-cyan-500/30 text-cyan-300" title="Copy">
        <Copy size={12} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-white/45 tracking-wide">{label}</div>
        <div className="text-emerald-300/90 break-all">{value}</div>
        {ok ? <span className="text-[7px] text-lime-400">copied</span> : null}
      </div>
    </div>
  );
}

const SovereignRuntimePanel = memo(({ onSystemLog, getSimTime }) => {
  const [, setTick] = useState(0);
  const [booting, setBooting] = useState(false);
  const [biome, setBiome] = useState(() => ({ ...DEFAULT_BIOME_STATE }));
  const [gpuShadowBusy, setGpuShadowBusy] = useState(false);
  const [gpuShadowResult, setGpuShadowResult] = useState(null);
  const [executionModeTrace, setExecutionModeTrace] = useState([]);
  const [modeDwellMs, setModeDwellMs] = useState({});
  const lastValidateWallRef = useRef(typeof performance !== "undefined" ? performance.now() : 0);
  const cortexPredRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const sim = typeof getSimTime === "function" ? getSimTime() : 0;
    sovereignRuntimeSingleton.syncChronosFromSim(sim);
  }, [getSimTime]);

  const chronos = sovereignRuntimeSingleton.chronos;
  const health = sovereignRuntimeSingleton.healthScore;

  const apiEntries = useMemo(() => Object.entries(SOVEREIGN_API_KEYS), []);
  const fbEntries = useMemo(() => Object.entries(FIREBASE_PATH_KEYS), []);
  const rhizohRoadmap = useMemo(() => getRhizohRoadmapManifest(), []);
  const verifyDemo = useMemo(() => verificationLaneForRisk(0.7), []);

  const runBoot = useCallback(async () => {
    setBooting(true);
    await sovereignRuntimeSingleton.runBootSequence((phase) => {
      onSystemLog?.(`SR BOOT · ${phase.id}`);
    });
    onSystemLog?.("SOVEREIGN RUNTIME · boot complete · registries seeded");
    setBooting(false);
  }, [onSystemLog]);

  const runGpuShadowValidate = useCallback(async () => {
    setGpuShadowBusy(true);
    onSystemLog?.("RHIZOH GPU · shadow validate · N=4096 Pass 0–3.5");
    try {
      const warm = await warmSwarmGpu({ n: 4096 });
      const g = warm.computeGraph;
      if (!g?.runAndValidateReadback) {
        const msg = "RHIZOH GPU · no computeGraph (WebGPU/shader init failed)";
        setGpuShadowResult({ ok: false, reason: "no_compute_graph", warm });
        onSystemLog?.(msg);
        return;
      }
      const res = await g.runAndValidateReadback();
      const prevSnap = cortexPredRef.current;
      const curRatio = res.cellDensityStats?.ratioMaxAvg ?? res.metrics?.cellDensityStats?.ratioMaxAvg;
      const curLog = res.metrics?.occupancy?.logicalOccupancy?.ratio;
      let prediction = null;
      if (prevSnap && curRatio != null) {
        const dSkew = curRatio - (prevSnap.ratioMaxAvg ?? 0);
        const skewVelocity = dSkew;
        const prevVel = prevSnap.skewVelocity ?? 0;
        const accel = skewVelocity - prevVel;
        const moderateSkew = curRatio >= 40 && curRatio < 72;
        const highDelta = Math.abs(skewVelocity) > 10 || Math.abs(dSkew) > 12;
        const prevAccel = prevSnap.skewAccel ?? 0;
        const skewJerk = accel - prevAccel;
        const osc = Math.abs(accel) > 6 || Math.abs(skewJerk) > 8;
        let confidenceBand = "medium";
        if (curRatio < 44 && Math.abs(skewVelocity) < 2 && Math.abs(dSkew) < 4 && !osc) confidenceBand = "high";
        if (osc || highDelta || curRatio > 88 || (moderateSkew && (Math.abs(skewVelocity) > 5 || Math.abs(dSkew) > 8)))
          confidenceBand = "low";
        prediction = {
          nextSkewEstimate: Math.max(0, curRatio + dSkew),
          occupancyDriftDelta: curLog != null && prevSnap.logicalRatio != null ? curLog - prevSnap.logicalRatio : null,
          confidenceBand,
          skewVelocity,
          skewAccel: accel,
          skewJerk
        };
      }
      if (res.ok && curRatio != null && curLog != null) {
        const vel = prevSnap ? curRatio - (prevSnap.ratioMaxAvg ?? 0) : 0;
        const prevVel = prevSnap?.skewVelocity ?? 0;
        const accel = vel - prevVel;
        cortexPredRef.current = {
          ratioMaxAvg: curRatio,
          logicalRatio: curLog,
          skewVelocity: vel,
          skewAccel: accel,
          ts: performance.now()
        };
      }
      if (res.ok && res.executionModeHint?.executionMode) {
        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        const dt = Math.max(0, now - lastValidateWallRef.current);
        lastValidateWallRef.current = now;
        const modeKey = res.executionModeHint.executionMode;
        setModeDwellMs((d) => ({ ...d, [modeKey]: (d[modeKey] || 0) + dt }));
        const h = res.executionModeHint;
        setExecutionModeTrace((prev) => {
          const last = prev[prev.length - 1];
          if (last?.mode === h.executionMode && last?.hash === h.inputSnapshotHash) return prev;
          return [
            ...prev.slice(-15),
            {
              t: Date.now(),
              mode: h.executionMode,
              instant: h.instantExecutionMode,
              hash: h.inputSnapshotHash,
              reason: h.reason
            }
          ];
        });
      }
      setGpuShadowResult({ ok: res.ok, res, bitonicSteps: g.bitonicDispatchCount, prediction });
      const m = res.metrics;
      if (!res.ok && res.code) {
        onSystemLog?.(`RHIZOH GPU · validation ${res.code}${res.detail ? ` (${res.detail})` : ""}`);
      }
      onSystemLog?.(
        `RHIZOH GPU · ${res.ok ? "OK" : "FAIL"} · cells=${res.uniqueCellCount ?? "?"} · bitonicDispatches=${g.bitonicDispatchCount}`
      );
      if (m) {
        onSystemLog?.(
          `RHIZOH GPU · metrics host=${m.dispatchHostMs?.toFixed(2) ?? "?"}ms · gpuQueue=${m.gpuQueueIdleMs?.toFixed(2) ?? "?"}ms · readback=${m.readbackMs?.toFixed(2) ?? "?"}ms`
        );
        if (res.neighborPolicy?.mode) {
          onSystemLog?.(
            `RHIZOH GPU · neighborPolicy=${res.neighborPolicy.mode} p95=${res.neighborPolicy.p95} smoothed=${res.neighborPolicySmoothing?.smoothedP95?.toFixed(2) ?? "—"}`
          );
        }
        if (res.skewPartitionSignal?.action) {
          onSystemLog?.(
            `RHIZOH GPU · partitionSignal=${res.skewPartitionSignal.action}` +
              (res.skewPartitionSignal.hysteresisApplied
                ? ` (locked T${res.skewPartitionSignal.lockedTierIndex} raw T${res.skewPartitionSignal.rawInstantTier})`
                : "")
          );
        }
        if (res.executionModeHint?.executionMode) {
          onSystemLog?.(
            `RHIZOH GPU · executionMode=${res.executionModeHint.executionMode} (${res.executionModeHint.reason})`
          );
        }
        if (res.softRiskProxy != null) {
          const rv = res.riskVector;
          const rvStr = rv
            ? ` vec[${(rv.skewRisk ?? 0).toFixed(2)},${(rv.samplingRisk ?? 0).toFixed(2)},${(rv.occupancyRisk ?? 0).toFixed(2)}]`
            : "";
          onSystemLog?.(
            `RHIZOH GPU · L∞=${res.softRiskProxy.toFixed(3)}${rvStr} · pass45 #${res.executionModeHint?.inputSnapshotHash ?? "—"}`
          );
        }
      }
    } catch (e) {
      setGpuShadowResult({ ok: false, error: String(e) });
      onSystemLog?.(`RHIZOH GPU · error · ${e}`);
    } finally {
      setGpuShadowBusy(false);
    }
  }, [onSystemLog]);

  const applyBiome = (key, val) => {
    const next = sovereignRuntimeSingleton.setBiome({ [key]: val });
    setBiome({ ...next });
    onSystemLog?.(`BIOME · ${key}=${val.toFixed(4)}`);
  };

  return (
    <div className="bg-[#060d18]/95 border border-amber-500/35 rounded-[2rem] p-5 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
      <div className="text-[10px] text-amber-300 tracking-[0.35em] flex items-center gap-2 font-black uppercase">
        <Shield size={16} className="text-amber-400" /> META · Sovereign Runtime
      </div>
      <p className="text-[8px] text-white/45 normal-case leading-relaxed tracking-wide font-semibold">
        Conductor for Habitat OS · Chronos OS · Sovereign OS — registries, clocks, biome ecology, Firebase path keys (copy-ready).
      </p>
      <p className="text-[8px] text-amber-200/80 normal-case leading-relaxed font-bold border border-amber-500/20 rounded-lg px-2 py-1.5 bg-amber-950/30">
        Target: Sovereign Multi-Agent World OS — {WORLD_OS_PILLARS.length} pillars · global scale goal{" "}
        {GLOBAL_WORLD_TOPOLOGY.scale.targetGlobalEntities.toLocaleString()} entities via federated RegionShard mesh (not MMO shard).
      </p>

      <details className="border border-cyan-500/25 rounded-xl p-3 bg-cyan-950/15">
        <summary className="text-[9px] text-cyan-300 cursor-pointer font-black">World OS pillars + robotics + LLM flow</summary>
        <ul className="mt-2 space-y-1 text-[8px] text-white/65 normal-case list-disc pl-4">
          {WORLD_OS_PILLARS.map((p) => (
            <li key={p.id}>
              <span className="text-cyan-200 font-mono">{p.id}</span> — {p.name}: {p.role}
            </li>
          ))}
        </ul>
        <div className="mt-2 text-[7px] text-white/40 normal-case">
          Region shards: {REGION_SHARD_IDS.join(", ")}
        </div>
        <div className="mt-2 text-[7px] font-mono text-emerald-300/90 normal-case">
          Robotics: {ROBOTICS_FLOW_ORDER.join(" → ")}
        </div>
        <div className="mt-1 text-[7px] font-mono text-violet-300/90 normal-case">
          Sovereignty: {SOVEREIGNTY_FLOW.join(" → ")}
        </div>
        <div className="mt-3 text-[8px] text-amber-200/90 normal-case font-bold">Execution priority (bottleneck-first)</div>
        <ol className="mt-1 pl-4 list-decimal text-[7px] text-white/55 space-y-0.5">
          {rhizohRoadmap.priorityPhases.map((p) => (
            <li key={p.phase}>
              P{p.phase} {p.code}: {p.focus}
            </li>
          ))}
        </ol>
        <div className="mt-2 text-[7px] text-white/45 normal-case">
          Compute passes:{" "}
          {rhizohRoadmap.computePasses.map((x) => `${x.pass}:${x.id}`).join(" · ")}
        </div>
        <div className="mt-1 text-[7px] text-emerald-300/80 normal-case">
          Sort: v1 {rhizohRoadmap.sortPipeline.v1.algorithm} → v2 {rhizohRoadmap.sortPipeline.v2.algorithm} · Mean-field hybrid:{" "}
          {rhizohRoadmap.meanFieldHybrid.localNeighborSamples} local samples + field {rhizohRoadmap.meanFieldHybrid.farFieldChannels.join(",")}
        </div>
        <div className="mt-1 text-[7px] text-rose-300/80 normal-case">
          Verifier example risk=0.7: blocking={String(verifyDemo.blocking)} tiers={verifyDemo.tiers.join(",")} (Z3 = formal cluster, not in Chronos tick)
        </div>
        <div className="mt-1 text-[7px] text-amber-200/80 font-mono normal-case break-all">
          Verifier lane: {VERIFIER_FLOW_ORDER.join(" → ")} · Quarantine lifecycle: {QUARANTINE_LIFECYCLE_ORDER.join(" → ")}
        </div>
        {rhizohRoadmap.phaseGateStateExample ? (
          <div className="mt-1 text-[7px] text-white/40 normal-case break-all">
            Phase gate maturity (example): {JSON.stringify(rhizohRoadmap.phaseGateStateExample)}
          </div>
        ) : null}
      </details>

      <details className="border border-lime-500/30 rounded-xl p-3 bg-lime-950/15">
        <summary className="text-[9px] text-lime-300 cursor-pointer font-black normal-case">
          RHIZOH GPU shadow — validate (Pass 0–3.5, N=4096)
        </summary>
        <p className="mt-2 text-[7px] text-white/45 normal-case leading-snug">
          Spawn → Morton → Bitonic → cell starts → cell end/count on GPU. Readback yalnızca doğrulama; üretimde CPU derive yok.
        </p>
        <div className="mt-2 flex flex-wrap gap-2 items-center">
          <button
            type="button"
            disabled={gpuShadowBusy}
            onClick={() => void runGpuShadowValidate()}
            className="text-[9px] px-3 py-2 rounded-xl bg-lime-500/20 border border-lime-400/45 text-lime-100 font-black uppercase disabled:opacity-40"
          >
            {gpuShadowBusy ? "GPU…" : "Run validate"}
          </button>
          {gpuShadowResult ? (
            <span className={`text-[8px] font-mono ${gpuShadowResult.ok ? "text-lime-300" : "text-rose-300"}`}>
              {gpuShadowResult.ok ? "pass" : "fail"}
              {gpuShadowResult.bitonicSteps != null ? ` · ${gpuShadowResult.bitonicSteps} bitonic submits` : ""}
            </span>
          ) : null}
        </div>
        {gpuShadowResult?.res?.metrics ? (
          <div className="mt-2 text-[7px] font-mono text-white/55 normal-case space-y-0.5">
            <div>dispatchHostMs: {gpuShadowResult.res.metrics.dispatchHostMs?.toFixed(3) ?? "—"}</div>
            <div>gpuQueueIdleMs: {gpuShadowResult.res.metrics.gpuQueueIdleMs?.toFixed(3) ?? "—"}</div>
            <div>readbackMs: {gpuShadowResult.res.metrics.readbackMs?.toFixed(3) ?? "—"}</div>
            {gpuShadowResult.res.metrics.cellDensityStats ? (
              <div>
                density avg {gpuShadowResult.res.metrics.cellDensityStats.avg?.toFixed(2) ?? "—"} · p50{" "}
                {gpuShadowResult.res.metrics.cellDensityStats.p50 ?? "—"} · p95{" "}
                {gpuShadowResult.res.metrics.cellDensityStats.p95 ?? "—"} · max {gpuShadowResult.res.metrics.cellDensityStats.max ?? "—"}
              </div>
            ) : null}
            {gpuShadowResult.res.metrics.occupancy?.logicalOccupancy ? (
              <div>
                logical occ {(gpuShadowResult.res.metrics.occupancy.logicalOccupancy.ratio * 100).toFixed(1)}% (
                {gpuShadowResult.res.metrics.occupancy.logicalOccupancy.activeThreads}/
                {gpuShadowResult.res.metrics.occupancy.logicalOccupancy.scheduledThreads} thr)
              </div>
            ) : null}
            {gpuShadowResult.res.metrics.occupancy?.memoryOccupancy ? (
              <div>
                mem proxy R~{gpuShadowResult.res.metrics.occupancy.memoryOccupancy.bytesReadApprox?.toLocaleString?.() ?? "—"} W~
                {gpuShadowResult.res.metrics.occupancy.memoryOccupancy.bytesWrittenApprox?.toLocaleString?.() ?? "—"} · line eff ~{" "}
                {gpuShadowResult.res.metrics.occupancy.memoryOccupancy.cacheLineEfficiencyProxy}
              </div>
            ) : null}
            {gpuShadowResult.res.metrics.occupancy?.computeOccupancy ? (
              <div>
                compute div ~{gpuShadowResult.res.metrics.occupancy.computeOccupancy.divergenceRatioProxy?.toFixed(2) ?? "—"} · branch eff ~{" "}
                {gpuShadowResult.res.metrics.occupancy.computeOccupancy.branchEfficiencyProxy?.toFixed(2) ?? "—"}
              </div>
            ) : null}
          </div>
        ) : null}
        <RhizohGpuValidateHeatmap
          gpuShadowResult={gpuShadowResult}
          executionModeTrace={executionModeTrace}
          modeDwellMs={modeDwellMs}
        />
      </details>

      <a
        href="/castle-sovereign-runtime.manifest.json"
        target="_blank"
        rel="noreferrer"
        className="inline-block text-[8px] text-sky-400/90 underline underline-offset-2 normal-case font-semibold hover:text-sky-300"
      >
        Static manifest (Firebase deploy bundle)
      </a>

      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          disabled={booting}
          onClick={() => void runBoot()}
          className="flex items-center gap-2 text-[9px] px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-100 font-black uppercase disabled:opacity-40"
        >
          <PlayCircle size={14} /> {booting ? "Boot…" : "Run boot sequence"}
        </button>
        <span className="text-[9px] font-mono text-emerald-400">health {(health * 100).toFixed(0)}%</span>
      </div>

      <details open className="group border border-white/10 rounded-xl p-3 bg-black/30">
        <summary className="text-[9px] text-cyan-400 cursor-pointer font-black flex items-center gap-2">
          <Zap size={12} /> Chronos · 5 clocks
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[8px] font-mono normal-case text-white/70">
          {CHRONOS_CLOCK_IDS.map((id) => (
            <div key={id}>
              <span className="text-white/40">{id}</span>{" "}
              <span className="text-cyan-200">{(chronos[id] ?? 0).toFixed(3)}</span>
            </div>
          ))}
        </div>
      </details>

      <details className="border border-white/10 rounded-xl p-3 bg-black/30">
        <summary className="text-[9px] text-violet-300 cursor-pointer font-black">Physics worker slots (parallel)</summary>
        <div className="mt-2 flex flex-wrap gap-1">
          {PHYSICS_WORKER_ROLES.map((w) => (
            <span key={w} className="text-[8px] px-2 py-0.5 rounded bg-violet-500/15 border border-violet-400/30 normal-case">
              {w}
            </span>
          ))}
        </div>
        <p className="text-[7px] text-white/35 mt-2 normal-case leading-snug">Target IPC: SharedArrayBuffer ring buffers (workers not spawned in this bundle).</p>
      </details>

      <details open className="border border-emerald-500/25 rounded-xl p-3 bg-emerald-950/20">
        <summary className="text-[9px] text-emerald-300 cursor-pointer font-black flex items-center gap-2">
          <Leaf size={12} /> Biome / Ecology API
        </summary>
        <div className="mt-3 space-y-3 normal-case">
          {[
            ["entropy", biome.entropy],
            ["climatePressure", biome.climatePressure],
            ["diseaseLoad", biome.diseaseLoad],
            ["evolutionRate", biome.evolutionRate],
            ["foodWebStability", biome.foodWebStability],
            ["resourceCyclePhase", biome.resourceCyclePhase]
          ].map(([key, val]) => (
            <label key={key} className="block text-[8px]">
              <div className="flex justify-between text-white/50 mb-1">
                <span>{key}</span>
                <span className="font-mono text-emerald-200">{typeof val === "number" ? val.toFixed(4) : val}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.005}
                value={typeof val === "number" ? val : 0}
                onChange={(e) => applyBiome(key, parseFloat(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </label>
          ))}
        </div>
      </details>

      <details className="border border-white/10 rounded-xl p-3 bg-black/30">
        <summary className="text-[9px] text-sky-300 cursor-pointer font-black">Mega-stack (M0–M10)</summary>
        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto text-[8px] normal-case text-white/55 leading-snug">
          {SOVEREIGN_RUNTIME_STACK.map((row) => (
            <div key={row.id} className="border-b border-white/5 pb-2">
              <span className="text-cyan-500 font-black">{row.code}</span> · {row.name}
              {row.conducts ? <div className="text-white/35 mt-0.5">Conducts: {row.conducts.join(" · ")}</div> : null}
              {row.dimensions ? <div className="text-emerald-400/80 mt-0.5">{row.dimensions.join(" · ")}</div> : null}
            </div>
          ))}
        </div>
      </details>

      <details open className="border border-white/10 rounded-xl p-3 bg-black/30">
        <summary className="text-[9px] text-lime-300 cursor-pointer font-black">API keys (capability strings)</summary>
        <div className="mt-2 max-h-40 overflow-y-auto">{apiEntries.map(([k, v]) => <CopyRow key={k} label={k} value={v} />)}</div>
      </details>

      <details open className="border border-orange-500/25 rounded-xl p-3 bg-orange-950/10">
        <summary className="text-[9px] text-orange-300 cursor-pointer font-black">Firebase paths (RTDB / Firestore bundle IDs)</summary>
        <div className="mt-2 max-h-48 overflow-y-auto">{fbEntries.map(([k, v]) => <CopyRow key={k} label={k} value={v} />)}</div>
      </details>

      <details className="border border-white/10 rounded-xl p-3 bg-black/30">
        <summary className="text-[9px] text-white/60 cursor-pointer font-black">Boot phases ({BOOT_SEQUENCE_PHASES.length})</summary>
        <ol className="mt-2 list-decimal pl-4 space-y-1 text-[7px] normal-case text-white/45 leading-relaxed">
          {BOOT_SEQUENCE_PHASES.map((p) => (
            <li key={p.id}>
              <span className="text-cyan-600/90">{p.id}</span> — {p.label}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
});

export default SovereignRuntimePanel;
