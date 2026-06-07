import React, { memo, useCallback, useEffect, useState } from "react";
import {
  CASTLE_PWE_EVENT_V0,
  patchCastlePwePresenceStateV0,
  patchCastlePweStateV0,
  readCastlePweV0
} from "../castleFlight/castlePersistentWorldEntityV0.js";
import {
  COMPANION_PRESENCE_STATE_LIST_V0,
  COMPANION_PRESENCE_STATE_LABELS_TR_V0
} from "../castleFlight/companionPresenceStateV0.js";
import { CompanionTimelinePanelV0 } from "./CompanionTimelinePanelV0.jsx";

const MOODS = Object.freeze(["idle", "guard", "curious", "sleep", "explore"]);
const ANIMS = Object.freeze(["idle", "walk", "sleep", "explore"]);

export const CastlePetStudioPanelV0 = memo(function CastlePetStudioPanelV0() {
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    window.addEventListener(CASTLE_PWE_EVENT_V0, bump);
    const id = window.setInterval(bump, 4000);
    return () => {
      window.removeEventListener(CASTLE_PWE_EVENT_V0, bump);
      window.clearInterval(id);
    };
  }, [bump]);

  void tick;
  const pwe = readCastlePweV0();

  if (!pwe?.mounted) {
    return (
      <section
        className="rounded-lg border border-white/10 bg-black/35 px-3 py-3 normal-case"
        data-castle-pet-studio="idle"
      >
        <p className="text-[10px] text-white/55">
          Companion henüz yok. Dünya gözlemini tamamladıktan sonra (konumlu veya konumsuz) Shane burada görünür —
          kale zorunlu değil.
        </p>
      </section>
    );
  }

  const onPatch = (patch) => {
    patchCastlePweStateV0(patch, { source: "castle_pet_studio" });
    bump();
  };

  const onPresenceState = (state) => {
    patchCastlePwePresenceStateV0(state, { source: "castle_pet_studio" });
    bump();
  };

  const geo =
    pwe.anchor.mode === "geo" && Number.isFinite(pwe.anchor.lat)
      ? `${pwe.anchor.lat.toFixed(5)}, ${pwe.anchor.lon.toFixed(5)}`
      : pwe.anchor.mode === "abstract"
        ? "Soyut düğüm (harita anchor yok)"
        : "—";

  return (
    <section
      className="rounded-lg border border-cyan-400/25 bg-cyan-950/15 px-3 py-3 space-y-3 normal-case"
      data-castle-pet-studio="active"
    >
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-100/90">
            Companion studio (Shane)
          </p>
          <p className="text-[9px] text-white/50 font-mono">{pwe.id}</p>
        </div>
        <span className="text-[8px] uppercase text-emerald-300/80 border border-emerald-400/30 rounded px-1.5 py-0.5">
          always mounted
        </span>
      </header>

      <p className="text-[9px] text-white/60">
        Companion baktığın yerde · kamera = birincil · harita pini = ikincil ·{" "}
        <span className="font-mono">{pwe.render.modelRef}</span>
      </p>

      <div className="rounded-lg border border-violet-400/20 bg-violet-950/20 px-2 py-2 text-[9px] text-violet-100/85 space-y-1">
        <p>
          Gözlem alanı:{" "}
          <span className="font-mono">
            {pwe.presence?.observable ? "açık (Shane baktığın yerde)" : pwe.presence?.dormancy || "beklemede"}
          </span>
        </p>
        <p>
          Presence state (truth):{" "}
          <span className="font-mono">
            {COMPANION_PRESENCE_STATE_LABELS_TR_V0[pwe.presence?.state] || pwe.presence?.state || "observing"}
          </span>
        </p>
        <p>
          Castle:{" "}
          {pwe.castleLink?.bound ? "continuity archive bağlı" : "opsiyonel — hafıza merkezi yok"}
        </p>
      </div>

      <label className="block text-[9px] text-white/70">
        Presence state (PWE — animasyon değil)
        <select
          className="mt-1 w-full rounded border border-violet-400/30 bg-black/50 px-2 py-1 text-[10px] text-white"
          value={pwe.presence?.state || "observing"}
          onChange={(e) => onPresenceState(e.target.value)}
        >
          {COMPANION_PRESENCE_STATE_LIST_V0.map((s) => (
            <option key={s} value={s}>
              {COMPANION_PRESENCE_STATE_LABELS_TR_V0[s] || s}
            </option>
          ))}
        </select>
      </label>

      <CompanionTimelinePanelV0 />

      <label className="block text-[9px] text-white/70">
        Harita pini (ikincil)
        <span className="ml-1 font-mono text-cyan-200/80">{geo}</span>
      </label>

      <label className="block text-[9px] text-white/70">
        Mood
        <select
          className="mt-1 w-full rounded border border-white/15 bg-black/50 px-2 py-1 text-[10px] text-white"
          value={pwe.state.mood}
          onChange={(e) => onPatch({ mood: e.target.value })}
        >
          {MOODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-[9px] text-white/70">
        Energy {Math.round(pwe.state.energy * 100)}%
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(pwe.state.energy * 100)}
          className="mt-1 w-full accent-cyan-400"
          onChange={(e) => onPatch({ energy: Number(e.target.value) / 100 })}
        />
      </label>

      <label className="block text-[9px] text-white/70">
        Trust {Math.round(pwe.state.trust * 100)}%
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(pwe.state.trust * 100)}
          className="mt-1 w-full accent-cyan-400"
          onChange={(e) => onPatch({ trust: Number(e.target.value) / 100 })}
        />
      </label>

      <label className="block text-[9px] text-white/70">
        Animation
        <select
          className="mt-1 w-full rounded border border-white/15 bg-black/50 px-2 py-1 text-[10px] text-white"
          value={pwe.state.animation}
          onChange={(e) => onPatch({ animation: e.target.value })}
        >
          {ANIMS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-[9px] text-white/70">
        Scale {pwe.state.scale.toFixed(2)}
        <input
          type="range"
          min={25}
          max={200}
          value={Math.round(pwe.state.scale * 100)}
          className="mt-1 w-full accent-cyan-400"
          onChange={(e) => onPatch({ scale: Number(e.target.value) / 100 })}
        />
      </label>

      <label className="block text-[9px] text-white/70">
        Tint
        <input
          type="color"
          value={pwe.state.appearance?.tint || "#22d3ee"}
          className="mt-1 h-7 w-full rounded border border-white/15 bg-black/50"
          onChange={(e) => onPatch({ appearance: { tint: e.target.value } })}
        />
      </label>
    </section>
  );
});
