import React from "react";
import {
  resolveProductSurfaceCopyV0,
  resolveShellHintsV0
} from "../../rhizoh/runtime/rhizohProductCopyI18nV0.js";
import { readUiLocaleV0 } from "../../rhizoh/runtime/rhizohUiLocaleV0.js";

const PRODUCT_SHELL_IDS_V0 = Object.freeze([
  "world",
  "hall",
  "greenroom",
  "broadcast",
  "studio",
  "profile"
]);

const PRODUCT_SHELL_STATUS_V0 = Object.freeze({
  greenroom: Object.freeze({ tr: "Beta", en: "Beta" }),
  broadcast: Object.freeze({ tr: "Beta", en: "Beta" }),
  studio: Object.freeze({ tr: "Beta", en: "Beta" }),
  profile: Object.freeze({ tr: "Ayar", en: "Settings" })
});

export const PRODUCT_SHELL_IDS = new Set(PRODUCT_SHELL_IDS_V0);

/**
 * @param {string} [locale]
 */
function resolveProductShellItemsV0(locale) {
  const surfaces = resolveProductSurfaceCopyV0(locale);
  const hints = resolveShellHintsV0(locale);
  return PRODUCT_SHELL_IDS_V0.map((id) => {
    const row = surfaces[id];
    return Object.freeze({
      id,
      label: row?.shell || id,
      hint: hints[id] || row?.pathHint || id,
      status: PRODUCT_SHELL_STATUS_V0[id] || null
    });
  });
}

/** @deprecated use resolveProductShellItemsV0 at runtime */
export const PRODUCT_SHELL_ITEMS = resolveProductShellItemsV0(readUiLocaleV0());

/**
 * @param {{ active: string, panelOpen?: Record<string, boolean>, onSelect: (id: string) => void, uiLocale?: string }} props
 */
export function UnifiedProductShellBar({ active, panelOpen = {}, onSelect, uiLocale }) {
  const locale = uiLocale || readUiLocaleV0();
  const items = resolveProductShellItemsV0(locale);
  const tr = locale === "tr";
  return (
    <nav
      className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[61] border-t border-cyan-400/20 bg-[#030711]/92 backdrop-blur-xl"
      aria-label={tr ? "Rhizoh bölümleri" : "Rhizoh sections"}
    >
      <div className="mx-auto flex max-w-4xl items-stretch justify-between gap-0.5 overflow-x-auto px-1 py-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] no-scrollbar sm:gap-1 sm:px-2">
        {items.map((item) => {
          const isActive = active === item.id;
          const isOpen = panelOpen[item.id] === true;
          return (
            <button
              key={item.id}
              type="button"
              title={
                isOpen
                  ? tr
                    ? `${item.hint || item.label} · açık (kapatmak için tekrar dokun)`
                    : `${item.hint || item.label} · open (tap again to close)`
                  : tr
                    ? `${item.hint || item.label} · açmak için dokun`
                    : `${item.hint || item.label} · tap to open`
              }
              aria-pressed={isOpen}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSelect(item.id)}
              className={`min-w-[3.25rem] flex-1 touch-manipulation rounded-lg border px-1 py-2 text-[9px] font-bold normal-case tracking-normal transition-colors sm:min-w-0 sm:px-2 sm:text-[10px] ${
                isOpen
                  ? "border-cyan-400/55 bg-cyan-500/25 text-cyan-50 shadow-[0_0_16px_rgba(34,211,238,0.18)]"
                  : isActive
                    ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-100/90"
                    : "border-transparent bg-black/20 text-white/50 hover:border-white/10 hover:text-white/75"
              }`}
            >
              <span className="block truncate normal-case tracking-normal opacity-95 sm:hidden">{item.label.split(" ")[0]}</span>
              <span className="hidden sm:block">{item.label}</span>
              {item.status ? (
                <span className="mt-0.5 block truncate text-[7px] font-semibold uppercase tracking-wide text-white/38">
                  {tr ? item.status.tr : item.status.en}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
