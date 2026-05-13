import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { GenesisSurfaceNav } from "./GenesisSurfaceNav.jsx";
import { GenesisRuntimeObservationPanel } from "../studio/ui/GenesisRuntimeObservationPanel.jsx";
import { GenesisContinuityMicroStream } from "./GenesisContinuityMicroStream.jsx";
import { GenesisTemporalFieldMapV01 } from "./GenesisTemporalFieldMapV01.jsx";
import { GenesisTemporalQueryPlayground } from "./GenesisTemporalQueryPlayground.jsx";
import { GenesisReplaySessionViewer } from "./GenesisReplaySessionViewer.jsx";
import { GenesisClientCapabilityPanel } from "./GenesisClientCapabilityPanel.jsx";
import {
  probeGenesisGatewayHealth,
  resolveGenesisGatewayOriginCached,
  resolveGenesisNetworkBundle
} from "./genesisNetworkResolverV1.js";
import { GENESIS_SURFACE_PROTOCOL_ARTIFACT_VERSION } from "./genesisSurfaceArtifactV0.js";
import { ExplainAcademyLink } from "./ExplainAcademyLink.jsx";
import {
  explainHubDiagnosticKind,
  academyHashHref,
  GENESIS_SEMANTIC_BRIDGE_SCHEMA,
  SEMANTIC_ANCHOR
} from "./genesisSemanticBridgeV1.js";
import {
  GENESIS_HUB_QUERY_CONTEXT_SCHEMA,
  hubScrollTargetForAnchor,
  parseHubLiveContextSearch,
  buildGenesisContinuityEventArchiveQueryUrl
} from "./genesisHubQueryContextV1.js";

/** @typedef {"stream" | "replay" | "evolution"} GenesisObserveMode */

const OBSERVE_MODE_IDS = /** @type {const} */ ({
  stream: "hub-continuity-panel",
  evolution: "hub-temporal-field-map",
  replay: "hub-epistemic-panel"
});

/** @param {URLSearchParams} prev */
function parseObserveMode(prev) {
  const raw = String(prev.get("mode") || "").trim().toLowerCase();
  if (raw === "stream" || raw === "replay" || raw === "evolution") return /** @type {GenesisObserveMode} */ (raw);
  return null;
}

/** @param {URLSearchParams} prev @param {GenesisObserveMode | null} mode */
function searchParamsWithMode(prev, mode) {
  const p = new URLSearchParams(prev.toString());
  if (mode) p.set("mode", mode);
  else p.delete("mode");
  return p;
}

function SectionTitle({ k, children, explainAnchorId }) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-1">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[9px] text-violet-300/90">{k}</span>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">{children}</h2>
      </div>
      {explainAnchorId ? <ExplainAcademyLink anchorId={explainAnchorId} /> : null}
    </div>
  );
}

/**
 * Birleşik gözlem yüzeyi — URL seçimi yok; {@link resolveGenesisGatewayOriginCached} tek giriş.
 */
export default function GenesisObservabilityHubPage() {
  const { pathname } = useLocation();
  const navActive = pathname === "/academy/observe" ? "observe" : "hub";
  const [searchParams, setSearchParams] = useSearchParams();
  const scrollSig = useRef("");
  const modeScrollSig = useRef("");

  const observeMode = useMemo(() => parseObserveMode(searchParams), [searchParams]);

  const gatewayOrigin = useMemo(() => resolveGenesisGatewayOriginCached(), []);
  const bundle = useMemo(() => resolveGenesisNetworkBundle(), []);

  const hubQueryContext = useMemo(() => {
    const q = searchParams.toString();
    return q ? parseHubLiveContextSearch(`?${q}`) : null;
  }, [searchParams]);
  const continuityEventArchiveUrl = useMemo(
    () => (hubQueryContext ? buildGenesisContinuityEventArchiveQueryUrl(gatewayOrigin, hubQueryContext) : ""),
    [gatewayOrigin, hubQueryContext]
  );
  const [health, setHealth] = useState(/** @type {Awaited<ReturnType<typeof probeGenesisGatewayHealth>> | null} */ (null));
  const [streamTel, setStreamTel] = useState({
    transport: /** @type {"sse" | "poll"} */ ("sse"),
    lastSeq: /** @type {number | null} */ (null),
    sseErrorCount: 0,
    eventArchiveEnabled: false
  });
  const [obsTel, setObsTel] = useState({ err: "", snap: null, loading: false });

  const onObs = useCallback((s) => {
    setObsTel(s);
  }, []);

  useEffect(() => {
    let alive = true;
    probeGenesisGatewayHealth({ timeoutMs: 4500 }).then((h) => {
      if (alive) setHealth(h);
    });
    return () => {
      alive = false;
    };
  }, [gatewayOrigin]);

  const entryState = useMemo(() => {
    if (!gatewayOrigin) {
      return { key: "replay-only", label: "replay-only", hint: "Gateway origin yok — canlı HTTP/SSE yok; replay uçları ayrı origin gerektirir.", tone: "amber" };
    }
    if (health === null) {
      return { key: "loading", label: "…", hint: "Gateway sağlığı yükleniyor.", tone: "neutral" };
    }
    if (!health.ok) {
      return {
        key: "replay-only",
        label: "replay-only",
        hint: `health/live başarısız: ${health.phase || health.error || "not_ok"} — deterministik replay GET’leri hâlâ denenebilir.`,
        tone: "amber"
      };
    }
    if (obsTel.err) {
      return { key: "degraded", label: "degraded", hint: `Runtime snapshot: ${obsTel.err}`, tone: "yellow" };
    }
    if (streamTel.transport !== "sse" || streamTel.sseErrorCount > 0) {
      const sub =
        streamTel.transport === "poll"
          ? "SSE yok veya düştü — continuity poll fallback."
          : `SSE onerror birikimi (${streamTel.sseErrorCount}).`;
      return { key: "degraded", label: "degraded", hint: sub, tone: "yellow" };
    }
    return { key: "live", label: "live", hint: "SSE + health/live + runtime snapshot yeşil.", tone: "emerald" };
  }, [gatewayOrigin, health, obsTel.err, streamTel.transport, streamTel.sseErrorCount]);

  const lastFingerprintDisplay = useMemo(() => {
    const fp = obsTel.snap?.replayFingerprint;
    if (!fp || typeof fp !== "object") return null;
    const short = String(fp.short || "").trim();
    if (short) return short;
    const hex = String(fp.hex || "").trim();
    if (hex.length >= 16) return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
    return hex || null;
  }, [obsTel.snap]);

  const issues = useMemo(() => {
    /** @type {{ key: string, text: string, anchorId: string }[]} */
    const rows = [];
    if (health && !health.ok) {
      rows.push({
        key: "health",
        text: `Gateway health/live: ${health.phase || health.error || `HTTP ${health.status ?? "?"}`}`,
        anchorId: explainHubDiagnosticKind("health").anchorId
      });
    }
    if (obsTel.err) {
      rows.push({
        key: "runtime",
        text: `Runtime GET: ${obsTel.err}`,
        anchorId: explainHubDiagnosticKind("runtime").anchorId
      });
    }
    if (streamTel.transport === "poll") {
      rows.push({
        key: "poll",
        text: "Continuity: polling fallback (EventSource yok veya SSE bağlantısı kurulamadı).",
        anchorId: explainHubDiagnosticKind("poll").anchorId
      });
    }
    if (streamTel.sseErrorCount > 0) {
      rows.push({
        key: "sse",
        text: `SSE onerror sayacı: ${streamTel.sseErrorCount} (tarayıcı otomatik yeniden deneme + MIME/origin hataları burada birikir).`,
        anchorId: explainHubDiagnosticKind("sse").anchorId
      });
    }
    if (!gatewayOrigin) {
      rows.push({
        key: "origin",
        text: "Resolver: gateway origin boş — VITE_GATEWAY_HTTP / VITE_LIVE_GATEWAY_BASE kontrol.",
        anchorId: explainHubDiagnosticKind("origin").anchorId
      });
    }
    return rows;
  }, [health, obsTel.err, streamTel, gatewayOrigin]);

  useEffect(() => {
    if (!hubQueryContext) {
      scrollSig.current = "";
      return;
    }
    const q = searchParams.toString();
    if (!q || q === scrollSig.current) return;
    scrollSig.current = q;
    const targetId = hubScrollTargetForAnchor(hubQueryContext.anchor || "");
    requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [hubQueryContext, searchParams]);

  useEffect(() => {
    if (!observeMode) {
      modeScrollSig.current = "";
      return;
    }
    const sig = `${observeMode}:${pathname}`;
    if (sig === modeScrollSig.current) return;
    modeScrollSig.current = sig;
    const id = OBSERVE_MODE_IDS[observeMode];
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [observeMode, pathname]);

  const modeLinkClass = (m) =>
    `rounded-md border px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] transition-colors ${
      observeMode === m
        ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
        : "border-white/10 text-white/45 hover:border-white/20 hover:text-white/75"
    }`;

  return (
    <div className="min-h-screen bg-[#07060d] px-4 py-6 text-white">
      <div className="mx-auto max-w-4xl space-y-5">
        <GenesisSurfaceNav active={navActive} />

        <div className="flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-black/35 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">Observe</span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] ${
                entryState.tone === "emerald"
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                  : entryState.tone === "yellow"
                    ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
                    : entryState.tone === "amber"
                      ? "border-orange-400/35 bg-orange-950/30 text-orange-100"
                      : "border-white/10 bg-white/5 text-white/60"
              }`}
            >
              {entryState.tone === "emerald" ? (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
              ) : entryState.tone === "yellow" ? (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              ) : entryState.tone === "amber" ? (
                <span className="h-1.5 w-1.5 rounded-full bg-orange-300" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
              )}
              {entryState.label}
            </span>
            <span className="max-w-md text-[8px] font-normal normal-case leading-snug text-white/50">{entryState.hint}</span>
          </div>
          <div className="flex min-w-0 flex-col items-start gap-1 sm:items-end">
            <span className="text-[7px] font-mono uppercase tracking-[0.16em] text-white/35">last replay fingerprint</span>
            <span
              className="max-w-full truncate font-mono text-[10px] text-violet-200/95"
              title={lastFingerprintDisplay || "runtime henüz dönmedi"}
            >
              {lastFingerprintDisplay ?? "—"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/[0.06] bg-black/25 px-2 py-1.5">
          <span className="text-[7px] font-black uppercase tracking-[0.18em] text-white/35">Deep link</span>
          <Link
            className={modeLinkClass("stream")}
            to={`${pathname}?${searchParamsWithMode(searchParams, "stream").toString()}`}
          >
            mode=stream
          </Link>
          <Link
            className={modeLinkClass("replay")}
            to={`${pathname}?${searchParamsWithMode(searchParams, "replay").toString()}`}
          >
            mode=replay
          </Link>
          <Link
            className={modeLinkClass("evolution")}
            to={`${pathname}?${searchParamsWithMode(searchParams, "evolution").toString()}`}
          >
            mode=evolution
          </Link>
          {observeMode ? (
            <button
              type="button"
              className="ml-1 text-[7px] uppercase tracking-[0.12em] text-white/35 underline-offset-2 hover:text-white/55 hover:underline"
              onClick={() => setSearchParams(searchParamsWithMode(searchParams, null))}
            >
              mode temizle
            </button>
          ) : null}
        </div>

        {hubQueryContext ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-3 py-2 text-[9px] text-emerald-100/90 normal-case">
            <div className="min-w-0 flex-1">
              <span className="font-mono text-[8px] text-white/45">{GENESIS_HUB_QUERY_CONTEXT_SCHEMA}</span>
              <div className="mt-0.5 font-mono text-[9px] text-emerald-50/95">
                ctx=1 · a={hubQueryContext.anchor || "—"} · t={hubQueryContext.eventType || "—"} · smin={hubQueryContext.seqMin ?? "—"} · smax={hubQueryContext.seqMax ?? "—"}{" "}
                · w={hubQueryContext.window ?? "—"}
              </div>
              <div className="mt-1 text-[8px] leading-snug text-amber-100/75">
                ctx=1 tarayıcı oturumu; SSE listesi bellek içi ring. Kalıcı omurga: signed checkpoint JSONL. İsteğe bağlı continuity-event arşivi: gateway{" "}
                <span className="font-mono">CASTLE_GENESIS_EVENT_ARCHIVE=1</span> + disk persist.
              </div>
              {streamTel.eventArchiveEnabled && continuityEventArchiveUrl ? (
                <div className="mt-1">
                  <a
                    href={continuityEventArchiveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[8px] text-sky-200/95 underline decoration-sky-400/40 underline-offset-2"
                  >
                    Sunucu continuity-event arşivi (JSON) → aynı seq aralığı
                  </a>
                </div>
              ) : hubQueryContext.seqMin != null && hubQueryContext.seqMax != null && !streamTel.eventArchiveEnabled ? (
                <div className="mt-1 text-[8px] text-white/45">
                  Bu seq aralığı için sunucu continuity-event arşivi kapalı (503) — gateway&apos;de{" "}
                  <span className="font-mono">CASTLE_GENESIS_EVENT_ARCHIVE=1</span> gerekir.
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {hubQueryContext.anchor ? (
                <Link
                  to={academyHashHref(hubQueryContext.anchor)}
                  className="rounded border border-white/15 px-2 py-0.5 text-[8px] uppercase tracking-[0.12em] text-white/80 hover:bg-white/10"
                >
                  Academy
                </Link>
              ) : null}
              <button
                type="button"
                className="rounded border border-white/15 px-2 py-0.5 text-[8px] uppercase tracking-[0.12em] text-white/70 hover:bg-white/10"
                onClick={() => {
                  const next = new URLSearchParams();
                  if (observeMode) next.set("mode", observeMode);
                  setSearchParams(next);
                }}
              >
                Filtreyi temizle
              </button>
            </div>
          </div>
        ) : null}

        <header className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-[0.32em] text-violet-200/85">Castle Genesis</div>
          <h1 className="text-xl font-light tracking-tight text-white/90">Observability hub</h1>
          <p className="text-[11px] leading-relaxed text-white/45 normal-case">
            Tek yüzey: transport + runtime + checkpoint + epistemic izleme. Ağ adresi{" "}
            <span className="font-mono text-white/60">{GENESIS_SURFACE_PROTOCOL_ARTIFACT_VERSION}</span> / resolver{" "}
            <span className="font-mono text-white/60">{bundle.schema}</span> / semantic{" "}
            <span className="font-mono text-white/60">{GENESIS_SEMANTIC_BRIDGE_SCHEMA}</span> / hub-query{" "}
            <span className="font-mono text-white/60">{GENESIS_HUB_QUERY_CONTEXT_SCHEMA}</span>
          </p>
        </header>

        <section id="hub-continuity-panel" className="rounded-xl border border-white/[0.07] bg-black/30 p-3">
          <SectionTitle k="A" explainAnchorId={SEMANTIC_ANCHOR.streamTransport}>
            Live stream status
          </SectionTitle>
          <div className="grid gap-2 text-[9px] text-white/70 sm:grid-cols-2">
            <div className="rounded border border-white/[0.06] bg-black/25 px-2 py-1.5 font-mono normal-case">
              <div>
                <span className="text-white/40">transport</span> · {streamTel.transport}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span>
                  <span className="text-white/40">last seq</span> · {streamTel.lastSeq != null ? String(streamTel.lastSeq) : "—"}
                </span>
                <ExplainAcademyLink anchorId={SEMANTIC_ANCHOR.seq} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span>
                  <span className="text-white/40">SSE errors</span> · {String(streamTel.sseErrorCount)}
                </span>
                {streamTel.sseErrorCount > 0 ? <ExplainAcademyLink anchorId={SEMANTIC_ANCHOR.sseErrors} /> : null}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span>
                  <span className="text-white/40">continuity event archive</span> ·{" "}
                  {streamTel.eventArchiveEnabled ? "gateway JSONL" : "off"}
                </span>
              </div>
              <div className="mt-1 truncate text-[8px] text-white/45" title={bundle.streamUrl}>
                streamUrl · {bundle.streamUrl || "—"}
              </div>
            </div>
            <div className="rounded border border-white/[0.06] bg-black/25 px-2 py-1.5 font-mono normal-case">
              <div className="mb-0.5 flex items-center justify-between gap-1">
                <span className="text-white/40">health/live</span>
                <ExplainAcademyLink anchorId={SEMANTIC_ANCHOR.healthLive} />
              </div>
              <div>
                {health == null ? "…" : health.ok ? "ok" : "fail"}
              </div>
              {health && !health.ok ? (
                <div className="text-rose-200/90">{health.phase || health.error || "not_ok"}</div>
              ) : null}
              <div className="mt-1 truncate text-[8px] text-white/45" title={bundle.healthLiveUrl}>
                origin · {bundle.origin || "—"}
              </div>
            </div>
          </div>
          <div className="mt-2">
            <GenesisContinuityMicroStream
              gatewayOrigin={gatewayOrigin}
              onStreamTelemetry={setStreamTel}
              hubQueryContext={hubQueryContext}
            />
          </div>
        </section>

        <section id="hub-temporal-field-map" className="rounded-xl border border-white/[0.07] bg-black/28 p-3">
          <SectionTitle k="A2">Temporal field map (v0.1)</SectionTitle>
          <p className="mb-2 text-[9px] leading-relaxed text-white/40 normal-case">
            Replay fingerprint + temporal diff (küme ayrımı, sinyaller) aynı seq ekseninde. Anchor:{" "}
            <span className="font-mono text-white/55">temporal-field-map</span>.
          </p>
          <GenesisTemporalFieldMapV01 gatewayOrigin={gatewayOrigin} hubQueryContext={hubQueryContext} lastSeq={streamTel.lastSeq} />
        </section>

        <section id="hub-runtime-panel" className="rounded-xl border border-white/[0.07] bg-black/25 p-3">
          <SectionTitle k="B" explainAnchorId={SEMANTIC_ANCHOR.runtimeSurface}>
            Runtime snapshot
          </SectionTitle>
          <GenesisRuntimeObservationPanel gatewayOrigin={gatewayOrigin} onObservationState={onObs} />
          <div className="mt-3">
            <GenesisClientCapabilityPanel />
          </div>
        </section>

        <section id="hub-checkpoint-panel" className="rounded-xl border border-white/[0.07] bg-black/25 p-3">
          <SectionTitle k="C" explainAnchorId={SEMANTIC_ANCHOR.checkpointTools}>
            Checkpoint tools
          </SectionTitle>
          <GenesisTemporalQueryPlayground gatewayOrigin={gatewayOrigin} />
        </section>

        <section id="hub-epistemic-panel" className="rounded-xl border border-white/[0.07] bg-black/25 p-3">
          <SectionTitle k="D" explainAnchorId={SEMANTIC_ANCHOR.epistemicField}>
            Epistemic field (observatory)
          </SectionTitle>
          <p className="mb-2 text-[9px] leading-relaxed text-white/40 normal-case">
            S, containment ve tensör korelasyonu — yalnız okuma; yürütme yok.
          </p>
          <GenesisReplaySessionViewer gatewayOrigin={gatewayOrigin} />
        </section>

        <section id="hub-diagnostics-panel" className="rounded-xl border border-rose-500/15 bg-rose-950/10 p-3">
          <SectionTitle k="E" explainAnchorId={SEMANTIC_ANCHOR.diagnostics}>
            Contamination / diagnostics
          </SectionTitle>
          {issues.length === 0 ? (
            <p className="text-[9px] text-emerald-200/80 normal-case">Şu an toplanan sinyal yok (veya henüz yükleniyor).</p>
          ) : (
            <ul className="space-y-1.5 text-[9px] text-rose-100/90 normal-case">
              {issues.map((row) => (
                <li key={row.key} className="flex flex-wrap items-start gap-2">
                  <span className="min-w-0 flex-1">{row.text}</span>
                  <ExplainAcademyLink anchorId={row.anchorId} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[8px] text-white/35 normal-case">
            React üretim invariant (#185) gibi UI motoru hataları buraya kablo edilmedi; konsol + hata sınırı ayrı izlenir.
          </p>
        </section>
      </div>
    </div>
  );
}
