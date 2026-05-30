import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { diffGenesisRuntimeSnapshots } from "./genesisContinuityDiffV0.js";
import {
  formatGenesisContinuityEventLine,
  GENESIS_CONTINUITY_EVENT_SCHEMA
} from "./genesisContinuityEventFormatV0.js";
import { ExplainAcademyLink } from "./ExplainAcademyLink.jsx";
import { explainContinuityEventType, SEMANTIC_ANCHOR } from "./genesisSemanticBridgeV1.js";

const MAX_LINES = 28;
const POLL_MS = 2600;

/** @param {import("react").Dispatch<import("react").SetStateAction<{ key: string; at: string; line: string; eventType?: string | null; seq?: number | null }[]>>} setLines */
function pushLine(setLines, at, line, keyBase, eventType, seq) {
  setLines((cur) => {
    const sn = typeof seq === "number" && Number.isFinite(seq) ? seq : null;
    const row = { key: `${keyBase}-${line}`, at, line, eventType: eventType || null, seq: sn };
    return [...cur, row].slice(-MAX_LINES);
  });
}

/**
 * @param {{
 *   gatewayOrigin: string,
 *   onStreamTelemetry?: (s: { transport: "sse" | "poll"; lastSeq: number | null; sseErrorCount: number; eventArchiveEnabled: boolean }) => void,
 *   hubQueryContext?: null | { anchor?: string | null, eventType?: string | null, seqMin?: number | null, seqMax?: number | null, window?: number | null }
 * }} props
 */
export function GenesisContinuityMicroStream({ gatewayOrigin, onStreamTelemetry, hubQueryContext }) {
  const onStreamTelemetryRef = useRef(onStreamTelemetry);
  onStreamTelemetryRef.current = onStreamTelemetry;

  const runtimeUrl = useMemo(() => {
    const o = String(gatewayOrigin || "").trim().replace(/\/+$/, "");
    if (!o) return "";
    return `${o}/rhizoh/genesis/runtime`;
  }, [gatewayOrigin]);

  const streamUrl = useMemo(() => {
    const o = String(gatewayOrigin || "").trim().replace(/\/+$/, "");
    if (!o) return "";
    return `${o}/rhizoh/genesis/stream`;
  }, [gatewayOrigin]);

  const prevRef = useRef(null);
  const [lines, setLines] = useState(() => []);
  const [transport, setTransport] = useState(/** @type {"sse" | "poll"} */ ("sse"));
  const [lastSeq, setLastSeq] = useState(/** @type {number | null} */ (null));
  const [sseErrorCount, setSseErrorCount] = useState(0);
  const [eventArchiveEnabled, setEventArchiveEnabled] = useState(false);

  useEffect(() => {
    onStreamTelemetryRef.current?.({ transport, lastSeq, sseErrorCount, eventArchiveEnabled });
  }, [transport, lastSeq, sseErrorCount, eventArchiveEnabled]);

  const pull = useCallback(async () => {
    if (!runtimeUrl) return;
    try {
      const res = await fetch(runtimeUrl, { method: "GET", cache: "no-store" });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) return;
      if (typeof j.genesisStream?.lastAcceptedSeq === "number" && Number.isFinite(j.genesisStream.lastAcceptedSeq)) {
        setLastSeq(j.genesisStream.lastAcceptedSeq);
      }
      const ea = j.genesisStream?.eventArchive;
      setEventArchiveEnabled(Boolean(ea && typeof ea === "object" && ea.enabled === true));
      const prev = prevRef.current;
      prevRef.current = j;
      const delta = diffGenesisRuntimeSnapshots(prev, j);
      if (!delta.length) return;
      setLines((cur) => {
        const next = [
          ...cur,
          ...delta.map((d, i) => ({
            key: `${j.serverTime}-poll-${i}-${d.line}`,
            at: "",
            line: d.line,
            eventType: null,
            seq: null
          }))
        ];
        return next.slice(-MAX_LINES);
      });
    } catch {
      /* quiet */
    }
  }, [runtimeUrl]);

  useEffect(() => {
    if (!streamUrl || !runtimeUrl) return undefined;

    if (typeof EventSource !== "undefined") {
      setTransport("sse");
      const es = new EventSource(streamUrl);
      es.onmessage = (ev) => {
        try {
          const j = JSON.parse(ev.data);
          if (j.schema !== GENESIS_CONTINUITY_EVENT_SCHEMA || !j.type) return;
          if (typeof j.seq === "number" && Number.isFinite(j.seq)) {
            setLastSeq(j.seq);
          }
          const at =
            typeof j.serverTime === "number"
              ? new Date(j.serverTime).toISOString().slice(11, 19)
              : "";
          const line = formatGenesisContinuityEventLine(j);
          pushLine(setLines, at, line, `${j.serverTime}-${j.id}`, j.type, j.seq);
        } catch {
          /* ignore malformed */
        }
      };
      es.onerror = () => {
        setSseErrorCount((c) => c + 1);
        try {
          es.close();
        } catch {
          /* noop */
        }
      };
      return () => {
        try {
          es.close();
        } catch {
          /* noop */
        }
      };
    }

    setTransport("poll");
    void pull();
    const id = window.setInterval(() => void pull(), POLL_MS);
    return () => window.clearInterval(id);
  }, [streamUrl, runtimeUrl, pull]);

  useEffect(() => {
    if (!runtimeUrl) return undefined;
    void pull();
    return undefined;
  }, [runtimeUrl, pull]);

  const visibleLines = useMemo(() => {
    if (!hubQueryContext) return lines;
    let out = lines;
    const et = String(hubQueryContext.eventType || "").trim();
    if (et) {
      out = out.filter((r) => r.eventType === et);
    }
    const smin = hubQueryContext.seqMin;
    const smax = hubQueryContext.seqMax;
    if (smin != null || smax != null) {
      out = out.filter((r) => {
        if (typeof r.seq !== "number") return false;
        if (smin != null && r.seq < smin) return false;
        if (smax != null && r.seq > smax) return false;
        return true;
      });
    }
    const win = hubQueryContext.window;
    if (win != null && Number.isFinite(win) && smin == null && smax == null) {
      out = out.slice(-Math.min(512, Math.max(1, Math.floor(win))));
    }
    return out;
  }, [lines, hubQueryContext]);

  if (!runtimeUrl) return null;

  const ctxActive = !!(
    hubQueryContext &&
    (hubQueryContext.anchor ||
      hubQueryContext.eventType ||
      hubQueryContext.seqMin != null ||
      hubQueryContext.seqMax != null ||
      hubQueryContext.window != null)
  );

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/40">continuity stream</div>
        <div className="flex items-center gap-1">
          <ExplainAcademyLink anchorId={SEMANTIC_ANCHOR.streamTransport} />
          {sseErrorCount > 0 ? <ExplainAcademyLink anchorId={SEMANTIC_ANCHOR.sseErrors} /> : null}
          <div className="text-[7px] uppercase tracking-[0.14em] text-white/30">{transport}</div>
        </div>
      </div>
      {ctxActive ? (
        <div className="mb-1 rounded border border-emerald-500/20 bg-emerald-950/15 px-2 py-1 text-[8px] normal-case text-emerald-100/85">
          Academy → Hub bağlamı:{" "}
          {hubQueryContext?.anchor ? <span className="font-mono">#{String(hubQueryContext.anchor)}</span> : null}
          {hubQueryContext?.eventType ? (
            <span className="font-mono">
              {" "}
              · type={String(hubQueryContext.eventType)}
            </span>
          ) : null}
          {hubQueryContext?.seqMin != null || hubQueryContext?.seqMax != null ? (
            <span className="font-mono">
              {" "}
              · seq∈[{hubQueryContext?.seqMin ?? "…"},{hubQueryContext?.seqMax ?? "…"}]
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        className="max-h-[220px] space-y-1 overflow-y-auto font-mono text-[9px] leading-relaxed text-white/55"
        aria-live="polite"
      >
        {lines.length === 0 ? (
          <div className="text-white/35 normal-case">
            {transport === "sse" ? "Listening for gateway events…" : "Waiting for gateway deltas…"}
          </div>
        ) : visibleLines.length === 0 ? (
          <div className="text-amber-200/80 normal-case">
            Filtre eşleşmedi (seq / type penceresi). Ham tampon: {lines.length} satır — filtreleri temizleyin veya canlı akışı bekleyin.
          </div>
        ) : (
          visibleLines.map((row) => (
            <div key={row.key} className="flex gap-2 border-b border-white/[0.04] pb-0.5">
              <span className="shrink-0 text-white/30">{row.at}</span>
              <span className="w-10 shrink-0 font-mono text-white/25">{row.seq != null ? `#${row.seq}` : "—"}</span>
              <span className="min-w-0 flex-1 break-words text-white/70 normal-case">{row.line}</span>
              {row.eventType ? (
                <ExplainAcademyLink anchorId={explainContinuityEventType(row.eventType).anchorId} />
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
