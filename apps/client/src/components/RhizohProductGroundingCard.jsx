import React, { memo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * @param {{
 *   grounding: {
 *     lead: string,
 *     whyDifferent: string[],
 *     whatRhizohIs: string,
 *     notThis: string,
 *     localeHint?: string | null
 *   } | null,
 *   className?: string
 * }} props
 */
export const RhizohProductGroundingCard = memo(function RhizohProductGroundingCard({
  grounding,
  className = ""
}) {
  const [open, setOpen] = useState(false);
  if (!grounding) return null;

  return (
    <section
      className={`mx-auto max-w-lg rounded-xl border border-violet-400/15 bg-black/30 px-3 py-2.5 ${className}`}
      aria-label="Rhizoh ürün hissi"
    >
      <p className="text-[11px] leading-relaxed text-violet-100/90">{grounding.lead}</p>
      <p className="mt-1 text-[9px] italic text-white/40">{grounding.notThis}</p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-violet-300/80 hover:text-violet-200"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? "Kapat" : "Rhizoh neden farklı hissettiriyor?"}
      </button>
      {open ? (
        <ul className="mt-2 space-y-1.5 border-t border-white/10 pt-2 text-[9px] text-white/70">
          {grounding.whyDifferent.map((line) => (
            <li key={line.slice(0, 24)}>{line}</li>
          ))}
          <li className="text-white/85">{grounding.whatRhizohIs}</li>
          {grounding.localeHint ? (
            <li className="font-mono text-[8px] text-white/45">{grounding.localeHint}</li>
          ) : null}
        </ul>
      ) : null}
    </section>
  );
});
