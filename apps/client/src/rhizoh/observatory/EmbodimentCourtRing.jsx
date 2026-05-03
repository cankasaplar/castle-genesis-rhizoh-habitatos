import { memo, useId, useMemo } from "react";

/** @param {string} route */
function routeAura(route) {
  const r = String(route || "");
  if (r === "candidate_embodiment") return { stroke: "rgb(217, 70, 239)", glow: "rgba(217, 70, 239, 0.45)" };
  if (r === "hibernate") return { stroke: "rgb(129, 140, 248)", glow: "rgba(99, 102, 241, 0.35)" };
  return { stroke: "rgb(148, 163, 184)", glow: "rgba(148, 163, 184, 0.28)" };
}

/**
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {number} score01
 */
function scoreArcD(cx, cy, r, score01) {
  const s = Math.max(0, Math.min(1, score01));
  if (s < 0.003) return "";
  const start = -Math.PI / 2;
  const end = start + s * 2 * Math.PI;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const largeArc = s > 0.5 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

/**
 * @param {{ cx?: number, cy?: number, orbitR?: number, diagnostics?: Record<string, unknown> | null }} props
 */
const EmbodimentCourtRing = memo(function EmbodimentCourtRing({ cx = 120, cy = 120, orbitR = 38, diagnostics }) {
  const ghostId = useId().replace(/:/g, "");
  const d = diagnostics && typeof diagnostics === "object" ? diagnostics : {};
  const courtRaw = Array.isArray(d.embodimentCourt) ? d.embodimentCourt : [];
  const fallback = Array.isArray(d.embodimentCandidates) ? d.embodimentCandidates : [];
  const court = courtRaw.length ? courtRaw : fallback;

  const nodes = useMemo(() => {
    const n = Math.max(court.length, 1);
    return court.map((th, i) => {
      const ang = (i / n) * Math.PI * 2 - Math.PI / 3;
      const x = cx + orbitR * Math.cos(ang);
      const y = cy + orbitR * Math.sin(ang);
      const g = th.lastEmbodimentGate && typeof th.lastEmbodimentGate === "object" ? th.lastEmbodimentGate : {};
      const seals = g.seals && typeof g.seals === "object" ? g.seals : {};
      const score = Number(g.score) || 0;
      const route = String(g.route || "");
      const aura = routeAura(route);
      const arc = scoreArcD(x, y, 20, score);
      return { th, x, y, seals, score, route, aura, arc, key: String(th.id || i), idx: i };
    });
  }, [court, cx, cy, orbitR]);

  const fid = `l10Ghost-${ghostId}`;
  return (
    <g>
      <defs>
        <filter id={fid} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {!court.length ? (
        <text x={cx - 48} y={cy + orbitR + 14} fill="rgba(148,163,184,0.45)" fontSize="9">
          court idle — no gate snapshot
        </text>
      ) : null}
      {nodes.map(({ th, x, y, seals, score, route, aura, arc, key, idx }) => (
        <g key={key} filter={`url(#${fid})`}>
          <circle
            cx={x}
            cy={y}
            r={16}
            fill="none"
            stroke={aura.stroke}
            strokeWidth={2}
            strokeOpacity={0.28}
          />
          <circle cx={x} cy={y} r={14} fill="rgba(148, 163, 184, 0.07)" stroke="rgba(148, 163, 184, 0.42)" strokeWidth={0.75} />
          {arc ? (
            <path
              className="l10-court-arc"
              d={arc}
              fill="none"
              stroke={aura.stroke}
              strokeWidth={1.85}
              strokeLinecap="round"
              style={{
                ["--l10-court-slot-score"]: `var(--l10-court-${idx}-score, 0)`
              }}
            />
          ) : null}
          <circle
            cx={x}
            cy={y}
            r={22}
            fill="none"
            stroke={aura.stroke}
            strokeWidth={0.75}
            strokeOpacity={0.22}
          />
          <text x={x - 14} y={y + 20} fill="rgb(167, 243, 208)" fontSize="8.5" opacity={0.88}>
            {seals.capability ? "c✓" : "c·"}
            {seals.field ? " f✓" : " f·"}
            {seals.authority ? " a✓" : " ⧖"}
          </text>
          <text x={x - 18} y={y - 22} fill={aura.stroke} fontSize="7.5" opacity={0.75}>
            {route.replace(/_/g, " ").slice(0, 22)}
          </text>
          <title>{`${String(th.missionSummary || "").slice(0, 120)} · ${route} · ${score.toFixed(2)}`}</title>
        </g>
      ))}
    </g>
  );
});

EmbodimentCourtRing.displayName = "EmbodimentCourtRing";
export default EmbodimentCourtRing;
