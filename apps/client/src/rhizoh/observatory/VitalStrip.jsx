import { memo } from "react";

/**
 * @param {{ diagnostics?: Record<string, unknown> | null }} props
 */
const VitalStrip = memo(function VitalStrip({ diagnostics }) {
  const d = diagnostics && typeof diagnostics === "object" ? diagnostics : {};
  const sp = d.field && typeof d.field === "object" ? d.field : {};
  const tsge = d.tsge && typeof d.tsge === "object" ? d.tsge : {};
  const presence = 0.65 + (Number(sp.stabilityScore) || 0) * 0.35;
  const stability = Number(sp.stabilityScore) || 0;
  const drift = Number(sp.driftScore) || 0;
  const resonance = 1 - Math.min(1, Number(tsge.attentionCurvatureVariance) || 0) * 2.2;
  const satP = Number(tsge.saturationPressure);
  const spawnPressure = Number.isFinite(satP)
    ? Math.min(1, Math.max(0, satP))
    : Math.min(1, (Number(tsge.saturationStreak) || 0) / 22);

  const bar = (label, v) => (
    <div className="flex items-center gap-1.5">
      <span className="w-20 shrink-0 text-[8px] text-white/50">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400/80 to-cyan-400/70"
          style={{ width: `${Math.round(Math.min(1, Math.max(0, v)) * 100)}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-emerald-400/25 bg-[#030806]/90 px-3 py-2">
      <div className="text-[8px] tracking-[0.3em] text-emerald-200/85 mb-1.5">VITAL STRIP</div>
      <div className="space-y-1">
        {bar("Presence", presence)}
        {bar("Stability", stability)}
        {bar("Drift", drift)}
        {bar("Resonance", resonance)}
        {bar("SpawnPressure", spawnPressure)}
      </div>
    </div>
  );
});

VitalStrip.displayName = "VitalStrip";
export default VitalStrip;
