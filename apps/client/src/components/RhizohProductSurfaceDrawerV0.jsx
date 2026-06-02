import React, { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { KernelConsolePanel } from "../studio/ui/KernelConsolePanel";
import { DirectorDeckPanel } from "../studio/ui/DirectorDeckPanel";
import { WorldLivingMapPanel } from "../studio/ui/WorldLivingMapPanel";
import { ProductProfilePanel } from "../studio/ui/ProductProfilePanel";
import { RuntimeHealthPanel } from "../studio/ui/RuntimeHealthPanel";
import {
  resolveProductDrawerChromeCopyV0,
  resolveProductDrawerSurfaceCopyV0
} from "../rhizoh/runtime/rhizohProductCopyI18nV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

/**
 * @param {{
 *   surface: string,
 *   open: boolean,
 *   onClose: () => void,
 *   auth?: object | null,
 *   gatewayOrigin?: string,
 *   runtimeHealth?: object | null,
 *   uiLocale?: string
 * }} props
 */
export const RhizohProductSurfaceDrawerV0 = memo(function RhizohProductSurfaceDrawerV0({
  surface,
  open,
  onClose,
  auth = null,
  gatewayOrigin = "",
  runtimeHealth = null,
  uiLocale
}) {
  const locale = uiLocale || readUiLocaleV0();
  const chrome = useMemo(() => resolveProductDrawerChromeCopyV0(locale), [locale]);
  const meta = useMemo(() => resolveProductDrawerSurfaceCopyV0(surface, locale), [surface, locale]);

  if (!open || surface === "world") return null;

  return (
    <div
      className="pointer-events-auto fixed inset-x-0 bottom-[3.25rem] z-[58] mx-auto max-h-[min(52vh,28rem)] w-full max-w-2xl overflow-hidden rounded-t-2xl border border-cyan-400/25 bg-[#030711]/95 shadow-[0_-8px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      role="dialog"
      aria-label={`${meta.title} surface`}
      data-rhizoh-product-drawer={surface}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/90">{meta.title}</p>
          <p className="text-[10px] text-white/55 normal-case">{meta.blurb}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/15 px-2 py-1 text-[9px] uppercase tracking-wide text-white/60 hover:text-white"
        >
          {chrome.close}
        </button>
      </div>

      <div className="max-h-[calc(min(52vh,28rem)-3rem)] overflow-y-auto px-3 py-3 no-scrollbar">
        {surface === "hall" ? (
          <div className="space-y-3">
            <KernelConsolePanel />
            <QuickLinks
              links={[
                { to: "/genesis/portal", label: "Genesis portal" },
                { to: "/academy/observe", label: "Academy observe" }
              ]}
            />
          </div>
        ) : null}

        {surface === "greenroom" || surface === "broadcast" ? (
          <div className="space-y-3">
            <DirectorDeckPanel />
            {surface === "broadcast" ? (
              <p className="rounded-lg border border-fuchsia-400/25 bg-fuchsia-950/20 px-3 py-2 text-[10px] text-fuchsia-100/85 normal-case">
                {chrome.broadcastNote}
              </p>
            ) : null}
          </div>
        ) : null}

        {surface === "studio" ? (
          <div className="space-y-3">
            <WorldLivingMapPanel />
            <KernelConsolePanel />
            <QuickLinks links={[{ to: "/genesis/portal", label: "Genesis runtime observation" }]} />
          </div>
        ) : null}

        {surface === "profile" ? (
          <div className="space-y-3">
            <ProductProfilePanel auth={auth} />
            <RuntimeHealthPanel health={runtimeHealth} gatewayBaseUrl={gatewayOrigin} />
            <QuickLinks
              links={[
                { to: "/academy/research", label: "Academy · Research" },
                { to: "/academy/observe", label: "Academy · Observe" },
                { to: "/genesis/hub", label: "Genesis hub" }
              ]}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
});

/** @param {{ links: { to: string, label: string }[] }} props */
function QuickLinks({ links }) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-cyan-200/90 hover:border-cyan-400/40"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
