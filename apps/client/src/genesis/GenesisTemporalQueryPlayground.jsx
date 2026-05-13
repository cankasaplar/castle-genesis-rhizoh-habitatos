import React, { useCallback, useMemo, useState } from "react";

function shortHex(s, head = 10, tail = 6) {
  const t = String(s || "").trim();
  if (!t) return "—";
  if (t.length <= head + tail + 1) return t;
  return `${t.slice(0, head)}…${t.slice(-tail)}`;
}

/**
 * Read-only playground for gateway checkpoint query projections (`by-seq`, `range`, `lineage`).
 * Does not synthesize continuity; only displays gateway JSON + HTTP semantics (410 ephemeral, etc.).
 * @param {{ gatewayOrigin: string }} props
 */
export function GenesisTemporalQueryPlayground({ gatewayOrigin }) {
  const base = useMemo(() => String(gatewayOrigin || "").trim().replace(/\/+$/, ""), [gatewayOrigin]);

  const [bySeq, setBySeq] = useState("128");
  const [rangeFrom, setRangeFrom] = useState("1");
  const [rangeTo, setRangeTo] = useState("256");
  const [lineageSeq, setLineageSeq] = useState("256");

  const [out, setOut] = useState(/** @type {{ label: string, status: number, body: unknown, text: string } | null} */ (null));
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (label, url) => {
      if (!base) return;
      setBusy(true);
      setOut(null);
      try {
        const res = await fetch(url, { method: "GET", cache: "no-store" });
        const text = await res.text();
        let body = null;
        try {
          body = JSON.parse(text);
        } catch {
          body = { parse_error: true, raw: text.slice(0, 800) };
        }
        setOut({ label, status: res.status, body, text });
      } catch (e) {
        setOut({
          label,
          status: 0,
          body: { ok: false, error: String(e?.message || e || "network_error") },
          text: ""
        });
      } finally {
        setBusy(false);
      }
    },
    [base]
  );

  if (!base) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3 text-[9px] text-amber-100/80 normal-case">
        Temporal query playground: gateway origin yok — Rhizoh HTTP base yapılandırılmalı.
      </div>
    );
  }

  const projectionRows =
    out?.body &&
    typeof out.body === "object" &&
    out.body !== null &&
    Array.isArray(/** @type {{ checkpoints?: unknown[] }} */ (out.body).checkpoints)
      ? /** @type {{ checkpoints: { seqCommittedThrough?: unknown; prevLedgerRoot?: unknown; ledgerRoot?: unknown }[] }} */ (out.body).checkpoints
      : null;

  return (
    <div className="space-y-3 rounded-xl border border-cyan-400/20 bg-cyan-950/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[9px] font-black tracking-[0.22em] text-cyan-200/90">TEMPORAL QUERY (READ-ONLY)</div>
        <div className="text-[8px] text-cyan-100/60">{busy ? "fetch…" : "idle"}</div>
      </div>
      <p className="text-[8px] leading-relaxed text-white/45 normal-case">
        Gateway query yüzeyi: yalnızca projeksiyon. 410 = bilinçli ephemeral (`CASTLE_GENESIS_DISK_PERSIST=0`); 503 = durable okuma yok;
        200 gövdesi yeni iddia üretmez.
      </p>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="space-y-1 rounded border border-white/[0.08] bg-black/25 p-2">
          <div className="text-[8px] uppercase tracking-[0.18em] text-white/55">by-seq</div>
          <input
            className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 font-mono text-[10px] text-white/90"
            value={bySeq}
            onChange={(e) => setBySeq(e.target.value)}
            inputMode="numeric"
            aria-label="seq for by-seq query"
          />
          <button
            type="button"
            disabled={busy}
            className="w-full rounded bg-cyan-600/30 py-1 text-[9px] font-bold uppercase tracking-wider text-cyan-100 hover:bg-cyan-500/35 disabled:opacity-40"
            onClick={() => run("by-seq", `${base}/rhizoh/genesis/checkpoint/by-seq/${encodeURIComponent(String(bySeq).trim())}`)}
          >
            GET by-seq
          </button>
        </div>
        <div className="space-y-1 rounded border border-white/[0.08] bg-black/25 p-2">
          <div className="text-[8px] uppercase tracking-[0.18em] text-white/55">range</div>
          <div className="flex gap-1">
            <input
              className="w-1/2 rounded border border-white/10 bg-black/40 px-1 py-1 font-mono text-[10px] text-white/90"
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
              aria-label="from seq"
            />
            <input
              className="w-1/2 rounded border border-white/10 bg-black/40 px-1 py-1 font-mono text-[10px] text-white/90"
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
              aria-label="to seq"
            />
          </div>
          <button
            type="button"
            disabled={busy}
            className="w-full rounded bg-cyan-600/30 py-1 text-[9px] font-bold uppercase tracking-wider text-cyan-100 hover:bg-cyan-500/35 disabled:opacity-40"
            onClick={() =>
              run(
                "range",
                `${base}/rhizoh/genesis/checkpoint/range?from=${encodeURIComponent(String(rangeFrom).trim())}&to=${encodeURIComponent(String(rangeTo).trim())}`
              )
            }
          >
            GET range
          </button>
        </div>
        <div className="space-y-1 rounded border border-white/[0.08] bg-black/25 p-2">
          <div className="text-[8px] uppercase tracking-[0.18em] text-white/55">lineage</div>
          <input
            className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 font-mono text-[10px] text-white/90"
            value={lineageSeq}
            onChange={(e) => setLineageSeq(e.target.value)}
            aria-label="through seq for lineage"
          />
          <button
            type="button"
            disabled={busy}
            className="w-full rounded bg-cyan-600/30 py-1 text-[9px] font-bold uppercase tracking-wider text-cyan-100 hover:bg-cyan-500/35 disabled:opacity-40"
            onClick={() =>
              run("lineage", `${base}/rhizoh/genesis/checkpoint/lineage?seq=${encodeURIComponent(String(lineageSeq).trim())}`)
            }
          >
            GET lineage
          </button>
        </div>
      </div>

      {projectionRows && projectionRows.length > 0 ? (
        <div className="overflow-x-auto rounded border border-white/[0.06]">
          <table className="w-full text-left text-[8px] text-white/80">
            <thead className="text-white/45">
              <tr>
                <th className="px-2 py-1 font-normal">seq</th>
                <th className="px-2 py-1 font-normal">prev → ledger</th>
              </tr>
            </thead>
            <tbody>
              {projectionRows.map((row, i) => (
                <tr key={i} className="border-t border-white/[0.05] font-mono normal-case">
                  <td className="px-2 py-1">{String(row.seqCommittedThrough ?? "—")}</td>
                  <td className="px-2 py-1 break-all">
                    {shortHex(row.prevLedgerRoot)} → {shortHex(row.ledgerRoot)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {out ? (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-[8px] text-white/55">
            <span className="uppercase tracking-[0.15em]">{out.label}</span>
            <span className="rounded border border-white/10 px-1 py-0.5 font-mono text-white/70">HTTP {out.status}</span>
            {out.body && typeof out.body === "object" && out.body !== null && "error" in out.body ? (
              <span className="font-mono text-amber-200/90">{String(/** @type {{ error?: unknown }} */ (out.body).error)}</span>
            ) : null}
          </div>
          <pre className="max-h-48 overflow-auto rounded border border-white/[0.08] bg-black/50 p-2 text-[8px] leading-relaxed text-emerald-100/80">
            {JSON.stringify(out.body, null, 2)}
          </pre>
        </div>
      ) : null}

      <div className="text-[7px] leading-relaxed text-white/35 normal-case">
        Protocol observatory: canlı gateway cevabı; tutorial veya AI açıklaması değildir.
      </div>
    </div>
  );
}
