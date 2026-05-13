import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { diffGenesisRuntimeSnapshots } from "./genesisContinuityDiffV0.js";
import {
  formatGenesisContinuityEventLine,
  GENESIS_CONTINUITY_EVENT_SCHEMA
} from "./genesisContinuityEventFormatV0.js";

const MAX_LINES = 28;
const POLL_MS = 2600;

function pushLine(setLines, at, line, keyBase) {
  setLines((cur) => {
    const row = { key: `${keyBase}-${line}`, at, line };
    return [...cur, row].slice(-MAX_LINES);
  });
}

/**
 * @param {{ gatewayOrigin: string }} props
 */
export function GenesisContinuityMicroStream({ gatewayOrigin }) {
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

  const pull = useCallback(async () => {
    if (!runtimeUrl) return;
    try {
      const res = await fetch(runtimeUrl, { method: "GET", cache: "no-store" });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) return;
      const prev = prevRef.current;
      prevRef.current = j;
      const delta = diffGenesisRuntimeSnapshots(prev, j);
      if (!delta.length) return;
      setLines((cur) => {
        const next = [
          ...cur,
          ...delta.map((d, i) => ({ key: `${j.serverTime}-poll-${i}-${d.line}`, ...d }))
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
          const at =
            typeof j.serverTime === "number"
              ? new Date(j.serverTime).toISOString().slice(11, 19)
              : "";
          const line = formatGenesisContinuityEventLine(j);
          pushLine(setLines, at, line, `${j.serverTime}-${j.id}`);
        } catch {
          /* ignore malformed */
        }
      };
      es.onerror = () => {
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

  if (!runtimeUrl) return null;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/40">continuity stream</div>
        <div className="text-[7px] uppercase tracking-[0.14em] text-white/30">{transport}</div>
      </div>
      <div
        className="max-h-[220px] space-y-1 overflow-y-auto font-mono text-[9px] leading-relaxed text-white/55"
        aria-live="polite"
      >
        {lines.length === 0 ? (
          <div className="text-white/35 normal-case">
            {transport === "sse" ? "Listening for gateway events…" : "Waiting for gateway deltas…"}
          </div>
        ) : (
          lines.map((row) => (
            <div key={row.key} className="flex gap-2 border-b border-white/[0.04] pb-0.5">
              <span className="shrink-0 text-white/30">{row.at}</span>
              <span className="min-w-0 break-words text-white/70 normal-case">{row.line}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
