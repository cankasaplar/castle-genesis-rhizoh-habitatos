import React, { memo } from "react";

/**
 * Read-only collective observation surface — no actions, no execution.
 *
 * @param {{
 *   pulse: {
 *     lines: string[],
 *     disclaimer: string,
 *     metrics: { collectiveMemoryPulse: string }
 *   } | null,
 *   className?: string
 * }} props
 */
export const RhizohCollectivePulsePanel = memo(function RhizohCollectivePulsePanel({
  pulse,
  className = ""
}) {
  if (!pulse) return null;

  return (
    <aside
      role="complementary"
      aria-label="Kolektif gözlem özeti"
      className={`mx-auto max-w-lg rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 ${className}`}
      data-rhizoh-collective-pulse="1"
      data-readonly="1"
    >
      <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/40">
        Collective pulse · read-only
      </p>
      <ul className="mt-2 space-y-1">
        {pulse.lines.map((line) => (
          <li key={line} className="text-[10px] leading-snug text-white/72">
            {line}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[8px] leading-snug text-white/38">{pulse.disclaimer}</p>
    </aside>
  );
});
