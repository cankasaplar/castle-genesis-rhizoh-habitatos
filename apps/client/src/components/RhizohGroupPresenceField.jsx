import { useEffect } from "react";

const STYLE_ID = "rhizoh-group-presence-keyframes";

function ensureGroupKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
@keyframes rhizoh-group-pulse-line {
  0%, 100% { opacity: 0.25; stroke-width: 1; }
  50% { opacity: 0.85; stroke-width: 2; }
}
@keyframes rhizoh-group-ambient {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(1.04); }
}
  `;
  document.head.appendChild(s);
}

/**
 * Çoklu orbit — bondGraph + attention; aktif konuşmacıya pulse çizgisi.
 */
export function RhizohGroupPresenceField({ socialField = null, pulseNonce = 0 }) {
  useEffect(() => {
    ensureGroupKeyframes();
  }, []);

  if (!socialField || typeof socialField !== "object") return null;

  const bond = socialField.bondGraph && typeof socialField.bondGraph === "object" ? socialField.bondGraph : {};
  const att = socialField.attention && typeof socialField.attention === "object" ? socialField.attention : {};
  const room = socialField.roomState && typeof socialField.roomState === "object" ? socialField.roomState : {};
  const voice = socialField.voiceHint && typeof socialField.voiceHint === "object" ? socialField.voiceHint : {};

  const nodes = Object.entries(bond).map(([id, row]) => ({
    id,
    label: (row && row.label) || id
  }));

  const primaryId = att.primaryId ? String(att.primaryId) : "";
  const hasNodes = nodes.length > 0;
  const ambientOnly = !hasNodes || att.mode === "room_observe";

  const energy = Number(room.energy) || 0;
  const cohesion = Number(room.cohesion) || 0;

  return (
    <div className="rounded-2xl border border-violet-400/20 bg-black/25 px-2 py-2 overflow-hidden">
      <div className="text-[8px] tracking-[0.28em] font-bold text-violet-200/90 mb-1.5">GROUP FIELD</div>
      <div className="relative min-h-[72px] flex items-center justify-center gap-1 flex-wrap px-1">
        {hasNodes ? (
          nodes.map((n, i) => {
            const active = primaryId && n.id === primaryId;
            return (
              <div key={n.id} className="flex flex-col items-center gap-0.5" style={{ order: i }}>
                <span
                  className={`text-[8px] max-w-[52px] truncate ${active ? "text-cyan-200 font-semibold" : "text-white/55"}`}
                  title={n.label}
                >
                  {n.label}
                </span>
                <div className="relative">
                  {active ? (
                    <svg
                      className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none"
                      viewBox="0 0 40 40"
                      aria-hidden
                    >
                      <line
                        x1="20"
                        y1="36"
                        x2="20"
                        y2="8"
                        stroke="rgba(34,211,238,0.5)"
                        strokeDasharray="3 2"
                        style={{ animation: "rhizoh-group-pulse-line 1.6s ease-in-out infinite" }}
                      />
                    </svg>
                  ) : null}
                  <div
                    className={`h-2.5 w-2.5 rounded-full border ${
                      active ? "border-cyan-300/80 bg-cyan-400/35 shadow-[0_0_10px_rgba(34,211,238,0.35)]" : "border-white/20 bg-white/10"
                    }`}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div
            className="h-16 w-16 rounded-full border border-violet-400/25 bg-violet-500/10"
            style={{ animation: "rhizoh-group-ambient 4s ease-in-out infinite" }}
            title="Oda gözlemi"
          />
        )}
        <div className="flex flex-col items-center gap-0.5 mx-1 order-[100]">
          <div className="text-[7px] text-white/40">Rhizoh</div>
          <div className="h-3 w-3 rounded-full bg-gradient-to-br from-violet-400/90 to-cyan-400/70 shadow-[0_0_12px_rgba(139,92,246,0.45)]" />
        </div>
      </div>
      <div className="mt-1.5 text-[7px] text-white/45 leading-relaxed space-y-0.5">
        <div>
          Oda: e={energy.toFixed(2)} c={cohesion.toFixed(2)}
          {room.focusTopic ? ` · ${String(room.focusTopic)}` : ""}
          {ambientOnly ? " · gözlem" : ""}
        </div>
        <div className="truncate" title={String(voice.rationale || "")}>
          Rota: {voice.type || "—"}
          {voice.addressee ? ` → @${voice.addressee}` : ""}
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        group presence tick {pulseNonce}
      </span>
    </div>
  );
}
