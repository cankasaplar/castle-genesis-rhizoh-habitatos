import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildTemporalProjectionTensorV0,
  classifyContainmentPhiV0,
  containmentAlignmentMapV0,
  containmentDetailTextV0,
  crossOriginFieldTopologyV0,
  crossOriginObservationalGeometryV0,
  genesisCheckpointRowsFromGetBodyV0,
  lastAcceptedSeqFromRuntimeBody
} from "./genesisEpistemicProjectionPhysicsV0.js";
import {
  EPISTEMIC_VECTOR_FIELD_DYNAMICS_MODEL_V022,
  epistemicVectorFieldDynamicsBundleV01
} from "./genesisEpistemicVectorFieldDynamicsV0.js";
import {
  GENESIS_DEPLOY_MODE_OBSERVABILITY,
  GENESIS_DEPLOY_MODE_RESEARCH,
  genesisObservabilityStructuralContractOkV01,
  genesisStreamCheckpointSeparationEnvelopeV01,
  resolveGenesisSurfaceLockStateV01
} from "./genesisSurfaceLockV01.js";
import { getRuntimeClientCapabilitiesSnapshotV0 } from "./runtimeClientCapabilitiesV0.js";

function shortHex(s, head = 12, tail = 8) {
  const t = String(s || "").trim();
  if (!t) return "—";
  if (t.length <= head + tail + 1) return t;
  return `${t.slice(0, head)}…${t.slice(-tail)}`;
}

function truncJson(obj, max = 220) {
  try {
    const s = JSON.stringify(obj);
    if (s.length <= max) return s;
    return `${s.slice(0, max)}…`;
  } catch {
    return "—";
  }
}

function FieldRow({ label, value, mode }) {
  const ok = mode === "accepted";
  return (
    <div className="flex items-start justify-between gap-2 rounded border border-white/[0.06] bg-black/25 px-2 py-1">
      <span className="text-[8px] uppercase tracking-[0.14em] text-white/45">{label}</span>
      <div className="max-w-[72%] text-right">
        <span
          className={`inline-block rounded px-1 py-0.5 font-mono text-[8px] normal-case ${
            ok ? "bg-emerald-950/40 text-emerald-200/90" : "bg-white/[0.06] text-white/50"
          }`}
        >
          {ok ? "accepted" : "unavailable"}
        </span>
        <div className="mt-0.5 break-all font-mono text-[9px] text-white/80">{value}</div>
      </div>
    </div>
  );
}

function normalizeGatewayOriginInput(raw) {
  const t = String(raw || "").trim();
  if (!t) return "";
  try {
    const u = t.includes("://") ? t : `https://${t}`;
    return new URL(u).origin.replace(/\/+$/, "");
  } catch {
    return "";
  }
}

/**
 * Read-only "replay observatory": correlates a seq window with current gateway runtime + checkpoint range/lineage.
 * Does not replay events or re-execute workers — only fetches GET surfaces the gateway already exposes.
 * @param {{ gatewayOrigin: string }} props
 */
export function GenesisReplaySessionViewer({ gatewayOrigin }) {
  const base = useMemo(() => String(gatewayOrigin || "").trim().replace(/\/+$/, ""), [gatewayOrigin]);

  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("256");
  const [includeLineage, setIncludeLineage] = useState(true);
  const [originBInput, setOriginBInput] = useState("");

  const [busy, setBusy] = useState(false);
  const [runtime, setRuntime] = useState(/** @type {{ status: number; body: unknown } | null} */ (null));
  const [range, setRange] = useState(/** @type {{ status: number; body: unknown } | null} */ (null));
  const [lineage, setLineage] = useState(/** @type {{ status: number; body: unknown } | null} */ (null));
  const [runtimeB, setRuntimeB] = useState(/** @type {{ status: number; body: unknown } | null} */ (null));
  const [rangeB, setRangeB] = useState(/** @type {{ status: number; body: unknown } | null} */ (null));
  const [lineageB, setLineageB] = useState(/** @type {{ status: number; body: unknown } | null} */ (null));
  const [clientSnap, setClientSnap] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [err, setErr] = useState("");
  /** Session-only boundary drift + tensor divergence trace (not truth); max 8. */
  const [driftSamples, setDriftSamples] = useState(
    /** @type {{ ts: number; phiA: string; phiB: string | null; lastA: number | null; lastB: number | null; tensorDifferenceNorm01?: number | null; channelDivergenceVector01?: [number, number, number] | null; fieldTopology?: { v: number; stressOrdering: string; anisotropy01: number; dominant: string; barycentricRL01: [number, number, number] } | null }[]} */ (
      []
    )
  );

  const load = useCallback(async () => {
    if (!base) return;
    const a = Math.floor(Number(from) || 0);
    const b = Math.floor(Number(to) || 0);
    if (a <= 0 || b <= 0) {
      setErr("from ve to pozitif tamsayı olmalı.");
      return;
    }
    if (b < a) {
      setErr("to, from’dan küçük olamaz.");
      return;
    }
    if (b - a > 512) {
      setErr("Aralık en fazla 512 seq (gateway range limiti).");
      return;
    }
    setErr("");
    setBusy(true);
    setRuntime(null);
    setRange(null);
    setLineage(null);
    setRuntimeB(null);
    setRangeB(null);
    setLineageB(null);
    setClientSnap(getRuntimeClientCapabilitiesSnapshotV0());

    const baseB = normalizeGatewayOriginInput(originBInput);
    const runtimeUrl = `${base}/rhizoh/genesis/runtime`;
    const rangeUrl = `${base}/rhizoh/genesis/checkpoint/range?from=${encodeURIComponent(String(a))}&to=${encodeURIComponent(String(b))}`;
    const lineageUrl = `${base}/rhizoh/genesis/checkpoint/lineage?seq=${encodeURIComponent(String(b))}`;

    try {
      const [rt, rg] = await Promise.all([
        fetch(runtimeUrl, { method: "GET", cache: "no-store" }).then(async (res) => ({
          status: res.status,
          body: await res.json().catch(() => ({ parse_error: true }))
        })),
        fetch(rangeUrl, { method: "GET", cache: "no-store" }).then(async (res) => ({
          status: res.status,
          body: await res.json().catch(() => ({ parse_error: true }))
        }))
      ]);
      setRuntime(rt);
      setRange(rg);

      let ln = /** @type {{ status: number; body: unknown } | null} */ (null);
      if (includeLineage) {
        ln = await fetch(lineageUrl, { method: "GET", cache: "no-store" }).then(async (res) => ({
          status: res.status,
          body: await res.json().catch(() => ({ parse_error: true }))
        }));
        setLineage(ln);
      }

      if (baseB && baseB !== base) {
        const runtimeUrlB = `${baseB}/rhizoh/genesis/runtime`;
        const rangeUrlB = `${baseB}/rhizoh/genesis/checkpoint/range?from=${encodeURIComponent(String(a))}&to=${encodeURIComponent(String(b))}`;
        const lineageUrlB = `${baseB}/rhizoh/genesis/checkpoint/lineage?seq=${encodeURIComponent(String(b))}`;
        const [rt2, rg2] = await Promise.all([
          fetch(runtimeUrlB, { method: "GET", cache: "no-store" }).then(async (res) => ({
            status: res.status,
            body: await res.json().catch(() => ({ parse_error: true }))
          })),
          fetch(rangeUrlB, { method: "GET", cache: "no-store" }).then(async (res) => ({
            status: res.status,
            body: await res.json().catch(() => ({ parse_error: true }))
          }))
        ]);
        setRuntimeB(rt2);
        setRangeB(rg2);
        let ln2 = /** @type {{ status: number; body: unknown } | null} */ (null);
        if (includeLineage) {
          ln2 = await fetch(lineageUrlB, { method: "GET", cache: "no-store" }).then(async (res) => ({
            status: res.status,
            body: await res.json().catch(() => ({ parse_error: true }))
          }));
          setLineageB(ln2);
        } else {
          setLineageB(null);
        }

        const lastA = lastAcceptedSeqFromRuntimeBody(rt.body);
        const lastB = lastAcceptedSeqFromRuntimeBody(rt2.body);
        const phiA = classifyContainmentPhiV0(a, b, lastA);
        const phiB = classifyContainmentPhiV0(a, b, lastB);

        const rangeRowsA = genesisCheckpointRowsFromGetBodyV0(rg.body);
        const lineageRowsA = includeLineage && ln ? genesisCheckpointRowsFromGetBodyV0(ln.body) : [];
        const rangeRowsB = genesisCheckpointRowsFromGetBodyV0(rg2.body);
        const lineageRowsB = includeLineage && ln2 ? genesisCheckpointRowsFromGetBodyV0(ln2.body) : [];
        const tA = buildTemporalProjectionTensorV0({ fromN: a, toN: b, rangeRows: rangeRowsA, lineageRows: lineageRowsA });
        const tB = buildTemporalProjectionTensorV0({ fromN: a, toN: b, rangeRows: rangeRowsB, lineageRows: lineageRowsB });
        const geom = crossOriginObservationalGeometryV0(tA, tB);
        let tensorDifferenceNorm01 = /** @type {number | null} */ (null);
        let channelDivergenceVector01 = /** @type {[number, number, number] | null} */ (null);
        let fieldTopology = /** @type {ReturnType<typeof crossOriginFieldTopologyV0>} */ (null);
        if (geom && !geom.windowMismatch) {
          tensorDifferenceNorm01 = geom.tensorDifferenceNorm01;
          channelDivergenceVector01 = geom.channelDivergenceVector01;
          fieldTopology = crossOriginFieldTopologyV0(geom);
        }

        setDriftSamples((prev) => [
          ...prev.slice(-7),
          {
            ts: Date.now(),
            phiA,
            phiB,
            lastA,
            lastB,
            tensorDifferenceNorm01,
            channelDivergenceVector01,
            fieldTopology
          }
        ]);
      } else {
        setRuntimeB(null);
        setRangeB(null);
        setLineageB(null);
      }
    } catch (e) {
      setErr(String(e?.message || e || "network_error"));
    } finally {
      setBusy(false);
    }
  }, [base, from, to, includeLineage, originBInput]);

  /** @type {Record<string, unknown> | null} */
  const rtBody =
    runtime?.body && typeof runtime.body === "object" && runtime.body !== null
      ? /** @type {Record<string, unknown>} */ (runtime.body)
      : null;
  const replay = rtBody?.replay && typeof rtBody.replay === "object" ? /** @type {Record<string, unknown>} */ (rtBody.replay) : null;
  const fp = rtBody?.replayFingerprint && typeof rtBody.replayFingerprint === "object" ? /** @type {Record<string, unknown>} */ (rtBody.replayFingerprint) : null;
  const caps = rtBody?.gatewayCapabilities;
  const seal = rtBody?.lastEpistemicSeal;

  const rangeBody =
    range?.body && typeof range.body === "object" && range.body !== null ? /** @type {Record<string, unknown>} */ (range.body) : null;
  const rangeRows = Array.isArray(rangeBody?.checkpoints) ? /** @type {unknown[]} */ (rangeBody.checkpoints) : [];

  const lineageBody =
    lineage?.body && typeof lineage.body === "object" && lineage.body !== null ? /** @type {Record<string, unknown>} */ (lineage.body) : null;
  const lineageRows = Array.isArray(lineageBody?.checkpoints) ? /** @type {unknown[]} */ (lineageBody.checkpoints) : [];

  const rangeBodyB =
    rangeB?.body && typeof rangeB.body === "object" && rangeB.body !== null ? /** @type {Record<string, unknown>} */ (rangeB.body) : null;
  const rangeRowsB = Array.isArray(rangeBodyB?.checkpoints) ? /** @type {unknown[]} */ (rangeBodyB.checkpoints) : [];
  const lineageBodyB =
    lineageB?.body && typeof lineageB.body === "object" && lineageB.body !== null ? /** @type {Record<string, unknown>} */ (lineageB.body) : null;
  const lineageRowsB = Array.isArray(lineageBodyB?.checkpoints) ? /** @type {unknown[]} */ (lineageBodyB.checkpoints) : [];

  const fromN = Math.floor(Number(from) || 0);
  const toN = Math.floor(Number(to) || 0);
  const lastNA = lastAcceptedSeqFromRuntimeBody(runtime?.body);
  const phiA = classifyContainmentPhiV0(fromN, toN, lastNA);
  const lastNB = runtimeB ? lastAcceptedSeqFromRuntimeBody(runtimeB.body) : null;
  const phiB = runtimeB ? classifyContainmentPhiV0(fromN, toN, lastNB) : null;

  const baseBNorm = normalizeGatewayOriginInput(originBInput);

  const projectionTensor = useMemo(() => {
    if (fromN <= 0 || toN <= 0 || toN < fromN) return null;
    return buildTemporalProjectionTensorV0({ fromN, toN, rangeRows, lineageRows });
  }, [fromN, toN, rangeRows, lineageRows]);

  const projectionTensorB = useMemo(() => {
    if (!baseBNorm || baseBNorm === base || !runtimeB || fromN <= 0 || toN <= 0 || toN < fromN) return null;
    return buildTemporalProjectionTensorV0({ fromN, toN, rangeRows: rangeRowsB, lineageRows: lineageRowsB });
  }, [baseBNorm, base, runtimeB, fromN, toN, rangeRowsB, lineageRowsB]);

  const bandRows = projectionTensor?.rows ?? [];
  const bandRowsB = projectionTensorB?.rows ?? [];

  const crossAlign = useMemo(() => containmentAlignmentMapV0(phiA, phiB), [phiA, phiB]);

  const crossGeometry = useMemo(
    () =>
      projectionTensor && projectionTensorB
        ? crossOriginObservationalGeometryV0(projectionTensor, projectionTensorB)
        : null,
    [projectionTensor, projectionTensorB]
  );

  const fieldTopologyCurrent = useMemo(() => {
    if (!crossGeometry || crossGeometry.windowMismatch) return null;
    return crossOriginFieldTopologyV0(crossGeometry);
  }, [crossGeometry]);

  const tensorDivergenceTraceMax = useMemo(() => {
    const vals = driftSamples.map((s) => s.tensorDifferenceNorm01).filter((v) => typeof v === "number");
    return Math.max(1e-6, ...vals, 1e-6);
  }, [driftSamples]);

  const epistemicDynamicsV01 = useMemo(
    () => epistemicVectorFieldDynamicsBundleV01(driftSamples, fieldTopologyCurrent),
    [driftSamples, fieldTopologyCurrent]
  );

  const epistemicEpochCount = epistemicDynamicsV01.stabilityGradientSeriesV01?.series?.length ?? 0;

  const surfaceLockV01 = useMemo(
    () =>
      resolveGenesisSurfaceLockStateV01({
        epistemicEpochCount,
        structuralContractSatisfied: genesisObservabilityStructuralContractOkV01(epistemicDynamicsV01)
      }),
    [epistemicDynamicsV01, epistemicEpochCount]
  );

  const prevRegimeRef = useRef(/** @type {string | null} */ (null));
  useEffect(() => {
    const regime = epistemicDynamicsV01.epistemicAnomalyFieldV01?.regimeQuantized?.regime;
    if (typeof regime !== "string") return;
    if (!surfaceLockV01.passiveObservabilityEpoch) return;
    const prev = prevRegimeRef.current;
    if (prev != null && prev !== regime) {
      console.info(
        `[genesis:passive-regime-shift] ${prev} -> ${regime} · epoch=${epistemicEpochCount}/${surfaceLockV01.passiveEpochMax} · log-only (no control hooks)`
      );
    }
    prevRegimeRef.current = regime;
  }, [
    epistemicDynamicsV01.epistemicAnomalyFieldV01?.regimeQuantized?.regime,
    epistemicEpochCount,
    surfaceLockV01.passiveObservabilityEpoch,
    surfaceLockV01.passiveEpochMax
  ]);

  const dSdtSparkAbsMax = useMemo(() => {
    const series = epistemicDynamicsV01.stabilityGradientSeriesV01?.series ?? [];
    const vals = series.map((p) => (typeof p.dS_dt === "number" ? Math.abs(p.dS_dt) : 0));
    return Math.max(1e-6, ...vals, 1e-6);
  }, [epistemicDynamicsV01]);

  const copyObservatoryEpistemicExport = useCallback(() => {
    const streamCheckpoint = genesisStreamCheckpointSeparationEnvelopeV01();
    const payload = {
      v: 0,
      kind: "genesis_observatory_epistemic_export",
      preReleaseLabel: /** @type {const} */ ("v0.2.2-pre-release"),
      modelDynamics: EPISTEMIC_VECTOR_FIELD_DYNAMICS_MODEL_V022,
      window: projectionTensor?.window ?? null,
      channelDivergenceVector01: crossGeometry?.channelDivergenceVector01 ?? null,
      tensorDifferenceNorm01: crossGeometry?.tensorDifferenceNorm01 ?? null,
      fieldTopology: fieldTopologyCurrent,
      epistemicDynamicsV01,
      driftSeries: driftSamples,
      genesisSurfaceLock01: {
        v: 0,
        surfaceLockSpecVersion: surfaceLockV01.surfaceLockSpecVersion,
        deployMode: surfaceLockV01.deployMode,
        hSurface01: surfaceLockV01.hSurfaceComputed01,
        hSurfaceExpected01: surfaceLockV01.hSurfaceExpected01,
        legacyDriftMode: surfaceLockV01.legacyDriftMode,
        selfTestLockMatch: surfaceLockV01.selfTestLockMatch,
        passiveEpochWindow01: {
          max: surfaceLockV01.passiveEpochMax,
          current: surfaceLockV01.epistemicEpochCount,
          passiveObservabilityEpoch: surfaceLockV01.passiveObservabilityEpoch,
          regimeShiftPolicy: surfaceLockV01.passiveObservabilityEpoch ? "log_only" : "none"
        }
      },
      genesisStreamCheckpointSeparation01: streamCheckpoint,
      adaptiveControlHooksEnabled: false
    };
    void navigator.clipboard?.writeText(JSON.stringify(payload)).catch(() => {});
  }, [projectionTensor, crossGeometry, fieldTopologyCurrent, driftSamples, epistemicDynamicsV01, surfaceLockV01]);

  const showV022ExtendedObservabilityMetrics =
    surfaceLockV01.deployMode === GENESIS_DEPLOY_MODE_RESEARCH || !surfaceLockV01.legacyDriftMode;

  if (!base) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3 text-[9px] text-amber-100/80 normal-case">
        Replay session viewer: gateway origin yok.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-fuchsia-500/20 bg-fuchsia-950/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[9px] font-black tracking-[0.2em] text-fuchsia-200/90">REPLAY SESSION (OBSERVATORY)</div>
        <div className="text-[8px] text-fuchsia-100/60">{busy ? "loading…" : "idle"}</div>
      </div>
      <p className="text-[8px] leading-relaxed text-white/45 normal-case">
        Bu modül replay motoru değildir: yalnızca mevcut GET yüzeylerini (runtime + checkpoint range/lineage) aynı
        ekranda ilişkilendirir. Runtime anlık fetch zamanındaki yüzeydir; geçmiş seq için tarihsel surface yoktur.
      </p>

      <div className="space-y-1.5">
        {surfaceLockV01.deployMode === GENESIS_DEPLOY_MODE_RESEARCH ? (
          <div className="rounded border border-amber-500/25 bg-amber-950/20 px-2 py-1.5 text-[8px] leading-relaxed text-amber-100/90 normal-case">
            <span className="font-black uppercase tracking-[0.14em] text-amber-200/95">Research mode</span>
            — metric topology can drift; UI schema adaptive. Laboratory channel (not a frozen observability contract).
          </div>
        ) : (
          <div className="rounded border border-cyan-500/25 bg-cyan-950/20 px-2 py-1.5 text-[8px] leading-relaxed text-cyan-100/90 normal-case">
            <span className="font-black uppercase tracking-[0.14em] text-cyan-200/95">Observability mode</span>
            — surface lock {surfaceLockV01.surfaceLockSpecVersion} · H_surface{" "}
            <span className="font-mono text-cyan-50/95">{surfaceLockV01.hSurfaceComputed01}</span>
            {surfaceLockV01.passiveObservabilityEpoch ? (
              <span className="mt-0.5 block text-[7px] text-cyan-100/75">
                Passive epoch window: {surfaceLockV01.epistemicEpochCount}/{surfaceLockV01.passiveEpochMax} — regime shifts
                log-only; no adaptive control hooks.
              </span>
            ) : null}
          </div>
        )}
        {surfaceLockV01.legacyDriftMode && surfaceLockV01.deployMode === GENESIS_DEPLOY_MODE_OBSERVABILITY ? (
          <div className="rounded border border-rose-500/30 bg-rose-950/25 px-2 py-1.5 text-[8px] leading-relaxed text-rose-100/90 normal-case">
            <span className="font-black uppercase tracking-[0.14em] text-rose-200/95">Legacy drift mode</span>
            — H_surface / structural contract vs locked v0.2.2-pre slice: epistemic invariance layer withholds extended
            metrics in UI (no cross-version merge).
          </div>
        ) : null}
        {!surfaceLockV01.selfTestLockMatch && surfaceLockV01.deployMode === GENESIS_DEPLOY_MODE_OBSERVABILITY ? (
          <div className="rounded border border-rose-600/40 bg-black/35 px-2 py-1 text-[8px] text-rose-200/95 normal-case">
            Build drift: computed H_surface ≠ locked constant — update{" "}
            <span className="font-mono">genesisSurfaceLockV01</span> before shipping observability.
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[8px] text-white/50">
          <div className="mb-0.5 uppercase tracking-[0.12em]">from</div>
          <input
            className="w-20 rounded border border-white/10 bg-black/40 px-2 py-1 font-mono text-[10px] text-white/90"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <label className="text-[8px] text-white/50">
          <div className="mb-0.5 uppercase tracking-[0.12em]">to</div>
          <input
            className="w-20 rounded border border-white/10 bg-black/40 px-2 py-1 font-mono text-[10px] text-white/90"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-1 text-[8px] text-white/55">
          <input type="checkbox" checked={includeLineage} onChange={(e) => setIncludeLineage(e.target.checked)} className="accent-fuchsia-400" />
          lineage → to
        </label>
        <button
          type="button"
          disabled={busy}
          className="rounded bg-fuchsia-600/35 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-fuchsia-100 hover:bg-fuchsia-500/40 disabled:opacity-40"
          onClick={() => void load()}
        >
          Load segment
        </button>
      </div>
      <label className="block text-[8px] text-white/50">
        <div className="mb-0.5 uppercase tracking-[0.12em]">optional origin B (dual φ overlay)</div>
        <input
          className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 font-mono text-[9px] text-white/90"
          value={originBInput}
          onChange={(e) => setOriginBInput(e.target.value)}
          placeholder="https://other-gateway.example (same segment / lineage flags)"
        />
      </label>

      {err ? (
        <div className="rounded border border-rose-500/25 bg-rose-950/20 px-2 py-1 text-[9px] text-rose-100/90 normal-case">{err}</div>
      ) : null}

      {runtime ? (
        <div className="space-y-2">
          <div className="text-[8px] uppercase tracking-[0.18em] text-white/50">
            Runtime snapshot <span className="font-mono text-fuchsia-200/80">HTTP {runtime.status}</span>
          </div>
          <div className="grid gap-1">
            <FieldRow
              label="continuity lastAcceptedSeq"
              value={lastNA != null ? String(lastNA) : "—"}
              mode={lastNA != null ? "accepted" : "unavailable"}
            />
            <FieldRow
              label="replay.alignment"
              value={replay?.alignment != null ? String(replay.alignment) : "—"}
              mode={replay?.alignment != null ? "accepted" : "unavailable"}
            />
            <FieldRow
              label="replay.divergenceTotal"
              value={replay?.divergenceTotal != null ? String(replay.divergenceTotal) : "—"}
              mode={replay?.divergenceTotal != null ? "accepted" : "unavailable"}
            />
            <FieldRow
              label="replay.workerPresent"
              value={replay?.workerPresent != null ? String(replay.workerPresent) : "—"}
              mode={replay?.workerPresent != null ? "accepted" : "unavailable"}
            />
            <FieldRow
              label="replayFingerprint.short"
              value={fp?.short != null ? String(fp.short) : "—"}
              mode={fp?.short != null ? "accepted" : "unavailable"}
            />
            <FieldRow
              label="replayFingerprint.hex"
              value={fp?.hex != null ? shortHex(String(fp.hex), 16, 10) : "—"}
              mode={fp?.hex != null ? "accepted" : "unavailable"}
            />
            <FieldRow
              label="lastEpistemicSeal"
              value={seal && typeof seal === "object" && "sealHash" in seal ? shortHex(String(/** @type {{ sealHash?: unknown }} */ (seal).sealHash), 12, 8) : "—"}
              mode={seal && typeof seal === "object" && (/** @type {{ sealHash?: unknown }} */ (seal).sealHash) ? "accepted" : "unavailable"}
            />
            <FieldRow
              label="gatewayCapabilities (JSON)"
              value={caps != null ? truncJson(caps) : "—"}
              mode={caps != null ? "accepted" : "unavailable"}
            />
          </div>
          {(() => {
            let ring = "border-white/10 bg-black/25";
            if (phiA === "contained") ring = "border-emerald-500/25 bg-emerald-950/15";
            else if (phiA === "exceeds") ring = "border-amber-500/25 bg-amber-950/15";
            return (
              <div className={`rounded border px-2 py-1.5 text-[8px] leading-relaxed normal-case ${ring}`}>
                <div className="mb-0.5 font-black uppercase tracking-[0.12em] text-white/50">
                  Epistemic boundary (φ) — primary origin
                </div>
                <div className="text-white/80">{containmentDetailTextV0(phiA, fromN, toN, lastNA ?? NaN)}</div>
              </div>
            );
          })()}
          {runtimeB ? (
            (() => {
              let ring = "border-white/10 bg-black/25";
              if (phiB === "contained") ring = "border-emerald-500/25 bg-emerald-950/15";
              else if (phiB === "exceeds") ring = "border-amber-500/25 bg-amber-950/15";
              return (
                <div className={`rounded border px-2 py-1.5 text-[8px] leading-relaxed normal-case ${ring}`}>
                  <div className="mb-0.5 font-black uppercase tracking-[0.12em] text-white/50">
                    Epistemic boundary (φ) — secondary origin
                  </div>
                  <div className="font-mono text-[8px] text-white/50">{baseBNorm}</div>
                  <div className="text-white/80">{containmentDetailTextV0(phiB ?? "unknown", fromN, toN, lastNB ?? NaN)}</div>
                </div>
              );
            })()
          ) : null}
          {phiB != null ? (
            <div className="rounded border border-white/[0.06] bg-black/20 px-2 py-1 font-mono text-[8px] text-white/50 normal-case">
              cross_origin_alignment · code={crossAlign.code}
              {crossAlign.mode ? ` · mode=${crossAlign.mode}` : ""}
              {"map" in crossAlign && crossAlign.map != null ? ` · map=${crossAlign.map}` : ""}
              <span className="block text-[7px] text-white/38">
                φA↔φB explicit pair table (not merged); boundary classification map only.
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {clientSnap ? (
        <div className="space-y-1">
          <div className="text-[8px] uppercase tracking-[0.18em] text-white/50">Client observer context (same tick)</div>
          <div className="rounded border border-white/[0.06] bg-black/30 px-2 py-1 font-mono text-[8px] text-white/60 normal-case">
            gateway_http={String(clientSnap.gatewayHttpConfigured)} · world_layer={String(!!clientSnap.worldLayerEnabled)}
          </div>
        </div>
      ) : null}

      {range ? (
        <div className="space-y-1">
          <div className="text-[8px] uppercase tracking-[0.18em] text-white/50">
            Checkpoint range <span className="font-mono text-fuchsia-200/80">HTTP {range.status}</span>
            {rangeBody?.error != null ? <span className="ml-2 font-mono text-amber-200/90">{String(rangeBody.error)}</span> : null}
          </div>
          {range.status === 200 && rangeBody?.ok === true ? (
            <div className="text-[8px] text-white/40 normal-case">
              Soft indicator: range query ok · {rangeRows.length} row(s). Does not re-verify signatures; gateway already validated on read.
            </div>
          ) : null}
          {rangeRows.length > 0 ? (
            <div className="overflow-x-auto rounded border border-white/[0.06]">
              <table className="w-full text-left text-[8px] text-white/80">
                <thead className="text-white/45">
                  <tr>
                    <th className="px-2 py-1 font-normal">seq</th>
                    <th className="px-2 py-1 font-normal">prev → ledger</th>
                  </tr>
                </thead>
                <tbody>
                  {rangeRows.map((row, i) => {
                    const r = row && typeof row === "object" ? /** @type {Record<string, unknown>} */ (row) : {};
                    return (
                      <tr key={i} className="border-t border-white/[0.05] font-mono normal-case">
                        <td className="px-2 py-1">{String(r.seqCommittedThrough ?? "—")}</td>
                        <td className="px-2 py-1 break-all">
                          {shortHex(String(r.prevLedgerRoot ?? ""))} → {shortHex(String(r.ledgerRoot ?? ""))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-[8px] text-white/45 normal-case">Bu aralıkta checkpoint satırı yok veya durable log kapalı.</div>
          )}
        </div>
      ) : null}

      {includeLineage && lineage ? (
        <div className="space-y-1">
          <div className="text-[8px] uppercase tracking-[0.18em] text-white/50">
            Causal prefix (lineage ≤ to) <span className="font-mono text-fuchsia-200/80">HTTP {lineage.status}</span>
            {lineageBody?.error != null ? <span className="ml-2 font-mono text-amber-200/90">{String(lineageBody.error)}</span> : null}
          </div>
          {lineageRows.length > 0 ? (
            <div className="overflow-x-auto rounded border border-white/[0.06]">
              <table className="w-full text-left text-[8px] text-white/80">
                <thead className="text-white/45">
                  <tr>
                    <th className="px-2 py-1 font-normal">seq</th>
                    <th className="px-2 py-1 font-normal">prev → ledger</th>
                  </tr>
                </thead>
                <tbody>
                  {lineageRows.map((row, i) => {
                    const r = row && typeof row === "object" ? /** @type {Record<string, unknown>} */ (row) : {};
                    return (
                      <tr key={i} className="border-t border-white/[0.05] font-mono normal-case">
                        <td className="px-2 py-1">{String(r.seqCommittedThrough ?? "—")}</td>
                        <td className="px-2 py-1 break-all">
                          {shortHex(String(r.prevLedgerRoot ?? ""))} → {shortHex(String(r.ledgerRoot ?? ""))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-[8px] text-white/45 normal-case">Lineage boş veya sorgu reddedildi.</div>
          )}
        </div>
      ) : null}

      {range && (bandRows.length > 0 || includeLineage) ? (
        <div className="space-y-1">
          <div className="text-[8px] font-black uppercase tracking-[0.18em] text-white/55">Timeline compression (epistemic band v0.2)</div>
          <p className="text-[8px] leading-relaxed text-white/40 normal-case">
            [from,to] seq bandında: range API ile lineage (≤to) kesişimi. overlap = R∩L kümesi (satır işareti + aşağıdaki ölçüler); truth değil, ölçülebilir projeksiyon cebiri.
          </p>
          {bandRows.length > 0 ? (
            <div className="overflow-x-auto rounded border border-white/[0.08]">
              <table className="w-full text-left text-[8px] text-white/85">
                <thead className="text-white/45">
                  <tr>
                    <th className="px-2 py-1 font-normal">seq</th>
                    <th className="px-2 py-1 font-normal">prev → ledger</th>
                    <th className="px-2 py-1 font-normal">range</th>
                    <th className="px-2 py-1 font-normal">lineage∩band</th>
                    <th className="px-2 py-1 font-normal">overlap</th>
                  </tr>
                </thead>
                <tbody>
                  {bandRows.map((row) => (
                    <tr key={row.seq} className="border-t border-white/[0.05] font-mono normal-case">
                      <td className="px-2 py-1">{row.seq}</td>
                      <td className="px-2 py-1 break-all">
                        {shortHex(row.prev)} → {shortHex(row.ledger)}
                      </td>
                      <td className="px-2 py-1">{row.inRange ? "✓" : "—"}</td>
                      <td className="px-2 py-1">{row.inLn ? "✓" : "—"}</td>
                      <td className="px-2 py-1">{row.overlap ? "✓" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-[8px] text-white/45 normal-case">Bu bantta checkpoint satırı yok (range boş veya lineage kapalı).</div>
          )}
          {projectionTensor ? (
            <div className="rounded border border-fuchsia-500/15 bg-black/25 px-2 py-1 font-mono text-[7px] text-fuchsia-100/70 normal-case">
              temporal_projection_tensor.v0 · |R|={projectionTensor.measures.cardinalityRange} · |L|=
              {projectionTensor.measures.cardinalityLineage} · |R∩L|={projectionTensor.measures.cardinalityOverlap} · |R∪L|=
              {projectionTensor.measures.cardinalityUnion} · J(R,L)=
              {projectionTensor.measures.jaccardRangeLineage == null ? "—" : projectionTensor.measures.jaccardRangeLineage.toFixed(4)}
            </div>
          ) : null}
        </div>
      ) : null}

      {baseBNorm && baseBNorm !== base && runtimeB ? (
        <div className="space-y-1">
          <div className="text-[8px] font-black uppercase tracking-[0.18em] text-white/55">Epistemic band — origin B</div>
          {bandRowsB.length > 0 ? (
            <div className="overflow-x-auto rounded border border-violet-500/20">
              <table className="w-full text-left text-[8px] text-white/85">
                <thead className="text-white/45">
                  <tr>
                    <th className="px-2 py-1 font-normal">seq</th>
                    <th className="px-2 py-1 font-normal">prev → ledger</th>
                    <th className="px-2 py-1 font-normal">range</th>
                    <th className="px-2 py-1 font-normal">lineage∩band</th>
                    <th className="px-2 py-1 font-normal">overlap</th>
                  </tr>
                </thead>
                <tbody>
                  {bandRowsB.map((row) => (
                    <tr key={row.seq} className="border-t border-white/[0.05] font-mono normal-case">
                      <td className="px-2 py-1">{row.seq}</td>
                      <td className="px-2 py-1 break-all">
                        {shortHex(row.prev)} → {shortHex(row.ledger)}
                      </td>
                      <td className="px-2 py-1">{row.inRange ? "✓" : "—"}</td>
                      <td className="px-2 py-1">{row.inLn ? "✓" : "—"}</td>
                      <td className="px-2 py-1">{row.overlap ? "✓" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-[8px] text-white/45 normal-case">Origin B için bu bantta satır yok veya sorgu başarısız.</div>
          )}
          {projectionTensorB ? (
            <div className="rounded border border-violet-500/15 bg-black/20 px-2 py-1 font-mono text-[7px] text-violet-100/70 normal-case">
              temporal_projection_tensor.v0 (B) · |R|={projectionTensorB.measures.cardinalityRange} · |L|=
              {projectionTensorB.measures.cardinalityLineage} · |R∩L|={projectionTensorB.measures.cardinalityOverlap} · J(R,L)=
              {projectionTensorB.measures.jaccardRangeLineage == null ? "—" : projectionTensorB.measures.jaccardRangeLineage.toFixed(4)}
            </div>
          ) : null}
          {crossGeometry ? (
            crossGeometry.windowMismatch ? (
              <div className="rounded border border-amber-500/20 bg-amber-950/15 px-2 py-1 text-[7px] text-amber-100/85 normal-case">
                observational_geometry_cross_origin: pencere uyuşmuyor (A.from/to ≠ B.from/to) — küme kesişimleri bu modda gösterilmez.
              </div>
            ) : (
              <div className="rounded border border-cyan-500/20 bg-cyan-950/10 px-2 py-1 font-mono text-[7px] text-cyan-100/80 normal-case">
                observational_geometry_cross_origin.v0 · |R_A∩R_B|={crossGeometry.cardinalityRangeIntersectionAB} · |L_A∩L_B|=
                {crossGeometry.cardinalityLineageIntersectionAB} · |O_A∩O_B|={crossGeometry.cardinalityOverlapIntersectionAB} ·
                J_overlap(A,B)=
                {crossGeometry.overlapJaccardCrossOrigin == null ? "—" : crossGeometry.overlapJaccardCrossOrigin.toFixed(4)} · ||ΔT||
                _01=
                {crossGeometry.tensorDifferenceNorm01 == null ? "—" : crossGeometry.tensorDifferenceNorm01.toFixed(4)}
                <span className="mt-0.5 block font-mono text-[7px] text-cyan-200/90">
                  [d_R,d_L,d_O]=[
                  {crossGeometry.channelDivergenceVector01
                    ? crossGeometry.channelDivergenceVector01.map((x) => x.toFixed(3)).join(",")
                    : "—"}
                  ]
                </span>
                {fieldTopologyCurrent ? (
                  <span className="mt-0.5 block font-sans text-[6px] text-white/55 normal-case">
                    field_topology · stress={fieldTopologyCurrent.stressOrdering} · anisotropy=
                    {fieldTopologyCurrent.anisotropy01.toFixed(3)} · dominant={fieldTopologyCurrent.dominant} · bary(R,L,O)=(
                    {fieldTopologyCurrent.barycentricRL01.map((x) => x.toFixed(2)).join(",")})
                  </span>
                ) : null}
                <span className="mt-0.5 block font-sans text-[6px] text-white/40 normal-case">
                  ||ΔT||_01 = ortalama kanal (1−Jaccard) — R/L/O projeksiyon kümesi çiftleri; dünya birleştirmez, gözlemsel geometri hizası.
                </span>
              </div>
            )
          ) : null}
        </div>
      ) : null}

      {driftSamples.length > 0 ? (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[8px] font-black uppercase tracking-[0.18em] text-white/50">Boundary drift memory (session)</div>
            <button
              type="button"
              className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white/60 hover:bg-white/[0.08]"
              onClick={() => copyObservatoryEpistemicExport()}
            >
              Copy epistemic export JSON
            </button>
          </div>
          <p className="text-[8px] text-white/38 normal-case">
            φA vs φB çift yükleme anları; turuncu = sınıflandırma ayrışması (containment divergence, truth değil).
          </p>
          <div className="flex flex-wrap gap-0.5">
            {driftSamples.map((s, i) => {
              const mismatch = s.phiB != null && s.phiA !== s.phiB;
              const td = s.tensorDifferenceNorm01;
              const title = `${new Date(s.ts).toISOString()} · φA=${s.phiA} · φB=${s.phiB ?? "—"} · lastA=${s.lastA ?? "—"} · lastB=${s.lastB ?? "—"}${
                td != null ? ` · ||ΔT||_01=${td.toFixed(4)}` : ""
              }`;
              return (
                <div
                  key={`${s.ts}-${i}`}
                  title={title}
                  className={`h-4 w-2.5 rounded-sm ${mismatch ? "bg-amber-500/75" : "bg-slate-600/55"}`}
                />
              );
            })}
          </div>
          <div className="text-[7px] font-black uppercase tracking-[0.14em] text-white/45">Tensor divergence field sample ||ΔT||_01(t)</div>
          <p className="text-[7px] text-white/35 normal-case">
            Her Load segment ile örneklenir; statik tensör değil, oturum içi epistemik divergence izi (gözlemsel geometri).
          </p>
          <div className="flex flex-wrap items-end gap-0.5" style={{ minHeight: 24 }}>
            {driftSamples.map((s, i) => {
              const v = s.tensorDifferenceNorm01;
              if (v == null || typeof v !== "number") {
                return (
                  <div
                    key={`td-${s.ts}-${i}`}
                    title="tensor divergence not recorded (single origin or window mismatch)"
                    className="h-1 w-2.5 rounded-sm bg-white/10"
                  />
                );
              }
              const h = Math.max(3, (v / tensorDivergenceTraceMax) * 22);
              return (
                <div
                  key={`td-${s.ts}-${i}`}
                  title={`||ΔT||_01=${v.toFixed(4)} @ ${new Date(s.ts).toISOString()}`}
                  className="w-2.5 rounded-sm bg-cyan-500/75"
                  style={{ height: h }}
                />
              );
            })}
          </div>
          <div className="text-[7px] font-black uppercase tracking-[0.14em] text-violet-300/70">Epistemic acceleration |dS/dt| (discrete)</div>
          <p className="text-[7px] text-white/35 normal-case">
            S = yoğunluk özeti · S_norm = zaman ölçeği · dS/dt = hareket sinyali (sparkline yalnızca dS/dt; karar değil).
          </p>
          <div className="flex flex-wrap items-end gap-0.5" style={{ minHeight: 24 }}>
            {driftSamples.map((s, i) => {
              if (i === 0) {
                return (
                  <div
                    key={`ds0-${s.ts}`}
                    title="dS/dt: first sample has no preceding segment"
                    className="h-1 w-2.5 rounded-sm bg-white/10"
                  />
                );
              }
              const pt = epistemicDynamicsV01.stabilityGradientSeriesV01?.series[i - 1];
              const rate = pt?.dS_dt;
              if (rate == null || typeof rate !== "number") {
                return (
                  <div
                    key={`ds-${s.ts}-${i}`}
                    title="dS/dt not available"
                    className="h-1 w-2.5 rounded-sm bg-white/10"
                  />
                );
              }
              const mag = Math.abs(rate);
              const h = Math.max(3, (mag / dSdtSparkAbsMax) * 22);
              return (
                <div
                  key={`ds-${s.ts}-${i}`}
                  title={`dS/dt=${rate.toFixed(4)} @ ${new Date(s.ts).toISOString()}`}
                  className="w-2.5 rounded-sm bg-violet-500/80"
                  style={{ height: h }}
                />
              );
            })}
          </div>
          <div className="rounded border border-white/[0.06] bg-black/25 px-2 py-1 font-mono text-[6px] text-white/55 normal-case">
            {EPISTEMIC_VECTOR_FIELD_DYNAMICS_MODEL_V022} · S=
            {epistemicDynamicsV01.stabilityFunctional01?.S != null
              ? epistemicDynamicsV01.stabilityFunctional01.S.toFixed(4)
              : "—"}{" "}
            · S_norm=S/(1+∫dt)=
            {epistemicDynamicsV01.stabilityFunctional01?.S_norm != null
              ? epistemicDynamicsV01.stabilityFunctional01.S_norm.toFixed(4)
              : "—"}{" "}
            · ∫dt≈
            {epistemicDynamicsV01.stabilityFunctional01?.totalElapsedSeconds != null
              ? epistemicDynamicsV01.stabilityFunctional01.totalElapsedSeconds.toFixed(2)
              : "—"}
            s · dS/dt_last=
            {epistemicDynamicsV01.stabilityGradientSeriesV01?.last?.dS_dt != null
              ? epistemicDynamicsV01.stabilityGradientSeriesV01.last.dS_dt.toFixed(4)
              : "—"}{" "}
            (observation channel, not control) · ∫‖ΔT‖dt≈{epistemicDynamicsV01.cumulativeIntegralTensorNorm01.toFixed(4)} · TV_ch(L1)=
            {epistemicDynamicsV01.channelTotalVariationL1.toFixed(4)}
            {epistemicDynamicsV01.phase01 != null ? ` · phase01=${epistemicDynamicsV01.phase01.toFixed(3)}` : ""}
            {epistemicDynamicsV01.sequentialChannelAlignment?.cosine01 != null
              ? ` · seq_align_cos=${epistemicDynamicsV01.sequentialChannelAlignment.cosine01.toFixed(3)}`
              : ""}
            <span className="mt-0.5 block text-violet-200/80">
              anomaly_field A=α·S_norm+β·|dS/dt| · A_last=
              {epistemicDynamicsV01.epistemicAnomalyFieldV01?.last?.A != null
                ? epistemicDynamicsV01.epistemicAnomalyFieldV01.last.A.toFixed(4)
                : "—"}{" "}
              · p_sess=
              {epistemicDynamicsV01.epistemicAnomalyFieldV01?.regimeQuantized?.detail?.percentile01 != null
                ? epistemicDynamicsV01.epistemicAnomalyFieldV01.regimeQuantized.detail.percentile01.toFixed(2)
                : "—"}{" "}
              · μ_A(EMA)=
              {epistemicDynamicsV01.epistemicAnomalyFieldV01?.regimeQuantized?.detail?.muA_ema != null
                ? epistemicDynamicsV01.epistemicAnomalyFieldV01.regimeQuantized.detail.muA_ema.toFixed(4)
                : "—"}{" "}
              · regime_q=
              {epistemicDynamicsV01.epistemicAnomalyFieldV01?.regimeQuantized?.regime ?? "—"} (tertile+EMA quantize, not
              threshold on S_norm)
            </span>
            {showV022ExtendedObservabilityMetrics ? (
              <>
                <span className="mt-0.5 block font-mono text-[6px] text-sky-100/70 normal-case">
                  Δ_scale=|μ_fast−μ_slow|_last=
                  {epistemicDynamicsV01.epistemicAnomalyFieldV01?.scaleInterference01?.last?.deltaScale != null
                    ? epistemicDynamicsV01.epistemicAnomalyFieldV01.scaleInterference01.last.deltaScale.toFixed(4)
                    : "—"}{" "}
                  · coherence=
                  {epistemicDynamicsV01.epistemicAnomalyFieldV01?.regimeCoherence01?.coherenceScore01 != null
                    ? epistemicDynamicsV01.epistemicAnomalyFieldV01.regimeCoherence01.coherenceScore01.toFixed(4)
                    : "—"}{" "}
                  (EMA spread × rank stability; ölçüm topolojisi, karar değil)
                </span>
                <span className="mt-0.5 block font-mono text-[6px] text-violet-100/65 normal-case">
                  μ_A multi-window (last):{" "}
                  {(epistemicDynamicsV01.epistemicAnomalyFieldV01?.emaMultiScaleOfA ?? [])
                    .map((m) => {
                      const v = m.series[m.series.length - 1];
                      return `${m.id}=${v != null && Number.isFinite(v) ? v.toFixed(3) : "—"}`;
                    })
                    .join(" · ") || "—"}{" "}
                  — moving baselines only; regime still uses primary λ EMA for dev term.
                </span>
              </>
            ) : (
              <span className="mt-0.5 block font-mono text-[6px] text-rose-200/75 normal-case">
                v0.2.2 extended observability metrics withheld (Legacy drift mode — epistemic invariance; no silent
                cross-version merge).
              </span>
            )}
          </div>
        </div>
      ) : null}

      <div className="text-[7px] leading-relaxed text-white/35 normal-case">
        Raw JSON incelemesi için Temporal Query Playground kullanın; burada yalnızca oturum korelasyonu gösterilir.
      </div>
    </div>
  );
}
