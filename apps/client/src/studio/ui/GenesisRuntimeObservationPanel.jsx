import React, { useCallback, useEffect, useMemo, useState } from "react";

function formatUptime(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-2 rounded border border-white/[0.08] bg-black/20 px-2 py-1">
      <span className="text-[8px] uppercase tracking-[0.18em] text-white/55">{label}</span>
      <span
        className={`max-w-[68%] text-right text-[9px] text-white/85 ${mono ? "break-all font-mono normal-case" : "normal-case"}`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Read-only observer of gateway `GET /rhizoh/genesis/runtime` — no client-side synthetic continuity.
 * @param {{ gatewayOrigin: string }} props
 */
export function GenesisRuntimeObservationPanel({ gatewayOrigin }) {
  const url = useMemo(() => {
    const o = String(gatewayOrigin || "").trim().replace(/\/+$/, "");
    if (!o) return "";
    return `${o}/rhizoh/genesis/runtime`;
  }, [gatewayOrigin]);

  const [snap, setSnap] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const pull = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch(url, { method: "GET", cache: "no-store" });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) {
        setErr(String(j?.error || res.statusText || "fetch_failed"));
        setSnap(null);
        return;
      }
      setErr("");
      setSnap(j);
    } catch (e) {
      setErr(String(e?.message || e || "network_error"));
      setSnap(null);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!url) return undefined;
    pull();
    const id = window.setInterval(pull, 3000);
    return () => window.clearInterval(id);
  }, [pull, url]);

  if (!url) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3 text-[9px] text-amber-100/80 normal-case">
        Genesis runtime observer: gateway origin yok (Rhizoh HTTP base / env).
      </div>
    );
  }

  const tick = snap?.canonicalTick?.value;
  const seal = snap?.lastEpistemicSeal?.sealHash;
  const sealNote = seal ? `${seal.slice(0, 10)}…${seal.slice(-8)}` : "henüz mühür yok (gateway’de seal üretilene kadar)";
  const meshNodes = snap?.presenceMesh?.uniqueClientUids;
  const spiral = snap?.spiralWebSocket?.clientsActive;
  const connectedLabel =
    meshNodes != null || spiral != null
      ? `mesh uid: ${meshNodes ?? "—"} · spiral ws: ${spiral ?? "—"}`
      : "—";

  return (
    <div className="space-y-2 rounded-xl border border-violet-400/20 bg-violet-950/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[9px] font-black tracking-[0.22em] text-violet-200/90">GENESIS RUNTIME (OBSERVER)</div>
        <div className="text-[8px] text-violet-100/60">{loading ? "sync…" : err ? "degraded" : "live"}</div>
      </div>
      {err ? (
        <div className="rounded border border-rose-500/25 bg-rose-950/20 px-2 py-1 text-[9px] text-rose-100/90 normal-case">
          {err}
        </div>
      ) : null}
      <div className="grid gap-1">
        <Row label="Canonical tick (gateway)" value={tick != null ? String(tick).padStart(8, "0") : "—"} mono />
        <Row label="Gateway uptime" value={snap ? formatUptime(snap.uptimeSec) : "—"} />
        <Row label="Current seal (last issued)" value={snap ? sealNote : "—"} mono />
        <Row
          label="Replay signal (worker)"
          value={
            snap
              ? `${snap.replay?.alignment ?? "—"}${snap.replay?.divergenceTotal != null ? ` · div=${snap.replay.divergenceTotal}` : ""}`
              : "—"
          }
        />
        <Row
          label="Replay fingerprint (gateway)"
          value={snap?.replayFingerprint?.short ? String(snap.replayFingerprint.short) : "—"}
          mono
        />
        <Row
          label="Continuity seq (last accepted)"
          value={snap?.genesisStream?.lastAcceptedSeq != null ? String(snap.genesisStream.lastAcceptedSeq) : "—"}
        />
        <Row label="Connected / presence" value={snap ? connectedLabel : "—"} />
        <Row
          label="AI throttle (R5, gateway)"
          value={snap ? String(snap.rhizohLlm?.constitutionalThrottleTotal ?? 0) : "—"}
        />
        <Row label="Ledger height (persisted entries)" value={snap ? String(snap.epistemicLedger?.entriesPersistedTotal ?? 0) : "—"} />
        <Row label="Infra queue depth · errors" value={snap ? `${snap.infra?.queueDepth ?? 0} · ${snap.infra?.errors ?? 0}` : "—"} />
        <Row label="Rhizoh LLM turns (completed)" value={snap ? String(snap.rhizohLlm?.turnsCompleted ?? 0) : "—"} />
      </div>
      <div className="text-[7px] leading-relaxed text-white/40 normal-case">
        Kaynak: gateway-only JSON (`castle.genesis.runtime.surface.v0`). UI üretmez; yalnızca okur.
      </div>
    </div>
  );
}
