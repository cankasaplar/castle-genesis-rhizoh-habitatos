import React from "react";
import { RHIZOH_PRODUCT_TOPOLOGY_V0 } from "../../rhizoh/product/rhizohProductTopologyV0.js";

/** Phase P1 — single product navigation (one UX language with the studio drawer). */
export const PRODUCT_SHELL_ITEMS = [
  { id: "world", label: "World" },
  { id: "hall", label: "Hall" },
  { id: "greenroom", label: "Green Room" },
  { id: "broadcast", label: "Broadcast" },
  { id: "studio", label: "Studio" },
  { id: "profile", label: "Profile" }
];

export const PRODUCT_SHELL_IDS = new Set(PRODUCT_SHELL_ITEMS.map((x) => x.id));

/**
 * @param {{ active: string, onSelect: (id: string) => void }} props
 */
export function UnifiedProductShellBar({ active, onSelect }) {
  return (
    <nav
      className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[61] border-t border-cyan-400/20 bg-[#030711]/92 backdrop-blur-xl"
      aria-label="Rhizoh product"
    >
      <div className="mx-auto flex max-w-4xl items-stretch justify-between gap-0.5 overflow-x-auto px-1 py-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] no-scrollbar sm:gap-1 sm:px-2">
        {PRODUCT_SHELL_ITEMS.map((item) => {
          const on = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              title={RHIZOH_PRODUCT_TOPOLOGY_V0[item.id]?.labelTr || item.label}
              onClick={() => onSelect(item.id)}
              className={`min-w-[3.25rem] flex-1 touch-manipulation rounded-lg border px-1 py-2 text-[8px] font-black uppercase tracking-[0.14em] transition-colors sm:min-w-0 sm:px-2 sm:text-[9px] sm:tracking-[0.18em] ${
                on
                  ? "border-cyan-400/45 bg-cyan-500/20 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.12)]"
                  : "border-transparent bg-black/20 text-white/50 hover:border-white/10 hover:text-white/75"
              }`}
            >
              <span className="block truncate normal-case tracking-normal opacity-95 sm:hidden">{item.label.split(" ")[0]}</span>
              <span className="hidden sm:block">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
