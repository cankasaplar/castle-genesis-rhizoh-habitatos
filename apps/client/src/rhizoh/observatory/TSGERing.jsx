import { memo } from "react";

/**
 * Morphology: radius / stroke / wobble / glow via CSS vars (.l10-morph-root), rAF-interpolated.
 *
 * @param {{ cx?: number, cy?: number, diagnostics?: Record<string, unknown> | null }} props
 */
const TSGERing = memo(function TSGERing({ cx = 120, cy = 120, diagnostics }) {
  const d = diagnostics && typeof diagnostics === "object" ? diagnostics : {};
  const t = d.tsge && typeof d.tsge === "object" ? d.tsge : {};
  const streak = Number(t.saturationStreak) || 0;

  const wobbleStyle = {
    transformOrigin: `${cx}px ${cy}px`
  };

  return (
    <g>
      <g className="l10-morph-tsge-wobble" style={wobbleStyle}>
        <circle className="l10-tsge-ring-glow" cx={cx} cy={cy} />
      </g>
      <circle
        className="l10-tsge-ring-main"
        cx={cx}
        cy={cy}
        fill="none"
        stroke="rgb(52, 211, 153)"
        strokeWidth={1.08}
        strokeDasharray="3 7"
      />
      {streak > 3 ? (
        <circle
          className="l10-tsge-sat-ring"
          cx={cx}
          cy={cy}
          fill="none"
          stroke="rgb(244, 114, 182)"
          strokeWidth={1.15}
          strokeOpacity={0.42}
        />
      ) : null}
    </g>
  );
});

TSGERing.displayName = "TSGERing";
export default TSGERing;
