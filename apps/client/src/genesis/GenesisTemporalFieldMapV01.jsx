import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildGenesisReplayRouterUrl,
  buildGenesisReplayTemporalDiffUrl
} from "./genesisHubQueryContextV1.js";

/** UI artifact label — gateway şemaları yanıtta gelir. */
export const GENESIS_TEMPORAL_FIELD_MAP_V01 = "castle.genesis.temporal_field_map.v0.1";

/** @param {{ ringOnly: number, archiveOnly: number, overlap: number }} c */
function ringArchiveShannonBits01(c) {
  const t = c.ringOnly + c.archiveOnly + c.overlap;
  if (t <= 0) return 0;
  let h = 0;
  for (const n of [c.ringOnly, c.archiveOnly, c.overlap]) {
    if (n <= 0) continue;
    const p = n / t;
    h -= p * Math.log2(p);
  }
  return Math.round(h * 1000) / 1000;
}

/**
 * Tek eksende: replay fingerprint + temporal diff (set ayrımı + sinyaller) + ham JSON linkleri.
 * @param {{
 *   gatewayOrigin: string,
 *   hubQueryContext?: null | { seqMin?: number | null, seqMax?: number | null, eventType?: string | null },
 *   lastSeq?: number | null
 * }} props
 */
export function GenesisTemporalFieldMapV01({ gatewayOrigin, hubQueryContext, lastSeq }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  /** @type {Record<string, unknown> | null} */
  const [replay, setReplay] = useState(null);
  /** @type {Record<string, unknown> | null} */
  const [diff, setDiff] = useState(null);

  const rangePreset = useMemo(() => {
    if (!hubQueryContext) return null;
    const a = hubQueryContext.seqMin;
    const b = hubQueryContext.seqMax;
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return { from: Math.floor(a), to: Math.floor(b), type: String(hubQueryContext.eventType || "").trim() };
  }, [hubQueryContext?.seqMin, hubQueryContext?.seqMax, hubQueryContext?.eventType]);

  useEffect(() => {
    if (rangePreset) {
      setFrom(String(rangePreset.from));
      setTo(String(rangePreset.to));
      setTypeFilter(rangePreset.type || "");
      return;
    }
    if (lastSeq != null && Number.isFinite(lastSeq) && lastSeq > 0) {
      const lo = Math.max(1, lastSeq - 49);
      setFrom(String(lo));
      setTo(String(lastSeq));
    }
  }, [rangePreset, lastSeq]);

  const load = useCallback(async () => {
    const o = String(gatewayOrigin || "").trim();
    const fa = parseInt(String(from).trim(), 10);
    const tb = parseInt(String(to).trim(), 10);
    if (!o || !Number.isFinite(fa) || !Number.isFinite(tb) || fa <= 0 || tb <= 0) {
      setErr("from / to pozitif tamsayı olmalı.");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const type = String(typeFilter || "").trim();
      const replayUrl = buildGenesisReplayRouterUrl(o, { from: fa, to: tb, type: type || undefined, checkpoints: true });
      const diffUrl = buildGenesisReplayTemporalDiffUrl(o, { from: fa, to: tb, type: type || undefined });
      const [r1, r2] = await Promise.all([
        fetch(replayUrl, { method: "GET", cache: "no-store" }),
        fetch(diffUrl, { method: "GET", cache: "no-store" })
      ]);
      const j1 = await r1.json().catch(() => null);
      const j2 = await r2.json().catch(() => null);
      if (!r1.ok || !j1?.ok) {
        setReplay(null);
        setDiff(null);
        setErr(`replay HTTP ${r1.status} · ${String(j1?.error || "bad_body")}`);
        return;
      }
      if (!r2.ok || !j2?.ok) {
        setReplay(j1);
        setDiff(null);
        setErr(`diff HTTP ${r2.status} · ${String(j2?.error || "bad_body")}`);
        return;
      }
      setReplay(j1);
      setDiff(j2);
    } catch (e) {
      setReplay(null);
      setDiff(null);
      setErr(String(e?.message || e || "network_error"));
    } finally {
      setLoading(false);
    }
  }, [gatewayOrigin, from, to, typeFilter]);

  const counts = diff && typeof diff.counts === "object" ? /** @type {Record<string, number>} */ (diff.counts) : null;
  const signals = diff && typeof diff.signals === "object" ? /** @type {Record<string, unknown>} */ (diff.signals) : null;
  const entropy01 =
    counts && typeof counts.ringOnly === "number"
      ? ringArchiveShannonBits01({
          ringOnly: counts.ringOnly,
          archiveOnly: counts.archiveOnly,
          overlap: counts.overlap
        })
      : null;
  const parsedFrom = parseInt(String(from).trim(), 10);
  const parsedTo = parseInt(String(to).trim(), 10);
  const urlsValid = Number.isFinite(parsedFrom) && Number.isFinite(parsedTo) && parsedFrom > 0 && parsedTo > 0;
  const typeTrim = String(typeFilter || "").trim();
  const replayUrlOpen = urlsValid
    ? buildGenesisReplayRouterUrl(String(gatewayOrigin || "").trim(), {
        from: parsedFrom,
        to: parsedTo,
        type: typeTrim || undefined,
        checkpoints: true
      })
    : "";
  const diffUrlOpen = urlsValid
    ? buildGenesisReplayTemporalDiffUrl(String(gatewayOrigin || "").trim(), {
        from: parsedFrom,
        to: parsedTo,
        type: typeTrim || undefined
      })
    : "";

  if (!String(gatewayOrigin || "").trim()) return null;

  return (
    <div className="rounded-xl border border-cyan-500/15 bg-cyan-950/10 p-3 text-[9px] text-white/70 normal-case">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2 border-b border-white/[0.06] pb-2">
        <div>
          <div className="font-mono text-[8px] text-white/40">{GENESIS_TEMPORAL_FIELD_MAP_V01}</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
            Temporal field map
          </div>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void load()}
          className="rounded border border-cyan-400/30 bg-black/30 px-2 py-1 text-[8px] uppercase tracking-[0.14em] text-cyan-100/90 hover:bg-cyan-950/40 disabled:opacity-40"
        >
          {loading ? "…" : "Yükle"}
        </button>
      </div>
      <div className="mb-2 grid gap-2 sm:grid-cols-3">
        <label className="block font-mono text-[8px] text-white/45">
          from
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-0.5 w-full rounded border border-white/10 bg-black/40 px-1.5 py-1 text-[9px] text-white/85"
          />
        </label>
        <label className="block font-mono text-[8px] text-white/45">
          to
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-0.5 w-full rounded border border-white/10 bg-black/40 px-1.5 py-1 text-[9px] text-white/85"
          />
        </label>
        <label className="block font-mono text-[8px] text-white/45">
          type (opsiyonel)
          <input
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="mt-0.5 w-full rounded border border-white/10 bg-black/40 px-1.5 py-1 text-[9px] text-white/85"
          />
        </label>
      </div>
      {err ? <div className="mb-2 rounded border border-rose-500/25 bg-rose-950/20 px-2 py-1 text-[8px] text-rose-100/90">{err}</div> : null}
      {replay?.ok ? (
        <div className="mb-2 space-y-1 rounded border border-white/[0.06] bg-black/25 px-2 py-1.5 font-mono text-[8px]">
          <div className="text-white/45">replay · {String(replay.schema || "—")}</div>
          <div className="break-all text-cyan-100/90">
            <span className="text-white/40">replayFingerprint</span> · {String(replay.replayFingerprint || "—")}
          </div>
          <div className="text-white/50">
            <span className="text-white/40">determinismProjection</span> · {String(replay.determinismProjection || "—")}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {replayUrlOpen ? (
              <a
                href={replayUrlOpen}
                target="_blank"
                rel="noreferrer"
                className="text-sky-300/90 underline decoration-sky-500/30 underline-offset-2"
              >
                replay JSON
              </a>
            ) : null}
            {diffUrlOpen ? (
              <a
                href={diffUrlOpen}
                target="_blank"
                rel="noreferrer"
                className="text-sky-300/90 underline decoration-sky-500/30 underline-offset-2"
              >
                diff JSON
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
      {diff?.ok ? (
        <div className="space-y-2 rounded border border-white/[0.06] bg-black/25 px-2 py-1.5">
          <div className="font-mono text-[8px] text-white/45">diff · {String(diff.schema || "—")}</div>
          {counts ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[8px] sm:grid-cols-3">
              <span className="text-white/40">ring</span>
              <span>{String(counts.ring ?? "—")}</span>
              <span className="text-white/40">archive</span>
              <span>{String(counts.archive ?? "—")}</span>
              <span className="text-white/40">overlap</span>
              <span>{String(counts.overlap ?? "—")}</span>
              <span className="text-white/40">ringOnly</span>
              <span>{String(counts.ringOnly ?? "—")}</span>
              <span className="text-white/40">archiveOnly</span>
              <span>{String(counts.archiveOnly ?? "—")}</span>
              <span className="text-white/40">union</span>
              <span>{String(counts.union ?? "—")}</span>
              <span className="text-white/40">contentMismatch</span>
              <span>{String(counts.contentMismatch ?? "—")}</span>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2 font-mono text-[8px]">
            <span className="text-white/40">overlap/union</span>
            <span>{overlapRatio != null ? overlapRatio.toFixed(4) : "—"}</span>
            <span className="text-white/40">H(ring|arch|ovl)</span>
            <span>{entropy01 != null ? String(entropy01) : "—"} bits</span>
          </div>
          {signals ? (
            <div className="flex flex-wrap gap-1.5 text-[8px]">
              <span
                className={`rounded border px-1.5 py-0.5 ${
                  signals.ringArchivePayloadAligned ? "border-emerald-500/30 text-emerald-200/90" : "border-amber-500/30 text-amber-200/90"
                }`}
              >
                ringArchivePayloadAligned={String(!!signals.ringArchivePayloadAligned)}
              </span>
              <span
                className={`rounded border px-1.5 py-0.5 ${
                  !signals.archiveRetentionGap ? "border-white/10 text-white/50" : "border-violet-400/35 text-violet-200/90"
                }`}
              >
                archiveRetentionGap={String(!!signals.archiveRetentionGap)}
              </span>
              <span
                className={`rounded border px-1.5 py-0.5 ${
                  !signals.ringAheadOfArchive ? "border-white/10 text-white/50" : "border-orange-400/35 text-orange-200/90"
                }`}
              >
                ringAheadOfArchive={String(!!signals.ringAheadOfArchive)}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
      {!replay && !err ? (
        <p className="text-[8px] text-white/35">Seq aralığını girip Yükle — ctx=1 ile Hub URL’si geldiysen from/to otomatik dolar.</p>
      ) : null}
    </div>
  );
}
