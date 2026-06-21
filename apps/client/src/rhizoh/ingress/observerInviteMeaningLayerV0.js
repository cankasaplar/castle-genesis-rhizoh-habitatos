/**
 * Ontology translation layer v0 — three epistemic coordinate systems (not features).
 * Contract injection at invite ingress. @see docs/RHIZOH_MEANING_LAYER_V0.md
 */

export const OBSERVER_INVITE_MEANING_LAYER_SCHEMA_V0 = "castle.rhizoh.observer_invite_meaning_layer.v0";

const WHY_AM_I_HERE_V0 = Object.freeze({
  tr: Object.freeze({
    title: "Neden buradasın?",
    body:
      "Bir ajanla etkileşmiyorsun. Varlığınla tutarlılık kazanan nedensel bir sistemi gözlemliyorsun — salt okunur; execution yetkisi yok.",
    axiom:
      "Gözlemci olarak graph'a dahilsin; ajan değilsin. Yorumlayabilirsin; mühürleyemezsin.",
    footnote: "Observation ≠ Execution"
  }),
  en: Object.freeze({
    title: "Why am I here?",
    body:
      "You are not interacting with an agent. You are observing a causal system that becomes coherent through your presence — read-only; no execution authority.",
    axiom:
      "You are in the graph as an observer node, not an agent. You may interpret; you may not seal.",
    footnote: "Observation ≠ Execution"
  })
});

/** Three epistemic coordinate systems — ontology translation, not feature list. */
const SURFACE_MEANINGS_V0 = Object.freeze({
  tr: Object.freeze([
    Object.freeze({
      id: "map",
      label: "Harita",
      role: "Mekânsal nedensellik projeksiyon katmanı",
      description:
        "Uzay topolojisi ve pinler — olayların nerede bağlandığını gösteren koordinat sistemi."
    }),
    Object.freeze({
      id: "chess",
      label: "Satranç / Arena",
      role: "Zamansal akıl yürütme yüzeyi",
      description:
        "Karar baskısı simülatörü — hamle zinciri üzerinden nedensel baskının zaman içinde nasıl göründüğü."
    }),
    Object.freeze({
      id: "castle",
      label: "Kale",
      role: "Anlatı tutarlılığı çıpası",
      description:
        "Kimlik stabilizasyon arayüzü — isteğe bağlı kişisel düğüm; zorunlu değil."
    })
  ]),
  en: Object.freeze([
    Object.freeze({
      id: "map",
      label: "Map",
      role: "Spatial causality projection layer",
      description:
        "Space topology and pins — the coordinate system for where events bind in the world."
    }),
    Object.freeze({
      id: "chess",
      label: "Chess / Arena",
      role: "Temporal reasoning surface",
      description:
        "Decision-pressure simulator — how causal pressure appears over time through move chains."
    }),
    Object.freeze({
      id: "castle",
      label: "Castle",
      role: "Narrative coherence anchor",
      description:
        "Identity stabilization UI — optional personal node; not required."
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
    kind: "ontological_gate_assertion",
    ...copy,
    interpretationOnly: true,
    readOnly: true,
    isContractInjection: true
  });
}

/**
 * @param {string} [locale]
 */
export function getMeaningLayerSurfacesV0(locale = "en") {
  const tr = locale === "tr";
  return Object.freeze({
    schema: OBSERVER_INVITE_MEANING_LAYER_SCHEMA_V0,
    kind: "ontology_translation_layer",
    title: tr ? "Üç epistemik koordinat sistemi" : "Three epistemic coordinate systems",
    surfaces: SURFACE_MEANINGS_V0[tr ? "tr" : "en"],
    interpretationOnly: true,
    readOnly: true
  });
}
