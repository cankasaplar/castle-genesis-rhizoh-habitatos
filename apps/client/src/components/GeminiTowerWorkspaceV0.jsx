import React, { memo, useCallback, useEffect, useRef, useState } from "react";
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
import { RhizohTowerLlmConnectionsStripV0 } from "./RhizohTowerLlmConnectionsStripV0.jsx";

const C = GEMINI_TOWER_DESIGN_V0.identity.colors;

function MuseMessage({ sender, text }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] leading-relaxed text-white/85">
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
        `"${text}" fikrini görselleştirdim. (local manifest — Imagen API bağlanınca gerçek üretim.)`
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
    saveGeminiTowerGalleryWorkV0({ image, prompt });
    onMuseMessage("Prism Gallery", "Masterpiece saved to Prism Gallery.");
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

const LobbyRoomV0 = memo(function LobbyRoomV0() {
  const [gallery, setGallery] = useState(() => readGeminiTowerGalleryV0());

  useEffect(() => {
    const refresh = () => setGallery(readGeminiTowerGalleryV0());
    window.addEventListener(GEMINI_TOWER_GALLERY_UPDATED_EVENT_V0, refresh);
    return () => window.removeEventListener(GEMINI_TOWER_GALLERY_UPDATED_EVENT_V0, refresh);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="text-[11px] text-white/70">
        Holographic welcome — masonry grid of your manifested works.
      </p>
      <div
        id="lobby-gallery-grid"
        className="mt-3 grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4"
      >
        {gallery.length === 0 ? (
          <p className="col-span-full text-center text-[11px] text-white/45">
            No artifacts yet. Visit Imagine Atelier to create!
          </p>
        ) : (
          gallery.map((art) => (
            <div
              key={art.id}
              className="gallery-card overflow-hidden rounded-lg border border-white/10 transition hover:scale-[1.02]"
            >
              <img src={art.image} alt="" className="block w-full" />
              {art.prompt ? (
                <p className="truncate px-1 py-0.5 text-[9px] text-white/50">{art.prompt}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

function PlaceholderRoomV0({ room }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 p-6 text-center">
      <span className="text-4xl">{room.icon}</span>
      <h3 className="mt-3 text-sm font-bold text-white">{room.name}</h3>
      <p className="mt-2 max-w-md text-[11px] leading-relaxed text-white/60">{room.description}</p>
      <p className="mt-4 text-[10px] uppercase tracking-wider text-cyan-300/80">
        Room shell ready · wire Three.js / timeline / vision API next
      </p>
    </div>
  );
}

/**
 * Full-screen Gemini Visual Master Tower workspace (V11).
 */
export const GeminiTowerWorkspaceV0 = memo(function GeminiTowerWorkspaceV0({ open, onClose, uiLocale = "en" }) {
  const tr = uiLocale === "tr";
  const [roomId, setRoomId] = useState(resolveDefaultGeminiTowerRoomIdV0);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [status, setStatus] = useState("");
  const [museMessages, setMuseMessages] = useState(() => [
    { id: "welcome", sender: "Gemini Muse", text: "Imagine. Create. Manifest. — Type a prompt and hit Generate." }
  ]);

  const addMuseMessage = useCallback((sender, text) => {
    setMuseMessages((prev) => [...prev.slice(-24), { id: `${Date.now()}_${prev.length}`, sender, text }]);
  }, []);

  if (!open) return null;

  const activeRoom = GEMINI_TOWER_DESIGN_V0.rooms.find((r) => r.id === roomId) || GEMINI_TOWER_DESIGN_V0.rooms[1];

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
          <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
            {activeRoom.icon} {activeRoom.name}
          </p>
          {roomId === "imagine_atelier" ? (
            <ImagineAtelierRoomV0 museMessages={museMessages} onMuseMessage={addMuseMessage} onStatus={setStatus} />
          ) : roomId === "lobby" ? (
            <LobbyRoomV0 />
          ) : (
            <PlaceholderRoomV0 room={activeRoom} />
          )}
        </main>
      </div>
    </div>
  );
});
