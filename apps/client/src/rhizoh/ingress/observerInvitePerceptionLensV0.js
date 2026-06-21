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
        "Bu bir kullanım uygulaması değil — gözlemleyip keşfedeceğin bir sistem. Haritada gez, kuleleri gör, yeniden oynatmayı izle.",
      lead: "Deneyim odaklı soyutlama: ne yapacağını bilmen yeterli; teknik detay arka planda.",
      cta: "Dünyaya gir ve keşfet",
      sectionInvite: "DAVET",
      sectionExpectation: "BEKLENTİ",
      sectionActivities: "BURADA NE YAPACAKSIN?",
      perceptionModeLabel: "Algı modu",
      perceptionModeName: "keşif",
      activities: Object.freeze(["Haritada gez", "Kule / arena keşfi", "Yeniden oynatma izle", "Basit hikaye akışı"])
    }),
    en: Object.freeze({
      kicker: "Explorer mode",
      title: "Explore the Rhizoh world",
      expectation:
        "This is not an app to consume — it is a system to observe and explore. Walk the map, discover towers, watch replay.",
      lead: "Experience-first abstraction: you only need to know what to do; technical detail stays in the background.",
      cta: "Enter the world and explore",
      sectionInvite: "INVITE",
      sectionExpectation: "EXPECTATION",
      sectionActivities: "WHAT WILL YOU DO HERE?",
      perceptionModeLabel: "Perception mode",
      perceptionModeName: "explorer",
      activities: Object.freeze(["Walk the map", "Discover towers / arenas", "Watch replay", "Simple story flow"])
    })
  }),
  [INVITE_PERCEPTION_MODE_V0.RESEARCH]: Object.freeze({
    tr: Object.freeze({
      kicker: "Araştırma modu",
      title: "Rhizoh epistemik modelleme ortamı",
      expectation:
        "Bu bir epistemik modelleme ve gözlem ortamıdır — nedensel graf, olay kaynağı ve kimlik projeksiyonunu inceleyebilirsin.",
      lead: "Whitepaper arayüzü: sistem nasıl çalışıyor sorusuna yanıt.",
      cta: "Gözlem alanına gir",
      sectionInvite: "DAVET",
      sectionExpectation: "BEKLENTİ",
      sectionActivities: "BURADA NE YAPACAKSIN?",
      sectionEpistemicSubject: "EPİSTEMİK ÖZNE (Salt okunur)",
      sectionCausalTimeline: "NEDENSEL ANLIK ZAMAN ÇİZELGESİ",
      perceptionModeLabel: "Algı modu",
      perceptionModeName: "araştırma",
      activities: Object.freeze([
        "Nedensel graf",
        "Olay günlüğü / yeniden oynatma",
        "Kimlik projeksiyonu (epi_id)",
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
      sectionInvite: "INVITE",
      sectionExpectation: "EXPECTATION",
      sectionActivities: "WHAT WILL YOU DO HERE?",
      sectionEpistemicSubject: "EPISTEMIC SUBJECT (READ ONLY)",
      sectionCausalTimeline: "CAUSAL SNAPSHOT TIMELINE",
      perceptionModeLabel: "Perception mode",
      perceptionModeName: "research",
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
        "Bu bir startup demosu değil — ölçeklenebilir simülasyon / olay altyapısının kontrollü kanıtı.",
      lead: "Altyapı merceği: verim, mimari netliği, hat stabilitesi.",
      cta: "Altyapı gözlemine gir",
      sectionInvite: "DAVET",
      sectionExpectation: "BEKLENTİ",
      sectionActivities: "BURADA NE YAPACAKSIN?",
      sectionInfrastructure: "ALTYAPI SİNYALİ",
      sectionEpistemicSubject: "EPİSTEMİK ÖZNE (Salt okunur)",
      perceptionModeLabel: "Algı modu",
      perceptionModeName: "sinyal",
      infrastructureReplay: "Olay kaynaklı yeniden oynatma aktif · kabul bekliyor · yalnızca gözlemci",
      eventNodesLabel: "olay düğümü",
      causalEdgesLabel: "nedensel kenar",
      activities: Object.freeze([
        "Olay verimi",
        "Mimari netlik",
        "Hat stabilitesi",
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
      sectionInvite: "INVITE",
      sectionExpectation: "EXPECTATION",
      sectionActivities: "WHAT WILL YOU DO HERE?",
      sectionInfrastructure: "INFRASTRUCTURE SIGNAL",
      sectionEpistemicSubject: "EPISTEMIC SUBJECT (READ ONLY)",
      perceptionModeLabel: "Perception mode",
      perceptionModeName: "signal",
      infrastructureReplay: "Event-sourced replay active · admission hold · observer-only",
      eventNodesLabel: "event nodes",
      causalEdgesLabel: "causal edges",
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
