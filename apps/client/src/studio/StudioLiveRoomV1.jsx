import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { RhizohThoughtField3DV0 } from "../rhizoh/runtime/RhizohThoughtField3DV0.jsx";
import {
  CASTLE_PWE_EVENT_V0,
  readCastlePweV0
} from "../castleFlight/castlePersistentWorldEntityV0.js";
import { bootstrapStudioLiveRoomSceneV1 } from "./studioLiveRoomSceneBootstrapV1.js";
import {
  STUDIO_CAMERA_MODE_V1,
  applyStudioCameraModeV1
} from "./studioLiveRoomCameraV1.js";
import {
  STUDIO_VISUAL_PRESENCE_V1,
  applyStudioPresenceVisualToRootV1,
  mapPweStateToStudioVisualV1
} from "./studioLiveRoomPresenceVisualV1.js";
import {
  attachStudioLiveRoomVoiceHookV1,
  STUDIO_VOICE_EVENT_V1
} from "./studioLiveRoomVoiceHookV1.js";
import { StudioLiveRoomDrawerV1 } from "./StudioLiveRoomDrawerV1.jsx";

/**
 * Studio Live Room v1 — 2 stage entities + 3 ambient + voice + presence + drawer.
 * Route: `/studio-live` — no Cesium, no multi-engine.
 */
export const StudioLiveRoomV1 = memo(function StudioLiveRoomV1() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const voiceRef = useRef(null);
  const cameraModeRef = useRef(STUDIO_CAMERA_MODE_V1.STAGE_FOCUS);
  const studioPresenceRef = useRef(STUDIO_VISUAL_PRESENCE_V1.OBSERVING);

  const [boot, setBoot] = useState("loading");
  const [loadReport, setLoadReport] = useState([]);
  const [cameraMode, setCameraMode] = useState(STUDIO_CAMERA_MODE_V1.STAGE_FOCUS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("voice");
  const [transcript, setTranscript] = useState("");
  const [rhizohReply, setRhizohReply] = useState("");
  const [voiceSnap, setVoiceSnap] = useState({ ok: true, listening: false });
  const [presence, setPresence] = useState({
    studio: STUDIO_VISUAL_PRESENCE_V1.OBSERVING,
    pwe: "observing",
    field: "IDLE"
  });

  const syncPresenceFromPwe = useCallback((voiceOverride) => {
    const pwe = readCastlePweV0();
    const pweState = pwe?.presence?.state || "observing";
    const studioFromPwe = mapPweStateToStudioVisualV1(pweState);
    const studio = voiceOverride || studioFromPwe;
    let field = "IDLE";
    if (studio === STUDIO_VISUAL_PRESENCE_V1.THINKING) field = "GENERATING";
    else if (studio === STUDIO_VISUAL_PRESENCE_V1.SPEAKING) field = "SPEAKING";
    else if (studio === STUDIO_VISUAL_PRESENCE_V1.LISTENING) field = "LISTENING";
    setPresence({ studio, pwe: pweState, field });
    studioPresenceRef.current = studio;
    return studio;
  }, []);

  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  useEffect(() => {
    studioPresenceRef.current = presence.studio;
  }, [presence.studio]);

  useEffect(() => {
    const onPwe = () => syncPresenceFromPwe();
    window.addEventListener(CASTLE_PWE_EVENT_V0, onPwe);
    onPwe();
    return () => window.removeEventListener(CASTLE_PWE_EVENT_V0, onPwe);
  }, [syncPresenceFromPwe]);

  useEffect(() => {
    const onVoice = (ev) => setVoiceSnap(ev.detail || {});
    window.addEventListener(STUDIO_VOICE_EVENT_V1, onVoice);
    return () => window.removeEventListener(STUDIO_VOICE_EVENT_V1, onVoice);
  }, []);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return undefined;

    let dead = false;
    let raf = 0;
    const clock = { t: 0 };

    (async () => {
      try {
        const ctx = await bootstrapStudioLiveRoomSceneV1(el, {
          onAssetStatus: () => {}
        });
        if (dead) {
          ctx.dispose();
          return;
        }
        sceneRef.current = ctx;
        setLoadReport(ctx.loadReport);
        setBoot("ready");

        voiceRef.current = attachStudioLiveRoomVoiceHookV1({
          onTranscript: (text, isFinal) => {
            setTranscript(text);
            if (isFinal) setDrawerTab("voice");
          },
          onRhizohReply: (reply) => setRhizohReply(reply),
          onPresence: (studioPresence) => {
            syncPresenceFromPwe(studioPresence);
          }
        });

        const tick = (now) => {
          if (dead) return;
          raf = requestAnimationFrame(tick);
          clock.t = now / 1000;
          const studio = studioPresenceRef.current;
          applyStudioPresenceVisualToRootV1(ctx.entities.rhizoh, studio, clock.t);
          const octoPresence =
            studio === STUDIO_VISUAL_PRESENCE_V1.SPEAKING
              ? STUDIO_VISUAL_PRESENCE_V1.LISTENING
              : STUDIO_VISUAL_PRESENCE_V1.OBSERVING;
          applyStudioPresenceVisualToRootV1(ctx.entities.octo, octoPresence, clock.t);

          for (const k of ["fox", "medusa", "robot"]) {
            const amb = ctx.entities[k];
            if (amb) amb.rotation.y = clock.t * 0.06;
          }

          const octo = ctx.entities.octo;
          if (octo && cameraModeRef.current === STUDIO_CAMERA_MODE_V1.STAGE_FOCUS) {
            octo.position.x = 2.2 + Math.sin(clock.t * 0.35) * 0.25;
          }

          applyStudioCameraModeV1(cameraModeRef.current, ctx.camera, ctx.controls, clock.t);
          ctx.renderer.render(ctx.scene, ctx.camera);
        };
        tick(0);
      } catch (err) {
        if (!dead) {
          setBoot("error");
          setLoadReport([{ key: "bootstrap", ok: false, error: String(err?.message || err) }]);
        }
      }
    })();

    const onResize = () => sceneRef.current?.resize?.();
    window.addEventListener("resize", onResize);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      voiceRef.current?.stop?.();
      voiceRef.current = null;
      sceneRef.current?.dispose?.();
      sceneRef.current = null;
    };
  }, []);

  const toggleMic = () => {
    const v = voiceRef.current;
    if (!v) return;
    if (v.isListening()) v.stop();
    else v.start();
  };

  return (
    <div className="fixed inset-0 z-[40] flex flex-col bg-[#060810] text-white" data-studio-live-room-v1="1">
      <header className="absolute left-0 right-0 top-0 z-10 flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="rounded-lg border border-cyan-400/30 bg-black/50 px-3 py-2 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-100">
            Studio Live Room v1
          </p>
          <p className="text-[9px] text-white/50">Stage · Ambient · Cognitive · Drawer</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Object.values(STUDIO_CAMERA_MODE_V1).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`rounded border px-2 py-1 text-[9px] uppercase ${
                cameraMode === mode
                  ? "border-cyan-400/50 bg-cyan-950/60 text-cyan-100"
                  : "border-white/15 text-white/55 hover:bg-white/5"
              }`}
              onClick={() => setCameraMode(mode)}
            >
              {mode.replace(/_/g, " ")}
            </button>
          ))}
          <button
            type="button"
            className={`rounded border px-2 py-1 text-[9px] ${
              voiceSnap.listening
                ? "border-red-400/50 bg-red-950/40 text-red-100"
                : "border-emerald-400/40 text-emerald-200"
            }`}
            onClick={toggleMic}
            disabled={boot !== "ready" || voiceSnap.ok === false}
          >
            {voiceSnap.listening ? "Mic durdur" : "Mic başlat"}
          </button>
          <a
            href="/"
            className="rounded border border-white/20 bg-black/40 px-2 py-1 text-[10px] text-white/80"
          >
            ← Rhizoh
          </a>
        </div>
      </header>

      <div ref={mountRef} className="min-h-0 flex-1 w-full" />

      {boot === "loading" ? (
        <p className="pointer-events-none absolute bottom-24 left-1/2 z-10 -translate-x-1/2 text-[10px] text-white/55">
          Asset registry → scene bootstrap…
        </p>
      ) : null}
      {boot === "error" ? (
        <p className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2 rounded border border-red-400/40 bg-red-950/80 px-3 py-2 text-[10px] text-red-100">
          Bootstrap hatası
        </p>
      ) : null}

      <RhizohThoughtField3DV0
        activeSurface="studio"
        rhizohFieldState={presence.field}
        expanded={boot === "ready" && presence.studio === STUDIO_VISUAL_PRESENCE_V1.THINKING}
        className="bottom-32"
      />

      <StudioLiveRoomDrawerV1
        open={drawerOpen}
        onToggle={() => setDrawerOpen((o) => !o)}
        tab={drawerTab}
        onTab={setDrawerTab}
        voice={voiceSnap}
        presence={presence}
        cameraMode={cameraMode}
        loadReport={loadReport}
        transcript={transcript}
        rhizohReply={rhizohReply}
      />
    </div>
  );
});
