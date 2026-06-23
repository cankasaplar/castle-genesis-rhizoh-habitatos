/**
 * Epistemic pin semantic registry v0 — read-only grounding for narrative projection.
 * Ingress SSOT; runtime pin rows merged when available (no causal write).
 * @see docs/RHIZOH_NARRATIVE_PROJECTION_ENGINE_V0.md
 */

export const EPISTEMIC_PIN_SEMANTIC_REGISTRY_SCHEMA_V0 =
  "castle.rhizoh.epistemic_pin_semantic_registry.v0";

/** Ingress-static semantics (sovereign mesh subset + bootstrap pins). */
const STATIC_PIN_SEMANTICS_V0 = Object.freeze({
  origin_home_serencebey: Object.freeze({
    en: Object.freeze({
      title: "Serencebey origin seed",
      role: "Semantic gravity anchor",
      description:
        "Permanent bootstrap observation window — Istanbul mesh entry, not user identity."
    }),
    tr: Object.freeze({
      title: "Serencebey köken tohumu",
      role: "Anlamsal yerçekimi çıpası",
      description:
        "Kalıcı bootstrap gözlem penceresi — İstanbul mesh girişi, kullanıcı kimliği değil."
    })
  }),
  castle: Object.freeze({
    en: Object.freeze({
      title: "Home Hub",
      role: "Narrative coherence anchor",
      description: "System shields active — spatial causality hub on the sovereign mesh."
    }),
    tr: Object.freeze({
      title: "Ana Merkez",
      role: "Anlatı tutarlılığı çıpası",
      description: "Sistem kalkanları aktif — egemen mesh üzerinde mekânsal nedensellik merkezi."
    })
  }),
  ghost: Object.freeze({
    en: Object.freeze({
      title: "Rhizoh AI Ghost",
      role: "Observation relay node",
      description: "Memory scan surface — interpretive layer only, not execution authority."
    }),
    tr: Object.freeze({
      title: "Rhizoh AI Ghost",
      role: "Gözlem aktarım düğümü",
      description: "Hafıza tarama yüzeyi — yalnızca yorum katmanı, execution yetkisi yok."
    })
  }),
  chess_arena: Object.freeze({
    en: Object.freeze({
      title: "Chess Arena",
      role: "Temporal reasoning surface",
      description: "Decision-pressure simulator — move chains expose causal pressure over time."
    }),
    tr: Object.freeze({
      title: "Satranç Arenası",
      role: "Zamansal akıl yürütme yüzeyi",
      description: "Karar baskısı simülatörü — hamle zincirleri nedensel baskıyı zaman içinde gösterir."
    })
  }),
  worldsports: Object.freeze({
    en: Object.freeze({
      title: "WorldSports",
      role: "Live scores surface",
      description: "Gateway world-feed observation — API-Sports scores only; interpretation only."
    }),
    tr: Object.freeze({
      title: "WorldSports",
      role: "Canlı skor yüzeyi",
      description: "Gateway world-feed gözlemi — yalnızca API-Sports skorları; yalnızca yorum."
    })
  }),
  worldnews: Object.freeze({
    en: Object.freeze({
      title: "World News",
      role: "Headlines surface",
      description: "Gateway world-feed observation — news headlines only; interpretation only."
    }),
    tr: Object.freeze({
      title: "World News",
      role: "Haber başlıkları yüzeyi",
      description: "Gateway world-feed gözlemi — yalnızca haber başlıkları; yalnızca yorum."
    })
  }),
  gemini_tower: Object.freeze({
    en: Object.freeze({
      title: "Gemini Neural Tower",
      role: "Multimodal projection tower",
      description: "Creative multimodal workspace pin — observation surface, not agent vertex."
    }),
    tr: Object.freeze({
      title: "Gemini Sinir Kulesi",
      role: "Çok modlu projeksiyon kulesi",
      description: "Yaratıcı çok modlu workspace pini — gözlem yüzeyi, ajan köşesi değil."
    })
  }),
  my_castle: Object.freeze({
    en: Object.freeze({
      title: "Your castle anchor",
      role: "Optional personal node",
      description: "Identity stabilization UI — optional; does not grant causal write."
    }),
    tr: Object.freeze({
      title: "Kale çıpan",
      role: "İsteğe bağlı kişisel düğüm",
      description: "Kimlik stabilizasyon arayüzü — isteğe bağlı; nedensel yazma yetkisi vermez."
    })
  }),
  wprl_sports_arena: Object.freeze({
    en: Object.freeze({
      title: "WPRL Sports Arena",
      role: "Sports observation node",
      description:
        "Istanbul sports observation hub — live games, map projection, observer-density field. Reality layer: SPORTS_REALITY. Coordinates: 41.0151° N, 28.9795° E."
    }),
    tr: Object.freeze({
      title: "WPRL Sports Arena",
      role: "Spor gözlem düğümü",
      description:
        "İstanbul spor gözlem merkezi — canlı oyunlar, harita projeksiyonu, gözlem yoğunluğu alanı. Gerçeklik katmanı: SPORTS_REALITY. Koordinat: 41.0151° K, 28.9795° D."
    })
  })
});

const SURFACE_FALLBACKS_V0 = Object.freeze({
  map: Object.freeze({
    en: Object.freeze({
      title: "Map observation",
      role: "Spatial causality projection layer",
      description: "Space topology — where events bind in the world mesh."
    }),
    tr: Object.freeze({
      title: "Harita gözlemi",
      role: "Mekânsal nedensellik projeksiyon katmanı",
      description: "Uzay topolojisi — olayların world mesh'te nerede bağlandığı."
    })
  }),
  chess: Object.freeze({
    en: Object.freeze({
      title: "Chess / Arena",
      role: "Temporal reasoning surface",
      description: "Decision-pressure simulator over move chains."
    }),
    tr: Object.freeze({
      title: "Satranç / Arena",
      role: "Zamansal akıl yürütme yüzeyi",
      description: "Hamle zincirleri üzerinden karar baskısı simülatörü."
    })
  }),
  castle: Object.freeze({
    en: Object.freeze({
      title: "Castle gate",
      role: "Narrative coherence anchor",
      description: "Optional identity stabilization ritual — read-only for observers."
    }),
    tr: Object.freeze({
      title: "Kale kapısı",
      role: "Anlatı tutarlılığı çıpası",
      description: "İsteğe bağlı kimlik stabilizasyon ritüeli — gözlemciler için salt okunur."
    })
  })
});

/**
 * @param {string} raw
 */
export function normalizePinTargetIdV0(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (s.startsWith("pin_")) return s.slice(4) || s;
  return s;
}

function readRuntimePinRowV0(pinId) {
  if (typeof window === "undefined") return null;
  const inspect = window.__rhizoh?.inspectMapPinOwner;
  if (typeof inspect !== "function") return null;
  try {
    const snap = inspect();
    const rows = snap?.pins || [];
    return rows.find((p) => String(p.id) === pinId) || null;
  } catch {
    return null;
  }
}

/**
 * @param {string} pinId
 * @param {{ locale?: string }} [opts]
 */
export function lookupPinSemanticV0(pinId, opts = {}) {
  const tr = opts.locale === "tr";
  const lang = tr ? "tr" : "en";
  const normalized = normalizePinTargetIdV0(pinId);
  const staticRow = STATIC_PIN_SEMANTICS_V0[normalized] || STATIC_PIN_SEMANTICS_V0[pinId];
  const runtimeRow = readRuntimePinRowV0(normalized) || readRuntimePinRowV0(pinId);

  if (staticRow || runtimeRow) {
    const copy = staticRow?.[lang] || staticRow?.en;
    return Object.freeze({
      schema: EPISTEMIC_PIN_SEMANTIC_REGISTRY_SCHEMA_V0,
      entityId: normalized || pinId,
      registryHit: staticRow ? "static" : "runtime",
      title: copy?.title || runtimeRow?.label || normalized,
      role: copy?.role || runtimeRow?.type || "map_pin",
      description:
        copy?.description ||
        (runtimeRow
          ? `${runtimeRow.label || normalized} — ${runtimeRow.type || "pin"} on sovereign mesh.`
          : `${normalized} — map pin on observation surface.`),
      coordinateSystem: "map",
      grounded: true,
      readOnly: true,
      influencesCausalGraph: false
    });
  }

  return Object.freeze({
    schema: EPISTEMIC_PIN_SEMANTIC_REGISTRY_SCHEMA_V0,
    entityId: normalized || pinId || "unknown",
    registryHit: "none",
    title: tr ? "Kayıtsız gözlem hedefi" : "Unregistered observation target",
    role: tr ? "Gözlem izi (anlamsal grounding yok)" : "Observation trace (no semantic grounding)",
    description: tr
      ? `${pinId || "hedef"} için anlamsal kayıt yok — dikkat loglandı, epistemik rezonans ölçülmedi.`
      : `No semantic registry entry for ${pinId || "target"} — attention logged, epistemic resonance not measured.`,
    coordinateSystem: "map",
    grounded: false,
    readOnly: true,
    influencesCausalGraph: false
  });
}

/**
 * @param {string} surface
 * @param {{ locale?: string }} [opts]
 */
export function lookupSurfaceSemanticV0(surface, opts = {}) {
  const tr = opts.locale === "tr";
  const lang = tr ? "tr" : "en";
  const copy = SURFACE_FALLBACKS_V0[surface]?.[lang] || SURFACE_FALLBACKS_V0[surface]?.en;
  if (!copy) return null;
  return Object.freeze({
    schema: EPISTEMIC_PIN_SEMANTIC_REGISTRY_SCHEMA_V0,
    entityId: surface,
    registryHit: "surface",
    ...copy,
    coordinateSystem: surface,
    grounded: true,
    readOnly: true,
    influencesCausalGraph: false
  });
}
