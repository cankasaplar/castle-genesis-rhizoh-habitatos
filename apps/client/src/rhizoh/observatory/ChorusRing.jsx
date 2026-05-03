import { memo, useMemo } from "react";

const ROLE_COLOR = {
  listener: "#22d3ee",
  mediator: "#c084fc",
  scout: "#fbbf24",
  counterweight: "#fb7185",
  default: "#94a3b8"
};

/**
 * @param {{ cx?: number, cy?: number, orbitR?: number, diagnostics?: Record<string, unknown> | null }} props
 */
const ChorusRing = memo(function ChorusRing({ cx = 120, cy = 120, orbitR = 72, diagnostics }) {
  const d = diagnostics && typeof diagnostics === "object" ? diagnostics : {};
  const threads = Array.isArray(d.cognitiveThreads) ? d.cognitiveThreads : [];
  const ch = d.chorus && typeof d.chorus === "object" ? d.chorus : {};
  const conflictNote = String(ch.conflictNote || "");
  const hasConflict = conflictNote.length > 0;
  const dominant = String(ch.dominantTheme || "");
  const domColor = dominant ? ROLE_COLOR[dominant] || ROLE_COLOR.default : ROLE_COLOR.default;

  const chorus = useMemo(() => {
    const active = threads.filter((t) => t && String(t.status || "") === "active");
    const pick = active.length ? active : threads;
    return pick.slice(0, 3);
  }, [threads]);

  const orbitStyle = {
    transformOrigin: `${cx}px ${cy}px`
  };

  const inner = (
    <>
      <circle
        cx={cx}
        cy={cy}
        r={orbitR + 5}
        fill="none"
        stroke={domColor}
        strokeWidth={0.9}
        strokeOpacity={dominant ? 0.32 : 0.12}
      />
      {chorus.map((th, i) => {
        const n = Math.max(chorus.length, 1);
        const ang = (i / n) * Math.PI * 2 + Math.PI / 4;
        const role = String(th.role || "listener");
        const fill = ROLE_COLOR[role] || ROLE_COLOR.default;
        const ox = cx + orbitR * Math.cos(ang);
        const oy = cy + orbitR * Math.sin(ang);
        return (
          <g key={String(th.id || i)}>
            <circle cx={ox} cy={oy} r={7} fill={fill} fillOpacity={0.88} />
            <circle cx={ox} cy={oy} r={11} fill="none" stroke={fill} strokeOpacity={0.38} strokeWidth={0.85} />
            {dominant && role === dominant ? (
              <circle cx={ox} cy={oy} r={14} fill="none" stroke={domColor} strokeOpacity={0.55} strokeWidth={0.6} />
            ) : null}
            <title>{`${role}${hasConflict ? " · chorus tension" : ""}`}</title>
          </g>
        );
      })}
    </>
  );

  return (
    <g className="l10-chorus-orbit" style={orbitStyle}>
      {hasConflict ? <g className="l10-morph-chorus-jitter">{inner}</g> : inner}
    </g>
  );
});

ChorusRing.displayName = "ChorusRing";
export default ChorusRing;
