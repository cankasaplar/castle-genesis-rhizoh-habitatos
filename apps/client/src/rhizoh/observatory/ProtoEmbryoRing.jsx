import { memo, useMemo } from "react";

function protoOpacity(p, now) {
  const ttl = Number(p.decayTTL) || 180_000;
  const lived = Math.max(0, now - Number(p.createdAt || 0));
  return Math.max(0.12, Math.min(1, 1 - lived / Math.max(1, ttl)));
}

/**
 * Slow orbit geometry from diagnostics; scale + tether sway from morphology CSS vars (rAF).
 *
 * @param {{ cx?: number, cy?: number, orbitR?: number, diagnostics?: Record<string, unknown> | null }} props
 */
const ProtoEmbryoRing = memo(function ProtoEmbryoRing({ cx = 120, cy = 120, orbitR = 58, diagnostics }) {
  const d = diagnostics && typeof diagnostics === "object" ? diagnostics : {};
  const protos = Array.isArray(d.protoAgents) ? d.protoAgents : [];

  const nodes = useMemo(() => {
    const now = Date.now();
    const n = protos.length;
    return protos.map((p, i) => {
      const ang = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
      const m = Math.min(1, Math.max(0, Number(p.mitosisConfidence) || 0));
      const kappa = Number(p.tetherKappa);
      const kappaN = Number.isFinite(kappa) ? kappa : 0.08;
      const tetherProduct = Math.min(1, kappaN * 12 * (1 - m));
      const radial = orbitR * (0.34 + 0.66 * (0.2 + 0.8 * tetherProduct));
      const scale = 0.35 + m * 0.85;
      const op = protoOpacity(p, now);
      const tx = cx + radial * Math.cos(ang);
      const ty = cy + radial * Math.sin(ang);
      const baseR = 5 * scale;
      return { p, tx, ty, key: String(p.id || i), idx: i, baseR, op, lineOp: 0.18 + tetherProduct * 0.42 };
    });
  }, [protos, cx, cy, orbitR]);

  return (
    <g>
      {nodes.map(({ p, tx, ty, key, idx, baseR, op, lineOp }) => (
        <g key={key}>
          <line
            x1={cx}
            y1={cy}
            x2={tx}
            y2={ty}
            stroke="rgb(167, 139, 250)"
            strokeWidth={0.55 + (1 - Math.min(1, Number(p.mitosisConfidence) || 0)) * 1.65}
            strokeOpacity={lineOp}
          />
          <g
            className="l10-morph-proto-sway"
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              "--l10-proto-sway-deg": `var(--l10-proto-${idx}-sway-deg, 0deg)`,
              "--l10-proto-sway-period": `var(--l10-proto-${idx}-sway-period, 5s)`
            }}
          >
            <g transform={`translate(${tx} ${ty})`}>
              <g style={{ transform: `scale(var(--l10-proto-${idx}-scale, 1))` }}>
                <circle cx={0} cy={0} r={baseR} fill="rgb(192, 132, 252)" fillOpacity={op} />
              </g>
            </g>
          </g>
          <title>{`${String(p.semanticRoleHint || "proto")} · m=${(Number(p.mitosisConfidence) || 0).toFixed(2)}`}</title>
        </g>
      ))}
    </g>
  );
});

ProtoEmbryoRing.displayName = "ProtoEmbryoRing";
export default ProtoEmbryoRing;
