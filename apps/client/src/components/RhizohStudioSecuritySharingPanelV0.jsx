import React, { memo, useMemo } from "react";
import { STUDIO_ASSET_MANIFEST_V1 } from "../studio/assetRegistryV1.js";
import { evaluateControlPlaneHealthV0 } from "../rhizoh/runtime/rhizohControlPlaneV0.js";
import { RHIZOH_DOMAIN_ID_V0 } from "../rhizoh/runtime/rhizohDomainGateV0.js";

/**
 * Studio drawer — open-source sharing boundary + export security scaffold (no auto-export).
 */
export const RhizohStudioSecuritySharingPanelV0 = memo(function RhizohStudioSecuritySharingPanelV0({
  uiLocale = "en",
  gatewayOrigin = ""
}) {
  const tr = uiLocale === "tr";
  const health = useMemo(() => evaluateControlPlaneHealthV0(RHIZOH_DOMAIN_ID_V0.STUDIO), []);
  const exportBlocked = health?.downgrade?.exportDisabled === true;

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-violet-400/25 bg-violet-950/20 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-200/90">
        {tr ? "Güvenlik · Açık kaynak sınırı" : "Security · Open-source boundary"}
      </p>
      <p className="text-[10px] leading-relaxed text-white/55 normal-case">
        {tr
          ? "Paylaşım kullanıcı onayı ile. Otomatik özet veya dışa aktarma yok. Açık kaynak paketleri yalnızca manifest + lisans etiketi ile."
          : "Sharing is user-initiated. No auto-summary or silent export. Open-source packs are manifest + license tags only."}
      </p>

      <div className="grid grid-cols-2 gap-2 text-[9px]">
        <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5">
          <p className="text-white/40">{tr ? "Kontrol düzlemi" : "Control plane"}</p>
          <p className="font-semibold text-emerald-200/90">{health?.status || "—"}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5">
          <p className="text-white/40">{tr ? "Dışa aktarma" : "Export"}</p>
          <p className={`font-semibold ${exportBlocked ? "text-amber-200" : "text-cyan-200"}`}>
            {exportBlocked
              ? tr
                ? "Kısıtlı (degraded)"
                : "Restricted (degraded)"
              : tr
                ? "Manuel izinli"
                : "Manual only"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-white/8 bg-black/25 px-2 py-2">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-white/45">
          {tr ? "3B varlık manifesti" : "3D asset manifest"}
        </p>
        <ul className="mt-1 space-y-0.5 text-[9px] text-white/55">
          {STUDIO_ASSET_MANIFEST_V1.map((row) => (
            <li key={row.key}>
              {row.role} · <span className="text-violet-200/80">{row.layer}</span> · {row.url}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[9px] italic text-white/35">
          {tr
            ? "Octo + Fox (sahne) · Medusa (ambient) — lisanslar sonra bağlanacak."
            : "Octo + Fox (stage) · Medusa (ambient) — licenses wired later."}
        </p>
      </div>

      <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 px-2 py-2 text-[9px] text-white/55">
        <p className="font-semibold text-cyan-100/90">
          {tr ? "Stüdyo çıktı paketi" : "Studio output pack"}
        </p>
        <p className="mt-1">
          {tr ? "Kalıcılık:" : "Persistence:"} memory_only · gateway:{" "}
          {gatewayOrigin ? gatewayOrigin.slice(0, 32) : tr ? "yerel" : "local"}
        </p>
        <p className="mt-1 text-white/40">
          {tr
            ? "Çıktı paketi şimdilik bellek içi — FER-1 vault ile birleştirilecek."
            : "Output pack is memory-only for now — merges with FER-1 vault later."}
        </p>
      </div>
    </div>
  );
});
