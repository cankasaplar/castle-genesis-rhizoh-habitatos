import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCastleAuth } from "../firebase/useCastleAuth.js";
import { fetchAcademicObservatoryExportV0 } from "../rhizoh/academy/academicObservatoryClientV0.js";
import { AcademySurfaceNavV0 } from "./AcademySurfaceNavV0.jsx";

const MODES = /** @type {const} */ (["live", "paper", "export"]);

function panel(title, children) {
  return (
    <section className="rounded-xl border border-white/[0.08] bg-black/30 p-4">
      <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-teal-200/90">{title}</h2>
      {children}
    </section>
  );
}

/**
 * C-surface viewer — own conversation as research object (not admin debug).
 * @see docs/RHIZOH_ACADEMIC_OBSERVATORY_LAYER_V0.md
 */
export default function AcademicObservatoryPageV0() {
  const [params, setParams] = useSearchParams();
  const { user, authResolved, firebaseConfigured } = useCastleAuth();

  const threadId = params.get("thread_id") || "";
  const traceId = params.get("trace_id") || "";
  const modeParam = String(params.get("mode") || "live").toLowerCase();
  const mode = MODES.includes(/** @type {any} */ (modeParam)) ? modeParam : "live";

  const [draftThread, setDraftThread] = useState(threadId);
  const [draftTrace, setDraftTrace] = useState(traceId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(/** @type {Record<string, unknown> | null} */ (null));

  useEffect(() => {
    setDraftThread(threadId);
    setDraftTrace(traceId);
  }, [threadId, traceId]);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      if (!user) {
        setError("Giriş gerekli — yalnızca kendi thread'lerinizi gözlemleyebilirsiniz.");
        return;
      }
      const idToken = await user.getIdToken();
      const out = await fetchAcademicObservatoryExportV0({
        threadId: draftThread.trim() || undefined,
        traceId: draftTrace.trim() || undefined,
        mode: /** @type {"live"|"paper"|"export"} */ (mode),
        idToken
      });
      if (!out.ok) {
        const hint = out.hint ? ` (${out.hint})` : "";
        setError(`${out.error || "fetch_failed"}${hint}`);
        setPayload(null);
        return;
      }
      setPayload(out.body);
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("mode", mode);
        if (draftThread.trim()) next.set("thread_id", draftThread.trim());
        else next.delete("thread_id");
        if (draftTrace.trim()) next.set("trace_id", draftTrace.trim());
        else next.delete("trace_id");
        return next;
      });
    } catch (e) {
      setError(String(e?.message || e));
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [user, draftThread, draftTrace, mode, setParams]);

  const exp = payload?.export && typeof payload.export === "object" ? payload.export : null;
  const paper =
    payload?.paper_document && typeof payload.paper_document === "object" ? payload.paper_document : null;
  const turns = useMemo(() => {
    if (!exp?.life_continuity || typeof exp.life_continuity !== "object") return [];
    const sample = /** @type {Record<string, unknown>} */ (exp.life_continuity).turns_sample;
    return Array.isArray(sample) ? sample : [];
  }, [exp]);
  const nodes = useMemo(() => {
    if (!exp?.entity_graph || typeof exp.entity_graph !== "object") return [];
    const n = /** @type {Record<string, unknown>} */ (exp.entity_graph).nodes;
    return Array.isArray(n) ? n : [];
  }, [exp]);
  const edges = useMemo(() => {
    if (!exp?.entity_graph || typeof exp.entity_graph !== "object") return [];
    const e = /** @type {Record<string, unknown>} */ (exp.entity_graph).edges;
    return Array.isArray(e) ? e : [];
  }, [exp]);
  const resolverTrace =
    exp?.resolver_trace && typeof exp.resolver_trace === "object" ? exp.resolver_trace : null;

  const setMode = (m) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("mode", m);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#06080f] px-4 py-6 text-white">
      <div className="mx-auto max-w-3xl space-y-5">
        <AcademySurfaceNavV0 active="research" />

        <header className="rounded-xl border border-teal-400/25 bg-gradient-to-br from-teal-950/35 to-black/40 p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.28em] text-teal-200/90">
            Living research interface
          </p>
          <h1 className="mt-1 text-lg font-semibold text-white/95">Academy · Observation</h1>
          <p className="mt-2 max-w-xl text-[11px] leading-relaxed text-white/65 normal-case">
            Kendi konuşmanızı araştırma nesnesi olarak okuyun — turn akışı, yapısal graph ve deterministik paper
            görünümü. Başkalarının thread'lerine erişim yok (ops admin ayrı).
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-wide ${
                mode === m
                  ? "bg-teal-500/30 text-teal-50 ring-1 ring-teal-400/40"
                  : "border border-white/15 text-white/50 hover:text-white/80"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="grid gap-3 rounded-xl border border-white/[0.08] bg-black/25 p-4 sm:grid-cols-2">
          <label className="block text-[10px] text-white/55 normal-case">
            thread_id
            <input
              value={draftThread}
              onChange={(e) => setDraftThread(e.target.value)}
              placeholder="thr_…"
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 font-mono text-[11px] text-white/90"
            />
          </label>
          <label className="block text-[10px] text-white/55 normal-case">
            trace_id (opsiyonel)
            <input
              value={draftTrace}
              onChange={(e) => setDraftTrace(e.target.value)}
              placeholder="trace_…"
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 font-mono text-[11px] text-white/90"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loading || !firebaseConfigured}
            onClick={() => void load()}
            className="rounded-lg bg-teal-600/80 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-teal-500/90 disabled:opacity-40"
          >
            {loading ? "Yükleniyor…" : "Gözlemi yükle"}
          </button>
          {!user && authResolved ? (
            <span className="text-[10px] text-amber-200/80 normal-case">Firebase girişi gerekli</span>
          ) : null}
          {user ? (
            <span className="font-mono text-[9px] text-white/35">uid:{user.uid.slice(0, 12)}…</span>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-lg border border-red-400/30 bg-red-950/30 px-3 py-2 text-[11px] text-red-100/90 normal-case">
            {error}
            {error.includes("observatory_disabled") ? (
              <span className="mt-1 block text-white/50">
                Gateway: <code className="text-white/70">CASTLE_ACADEMIC_OBSERVATORY=1</code>
              </span>
            ) : null}
          </p>
        ) : null}

        {mode === "export" && payload ? (
          panel(
            "Raw export",
            <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-white/75">
              {JSON.stringify(payload.export, null, 2)}
            </pre>
          )
        ) : null}

        {mode !== "export" && exp ? (
          <div className="space-y-4">
            {panel(
              "1 · Observed conversation",
              turns.length ? (
                <ul className="space-y-2">
                  {[...turns].reverse().map((t) => (
                    <li
                      key={String(t.turn_id)}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                    >
                      <div className="flex flex-wrap gap-2 font-mono text-[9px] text-white/40">
                        <span>{String(t.role)}</span>
                        <span>{String(t.turn_id)}</span>
                        <span>{String(t.at || "")}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-white/80 normal-case whitespace-pre-wrap">
                        {String(t.text || "")}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-white/50 normal-case">
                  Turn örneği yok — thread_id verin veya önce sohbet turu oluşturun (L1 append açık olmalı).
                </p>
              )
            )}

            {panel(
              "2 · Structural analysis (L2-lite)",
              <div className="space-y-3 text-[11px] text-white/75 normal-case">
                <p>
                  <span className="text-white/45">Nodes:</span> {nodes.length} ·{" "}
                  <span className="text-white/45">Edges:</span> {edges.length}
                </p>
                {resolverTrace ? (
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-white/40">Resolver</p>
                    <pre className="mt-1 overflow-auto rounded-lg bg-black/40 p-2 font-mono text-[10px]">
                      {JSON.stringify(resolverTrace, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-white/45">Resolver trace yok.</p>
                )}
                {nodes.length ? (
                  <ul className="space-y-1 font-mono text-[10px]">
                    {nodes.map((n) => (
                      <li key={String(n.entity_id)}>
                        {String(n.entity_kind)} · {String(n.entity_id)} · {String(n.label)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}

            {(mode === "paper" || mode === "live") && paper ? (
              panel(
                "3 · Paper view",
                <div className="space-y-3 text-[11px] leading-relaxed text-white/80 normal-case">
                  <h3 className="text-sm font-semibold text-white/95">{String(paper.title)}</h3>
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-white/40">Abstract</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {(paper.abstract || []).map((line, i) => (
                        <li key={i}>{String(line)}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-white/40">Findings</p>
                    <ul className="mt-1 space-y-2">
                      {(paper.observations || []).map((o, i) => (
                        <li key={i} className="rounded border border-white/[0.06] px-2 py-1">
                          <span className="font-mono text-[9px] text-teal-200/80">{String(o.kind)}</span>
                          {o.turn_id ? (
                            <span className="ml-2 font-mono text-[9px] text-white/35">{String(o.turn_id)}</span>
                          ) : null}
                          <p className="mt-0.5">{String(o.detail)}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-white/40">Citations</p>
                    <ul className="mt-1 space-y-1 font-mono text-[10px]">
                      {(paper.turn_citations || []).map((c) => (
                        <li key={String(c.turn_id)}>
                          [{String(c.role)}] {String(c.turn_id)} — {String(c.excerpt)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {payload?.paper_markdown ? (
                    <details className="rounded-lg border border-white/10 bg-black/30 p-2">
                      <summary className="cursor-pointer text-[9px] uppercase tracking-wide text-white/50">
                        Markdown export
                      </summary>
                      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[10px] text-white/65">
                        {String(payload.paper_markdown)}
                      </pre>
                    </details>
                  ) : null}
                </div>
              )
            ) : null}
          </div>
        ) : null}

        {!payload && !loading && !error ? (
          <p className="text-center text-[11px] text-white/40 normal-case">
            Sohbetten sonra gateway yanıtındaki{" "}
            <code className="text-white/60">lifeContinuity.thread_id</code> ile yükleyin.{" "}
            <Link to="/" className="text-teal-300/90 underline">
              Rhizoh shell
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
