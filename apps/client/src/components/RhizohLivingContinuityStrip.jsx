import React, { memo } from "react";

/**
 * @param {{
 *   persistence: {
 *     welcomeHeadline: string,
 *     welcomeSub: string,
 *     lastVisitLabel: string,
 *     yesterdayLine: string,
 *     yourSpaceLine: string,
 *     worldNowLine: string,
 *     castleContinuity: string,
 *     worldContinuity: string,
 *     returning: boolean
 *   } | null,
 *   worldInstanceId?: string | null,
 *   className?: string
 * }} props
 */
export const RhizohLivingContinuityStrip = memo(function RhizohLivingContinuityStrip({
  persistence,
  worldInstanceId,
  className = ""
}) {
  if (!persistence) {
    return (
      <div
        className={`mx-auto max-w-lg animate-pulse rounded-xl border border-white/10 bg-black/20 px-3 py-4 ${className}`}
        aria-busy="true"
      >
        <p className="font-mono text-[9px] text-white/40">Continuity yükleniyor…</p>
      </div>
    );
  }

  return (
    <section
      role="region"
      aria-label="Rhizoh continuity"
      className={`mx-auto max-w-lg rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/25 to-violet-950/20 px-3 py-3 ${className}`}
      data-rhizoh-continuity-strip="1"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-emerald-100/95">{persistence.welcomeHeadline}</h2>
        <span className="font-mono text-[9px] text-white/45">
          {persistence.returning ? `son ziyaret · ${persistence.lastVisitLabel}` : "ilk oturum"}
        </span>
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-white/65">{persistence.welcomeSub}</p>

      <dl className="mt-3 grid gap-2 text-[9px] leading-snug">
        <div className="rounded-lg border border-white/[0.06] bg-black/20 px-2 py-1.5">
          <dt className="font-semibold uppercase tracking-wide text-violet-300/70">Neden buradasın</dt>
          <dd className="mt-0.5 text-white/75">{persistence.yourSpaceLine}</dd>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-black/20 px-2 py-1.5">
          <dt className="font-semibold uppercase tracking-wide text-amber-200/60">Dün / son iz</dt>
          <dd className="mt-0.5 text-white/70">{persistence.yesterdayLine}</dd>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-black/20 px-2 py-1.5">
          <dt className="font-semibold uppercase tracking-wide text-cyan-200/60">Şu an dünya</dt>
          <dd className="mt-0.5 text-white/80">{persistence.worldNowLine}</dd>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[8px] text-white/45">
          <span>{persistence.castleContinuity}</span>
          <span>{persistence.worldContinuity}</span>
          {worldInstanceId ? <span>wi={worldInstanceId}</span> : null}
        </div>
      </dl>
    </section>
  );
});
