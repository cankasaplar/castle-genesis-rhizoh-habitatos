import React, { memo, useMemo, useState } from "react";
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
import { SSL_SURFACE_ID_V0 } from "../rhizoh/runtime/rhizohSurfaceSingularityLayerV0.js";
import { RhizohStudioCitizenShellV0 } from "./RhizohStudioCitizenShellV0.jsx";
import { useSurfaceCitizenProjectionV0 } from "../rhizoh/runtime/useSurfaceCitizenProjectionV0.js";
import { useRhizohStudioProductionOrganismV0 } from "../rhizoh/runtime/useRhizohStudioProductionOrganismV0.js";
import { STUDIO_ORGANISM_SURFACE_ROLE_V0 } from "../rhizoh/runtime/rhizohStudioOrganismSurfaceRolesV0.js";
import { RhizohObservableRealityPanelV0 } from "./RhizohObservableRealityPanelV0.jsx";

const PROFILE_OBS_TABS_V0 = Object.freeze([
  { id: "reality", label: "Reality" },
  { id: "bindings", label: "Bindings" },
  { id: "timeline", label: "Timeline" }
]);

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
  const drawerProjection = useSurfaceCitizenProjectionV0(SSL_SURFACE_ID_V0.UI_DRAWER);
  const organism = useRhizohStudioProductionOrganismV0();
  const memory = organism?.memory_organ;
  const chrome = useMemo(() => resolveProductDrawerChromeCopyV0(locale), [locale]);
  const meta = useMemo(() => resolveProductDrawerSurfaceCopyV0(surface, locale), [surface, locale]);
  const [profileObsTab, setProfileObsTab] = useState("reality");

  if (!open || surface === "world") return null;

  return (
    <div
      className="pointer-events-auto fixed inset-x-0 bottom-[3.25rem] z-[58] mx-auto max-h-[min(52vh,28rem)] w-full max-w-2xl overflow-hidden rounded-t-2xl border border-cyan-400/25 bg-[#030711]/95 shadow-[0_-8px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      role="dialog"
      aria-label={`${meta.title} surface`}
      data-rhizoh-product-drawer={surface}
      data-rhizoh-scr-surface={SSL_SURFACE_ID_V0.UI_DRAWER}
      data-rhizoh-ssl-surface={SSL_SURFACE_ID_V0.UI_DRAWER}
      data-rhizoh-studio-organ-role={STUDIO_ORGANISM_SURFACE_ROLE_V0.UI_DRAWER}
      data-rhizoh-coherence-id={organism?.coherence_id || drawerProjection?.coherence_id || ""}
      data-rhizoh-episode-seq={memory?.episode_seq ?? ""}
      data-rhizoh-wal-entry={memory?.wal_entry_id ?? ""}
      data-rhizoh-pack-id={memory?.pack_id ?? ""}
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
          <RhizohStudioCitizenShellV0 surfaceKind="hall">
            <KernelConsolePanel />
            <QuickLinks
              links={[
                { to: "/genesis/portal", label: "Genesis portal" },
                { to: "/academy/observe", label: "Academy observe" }
              ]}
            />
          </RhizohStudioCitizenShellV0>
        ) : null}

        {surface === "greenroom" || surface === "broadcast" ? (
          <RhizohStudioCitizenShellV0 surfaceKind={surface}>
            <DirectorDeckPanel />
            {surface === "broadcast" ? (
              <p className="rounded-lg border border-fuchsia-400/25 bg-fuchsia-950/20 px-3 py-2 text-[10px] text-fuchsia-100/85 normal-case">
                {chrome.broadcastNote}
              </p>
            ) : null}
          </RhizohStudioCitizenShellV0>
        ) : null}

        {surface === "studio" ? (
          <RhizohStudioCitizenShellV0 surfaceKind="studio">
            <WorldLivingMapPanel />
            <KernelConsolePanel />
            <QuickLinks links={[{ to: "/genesis/portal", label: "Genesis runtime observation" }]} />
          </RhizohStudioCitizenShellV0>
        ) : null}

        {surface === "profile" ? (
          <RhizohStudioCitizenShellV0 surfaceKind="profile">
            <div
              className="mb-3 flex gap-1 rounded-lg border border-white/10 bg-black/30 p-1"
              role="tablist"
              aria-label="Observable reality"
            >
              {PROFILE_OBS_TABS_V0.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={profileObsTab === tab.id}
                  className={`flex-1 rounded-md px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide transition ${
                    profileObsTab === tab.id
                      ? "bg-cyan-500/20 text-cyan-100 border border-cyan-400/35"
                      : "text-white/50 hover:text-white/80 border border-transparent"
                  }`}
                  onClick={() => setProfileObsTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <RhizohObservableRealityPanelV0 section={profileObsTab} />
            <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
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
          </RhizohStudioCitizenShellV0>
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
