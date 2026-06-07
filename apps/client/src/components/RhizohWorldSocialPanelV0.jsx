import React, { memo, useCallback } from "react";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

/**
 * Social layer — castle-to-castle, sessions, presence (not map space).
 */
export const RhizohWorldSocialPanelV0 = memo(function RhizohWorldSocialPanelV0({
  uiLocale,
  onOpenGreenroom,
  onOpenBroadcast,
  onShareInvite
}) {
  const locale = uiLocale || readUiLocaleV0();
  const tr = locale === "tr";

  return (
    <div className="space-y-3 normal-case" data-rhizoh-world-social-panel="1">
      <p className="text-[10px] leading-relaxed text-white/60">
        {tr
          ? "İnsan bağlantısı haritadan ayrıdır — oturum, davet ve canlı iletişim burada."
          : "People connections are separate from the map — sessions, invites, and live links live here."}
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <SocialAction
          title={tr ? "Oturum daveti" : "Session invite"}
          blurb={tr ? "Arkadaşını etkinliğe bağla" : "Connect a friend to your event"}
          onClick={onShareInvite}
        />
        <SocialAction
          title={tr ? "Hazırlık odası" : "Green room"}
          blurb={tr ? "Etkinlik oluştur / düzenle" : "Create or edit an event"}
          onClick={onOpenGreenroom}
        />
        <SocialAction
          title={tr ? "Canlı yayın" : "Live broadcast"}
          blurb={tr ? "Yayın yüzeyine geç" : "Open broadcast surface"}
          onClick={onOpenBroadcast}
        />
        <div className="rounded-xl border border-violet-400/20 bg-violet-950/20 px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-violet-200/90">
            {tr ? "Castle-to-Castle" : "Castle-to-Castle"}
          </p>
          <p className="mt-1 text-[9px] text-white/45">
            {tr ? "Video / voice link — yakında" : "Video / voice link — coming soon"}
          </p>
        </div>
      </div>
    </div>
  );
});

/** @param {{ title: string, blurb: string, onClick?: () => void }} props */
function SocialAction({ title, blurb, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-cyan-400/25 bg-cyan-950/15 px-3 py-2.5 text-left transition hover:border-cyan-400/45 hover:bg-cyan-950/25"
    >
      <p className="text-[9px] font-bold uppercase tracking-wide text-cyan-100/95">{title}</p>
      <p className="mt-1 text-[9px] text-white/50">{blurb}</p>
    </button>
  );
}
