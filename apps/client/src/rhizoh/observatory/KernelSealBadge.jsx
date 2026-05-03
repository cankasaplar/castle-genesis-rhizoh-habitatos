import { memo } from "react";

const KernelSealBadge = memo(function KernelSealBadge({ kernelSeal }) {
  const ks = kernelSeal && typeof kernelSeal === "object" ? kernelSeal : null;
  if (!ks?.version) return null;
  return (
    <div className="rounded-lg border border-amber-400/30 bg-amber-950/40 px-2 py-1.5">
      <div className="text-[8px] tracking-[0.25em] text-amber-200/90">KERNEL SEAL</div>
      <div className="mt-0.5 flex flex-wrap gap-1 text-[9px] text-amber-100/85 normal-case">
        <span className="rounded bg-black/30 px-1.5 py-0.5 font-mono">v{ks.version}</span>
        <span className="text-white/50 truncate">{String(ks.sealedAt || "").slice(0, 10)}</span>
      </div>
    </div>
  );
});

KernelSealBadge.displayName = "KernelSealBadge";
export default KernelSealBadge;
