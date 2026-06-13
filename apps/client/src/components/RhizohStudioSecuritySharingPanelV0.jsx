import React, { memo, useCallback, useMemo, useState } from "react";
import { STUDIO_ASSET_MANIFEST_V1 } from "../studio/assetRegistryV1.js";
import {
  describeStudioExportPolicyV0,
  evaluateStudioExportAllowedV0,
  requestStudioExportPackV0,
  STUDIO_EXPORT_FAIL_SAFE_DENY_BY_DEFAULT_V0,
  STUDIO_EXPORT_MODE_V0
} from "../rhizoh/runtime/rhizohStudioExportPolicyV0.js";
import { resolveRhizohDomainTagsV0 } from "../rhizoh/runtime/rhizohDomainTagV0.js";

/**
 * Studio drawer — open-source sharing boundary wired to export policy layer.
 */
export const RhizohStudioSecuritySharingPanelV0 = memo(function RhizohStudioSecuritySharingPanelV0({
  uiLocale = "en",
  gatewayOrigin = ""
}) {
  const tr = uiLocale === "tr";
  const [userConsent, setUserConsent] = useState(false);
  const [exportStatus, setExportStatus] = useState("");

  const domainTags = useMemo(
    () => resolveRhizohDomainTagsV0({ pathname: "/studio/main", surfaceId: "studio", drawerId: "studio" }),
    []
  );

  const exportGate = useMemo(
    () => evaluateStudioExportAllowedV0({ userConsent }),
    [userConsent]
  );

  const exportSummary = useMemo(
    () => describeStudioExportPolicyV0({ userConsent }),
    [userConsent]
  );

  const exportModeLabel = useMemo(() => {
    if (exportGate.mode === STUDIO_EXPORT_MODE_V0.BLOCKED_DEGRADED) {
      return tr ? "Kısıtlı (degraded)" : "Restricted (degraded)";
    }
    if (exportGate.mode === STUDIO_EXPORT_MODE_V0.BLOCKED_NO_CONSENT) {
      return tr ? "Onay gerekli" : "Consent required";
    }
    if (exportGate.mode === STUDIO_EXPORT_MODE_V0.MANUAL_ONLY) {
      return tr ? "Manuel izinli" : "Manual only";
    }
    return tr ? "Politika engeli" : "Policy blocked";
  }, [exportGate.mode, tr]);

  const onRequestExportPack = useCallback(() => {
    const out = requestStudioExportPackV0({
      userConsent,
      gatewayOrigin,
      locale: uiLocale
    });
    if (!out.ok) {
      setExportStatus(tr ? `Engellendi: ${out.reason}` : `Blocked: ${out.reason}`);
      return;
    }
    setExportStatus(
      tr
        ? `Mock paket hazır (${out.pack.assets.length} varlık, bellek içi)`
        : `Mock pack ready (${out.pack.assets.length} assets, memory-only)`
    );
  }, [userConsent, gatewayOrigin, uiLocale, tr]);

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
          <p className="font-semibold text-emerald-200/90">
            {exportGate.health?.downgradeMode || "normal"}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5">
          <p className="text-white/40">{tr ? "Dışa aktarma" : "Export"}</p>
          <p
            className={`font-semibold ${
              exportGate.allowed ? "text-cyan-200" : "text-amber-200"
            }`}
          >
            {exportModeLabel}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-white/8 bg-black/25 px-2 py-2">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-white/45">
          {tr ? "Domain etiketleri" : "Domain tags"}
        </p>
        <p className="mt-1 font-mono text-[8px] text-violet-200/75">{domainTags.tags.join(" · ")}</p>
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
          {tr ? "Stüdyo çıktı paketi (mock)" : "Studio output pack (mock)"}
        </p>
        <p className="mt-1">
          {tr ? "Kalıcılık:" : "Persistence:"} {exportSummary.persistence} · gateway:{" "}
          {gatewayOrigin ? gatewayOrigin.slice(0, 32) : tr ? "yerel" : "local"}
        </p>
        <p className="mt-1 text-[8px] text-white/35">
          {tr ? "Fail-safe:" : "Fail-safe:"}{" "}
          {STUDIO_EXPORT_FAIL_SAFE_DENY_BY_DEFAULT_V0
            ? tr
              ? "varsayılan red"
              : "deny-by-default"
            : tr
              ? "kapalı"
              : "off"}
        </p>
        <label className="mt-2 flex items-center gap-2 normal-case">
          <input
            type="checkbox"
            checked={userConsent}
            onChange={(e) => setUserConsent(e.target.checked)}
            className="rounded border-white/20"
          />
          <span>{tr ? "Dışa aktarma onayı veriyorum" : "I consent to export"}</span>
        </label>
        <button
          type="button"
          disabled={!exportGate.allowed}
          onClick={onRequestExportPack}
          className="mt-2 w-full rounded-lg border border-cyan-400/35 bg-cyan-500/15 px-2 py-1.5 text-[9px] font-semibold uppercase text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {tr ? "Mock paket oluştur" : "Build mock pack"}
        </button>
        {exportStatus ? <p className="mt-2 text-[9px] text-emerald-300/85">{exportStatus}</p> : null}
        <p className="mt-2 text-white/40">
          {tr ? "FER-1 vault birleşimi Sprint 38" : "FER-1 vault merge in Sprint 38"}
        </p>
      </div>
    </div>
  );
});
