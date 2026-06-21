/**
 * Role-based perception lens v0 — same system, different epistemic framing.
 * observer → explorer · reviewer → research · investor → signal
 */

import { OBSERVER_INVITE_ROLE_V0 } from "./observerInviteRolesV0.js";

export const INVITE_PERCEPTION_MODE_V0 = Object.freeze({
  EXPLORER: "explorer",
  RESEARCH: "research",
  SIGNAL: "signal"
});

const LENS_BY_ROLE_V0 = Object.freeze({
  [OBSERVER_INVITE_ROLE_V0.OBSERVER]: INVITE_PERCEPTION_MODE_V0.EXPLORER,
  [OBSERVER_INVITE_ROLE_V0.REVIEWER]: INVITE_PERCEPTION_MODE_V0.RESEARCH,
  [OBSERVER_INVITE_ROLE_V0.INVESTOR]: INVITE_PERCEPTION_MODE_V0.SIGNAL
});

const LENS_COPY_V0 = Object.freeze({
  [INVITE_PERCEPTION_MODE_V0.EXPLORER]: Object.freeze({
    tr: Object.freeze({
      kicker: "Keşif modu",
      title: "Rhizoh dünyasını keşfet",
      expectation:
        "Bu bir kullanım uygulaması değil — gözlemleyip keşfedeceğin bir sistem. Haritada gez, kuleleri gör, replay izle.",
      lead: "Deneyim odaklı soyutlama: ne yapacağını bilmen yeterli; teknik detay arka planda.",
      cta: "Dünyaya gir ve keşfet",
      activities: Object.freeze(["Haritada gez", "Kule / arena keşfi", "Replay izle", "Basit hikaye akışı"])
    }),
    en: Object.freeze({
      kicker: "Explorer mode",
      title: "Explore the Rhizoh world",
      expectation:
        "This is not an app to consume — it is a system to observe and explore. Walk the map, discover towers, watch replay.",
      lead: "Experience-first abstraction: you only need to know what to do; technical detail stays in the background.",
      cta: "Enter the world and explore",
      activities: Object.freeze(["Walk the map", "Discover towers / arenas", "Watch replay", "Simple story flow"])
    })
  }),
  [INVITE_PERCEPTION_MODE_V0.RESEARCH]: Object.freeze({
    tr: Object.freeze({
      kicker: "Araştırma modu",
      title: "Rhizoh epistemik modelleme ortamı",
      expectation:
        "Bu bir epistemik modelleme ve gözlem ortamıdır — causal graph, event sourcing ve identity projection inceleyebilirsin.",
      lead: "Whitepaper arayüzü: sistem nasıl çalışıyor sorusuna yanıt.",
      cta: "Gözlem alanına gir",
      activities: Object.freeze([
        "Causal graph",
        "Event log / replay",
        "Identity projection (epi_id)",
        "Sistem tutarlılığı"
      ])
    }),
    en: Object.freeze({
      kicker: "Research mode",
      title: "Rhizoh epistemic modeling environment",
      expectation:
        "This is an epistemic modeling and observation environment — inspect causal graph, event sourcing, and identity projection.",
      lead: "Whitepaper interface: answers how the system works.",
      cta: "Enter observation area",
      activities: Object.freeze([
        "Causal graph",
        "Event log / replay",
        "Identity projection (epi_id)",
        "System coherence"
      ])
    })
  }),
  [INVITE_PERCEPTION_MODE_V0.SIGNAL]: Object.freeze({
    tr: Object.freeze({
      kicker: "Sinyal modu",
      title: "Rhizoh altyapı gözlemi",
      expectation:
        "Bu bir startup demosu değil — ölçeklenebilir simulation / event altyapısının kontrollü kanıtı.",
      lead: "Altyapı merceği: throughput, mimari netliği, pipeline stabilitesi.",
      cta: "Altyapı gözlemine gir",
      activities: Object.freeze([
        "Event throughput",
        "Mimari netlik",
        "Pipeline stabilitesi",
        "Ölçeklenebilirlik sinyali"
      ])
    }),
    en: Object.freeze({
      kicker: "Signal mode",
      title: "Rhizoh infrastructure observation",
      expectation:
        "This is not a startup demo — controlled evidence of scalable simulation / event infrastructure.",
      lead: "Infrastructure lens: throughput, architecture clarity, pipeline stability.",
      cta: "Enter infrastructure observation",
      activities: Object.freeze([
        "Event throughput",
        "Architecture clarity",
        "Pipeline stability",
        "Scalability signal"
      ])
    })
  })
});

const PANELS_BY_MODE_V0 = Object.freeze({
  [INVITE_PERCEPTION_MODE_V0.EXPLORER]: Object.freeze({
    showExpectationBanner: true,
    showActivities: true,
    showEpistemicSubject: false,
    showCausalTimeline: false,
    showInfrastructureSummary: false
  }),
  [INVITE_PERCEPTION_MODE_V0.RESEARCH]: Object.freeze({
    showExpectationBanner: true,
    showActivities: true,
    showEpistemicSubject: true,
    showCausalTimeline: true,
    showInfrastructureSummary: false
  }),
  [INVITE_PERCEPTION_MODE_V0.SIGNAL]: Object.freeze({
    showExpectationBanner: true,
    showActivities: true,
    showEpistemicSubject: true,
    showCausalTimeline: false,
    showInfrastructureSummary: true
  })
});

/**
 * @param {string} [role]
 * @param {string} [locale]
 */
export function resolveInvitePerceptionLensV0(role, locale = "en") {
  const r = String(role || OBSERVER_INVITE_ROLE_V0.OBSERVER).toLowerCase();
  const mode = LENS_BY_ROLE_V0[r] || INVITE_PERCEPTION_MODE_V0.EXPLORER;
  const tr = locale === "tr";
  const copy = LENS_COPY_V0[mode][tr ? "tr" : "en"];

  return Object.freeze({
    schema: "castle.rhizoh.invite_perception_lens.v0",
    role: r,
    mode,
    copy: Object.freeze({ ...copy }),
    panels: PANELS_BY_MODE_V0[mode],
    interpretationOnly: true,
    readOnly: true
  });
}

/**
 * @param {string} role
 * @param {string} [locale]
 */
export function getInviteExpectationFramingV0(role, locale = "en") {
  return resolveInvitePerceptionLensV0(role, locale).copy.expectation;
}
