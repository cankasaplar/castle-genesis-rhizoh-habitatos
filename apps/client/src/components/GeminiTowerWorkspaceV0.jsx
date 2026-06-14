import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useCastleAuth } from "../firebase/useCastleAuth.js";
import {
  GEMINI_TOWER_DESIGN_V0,
  resolveDefaultGeminiTowerRoomIdV0
} from "../rhizoh/runtime/geminiTowerDesignV0.js";
import {
  GEMINI_TOWER_GALLERY_UPDATED_EVENT_V0,
  readGeminiTowerGalleryV0,
  saveGeminiTowerGalleryWorkV0
} from "../rhizoh/runtime/geminiTowerGalleryV0.js";
import {
  analyzeGeminiTowerCanvasV0,
  enhanceGeminiTowerSketchV0,
  generateGeminiTowerImageV0
} from "../rhizoh/runtime/geminiTowerBrainV0.js";
import {
  MEDIA_CIVILIZATION_ACTION_V0,
  runMediaCivilizationPipelineV0
} from "../rhizoh/runtime/mediaCivilizationBridgeV0.js";
import { speakRhizohReplyChunkedV0 } from "../rhizoh/runtime/rhizohSpeechChunkTtsV0.js";
import { RhizohTowerLlmConnectionsStripV0 } from "./RhizohTowerLlmConnectionsStripV0.jsx";
import { RhizohTowerLiveStatusBadgeV0 } from "./RhizohTowerLiveStatusBadgeV0.jsx";
import { RhizohTowerMediaConnectBarV0 } from "./RhizohTowerMediaConnectBarV0.jsx";
import { RhizohTowerVoiceChatV0 } from "./RhizohTowerVoiceChatV0.jsx";

const C = GEMINI_TOWER_DESIGN_V0.identity.colors;

const MEDIA_ROOM_IDS_V0 = new Set(["vision_lens", "tower_voice", "imagine_atelier", "motion_deck"]);

function MuseMessage({ sender, text, large = false }) {
  return (
    <div
      className={`rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 leading-relaxed text-white/85 ${
        large ? "text-[13px]" : "text-[11px]"
      }`}
    >
      <span className="font-bold text-fuchsia-300">{sender}: </span>
      {text}
    </div>
  );
}

const ImagineAtelierRoomV0 = memo(function ImagineAtelierRoomV0({
  museMessages,
  onMuseMessage,
  onStatus
}) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState("");
  const overlayImageRef = useRef(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (overlayImageRef.current) {
      ctx.drawImage(overlayImageRef.current, 0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 960;
    canvas.height = 540;
    redraw();
  }, [redraw]);

  const paintStroke = useCallback((ev) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((ev.clientY - rect.top) / rect.height) * canvas.height;
    ctx.strokeStyle = "rgba(217, 70, 239, 0.85)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const onGenerate = useCallback(async () => {
    const text = prompt.trim();
    if (!text) {
      onMuseMessage("Gemini Muse", "Lütfen önce ne çizmemi istediğini sağ alttaki kutuya yaz.");
      return;
    }
    setBusy("generate");
    onStatus("🎨 Dreaming...");
    const result = await generateGeminiTowerImageV0(text);
    if (!result.ok) {
      onMuseMessage("Gemini Muse", "Generate başarısız — prompt boş veya canvas hazır değil.");
      onStatus("");
      setBusy("");
      return;
    }
    const img = new Image();
    img.onload = () => {
      overlayImageRef.current = img;
      redraw();
      onMuseMessage(
        "Gemini Muse",
        result.brief
          ? `"${text}" — Gemini metin brief: ${result.brief} (görsel: yerel manifest; Imagen API sonraki sprint.)`
          : `"${text}" — yerel renk manifesti oluşturuldu. Gerçek Imagen üretimi gateway Imagen endpoint ile gelecek.`
      );
      onStatus("✅ Manifested!");
      setBusy("");
    };
    img.src = result.url;
  }, [prompt, onMuseMessage, onStatus, redraw]);

  const onEnhance = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy("enhance");
    onStatus("👁️ Enhancing...");
    const sketch = canvas.toDataURL("image/png");
    const result = await enhanceGeminiTowerSketchV0(sketch, prompt);
    if (!result.ok) {
      onMuseMessage("Gemini Muse", "Enhance için önce canvas'ta bir şey çiz veya generate et.");
      onStatus("");
      setBusy("");
      return;
    }
    const img = new Image();
    img.onload = () => {
      overlayImageRef.current = img;
      redraw();
      onMuseMessage("Gemini Muse", result.feedback || "Sketch enhanced.");
      onStatus("✨ Enhanced!");
      setBusy("");
    };
    img.src = result.url;
  }, [prompt, onMuseMessage, onStatus, redraw]);

  const onSaveGallery = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = canvas.toDataURL("image/png", 0.85);
    const title = prompt.trim().slice(0, 120) || "Imagine Atelier work";
    saveGeminiTowerGalleryWorkV0({ image, prompt });
    runMediaCivilizationPipelineV0({
      action: MEDIA_CIVILIZATION_ACTION_V0.ARCHIVE,
      title,
      format: "image/png",
      content: prompt.trim() || title,
      mediaUrl: image,
      source: "gemini_tower",
      channelId: "imagine_atelier",
      tag: "prism_gallery"
    });
    onMuseMessage(
      "Prism Gallery",
      "Masterpiece saved to Prism Gallery and Castle Archive (Codex Vault / Library)."
    );
  }, [prompt, onMuseMessage]);

  return (
    <div className="flex min-h-0 flex-1 gap-3">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/40">
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-crosshair touch-none"
          style={{ background: C.background }}
          onPointerDown={(ev) => {
            drawingRef.current = true;
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!ctx || !canvas) return;
            ctx.beginPath();
            paintStroke(ev);
          }}
          onPointerMove={(ev) => {
            if (!drawingRef.current) return;
            paintStroke(ev);
          }}
          onPointerUp={() => {
            drawingRef.current = false;
          }}
          onPointerLeave={() => {
            drawingRef.current = false;
          }}
        />
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/15 bg-black/50 px-2 py-1 text-[9px] uppercase tracking-wider text-white/60">
          Infinite canvas · layered · HUD tools
        </div>
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy === "generate"}
            onClick={() => void onGenerate()}
            className="rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg disabled:opacity-50"
            style={{ background: C.gradient }}
            id="btn-generate"
          >
            {busy === "generate" ? "✨ Dreaming…" : "✨ Generate"}
          </button>
          <button
            type="button"
            disabled={busy === "enhance"}
            onClick={() => void onEnhance()}
            className="rounded-lg border border-violet-400/40 bg-violet-500/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-100 disabled:opacity-50"
            id="btn-enhance"
          >
            {busy === "enhance" ? "👁️ Looking…" : "⚡ Enhance"}
          </button>
          <button
            type="button"
            onClick={onSaveGallery}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/90"
            id="btn-save-gallery"
          >
            💾 Save to Gallery
          </button>
        </div>
      </div>
      <div
        className="flex w-[min(100%,350px)] shrink-0 flex-col rounded-xl border border-fuchsia-400/25 bg-slate-900/80 p-3 backdrop-blur-md"
        data-rhizoh-gemini-muse-panel="1"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-300">Gemini Muse</p>
        <div className="gemini-muse-body mt-2 flex max-h-48 flex-col gap-2 overflow-y-auto">
          {museMessages.map((m) => (
            <MuseMessage key={m.id} sender={m.sender} text={m.text} />
          ))}
        </div>
        <textarea
          className="chat-input mt-3 min-h-[72px] w-full resize-none rounded-lg border border-white/15 bg-black/40 p-2 text-[11px] text-white outline-none focus:border-fuchsia-400/50"
          placeholder="A futuristic city in neon rain…"
          value={prompt}
          onChange={(ev) => setPrompt(ev.target.value)}
        />
      </div>
    </div>
  );
});

const LobbyRoomV0 = memo(function LobbyRoomV0({ uiLocale = "en" }) {
  const tr = uiLocale === "tr";
  const [gallery, setGallery] = useState(() => readGeminiTowerGalleryV0());

  useEffect(() => {
    const refresh = () => setGallery(readGeminiTowerGalleryV0());
    window.addEventListener(GEMINI_TOWER_GALLERY_UPDATED_EVENT_V0, refresh);
    return () => window.removeEventListener(GEMINI_TOWER_GALLERY_UPDATED_EVENT_V0, refresh);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="text-[12px] leading-relaxed text-white/75">
        {tr
          ? "Prism Gallery — Imagine Atelier'de ürettiğin ve kaydettiğin eserler burada. Yerel tarayıcı galerisi; Save to Gallery ile eklenir."
          : "Prism Gallery — works you generate and save in Imagine Atelier. Local browser gallery; use Save to Gallery."}
      </p>
      <div
        id="lobby-gallery-grid"
        className="mt-3 grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4"
      >
        {gallery.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-black/25 py-10 text-center">
            <span className="text-3xl">💎</span>
            <p className="text-[12px] text-white/55">
              {tr ? "Henüz eser yok." : "No artifacts yet."}
            </p>
            <p className="max-w-sm text-[11px] text-white/40">
              {tr
                ? "Imagine Atelier'de prompt yaz → Generate → Save to Gallery."
                : "Imagine Atelier: prompt → Generate → Save to Gallery."}
            </p>
          </div>
        ) : (
          gallery.map((art) => (
            <div
              key={art.id}
              className="gallery-card overflow-hidden rounded-lg border border-white/10 transition hover:scale-[1.02]"
            >
              <img src={art.image} alt="" className="block w-full" />
              {art.prompt ? (
                <p className="truncate px-2 py-1 text-[10px] text-white/60">{art.prompt}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

const VisionLensRoomV0 = memo(function VisionLensRoomV0({
  uiLocale,
  visionFrame,
  idToken = "",
  onAnalyzeResult,
  onStatus
}) {
  const tr = uiLocale === "tr";
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState("");

  const onAnalyze = useCallback(async () => {
    if (!visionFrame) {
      onAnalyzeResult(
        tr ? "Önce üstteki kamerayı aç ve Kare yakala'ya bas." : "Open the camera above and capture a frame first.",
        { speak: false }
      );
      return;
    }
    setBusy(true);
    onStatus(tr ? "👁️ Analiz…" : "👁️ Analyzing…");
    const result = await analyzeGeminiTowerCanvasV0(visionFrame, { idToken });
    setAnalysis(result);
    onAnalyzeResult(result, { speak: true });
    onStatus("");
    setBusy(false);
  }, [idToken, onAnalyzeResult, onStatus, tr, visionFrame]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
        {visionFrame ? (
          <img
            src={visionFrame}
            alt=""
            className="aspect-square h-28 w-28 shrink-0 rounded-xl border border-white/15 object-cover bg-black/50"
          />
        ) : (
          <div className="flex aspect-square h-28 w-28 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/40 p-2 text-center text-[10px] leading-snug text-white/45">
            {tr ? "Üstten kare yakala" : "Capture frame above"}
          </div>
        )}
        <button
          type="button"
          disabled={busy || !visionFrame}
          onClick={() => void onAnalyze()}
          className="h-fit shrink-0 rounded-lg border border-violet-400/40 bg-violet-500/25 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-violet-50 disabled:opacity-40"
        >
          {busy ? (tr ? "Analiz ediliyor…" : "Analyzing…") : tr ? "Gemini Vision analizi" : "Run Gemini Vision"}
        </button>
      </div>
      <div className="flex min-h-[200px] flex-1 flex-col rounded-xl border border-fuchsia-400/25 bg-slate-900/70 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-300">
          {tr ? "Vision analizi" : "Vision analysis"}
        </p>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          {analysis ? (
            <p className="text-[13px] leading-relaxed text-white/90">{analysis}</p>
          ) : (
            <p className="text-[12px] leading-relaxed text-white/45">
              {tr
                ? "Analiz sonucu burada büyük puntoda görünür ve sesli okunur."
                : "Analysis appears here in large type and is read aloud."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

const TowerVoiceRoomV0 = memo(function TowerVoiceRoomV0({
  uiLocale,
  towerId = "gemini_tower",
  visionFrame,
  idToken = ""
}) {
  const tr = uiLocale === "tr";
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <RhizohTowerVoiceChatV0
        towerId={towerId}
        uiLocale={uiLocale}
        surface="gemini_tower_voice"
        visionFrame={visionFrame}
        idToken={idToken}
      />
      <p className="text-[9px] text-white/40">
        {tr
          ? "Ses STT + gateway Gemini — üstteki kamera karesi vision bağlamına eklenir."
          : "Voice STT + gateway Gemini — camera frame from the bar above attaches as vision context."}
      </p>
    </div>
  );
});

const ComingSoonRoomV0 = memo(function ComingSoonRoomV0({ room, uiLocale, onOpenVoice }) {
  const tr = uiLocale === "tr";
  const isMotion = room.id === "motion_deck";
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 p-6 text-center">
      <span className="text-5xl">{room.icon}</span>
      <h3 className="mt-3 text-base font-bold text-white">{room.name}</h3>
      <p className="mt-2 max-w-lg text-[12px] leading-relaxed text-white/65">{room.description}</p>
      <p className="mt-4 max-w-md text-[11px] leading-relaxed text-amber-200/85">
        {isMotion
          ? tr
            ? "Video/GIF üretim katmanı henüz bağlı değil. Şimdilik Voice Link ile kamera + ses üzerinden komut verebilirsin."
            : "Video/GIF generation layer is not wired yet. Use Voice Link for camera + voice commands for now."
          : tr
            ? "3D keşif alanı bir sonraki sprintte. Şimdilik Imagine Atelier ve Vision Lens aktif."
            : "3D exploration space is scheduled for a later sprint. Imagine Atelier and Vision Lens are live now."}
      </p>
      {onOpenVoice ? (
        <button
          type="button"
          onClick={onOpenVoice}
          className="mt-4 rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-100"
        >
          {tr ? "Voice Link'e geç" : "Open Voice Link"}
        </button>
      ) : null}
    </div>
  );
});

/**
 * Full-screen Gemini Visual Master Tower workspace (V11).
 */
export const GeminiTowerWorkspaceV0 = memo(function GeminiTowerWorkspaceV0({ open, onClose, uiLocale = "en" }) {
  const tr = uiLocale === "tr";
  const castleAuth = useCastleAuth();
  const [idToken, setIdToken] = useState("");

  useEffect(() => {
    let cancelled = false;
    const user = castleAuth?.user;
    if (!user?.getIdToken) {
      setIdToken("");
      return undefined;
    }
    void user.getIdToken().then((token) => {
      if (!cancelled) setIdToken(String(token || ""));
    });
    return () => {
      cancelled = true;
    };
  }, [castleAuth?.user]);

  const [roomId, setRoomId] = useState(resolveDefaultGeminiTowerRoomIdV0);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [status, setStatus] = useState("");
  const [visionFrame, setVisionFrame] = useState(null);
  const [museMessages, setMuseMessages] = useState(() => [
    {
      id: "welcome",
      sender: "Gemini Muse",
      text:
        uiLocale === "tr"
          ? "Hayal et. Üret. Somutlaştır. — Alttaki kutuya yaz ve Üret'e bas."
          : "Imagine. Create. Manifest. — Type a prompt and hit Generate."
    }
  ]);

  const addMuseMessage = useCallback((sender, text) => {
    setMuseMessages((prev) => [...prev.slice(-24), { id: `${Date.now()}_${prev.length}`, sender, text }]);
  }, []);

  const onVisionAnalyzeResult = useCallback(
    (text, { speak = false } = {}) => {
      addMuseMessage("Vision Lens", text);
      if (speak && text) {
        void speakRhizohReplyChunkedV0(text, { language: uiLocale });
      }
    },
    [addMuseMessage, uiLocale]
  );

  if (!open) return null;

  const activeRoom = GEMINI_TOWER_DESIGN_V0.rooms.find((r) => r.id === roomId) || GEMINI_TOWER_DESIGN_V0.rooms[1];
  const showMediaBar = MEDIA_ROOM_IDS_V0.has(roomId);
  const mediaPreviewSize = "square";

  return (
    <div
      className="fixed inset-0 z-[320] flex flex-col"
      style={{ background: C.background, color: C.text }}
      data-rhizoh-gemini-tower-workspace="1"
      role="dialog"
      aria-label={GEMINI_TOWER_DESIGN_V0.identity.name}
    >
      <header
        className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 backdrop-blur-md"
        style={{ background: "rgba(15, 23, 42, 0.75)" }}
      >
        <div>
          <h1
            className="bg-gradient-to-br from-blue-500 to-fuchsia-500 bg-clip-text text-sm font-black tracking-wide text-transparent"
          >
            {GEMINI_TOWER_DESIGN_V0.identity.name}
          </h1>
          <p className="text-[10px] text-white/50">{GEMINI_TOWER_DESIGN_V0.identity.tagline}</p>
          <div className="mt-1">
            <RhizohTowerLiveStatusBadgeV0 towerId="gemini_tower" uiLocale={uiLocale} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status ? <span className="text-[10px] text-cyan-200/90">{status}</span> : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80 hover:bg-white/10"
          >
            {tr ? "Kapat" : "Close"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav
          className="flex shrink-0 flex-col gap-1 border-r border-white/10 p-2 transition-all duration-200"
          style={{
            width: sidebarExpanded ? 240 : 80,
            backdropFilter: "blur(10px)",
            background: "rgba(15, 23, 42, 0.6)"
          }}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          {GEMINI_TOWER_DESIGN_V0.rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => setRoomId(room.id)}
              className={`flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] transition ${
                roomId === room.id
                  ? "border border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100"
                  : "border border-transparent text-white/65 hover:bg-white/5"
              }`}
            >
              <span className="text-lg">{room.icon}</span>
              {sidebarExpanded ? <span className="truncate font-semibold">{room.name}</span> : null}
            </button>
          ))}
          {sidebarExpanded ? (
            <RhizohTowerLlmConnectionsStripV0 towerId="gemini_tower" uiLocale={uiLocale} />
          ) : null}
        </nav>

        <main className="flex min-h-0 flex-1 flex-col p-4">
          {showMediaBar ? (
            <RhizohTowerMediaConnectBarV0
              uiLocale={uiLocale}
              previewSize={mediaPreviewSize}
              showMedusa={false}
              onFrameCapture={(frame) => {
                if (!frame) return;
                setVisionFrame(frame);
                if (roomId === "imagine_atelier") {
                  addMuseMessage(
                    "Vision Lens",
                    tr
                      ? "Kamera karesi alındı — Vision Lens sekmesine geçip analiz edebilirsin."
                      : "Camera frame captured — switch to Vision Lens to analyze."
                  );
                }
              }}
            />
          ) : null}
          <p className="mb-2 mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
            {activeRoom.icon} {activeRoom.name}
          </p>
          {roomId === "imagine_atelier" ? (
            <ImagineAtelierRoomV0 museMessages={museMessages} onMuseMessage={addMuseMessage} onStatus={setStatus} />
          ) : roomId === "lobby" ? (
            <LobbyRoomV0 uiLocale={uiLocale} />
          ) : roomId === "vision_lens" ? (
            <VisionLensRoomV0
              uiLocale={uiLocale}
              visionFrame={visionFrame}
              idToken={idToken}
              onAnalyzeResult={onVisionAnalyzeResult}
              onStatus={setStatus}
            />
          ) : roomId === "tower_voice" ? (
            <TowerVoiceRoomV0
              uiLocale={uiLocale}
              towerId="gemini_tower"
              visionFrame={visionFrame}
              idToken={idToken}
            />
          ) : roomId === "motion_deck" || roomId === "dimension_sandbox" ? (
            <ComingSoonRoomV0
              room={activeRoom}
              uiLocale={uiLocale}
              onOpenVoice={() => setRoomId("tower_voice")}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
});
