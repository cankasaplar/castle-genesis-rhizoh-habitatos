import { useEffect, useMemo, useState } from "react";
import {
  broadcastAudienceApplause,
  broadcastAudienceCheer,
  broadcastAudienceEmojiRain,
  broadcastAudienceWave,
  broadcastCameraCut,
  broadcastCameraFocus,
  broadcastCameraFollow,
  broadcastClipMark,
  broadcastLifecyclePause,
  broadcastLifecycleResume,
  broadcastLifecycleStart,
  broadcastLifecycleStop,
  broadcastOverlayPush,
  broadcastOverlayRemove,
  broadcastSceneSet,
  broadcastSegmentClose,
  broadcastSegmentOpen,
  broadcastSpotlightAssign,
  broadcastSpotlightRelease,
  createBroadcastChannel,
  getStudioKernelState,
  subscribeStudioKernel
} from "../store/studioStore.js";

type DeckTab = "live" | "stage" | "camera" | "audience" | "overlay";

export function DirectorDeckPanel() {
  const [tab, setTab] = useState<DeckTab>("live");
  const [, bump] = useState(0);
  const [broadcastUid, setBroadcastUid] = useState("broadcast:deck:1");
  const [roomUid, setRoomUid] = useState("room:deck:1");
  const [msg, setMsg] = useState("");

  useEffect(() => subscribeStudioKernel(() => bump((n) => n + 1)), []);

  const s = getStudioKernelState();
  const pres = s.presence;
  const proj = pres?.broadcastProjections?.[broadcastUid];
  const director = roomUid ? pres?.directorByRoomUid?.[roomUid] : undefined;
  const ch = pres?.broadcasts?.[broadcastUid];

  const tabs = useMemo(
    () =>
      [
        { id: "live" as const, label: "Live" },
        { id: "stage" as const, label: "Stage" },
        { id: "camera" as const, label: "Camera" },
        { id: "audience" as const, label: "Audience" },
        { id: "overlay" as const, label: "Overlay" }
      ] as const,
    []
  );

  const btn =
    "rounded-lg border border-violet-400/35 bg-violet-950/50 px-2 py-1.5 text-[9px] font-semibold tracking-wide text-violet-100/95 hover:bg-violet-900/55";

  return (
    <div className="mt-4 rounded-xl border border-violet-500/30 bg-[#0a0618]/95 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="text-[9px] font-black tracking-[0.22em] text-violet-200/90">DIRECTOR DECK · 5A</div>
        <div className="text-[8px] text-white/45">broadcast causal fold → projection</div>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-white/10 px-2 py-1.5 bg-black/25">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rounded-md px-2 py-1 text-[8px] font-bold tracking-wide ${
              tab === t.id ? "bg-violet-600/40 text-white" : "text-white/50 hover:text-white/75"
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-3 space-y-2 text-[9px] text-white/80">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-white/45">
            broadcast uid
            <input
              value={broadcastUid}
              onChange={(e) => setBroadcastUid(e.target.value)}
              className="mt-0.5 w-full rounded border border-white/15 bg-black/40 px-1.5 py-1 font-mono text-[8px] text-cyan-100"
            />
          </label>
          <label className="text-white/45">
            room uid (director)
            <input
              value={roomUid}
              onChange={(e) => setRoomUid(e.target.value)}
              className="mt-0.5 w-full rounded border border-white/15 bg-black/40 px-1.5 py-1 font-mono text-[8px] text-cyan-100"
            />
          </label>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-2 font-mono text-[8px] text-emerald-200/90 leading-relaxed">
          <div>channel: {ch ? `${ch.streamState} · ${ch.title}` : "—"}</div>
          <div>
            projection: {proj ? `${proj.state} · cam ${proj.cameraMode} · aud ${proj.audienceCount}` : "— (create channel first)"}
          </div>
          <div>director: {director ? `scene ${director.sceneMode} · clips ${director.clipMarkers.length}` : "—"}</div>
        </div>
        {msg ? <div className="text-amber-200/90 text-[8px]">{msg}</div> : null}

        {tab === "live" ? (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={btn}
              onClick={() => {
                const r = createBroadcastChannel({
                  channelUid: broadcastUid,
                  title: "Director deck",
                  roomUid: roomUid || undefined
                });
                setMsg(r.ok ? "broadcast created" : `create: ${r.error}`);
              }}
            >
              Create broadcast
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => {
                const r = broadcastLifecycleStart({
                  broadcastUid,
                  roomUid: roomUid || undefined,
                  sceneMode: "show"
                });
                setMsg(r.ok ? "start" : r.error);
              }}
            >
              Start
            </button>
            <button type="button" className={btn} onClick={() => setMsg(broadcastLifecyclePause({ broadcastUid }).ok ? "pause" : "err")}>
              Pause
            </button>
            <button type="button" className={btn} onClick={() => setMsg(broadcastLifecycleResume({ broadcastUid }).ok ? "resume" : "err")}>
              Resume
            </button>
            <button type="button" className={btn} onClick={() => setMsg(broadcastLifecycleStop({ broadcastUid }).ok ? "stop" : "err")}>
              Stop
            </button>
          </div>
        ) : null}

        {tab === "stage" ? (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={btn}
              onClick={() =>
                setMsg(broadcastSegmentOpen({ broadcastUid, segmentId: "seg-1", label: "A block" }).ok ? "segment open" : "err")
              }
            >
              Segment open
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => setMsg(broadcastSegmentClose({ broadcastUid, segmentId: "seg-1" }).ok ? "segment close" : "err")}
            >
              Segment close
            </button>
            <button
              type="button"
              className={btn}
              onClick={() =>
                setMsg(
                  broadcastSpotlightAssign({ broadcastUid, targetAvatarUid: "avatar:stage:1" }).ok ? "spotlight" : "err"
                )
              }
            >
              Spotlight assign
            </button>
            <button type="button" className={btn} onClick={() => setMsg(broadcastSpotlightRelease({ broadcastUid }).ok ? "spot off" : "err")}>
              Spotlight release
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => setMsg(broadcastSceneSet({ broadcastUid, roomUid, sceneMode: "interview" }).ok ? "scene" : "err")}
            >
              Scene set
            </button>
            <button
              type="button"
              className={btn}
              onClick={() =>
                setMsg(broadcastClipMark({ broadcastUid, roomUid, label: "mark" }).ok ? "clip mark" : "err")
              }
            >
              Clip mark
            </button>
          </div>
        ) : null}

        {tab === "camera" ? (
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={btn} onClick={() => setMsg(broadcastCameraFocus({ broadcastUid }).ok ? "focus" : "err")}>
              Focus
            </button>
            <button
              type="button"
              className={btn}
              onClick={() =>
                setMsg(broadcastCameraFollow({ broadcastUid, targetUid: "avatar:stage:1" }).ok ? "follow" : "err")
              }
            >
              Follow
            </button>
            <button type="button" className={btn} onClick={() => setMsg(broadcastCameraCut({ broadcastUid }).ok ? "cut" : "err")}>
              Cut
            </button>
          </div>
        ) : null}

        {tab === "audience" ? (
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={btn} onClick={() => setMsg(broadcastAudienceWave({ broadcastUid, intensity: 0.7 }).ok ? "wave" : "err")}>
              Wave
            </button>
            <button type="button" className={btn} onClick={() => setMsg(broadcastAudienceApplause({ broadcastUid }).ok ? "applause" : "err")}>
              Applause
            </button>
            <button type="button" className={btn} onClick={() => setMsg(broadcastAudienceCheer({ broadcastUid }).ok ? "cheer" : "err")}>
              Cheer
            </button>
            <button type="button" className={btn} onClick={() => setMsg(broadcastAudienceEmojiRain({ broadcastUid, emoji: "✨" }).ok ? "emoji" : "err")}>
              Emoji rain
            </button>
          </div>
        ) : null}

        {tab === "overlay" ? (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={btn}
              onClick={() =>
                setMsg(
                  broadcastOverlayPush({
                    broadcastUid,
                    overlayId: "ov-1",
                    overlayKind: "lowerThird",
                    payload: "Host"
                  }).ok
                    ? "overlay push"
                    : "err"
                )
              }
            >
              Push overlay
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => setMsg(broadcastOverlayRemove({ broadcastUid, overlayId: "ov-1" }).ok ? "overlay remove" : "err")}
            >
              Remove overlay
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
