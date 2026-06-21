/**
 * Meaning layer v0 — why surfaces exist (map / chess / castle).
 * Interpretation-only copy for invite landing + onboarding.
 */

export const OBSERVER_INVITE_MEANING_LAYER_SCHEMA_V0 = "castle.rhizoh.observer_invite_meaning_layer.v0";

const WHY_AM_I_HERE_V0 = Object.freeze({
  tr: Object.freeze({
    title: "Neden buradasın?",
    body:
      "Salt okunur bir epistemik sistemi gözlemliyorsun. Bu bir oyun hesabı veya sosyal ağ değil — execution yetkisi yok; yorum ve keşif var.",
    footnote: "Observation ≠ Execution"
  }),
  en: Object.freeze({
    title: "Why am I here?",
    body:
      "You are observing a read-only epistemic system. This is not a game account or social feed — no execution authority; observation and exploration only.",
    footnote: "Observation ≠ Execution"
  })
});

const SURFACE_MEANINGS_V0 = Object.freeze({
  tr: Object.freeze([
    Object.freeze({
      id: "map",
      label: "Harita",
      role: "Mekânsal biliş katmanı",
      description: "Dünyanın topolojisi, pinler ve koordinatlar — nerede olduğunu ve neyin nerede olduğunu görürsün."
    }),
    Object.freeze({
      id: "chess",
      label: "Satranç / Arena",
      role: "Akıl yürütme yüzeyi",
      description: "Taktik motor ve hamle zinciri — sistemde nedensel kararların somut bir yüzeyi."
    }),
    Object.freeze({
      id: "castle",
      label: "Kale",
      role: "Anlatı çıpası",
      description: "İsteğe bağlı kişisel düğüm — hikâye ve süreklilik için bir anchor; zorunlu değil."
    })
  ]),
  en: Object.freeze([
    Object.freeze({
      id: "map",
      label: "Map",
      role: "Spatial cognition layer",
      description: "World topology, pins, and coordinates — where things are and how space is organized."
    }),
    Object.freeze({
      id: "chess",
      label: "Chess / Arena",
      role: "Reasoning surface",
      description: "Tactical engine and move chains — a concrete face of causal decision-making in the system."
    }),
    Object.freeze({
      id: "castle",
      label: "Castle",
      role: "Narrative anchor",
      description: "Optional personal node — an anchor for story and continuity; not required."
    })
  ])
});

/**
 * @param {string} [locale]
 */
export function getWhyAmIHerePanelV0(locale = "en") {
  const tr = locale === "tr";
  const copy = WHY_AM_I_HERE_V0[tr ? "tr" : "en"];
  return Object.freeze({
    schema: OBSERVER_INVITE_MEANING_LAYER_SCHEMA_V0,
    kind: "why_am_i_here",
    ...copy,
    interpretationOnly: true,
    readOnly: true
  });
}

/**
 * @param {string} [locale]
 */
export function getMeaningLayerSurfacesV0(locale = "en") {
  const tr = locale === "tr";
  return Object.freeze({
    schema: OBSERVER_INVITE_MEANING_LAYER_SCHEMA_V0,
    kind: "surface_meanings",
    title: tr ? "Bu yüzeyler ne anlama geliyor?" : "What these surfaces mean",
    surfaces: SURFACE_MEANINGS_V0[tr ? "tr" : "en"],
    interpretationOnly: true,
    readOnly: true
  });
}
