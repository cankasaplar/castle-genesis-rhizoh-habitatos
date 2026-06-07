import React, { useMemo, useState } from "react";
import { Camera, Mic, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { OctoConversationStageV1 } from "./OctoConversationStageV1.jsx";
import { OBSERVER_SPECIES_FOX_V1 } from "./observerSpeciesRegistryV0.js";
import { resolveConversationAnchorModelUrlV0 } from "./conversationAnchorSpeciesV0.js";
import {
  deriveFoxCompanionBehaviorDriveV1,
  isCompanionBehaviorOnlyV0
} from "./companionBehaviorOnlyV0.js";
import {
  isOctoConversationLiveV1
} from "./octoConversationMotionV1.js";
import {
  listFoxAnimationCatalogV1,
  resolveFoxMotionStateV1
} from "./foxConversationMotionV1.js";

const MOTION_PRESETS = Object.freeze([
  { id: "idle", label: "Bekle", field: "idle", busy: false, motionOverride: null },
  { id: "listen", label: "Dinle", field: "listening", busy: false, motionOverride: null },
  { id: "think", label: "Düşün", field: "thinking", busy: true, motionOverride: null },
  { id: "walk", label: "Yürü", field: "idle", busy: false, draftSeed: "cube'a yaklaş", motionOverride: "walk" },
  { id: "trot", label: "Koş", field: "idle", busy: true, draftSeed: "cube'a koş", motionOverride: "trot" },
  { id: "approach", label: "Cube'a yaklaş", field: "idle", busy: false, draftSeed: "…", motionOverride: "walk" },
  { id: "rhizoh_speak", label: "Rhizoh konuşuyor", field: "speaking", busy: false, clearReply: true, motionOverride: null },
  { id: "rhizoh_think", label: "Rhizoh düşünüyor", field: "interpreting", busy: true, clearReply: true, motionOverride: null },
  { id: "retreat", label: "Uzaklaş", field: "thinking", busy: false, clearReply: true, motionOverride: null }
]);

/**
 * FOX anchor lab — tam boy sahne, yakın kamera, animasyon test paneli.
 * Route: /dev/fox-lab
 */
export function FoxConversationLabPageV1() {
  const [draft, setDraft] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldState, setFieldState] = useState("idle");
  const [loadState, setLoadState] = useState("loading");
  const [stageHeight, setStageHeight] = useState(360);
  const [submitPulse, setSubmitPulse] = useState(0);
  const [motionOverride, setMotionOverride] = useState(null);

  const modelUrl = resolveConversationAnchorModelUrlV0(OBSERVER_SPECIES_FOX_V1.id);

  const drive = useMemo(
    () =>
      deriveFoxCompanionBehaviorDriveV1({
        fieldState,
        draftText: draft,
        busy
      }),
    [fieldState, draft, busy]
  );

  const foxMotion = useMemo(() => resolveFoxMotionStateV1(drive), [drive]);

  const live = useMemo(
    () =>
      isOctoConversationLiveV1({
        fieldState,
        replyText: "",
        draftText: draft,
        busy
      }) || fieldState === "speaking" || fieldState === "executing",
    [fieldState, draft, busy]
  );

  const simulateSend = () => {
    const text = draft.trim();
    if (!text) return;
    setSubmitPulse((p) => p + 1);
    setBusy(true);
    setFieldState("interpreting");
    window.setTimeout(() => {
      setReply(text);
      setDraft("");
      setFieldState("speaking");
      setBusy(false);
    }, 900);
  };

  const applyPreset = (preset) => {
    setFieldState(preset.field);
    setBusy(Boolean(preset.busy));
    if (preset.clearReply) setReply("");
    if (preset.draftSeed !== undefined) setDraft(preset.draftSeed);
    else if (!preset.motionOverride) setDraft("");
    setMotionOverride(preset.motionOverride ?? null);
  };

  const loadColor =
    loadState === "ready"
      ? "text-emerald-300"
      : loadState === "loading"
        ? "text-amber-200"
        : "text-rose-300";

  return (
    <div className="flex min-h-screen flex-col bg-[#010103] text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold tracking-wide text-amber-100">FOX Studio Lab</h1>
          <p className="mt-0.5 text-[10px] text-white/50 normal-case">
            Companion davranış temsili · konuşmaz · cube Rhizoh yanıtına senkron
          </p>
          {isCompanionBehaviorOnlyV0(OBSERVER_SPECIES_FOX_V1.id) ? (
            <p
              className="mt-1 text-[9px] font-medium text-amber-200/80"
              data-rhizoh-companion-behavior-only="1"
            >
              Companion · davranış temsili · Konuşmaz — dinler, izler, eşlik eder
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Link
            to="/"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-[10px] text-white/70 hover:border-cyan-400/40 hover:text-cyan-100"
          >
            ← T0
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-3 pb-10 pt-4 sm:px-4">
        <div className="mb-3 w-full max-w-4xl rounded-xl border border-amber-400/20 bg-black/60 px-3 py-2 text-[10px] font-mono normal-case text-white/75">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              Species: <span className="text-amber-200/90">{OBSERVER_SPECIES_FOX_V1.id}</span>
            </span>
            <span>
              GLB: <span className="text-cyan-200/90">{modelUrl}</span>
            </span>
            <span>
              Yükleme: <span className={loadColor}>{loadState}</span>
            </span>
            <span>
              Canlı: <span className={live ? "text-emerald-300" : "text-white/45"}>{live ? "evet" : "hayır"}</span>
            </span>
            <span>motion: {foxMotion}</span>
            <span>emotion: {drive.emotion}</span>
          </div>
          <label className="mt-2 flex items-center gap-2">
            <span className="shrink-0 text-white/50">Sahne yüksekliği</span>
            <input
              type="range"
              min={240}
              max={520}
              value={stageHeight}
              onChange={(e) => setStageHeight(Number(e.target.value))}
              className="flex-1 accent-amber-400"
            />
            <span className="w-10 text-right text-amber-200/80">{stageHeight}px</span>
          </label>
          <ul className="mt-2 grid gap-0.5 text-[9px] text-white/45 sm:grid-cols-2">
            {listFoxAnimationCatalogV1().map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="mb-2 flex w-full max-w-4xl flex-wrap gap-1.5">
          {MOTION_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-lg border border-white/12 px-2.5 py-1 text-[9px] text-white/70 hover:border-amber-400/40 hover:text-amber-100"
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSubmitPulse((n) => n + 1)}
            className="rounded-lg border border-amber-400/30 px-2.5 py-1 text-[9px] text-amber-100/90"
          >
            Jump_ToIdle
          </button>
        </div>

        <div className="w-full max-w-4xl">
          {reply ? (
            <div className="mb-2 rounded-lg border border-amber-400/30 bg-amber-950/25 px-3 py-2 text-[11px] text-white/90 normal-case">
              {reply}
              <button
                type="button"
                className="mt-1 block text-[9px] text-white/55 underline"
                onClick={() => {
                  setReply("");
                  setFieldState("idle");
                }}
              >
                Kapat
              </button>
            </div>
          ) : null}

          <OctoConversationStageV1
            labMode
            anchorSpeciesId={OBSERVER_SPECIES_FOX_V1.id}
            fieldState={fieldState}
            replyText={reply}
            draftText={draft}
            busy={busy}
            submitPulse={submitPulse}
            foxMotionOverride={motionOverride}
            height={stageHeight}
            heightMax={560}
            onLoadStateChange={setLoadState}
          />

          <div
            className="relative overflow-hidden rounded-b-2xl rounded-t-none border border-white/15 border-t-0 bg-black/75 shadow-[0_0_32px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            data-rhizoh-unified-input="1"
            data-fox-lab-input="1"
          >
            <div className="relative flex items-center gap-1.5 px-2 py-2">
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/75"
                aria-label="Kamera"
              >
                <Camera className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/75"
                aria-label="Mikrofon"
              >
                <Mic className="h-4 w-4" />
              </button>
              <input
                id="fox-lab-command"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !busy) {
                    e.preventDefault();
                    simulateSend();
                  }
                }}
                autoComplete="off"
                disabled={busy}
                placeholder="Rhizoh'a yaz…"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none normal-case placeholder:text-white/40"
                aria-label="Mesaj"
              />
              <button
                type="button"
                onClick={simulateSend}
                disabled={busy || !draft.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/90 text-black disabled:opacity-40"
                aria-label="Gönder"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 border-t border-white/8 px-3 py-1.5 text-[8px] normal-case text-white/45">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />
              <span>Lab: FOX hero kamera · yuva · cube · GLB clip test</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-white/12 px-2.5 py-1 text-[9px] text-white/65 hover:border-amber-400/35"
              onClick={() => {
                setReply(DEMO_REPLY);
                setFieldState("speaking");
              }}
            >
              Uzun yanıt
            </button>
            <button
              type="button"
              className="rounded-lg border border-white/12 px-2.5 py-1 text-[9px] text-white/65 hover:border-amber-400/35"
              onClick={() => {
                setReply("");
                setDraft("");
                setBusy(false);
                setFieldState("idle");
                setMotionOverride(null);
              }}
            >
              Sıfırla
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/** @deprecated use FoxConversationLabPageV1 */
export const OctoConversationLabPageV1 = FoxConversationLabPageV1;
