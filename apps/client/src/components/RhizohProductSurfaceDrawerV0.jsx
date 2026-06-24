import React, { memo, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { CastlePetStudioPanelV0 } from "./CastlePetStudioPanelV0.jsx";
import { RhizohEventCreatePanelV12 } from "./RhizohEventCreatePanelV12.jsx";
import { RhizohStudioSecuritySharingPanelV0 } from "./RhizohStudioSecuritySharingPanelV0.jsx";
import { isDrawerModuleAwakenedV0 } from "../rhizoh/runtime/rhizohDrawerAwakeningV0.js";
import { writeRhizohWorldSystemModeV0 } from "../rhizoh/runtime/rhizohWorldSystemModeV0.js";
import {
  resolveRhizohProductDrawerBottomCssV0,
  RHIZOH_UI_Z_INDEX_V0
} from "../rhizoh/runtime/rhizohUiLayoutResolverV0.js";
import { RhizohGreenroomWaitingPanelV0 } from "./RhizohGreenroomWaitingPanelV0.jsx";
import { RhizohStudioLifeMemoryPanelV0 } from "./RhizohStudioLifeMemoryPanelV0.jsx";
import { RhizohStudioEightCameraDashboardV0 } from "./RhizohStudioEightCameraDashboardV0.jsx";
import { RhizohStudioDirectorModePanelV0 } from "./RhizohStudioDirectorModePanelV0.jsx";

const PROFILE_OBS_TABS_V0 = Object.freeze([
  { id: "reality", label: "Reality" },
  { id: "bindings", label: "Bindings" },
  { id: "timeline", label: "Timeline" }
]);

const USER_OUTCOME_COPY_V0 = Object.freeze({
  hall: Object.freeze({
    tr: Object.freeze({
      eyebrow: "Bu ekranda ne yapabilirsin?",
      title: "Gözlem özetini aç",
      body: "Salon artık kernel/debug konsolu değil; kayıt ve gözlem rotalarına güvenli geçiş alanı.",
      outcomes: Object.freeze(["Academy gözlem katmanına geç", "Araştırma gözlemevi", "Genesis portal kayıtları"])
    }),
    en: Object.freeze({
      eyebrow: "What can you do here?",
      title: "Open observation records",
      body: "Hall is no longer a kernel/debug console; it is a safe handoff to records and observation routes.",
      outcomes: Object.freeze(["Open Academy observe layer", "Research observatory", "Genesis portal records"])
    })
  }),
  greenroom: Object.freeze({
    tr: Object.freeze({
      eyebrow: "Beta kapsamı",
      title: "Davetli deneyim linki oluştur",
      body: "Başlık girip oluşturduğunda yerel deneyim kaydı ve paylaşılabilir davet linki oluşur. Yeni oda açıldığı iddia edilmez.",
      outcomes: Object.freeze(["Deneyim kaydı oluşur", "Davet linki kopyalanabilir", "Yayın başlamaz"])
    }),
    en: Object.freeze({
      eyebrow: "Beta scope",
      title: "Create an invite-only experience link",
      body: "When you enter a title and create, Rhizoh creates a local experience record and shareable invite link. It does not claim a new room opened.",
      outcomes: Object.freeze(["Experience record is created", "Invite link can be copied", "Broadcast does not start"])
    })
  }),
  broadcast: Object.freeze({
    tr: Object.freeze({
      eyebrow: "Beta kapsamı",
      title: "Yayın hazırlığı, canlı yayın değil",
      body: "Bu yüzey şimdilik davet ve hazırlık üretir. Canlı yayın başladı hissi vermemek için yönetmen konsolu gizlendi.",
      outcomes: Object.freeze(["Davet linki hazırlanır", "Durum açıkça beta kalır", "Canlı yayın iddiası kurulmaz"])
    }),
    en: Object.freeze({
      eyebrow: "Beta scope",
      title: "Broadcast prep, not a live stream",
      body: "This surface currently produces invite/prep state. The director console is hidden so it does not feel like a failed live product.",
      outcomes: Object.freeze(["Invite link is prepared", "State remains clearly beta", "No live-stream claim is made"])
    })
  }),
  studio: Object.freeze({
    tr: Object.freeze({
      eyebrow: "Beta kapsamı",
      title: "Stüdyo durumu",
      body: "Stüdyo bu sürümde üretim motoru gibi davranmaz. Yaşam hafızası gözlem paneli, durum ve güvenli inceleme bağlantıları gösterilir.",
      outcomes: Object.freeze(["Yaşam hafızası paneli", "Robotics cihaz köprüsü", "Gözlem kayıtları"])
    }),
    en: Object.freeze({
      eyebrow: "Beta scope",
      title: "Studio status",
      body: "Studio does not behave like a production engine in this build. Life Memory observation panel, status, and safe inspection links.",
      outcomes: Object.freeze(["Life Memory panel", "Robotics device bridge", "Observation records"])
    })
  })
});

/**
 * @param {{
 *   surface: string,
 *   open: boolean,
 *   onClose: () => void,
 *   auth?: object | null,
 *   gatewayOrigin?: string,
 *   runtimeHealth?: object | null,
 *   uiLocale?: string,
 *   experienceSessionId?: string | null,
 *   productSessionId?: string | null,
 *   gatewayPhase?: string
 * }} props
 */
export const RhizohProductSurfaceDrawerV0 = memo(function RhizohProductSurfaceDrawerV0({
  surface,
  open,
  onClose,
  auth = null,
  gatewayOrigin = "",
  runtimeHealth = null,
  uiLocale,
  experienceSessionId = null,
  productSessionId = null,
  gatewayPhase = "unknown"
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
      className="pointer-events-auto fixed inset-x-0 mx-auto max-h-[min(38vh,21rem)] w-full max-w-2xl overflow-hidden rounded-t-2xl border border-cyan-400/30 bg-[#050810] shadow-[0_-12px_48px_rgba(0,0,0,0.72)]"
      style={{
        bottom: resolveRhizohProductDrawerBottomCssV0(),
        zIndex: RHIZOH_UI_Z_INDEX_V0.PRODUCT_DRAWER
      }}
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
      <div className="flex items-center justify-between border-b border-white/12 bg-[#061018] px-4 py-2.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/90">{meta.title}</p>
          <p className="text-[10px] text-white/55 normal-case">{meta.blurb}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="relative z-10 shrink-0 touch-manipulation rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-white/75 hover:border-cyan-400/40 hover:text-white"
          data-rhizoh-product-drawer-close="1"
        >
          {chrome.close}
        </button>
      </div>

      <div className="max-h-[calc(min(38vh,21rem)-3.25rem)] overflow-y-auto bg-[#050810] px-3 py-3 no-scrollbar">
        {surface === "hall" ? (
          <RhizohStudioCitizenShellV0 surfaceKind="hall">
            <UserOutcomeCard surface="hall" locale={locale} />
            <LayerTransitionNav activeLayer="academy" locale={locale} />
            <QuickLinks
              links={[
                { to: "/academy/observe", label: locale === "tr" ? "Gözlem katmanı" : "Observe layer" },
                { to: "/academy/research", label: locale === "tr" ? "Araştırma" : "Research" },
                { to: "/genesis/academy", label: locale === "tr" ? "Academy hub" : "Academy hub" },
                { to: "/genesis/portal", label: "Genesis portal" },
                { to: "/world/space", label: locale === "tr" ? "Dünya haritası" : "World map" }
              ]}
            />
          </RhizohStudioCitizenShellV0>
        ) : null}

        {surface === "greenroom" || surface === "broadcast" ? (
          <RhizohStudioCitizenShellV0 surfaceKind={surface} showKernelStrips={false}>
            <RhizohGreenroomWaitingPanelV0
              uiLocale={locale}
              gatewayPhase={gatewayPhase}
              gatewayHeadline={runtimeHealth?.headline || runtimeHealth?.liveMessage || ""}
              experienceSessionId={experienceSessionId}
              surface={surface}
            />
            <RhizohEventCreatePanelV12
              experienceSessionId={experienceSessionId}
              productSessionId={productSessionId}
              authUid={auth?.user?.uid || auth?.uid || null}
              uiLocale={locale}
            />
            {surface === "broadcast" ? (
              <p className="rounded-lg border border-fuchsia-400/25 bg-fuchsia-950/20 px-3 py-2 text-[10px] text-fuchsia-100/85 normal-case">
                {chrome.broadcastNote}
              </p>
            ) : null}
          </RhizohStudioCitizenShellV0>
        ) : null}

        {surface === "studio" ? (
          <RhizohStudioCitizenShellV0 surfaceKind="studio">
            {isDrawerModuleAwakenedV0("studio") ? (
              <p className="mb-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-100">
                {locale === "tr" ? "Drawer uyanık · Sprint 37" : "Drawer awake · Sprint 37"}
              </p>
            ) : null}
            <LayerTransitionNav activeLayer="robotics" locale={locale} />
            <RhizohStudioDirectorModePanelV0 uiLocale={locale} />
            <RhizohStudioEightCameraDashboardV0 uiLocale={locale} />
            <RhizohStudioLifeMemoryPanelV0 uiLocale={locale} />
            <RhizohStudioSecuritySharingPanelV0 uiLocale={locale} gatewayOrigin={gatewayOrigin} />
            <RuntimeHealthPanel health={runtimeHealth} gatewayBaseUrl={gatewayOrigin} />
            <QuickLinks
              links={[
                { to: "/studio", label: locale === "tr" ? "Stüdyo konsolu" : "Studio console" },
                { to: "/academy/observe", label: locale === "tr" ? "Gözlem katmanı" : "Observe layer" },
                { to: "/genesis/portal", label: "Genesis portal" },
                { to: "/world/space", label: locale === "tr" ? "Haritayı aç" : "Open map" }
              ]}
            />
            <RoboticsModeLink locale={locale} />
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
            <CastlePetStudioPanelV0 />
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

/** @param {{ surface: string, locale?: string }} props */
function UserOutcomeCard({ surface, locale }) {
  const tr = (locale || readUiLocaleV0()) === "tr";
  const copy = USER_OUTCOME_COPY_V0[surface]?.[tr ? "tr" : "en"];
  if (!copy) return null;
  return (
    <section className="mb-3 rounded-xl border border-cyan-400/25 bg-[#081420] px-3 py-3 normal-case shadow-inner">
      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-cyan-200/80">
        {copy.eyebrow}
      </p>
      <p className="mt-1 text-[12px] font-semibold text-white/90">{copy.title}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-white/58">{copy.body}</p>
      <ul className="mt-2 space-y-1 text-[9px] text-white/55">
        {copy.outcomes.map((row) => (
          <li key={row} className="flex gap-1.5">
            <span className="text-cyan-300/80" aria-hidden>
              •
            </span>
            <span>{row}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** @param {{ activeLayer: 'academy' | 'robotics', locale?: string }} props */
function LayerTransitionNav({ activeLayer, locale }) {
  const tr = (locale || readUiLocaleV0()) === "tr";
  const tabs = [
    { id: "academy", to: "/academy/observe", label: tr ? "Academy" : "Academy" },
    { id: "robotics", to: "/world/modes", label: tr ? "Robotics" : "Robotics", mode: "robotics" }
  ];
  return (
    <nav
      className="mb-3 flex gap-1 rounded-lg border border-white/10 bg-black/30 p-1"
      aria-label={tr ? "Katman geçişi" : "Layer transition"}
    >
      {tabs.map((tab) => (
        <LayerTabLink key={tab.id} tab={tab} active={activeLayer === tab.id} />
      ))}
    </nav>
  );
}

/** @param {{ tab: { id: string, to: string, label: string, mode?: string }, active: boolean }} props */
function LayerTabLink({ tab, active }) {
  const navigate = useNavigate();
  const className = `flex-1 rounded-md px-2 py-1.5 text-center text-[9px] font-semibold uppercase tracking-wide transition ${
    active
      ? "bg-cyan-500/20 text-cyan-100 border border-cyan-400/35"
      : "text-white/50 hover:text-white/80 border border-transparent"
  }`;
  if (tab.mode) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          writeRhizohWorldSystemModeV0(tab.mode);
          navigate(tab.to);
        }}
      >
        {tab.label}
      </button>
    );
  }
  return (
    <Link to={tab.to} className={className}>
      {tab.label}
    </Link>
  );
}

/** @param {{ locale?: string }} props */
function RoboticsModeLink({ locale }) {
  const tr = (locale || readUiLocaleV0()) === "tr";
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => {
        writeRhizohWorldSystemModeV0("robotics");
        navigate("/world/modes");
      }}
      className="mt-2 w-full rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-left text-[10px] text-amber-100/90 normal-case hover:border-amber-400/50"
    >
      {tr
        ? "Robotics katmanı — cihaz, kamera ve sensör köprüsü"
        : "Robotics layer — device, camera, and sensor bridge"}
    </button>
  );
}

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
