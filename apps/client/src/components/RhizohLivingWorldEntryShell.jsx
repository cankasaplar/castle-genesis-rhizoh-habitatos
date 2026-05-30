import React, { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Eye, Castle, PlusCircle } from "lucide-react";

/**
 * @typedef {{
 *   hero?: boolean,
 *   ftue?: boolean,
 *   actionClosure?: boolean,
 *   continuity?: boolean,
 *   worldState?: boolean,
 *   actions?: boolean,
 *   technicalMeta?: boolean
 * }} RhizohCopyVisibilityV0
 */

const ALL_COPY_VISIBLE = Object.freeze({
  hero: true,
  ftue: true,
  actionClosure: true,
  continuity: true,
  worldState: true,
  actions: true,
  technicalMeta: true
});

/**
 * @param {RhizohCopyVisibilityV0 | undefined} vis
 * @param {keyof RhizohCopyVisibilityV0} key
 */
function copyVisible(vis, key) {
  if (!vis) return true;
  if (vis[key] === undefined) return true;
  return !!vis[key];
}

/**
 * Canonical Rhizoh entry shell — three fixed zones (orchestrator output only).
 *
 * RCML UI membrane — RCML_FREEZE_CONTRACT_V1.0: no rhizoh/experience imports; model prop only.
 *
 * @param {{
 *   model: {
 *     continuityStrip: object,
 *     worldState: object,
 *     actionSurface: object,
 *     humanLayer?: object,
 *     returning?: boolean
 *   } | null,
 *   onObserve?: () => void,
 *   onEnterCastle?: () => void,
 *   copyVisibility?: RhizohCopyVisibilityV0,
 *   overlayMode?: boolean
 * }} props
 */
export const RhizohLivingWorldEntryShell = memo(function RhizohLivingWorldEntryShell({
  model,
  onObserve,
  onEnterCastle,
  copyVisibility,
  overlayMode = false
}) {
  const vis = copyVisibility ?? ALL_COPY_VISIBLE;
  const showMeta = copyVisible(vis, "technicalMeta") && (model?.humanLayer?.showTechnicalMeta ?? model?.returning);

  const scrollToCastle = useCallback(() => {
    onEnterCastle?.();
    const el = document.getElementById("rhizoh-castle-presence");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [onEnterCastle]);

  const handleObserve = useCallback(() => {
    onObserve?.();
  }, [onObserve]);

  if (!model) {
    return (
      <div className={`mx-auto animate-pulse space-y-4 px-1 py-8 ${overlayMode ? "max-w-md" : "max-w-lg"}`}>
        <div className="h-24 rounded-xl bg-white/5" />
        <div className="h-32 rounded-xl bg-white/5" />
        <div className="h-16 rounded-xl bg-white/5" />
      </div>
    );
  }

  const { continuityStrip: c, worldState: w, actionSurface: a, humanLayer: h } = model;
  const labels = h?.uiLabels ?? {};

  const rootClass = overlayMode
    ? "mx-auto max-w-md space-y-4 text-[11px]"
    : "mx-auto max-w-lg space-y-5";

  return (
    <div className={rootClass} data-rhizoh-living-entry-shell="1">
      {copyVisible(vis, "hero") ? (
      <header className="px-1">
        <h1 className="text-xl font-semibold tracking-tight text-white">Rhizoh</h1>
        {h?.persona?.greeting ? (
          <p className="mt-2 text-[12px] leading-relaxed text-violet-100/85">{h.persona.greeting}</p>
        ) : null}
        {h?.mentalModel?.oneLiner ? (
          <p className="mt-2 text-[11px] text-white/70 border-l-2 border-violet-400/35 pl-3">
            {h.mentalModel.oneLiner}
          </p>
        ) : null}
        {h?.persona?.openingScene && !model.returning ? (
          <p className="mt-1 text-[10px] italic text-white/45">{h.persona.openingScene}</p>
        ) : null}
      </header>
      ) : null}

      {copyVisible(vis, "ftue") && h?.ftue?.active && h.ftue.beats?.length ? (
        <section
          role="region"
          aria-label="First steps"
          className="rounded-2xl border border-violet-500/30 bg-violet-950/25 px-4 py-4"
          data-zone="ftue-story"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-violet-200/70">
            {h.ftue.headline}
          </p>
          {h.ftue.guidanceLine ? (
            <p className="mt-1 text-[11px] text-white/60">{h.ftue.guidanceLine}</p>
          ) : null}
          <ol className="mt-3 space-y-2">
            {h.ftue.beats.map((beat) => (
              <li key={beat.step} className="flex gap-2 text-[11px] leading-relaxed">
                <span className="shrink-0 font-mono text-[9px] text-violet-300/80">{beat.step}</span>
                <div>
                  <span className="font-semibold text-violet-100/90">{beat.title} · </span>
                  <span className="text-white/75">{beat.line}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {copyVisible(vis, "actionClosure") && h?.actionLoopClosure ? (
        <section
          role="status"
          className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 px-4 py-3"
          data-zone="action-loop-closure"
          data-rhizoh-mutation-toast="1"
        >
          <p className="text-[9px] uppercase tracking-[0.12em] text-cyan-200/70">Az önce</p>
          <dl className="mt-2 space-y-1.5 text-[11px]">
            <div>
              <dt className="inline font-semibold text-cyan-100/90">Ne yaptın · </dt>
              <dd className="inline text-white/80">{h.actionLoopClosure.did}</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-cyan-100/90">Ne değişti · </dt>
              <dd className="inline text-white/80">{h.actionLoopClosure.changed}</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-cyan-100/90">Ne oldu · </dt>
              <dd className="inline text-white/75">{h.actionLoopClosure.happened}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {copyVisible(vis, "continuity") ? (
      <section
        role="region"
        aria-label="Continuity"
        className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/30 to-violet-950/20 px-4 py-4"
        data-zone="continuity-strip"
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-emerald-300/60">
          {labels.continuity || "Süreklilik"}
        </p>
        {model.returning ? (
          <p className="mt-1 text-sm font-medium text-emerald-100">Geri geldin</p>
        ) : (
          <p className="mt-1 text-sm font-medium text-violet-100">İlk nefes</p>
        )}
        {c.memoryEcho ? (
          <p className="mt-2 text-[11px] italic text-white/55">{c.memoryEcho}</p>
        ) : null}
        {c.mutationEcho && model.returning ? (
          <p className="mt-1 text-[10px] text-cyan-200/75">{c.mutationEcho}</p>
        ) : null}
        {c.crossSessionEcho && model.returning ? (
          <p className="mt-1 text-[10px] text-emerald-200/70">{c.crossSessionEcho}</p>
        ) : null}

        <ol className="mt-4 space-y-3 text-[11px] leading-relaxed">
          <li>
            <span className="font-semibold text-amber-200/70">Dün · </span>
            <span className="text-white/75">{c.yesterday}</span>
          </li>
          <li>
            <span className="font-semibold text-cyan-200/70">Bugün · </span>
            <span className="text-white/80">{c.todayChanged}</span>
          </li>
          <li>
            <span className="font-semibold text-violet-200/70">Neden buradasın · </span>
            <span className="text-white/85">{c.whyHere}</span>
          </li>
        </ol>
      </section>
      ) : null}

      {copyVisible(vis, "worldState") ? (
      <section
        role="region"
        aria-label="World state"
        className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4"
        data-zone="world-state"
        data-readonly="1"
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/40">
          {labels.worldState || "Dünya"}
        </p>

        <blockquote className="mt-3 border-l-2 border-violet-400/40 pl-3 text-[12px] leading-relaxed text-violet-100/90">
          {w.collectiveFeeling.primary}
          {w.collectiveFeeling.secondary ? (
            <span className="mt-1 block text-[11px] text-white/55">{w.collectiveFeeling.secondary}</span>
          ) : null}
        </blockquote>

        <div
          id="rhizoh-castle-presence"
          className="relative mt-4 flex h-28 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-950/25 transition-all duration-700"
          data-rhizoh-atmosphere-castle-surface="1"
          style={{
            opacity: w.castlePresence.ready ? 1 : 0.7,
            boxShadow: `0 0 ${20 + Math.round(w.castlePresence.pulse01 * 36)}px rgba(139,92,246,${0.1 + (w.castlePresence.mutationBias === "shifted_warm" ? 0.08 : 0)})`
          }}
        >
          <div className="text-center px-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-violet-200/60">
              {labels.castlePresence || "Castle"}
            </p>
            <p className="mt-1 text-[11px] text-white/80">{w.castlePresence.label}</p>
            {a.enterCastle?.meaning ? (
              <p className="mt-1 text-[9px] text-white/45">{a.enterCastle.meaning}</p>
            ) : null}
          </div>
        </div>

        {showMeta ? (
          <dl className="mt-3 grid gap-1 font-mono text-[9px] text-white/45">
            <div className="flex justify-between gap-2">
              <dt>world_instance</dt>
              <dd className="text-violet-200/80">{w.worldInstance.instanceId}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>ritim</dt>
              <dd>
                {w.worldInstance.timeZone} · {w.worldInstance.locale}
              </dd>
            </div>
            {w.worldInstance.weight ? (
              <div className="flex justify-between gap-2">
                <dt>instance</dt>
                <dd className="text-cyan-200/70">{w.worldInstance.weight}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="mt-3 text-[10px] text-white/40">
            {w.worldInstance.timeZone} · {h?.persona?.timeOfDay || "—"}
          </p>
        )}
      </section>
      ) : (
        <div
          id="rhizoh-castle-presence"
          className="sr-only"
          data-rhizoh-atmosphere-castle-surface="1"
          aria-hidden
        />
      )}

      {copyVisible(vis, "actions") ? (
      <section
        role="navigation"
        aria-label="Actions"
        className="rounded-2xl border border-white/10 bg-black/40 px-3 py-3"
        data-zone="action-surface"
      >
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white/40">
          {labels.actions || "Ne yapmak istersin?"}
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Link
            to={a.observe.href}
            onClick={handleObserve}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-3 py-3 text-center transition hover:border-cyan-400/50"
          >
            <Eye className="h-5 w-5 text-cyan-300/90" />
            <span className="text-[11px] font-semibold text-white">{a.observe.label}</span>
            <span className="text-[8px] text-white/45">{a.observe.hint}</span>
          </Link>

          <button
            type="button"
            onClick={scrollToCastle}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-violet-500/35 bg-violet-950/30 px-3 py-3 text-center transition hover:border-violet-400/55"
          >
            <Castle className="h-5 w-5 text-violet-300/90" />
            <span className="text-[11px] font-semibold text-white">{a.enterCastle.label}</span>
            <span className="text-[8px] text-white/45">{a.enterCastle.hint}</span>
          </button>

          <button
            type="button"
            disabled={a.createCastle.disabled}
            title={a.createCastle.hint}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center opacity-50 cursor-not-allowed"
          >
            <PlusCircle className="h-5 w-5 text-white/40" />
            <span className="text-[11px] font-semibold text-white/60">{a.createCastle.label}</span>
            <span className="text-[8px] text-white/35">yakında</span>
          </button>
        </div>
      </section>
      ) : null}
    </div>
  );
});
