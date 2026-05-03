import { memo } from "react";
import TSGERing from "./TSGERing.jsx";
import ProtoEmbryoRing from "./ProtoEmbryoRing.jsx";
import GhostEcologyRing from "./GhostEcologyRing.jsx";
import ChorusRing from "./ChorusRing.jsx";
import EmbodimentCourtRing from "./EmbodimentCourtRing.jsx";

/**
 * @param {{ diagnostics?: Record<string, unknown> | null }} props
 */
const GreenroomOrbit = memo(function GreenroomOrbit({ diagnostics }) {
  return (
    <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-2">
      <div className="text-[8px] tracking-[0.28em] text-cyan-200/80 mb-1 px-1">GREENROOM ORBIT</div>
      <svg
        viewBox="0 0 240 240"
        className="l10-svg l10-morph-orbit mx-auto block h-auto w-full max-w-[280px]"
        aria-hidden
      >
        <TSGERing diagnostics={diagnostics} />
        <ProtoEmbryoRing diagnostics={diagnostics} />
        <ChorusRing diagnostics={diagnostics} />
        <EmbodimentCourtRing diagnostics={diagnostics} />
      </svg>
      <div className="mt-1 px-1 text-[8px] text-white/40 normal-case">
        Ghost ecology v1 (ring 2.5) + slow truth / morph — affinity · rivalry · pollen · coalition braid.
      </div>
    </div>
  );
});

GreenroomOrbit.displayName = "GreenroomOrbit";
export default GreenroomOrbit;
