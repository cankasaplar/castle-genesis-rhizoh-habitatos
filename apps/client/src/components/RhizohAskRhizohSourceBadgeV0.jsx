import React, { memo } from "react";
import { RHIZOH_TEACHER_SOURCE_V0 } from "../rhizoh/runtime/rhizohKnowledgeStoreV0.js";

function labelForSourceV0(source, tr) {
  const s = String(source || "");
  if (s === RHIZOH_TEACHER_SOURCE_V0.RHIZOH) return tr ? "Rhizoh" : "Rhizoh";
  if (s === RHIZOH_TEACHER_SOURCE_V0.GPT) return "GPT";
  if (s === RHIZOH_TEACHER_SOURCE_V0.CLAUDE) return "Claude";
  if (s === RHIZOH_TEACHER_SOURCE_V0.GEMINI) return "Gemini";
  if (s.startsWith("teacher_")) return s.replace("teacher_", "").toUpperCase();
  if (s === "local" || s === "local_command") return tr ? "Yerel" : "Local";
  return tr ? "Öğretmen" : "Teacher";
}

function colorForSourceV0(source) {
  const s = String(source || "");
  if (s === RHIZOH_TEACHER_SOURCE_V0.RHIZOH) return "#34d399";
  if (s.includes("claude")) return "#60a5fa";
  if (s.includes("gemini")) return "#c084fc";
  return "#fbbf24";
}

export const RhizohAskRhizohSourceBadgeV0 = memo(function RhizohAskRhizohSourceBadgeV0({
  source = "",
  uiLocale = "en",
  compact = false
}) {
  const tr = uiLocale === "tr";
  if (!source) return null;
  const label = labelForSourceV0(source, tr);
  const color = colorForSourceV0(source);
  const isRhizoh = source === RHIZOH_TEACHER_SOURCE_V0.RHIZOH;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-black uppercase tracking-wider ${
        compact ? "text-[8px]" : "text-[9px]"
      }`}
      style={{ borderColor: `${color}55`, color, background: `${color}12` }}
      data-ask-rhizoh-source={source}
      title={isRhizoh ? (tr ? "Yerel Rhizoh bilgisi" : "Local Rhizoh knowledge") : undefined}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {isRhizoh ? (tr ? "Ask Rhizoh" : "Ask Rhizoh") : label}
    </span>
  );
});
