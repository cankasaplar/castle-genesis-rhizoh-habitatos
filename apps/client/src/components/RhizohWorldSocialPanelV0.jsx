import React, { memo, useCallback, useState } from "react";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";
import {
  createCastleSocialAvSessionV0,
  patchCastleSocialAvSessionV0,
  promoteCastleSocialAvSessionLiveV0,
  readCastleSocialAvSessionV0
} from "../castleSocial/castleSocialAvSessionV0.js";
import { resolveWorldMapBootstrapGeoV0 } from "../rhizoh/runtime/worldMapBootstrapGeoV0.js";

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
  const [c2cSession, setC2cSession] = useState(() => readCastleSocialAvSessionV0());

  const handleStartCastleLink = useCallback(() => {
    const anchor = resolveWorldMapBootstrapGeoV0();
    const hostCastleId = `castle:${anchor.source}`;
    let session = readCastleSocialAvSessionV0();
    if (!session) {
      session = createCastleSocialAvSessionV0({
        hostCastleId,
        hostAnchor: anchor,
        conversationContext: {
          intent: "spatial_castle_session",
          openLoops: ["media_transport_pending", "peer_castle_pending"]
        },
        memoryBinding: { enabled: true, mode: "castle_session_open" }
      });
    }
    const live = promoteCastleSocialAvSessionLiveV0(session);
    patchCastleSocialAvSessionV0(live, { micActive: true, cameraActive: false });
    setC2cSession(readCastleSocialAvSessionV0());
  }, []);

  const c2cStatus = c2cSession?.lifecycle || null;
  const spatial = c2cSession?.spatialSession;
  const roomLabel = spatial?.roomId || c2cSession?.roomKey || "—";
  const anchorLabel = spatial?.spatialContext?.hostAnchor?.label || "—";

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
          title={tr ? "Yayın hazırlığı · beta" : "Broadcast prep · beta"}
          blurb={tr ? "Davet ve durum hazırlığına geç" : "Open invite and status prep"}
          onClick={onOpenBroadcast}
        />
        <button
          type="button"
          onClick={handleStartCastleLink}
          className="rounded-xl border border-violet-400/30 bg-violet-950/25 px-3 py-2.5 text-left transition hover:border-violet-400/50 hover:bg-violet-950/35"
        >
          <p className="text-[9px] font-bold uppercase tracking-wide text-violet-200/90">
            {tr ? "Castle-to-Castle" : "Castle-to-Castle"}
          </p>
          <p className="mt-1 text-[9px] text-white/55">
            {c2cStatus === "LIVE"
              ? tr
                ? `Spatial session hazır · ${anchorLabel}`
                : `Spatial session ready · ${anchorLabel}`
              : tr
                ? "Castle session context hazırla"
                : "Prepare castle session context"}
          </p>
          {c2cSession ? (
            <p className="mt-1 text-[8px] text-white/38">
              {tr ? "Oda" : "Room"}: <span className="font-mono">{roomLabel}</span> ·{" "}
              {tr ? "media beklemede" : "media pending"}
            </p>
          ) : null}
        </button>
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
