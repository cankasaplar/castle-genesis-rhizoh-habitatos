import { memo, useMemo } from "react";

/**
 * Ring 2.5 — ghost ecology edges (affinity / rivalry / pollen / coalition braid).
 *
 * @param {{ cx?: number, cy?: number, orbitR?: number, diagnostics?: Record<string, unknown> | null }} props
 */
const GhostEcologyRing = memo(function GhostEcologyRing({ cx = 120, cy = 120, orbitR = 65, diagnostics }) {
  const d = diagnostics && typeof diagnostics === "object" ? diagnostics : {};
  const ge = d.ghostEcology && typeof d.ghostEcology === "object" ? d.ghostEcology : {};
  const threads = Array.isArray(d.cognitiveThreads) ? d.cognitiveThreads : [];

  const posById = useMemo(() => {
    const list = [...threads].filter((t) => t && t.id).sort((a, b) => Number(b.utilityAccumulator || 0) - Number(a.utilityAccumulator || 0));
    const n = Math.max(list.length, 1);
    const m = new Map();
    list.forEach((t, i) => {
      const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      m.set(String(t.id), {
        x: cx + orbitR * Math.cos(ang),
        y: cy + orbitR * Math.sin(ang)
      });
    });
    return m;
  }, [threads, cx, cy, orbitR]);

  const affinityEdges = Array.isArray(ge.affinityEdges) ? ge.affinityEdges : [];
  const rivalryEdges = Array.isArray(ge.rivalryEdges) ? ge.rivalryEdges : [];
  const pollenTransfers = Array.isArray(ge.pollenTransfers) ? ge.pollenTransfers : [];
  const coalitions = Array.isArray(ge.coalitions) ? ge.coalitions : [];

  const coalitionPaths = useMemo(() => {
    return coalitions.map((c) => {
      const ids = Array.isArray(c.members) ? c.members : [];
      const pts = ids
        .map((id) => posById.get(String(id)))
        .filter(Boolean)
        .map((p) => ({ ...p }));
      if (pts.length < 2) return null;
      pts.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
      const dStr = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      const closed = pts.length > 2 ? `${dStr} Z` : dStr;
      return { id: String(c.id || ""), d: closed };
    }).filter(Boolean);
  }, [coalitions, posById, cx, cy]);

  if (!threads.length) return null;

  return (
    <g aria-hidden className="l10-ghost-ecology-ring">
      {coalitionPaths.map((p) =>
        p ? (
          <path
            key={p.id}
            d={p.d}
            fill="none"
            stroke="rgb(250, 204, 21)"
            strokeWidth={1.25}
            strokeOpacity={0.55}
            strokeDasharray="5 3 2 3"
            strokeLinejoin="round"
          />
        ) : null
      )}
      {affinityEdges.map((e, i) => {
        const a = posById.get(String(e.from));
        const b = posById.get(String(e.to));
        if (!a || !b) return null;
        const op = 0.22 + (Number(e.w) || 0) * 0.62;
        return (
          <line
            key={`aff-${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="rgb(34, 197, 94)"
            strokeWidth={1.1}
            strokeOpacity={op}
          />
        );
      })}
      {rivalryEdges.map((e, i) => {
        const a = posById.get(String(e.from));
        const b = posById.get(String(e.to));
        if (!a || !b) return null;
        const op = 0.2 + (Number(e.w) || 0) * 0.55;
        return (
          <line
            key={`riv-${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="rgb(239, 68, 68)"
            strokeWidth={1.35}
            strokeDasharray="4 5"
            strokeOpacity={op}
          />
        );
      })}
      {pollenTransfers.slice(0, 14).map((pt, i) => {
        const a = posById.get(String(pt.from));
        const b = posById.get(String(pt.to));
        if (!a || !b) return null;
        const t1 = 0.38;
        const t2 = 0.72;
        const x1 = a.x + (b.x - a.x) * t1;
        const y1 = a.y + (b.y - a.y) * t1;
        const x2 = a.x + (b.x - a.x) * t2;
        const y2 = a.y + (b.y - a.y) * t2;
        const r = 1.4 + (Number(pt.strength) || 0) * 2.2;
        const op = 0.35 + (Number(pt.strength) || 0) * 0.55;
        return (
          <g key={`pol-${i}`}>
            <circle cx={x1} cy={y1} r={r} fill="rgb(250, 204, 21)" fillOpacity={op * 0.9} />
            <circle cx={x2} cy={y2} r={r * 0.85} fill="rgb(253, 224, 71)" fillOpacity={op * 0.75} />
          </g>
        );
      })}
    </g>
  );
});

GhostEcologyRing.displayName = "GhostEcologyRing";
export default GhostEcologyRing;
