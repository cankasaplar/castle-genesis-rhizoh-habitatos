/**
 * Academy + Founder Circle public landing copy (TR/EN).
 * RESEARCH-ONLY · interpretation-only · no execution authority.
 */

export const ACADEMY_FOUNDER_LANDING_SCHEMA_V0 = "castle.rhizoh.academy_founder_landing.v0";

const PAPER_PDF_HREF_V0 = "/rhizoh/academic/paper-v0.1.pdf";

/** @typedef {"en" | "tr"} AcademyFounderLocaleV0 */

/**
 * @param {AcademyFounderLocaleV0} locale
 */
export function getAcademyLandingCopyV0(locale = "en") {
  const tr = locale === "tr";
  return Object.freeze({
    schema: ACADEMY_FOUNDER_LANDING_SCHEMA_V0,
    locale,
    kicker: tr ? "Rhizoh Academy · araştırma önizlemesi" : "Rhizoh Academy · research preview",
    title: tr
      ? "Dağıtık gerçeklik inşası için bir gözlem protokolü"
      : "An observation protocol for distributed reality construction",
    lead: tr
      ? "Rhizoh bir oyun değil, günlük hayat işletim sistemi değil ve bitmiş bir ürün de değil. Tek yazarlı commit, drift tespiti ve reconciliation ile yetkiyi açıkça ayıran yaşayan bir sistem deneyidir."
      : "Rhizoh is not a game, not a daily-life OS, and not a finished product. It is a living systems experiment that separates authority through single-writer commits, drift detection, and reconciliation.",
    whatIsTitle: tr ? "Rhizoh nedir?" : "What is Rhizoh?",
    whatIs: tr
      ? [
          "Otorite tahkimi (authority arbitration) için event-sourced bir çekirdek.",
          "İstemci önerir ve simüle eder; gateway tek yazarlı commit verir.",
          "Sapma (drift) gizlenmez — loglanır, reconcile edilir.",
          "Gözlemci-merkezli bir yüzey: yorum katmanı yürütmeyi asla sahiplenmez."
        ]
      : [
          "An event-sourced kernel for authority arbitration.",
          "The client proposes and simulates; the gateway issues single-writer commits.",
          "Divergence is not hidden — it is logged and reconciled.",
          "An observer-centric surface: the interpretation layer never owns execution."
        ],
    whatIsNotTitle: tr ? "Ne değildir?" : "What is it not?",
    whatIsNot: tr
      ? [
          "Satranç / spor motoru satışı — satranç yalnızca kanıt taşıyıcısıdır.",
          "Hazır çok oyunculu ürün veya AAA oyun.",
          "Günlük hayat OS iddiası veya “her şeyi yapan AI”.",
          "Gizli olasılık motorlarıyla manipüle edilen bir dikkat ekonomisi."
        ]
      : [
          "A chess / sports engine sale — chess is only an evidence carrier.",
          "A shipped multiplayer product or AAA game.",
          "A daily-life OS claim or “do-everything AI”.",
          "An attention economy driven by hidden probability engines."
        ],
    stageTitle: tr ? "Şu an hangi aşamada?" : "Where are we now?",
    stageBadge: tr ? "Faz 0.5 · MODEL" : "Phase 0.5 · MODEL",
    stageBody: tr
      ? "Algı kabuğu donduruldu. Veri düzlemi READY imzası olmadan açılmaz. Üretimde çalışan kanıtlar var: SessionCreate, paylaşım URL’si, gateway ACK, sunucu commit, drift tespiti, reconciliation ve büyüyen event log — hepsi interpretationOnly etiketiyle etiketlenmiş araştırma önizlemesidir."
      : "The perception shell is frozen. The data plane stays off until a signed READY. Working evidence exists in production: SessionCreate, share URLs, gateway ACK, server commits, drift detection, reconciliation, and a growing event log — all labeled as an interpretation-only research preview.",
    evidenceTitle: tr ? "Bugün gösterilebilir kanıtlar" : "Demonstrable evidence today",
    evidence: tr
      ? [
          "Oturum oluşturma ve paylaşım URL’si",
          "WebSocket üzerinden gateway ACK",
          "Sunucu tarafı CommitMove",
          "DRIFT_DETECTED → reconciliation",
          "challengePeer() ile davet köprüsü",
          "truth / reality durum API’leri"
        ]
      : [
          "Session creation and share URLs",
          "Gateway ACK over WebSocket",
          "Server-side CommitMove",
          "DRIFT_DETECTED → reconciliation",
          "Invite bridge via challengePeer()",
          "truth / reality status APIs"
        ],
    paperTitle: tr ? "Paper v0.1" : "Paper v0.1",
    paperBody: tr
      ? "Dağıtık gerçeklik inşası üzerine sistem araştırması ön baskısı. Ürün duyurusu değil; tekrarlanabilir iddialar ve mimari kanıt."
      : "Systems research preprint on distributed reality construction. Not a product launch — reproducible claims and architectural evidence.",
    paperHref: PAPER_PDF_HREF_V0,
    paperCta: tr ? "PDF indir" : "Download PDF",
    roadmapTitle: tr ? "Yol haritası (dürüst sıra)" : "Roadmap (honest order)",
    roadmap: tr
      ? [
          { phase: "Şimdi", item: "Academy güven sayfası + Founder Circle ilgi kaydı" },
          { phase: "Bu hafta", item: "2-tarayıcı Reality Binding demo videosu" },
          { phase: "Sonra", item: "İlk 20 araştırma tanığı (oyuncu değil)" },
          { phase: "READY sonrası", item: "Kontrollü gerçek sinyal · veri düzlemi" },
          { phase: "Kasıtlı erteleme", item: "Go · basketbol · WorldSports — güven önce" }
        ]
      : [
          { phase: "Now", item: "Academy trust page + Founder Circle interest" },
          { phase: "This week", item: "2-browser Reality Binding demo video" },
          { phase: "Next", item: "First 20 research witnesses (not gamers)" },
          { phase: "After READY", item: "Controlled real signal · data plane" },
          { phase: "Deliberately later", item: "Go · basketball · WorldSports — trust first" }
        ],
    linksTitle: tr ? "Katmanlar" : "Layers",
    founderCircleCta: tr ? "Founder Circle" : "Founder Circle",
    observeCta: tr ? "Canlı gözlem" : "Observe live",
    researchCta: tr ? "Araştırma yüzeyi" : "Research surface",
    shellCta: tr ? "Rhizoh kabuğuna gir" : "Enter Rhizoh shell",
    honestyNote: tr
      ? "Bu sayfa satış değil güven içindir. Observation ≠ Execution."
      : "This page is for trust, not sales. Observation ≠ Execution."
  });
}

/**
 * @param {AcademyFounderLocaleV0} locale
 */
export function getFounderCircleCopyV0(locale = "en") {
  const tr = locale === "tr";
  return Object.freeze({
    schema: ACADEMY_FOUNDER_LANDING_SCHEMA_V0,
    locale,
    kicker: tr ? "Founder Circle · erken dönem doğrulama" : "Founder Circle · early validation",
    title: tr ? "İlk 20 araştırma tanığı" : "The first 20 research witnesses",
    lead: tr
      ? "25$/ay — ödeme henüz otomatik değil; ilgi kaydı ve manuel onboarding. Satın aldığınız şey satranç değil: otorite tahkimi, gözlemci-merkezli sistemler ve reconciliation tabanlı gerçeklik hikâyesi."
      : "$25/mo — billing is not automated yet; interest registration and manual onboarding. You are not paying for chess: you are backing authority arbitration, observer-centric systems, and reconciliation-based reality.",
    price: "$25",
    pricePeriod: tr ? "/ ay" : "/ month",
    cap: tr ? "İlk 20 kişi" : "First 20 people",
    promiseTitle: tr ? "Dürüstçe verilebilen vaatler" : "Promises we can honor today",
    promises: tr
      ? [
          "Erken erişim — research preview yüzeyleri",
          "Aylık canlı demo oturumu (Reality Binding kanıtı)",
          "Academy erişimi (observe + research + paper)",
          "Kapalı geliştirme günlüğü kanalı (manuel davet)",
          "Ürün kararlarında tanık sesi — yürütme otoritesi değil"
        ]
      : [
          "Early access — research preview surfaces",
          "Monthly live demo session (Reality Binding evidence)",
          "Academy access (observe + research + paper)",
          "Closed development log channel (manual invite)",
          "Witness voice in product decisions — not execution authority"
        ],
    notBuyingTitle: tr ? "Satın almadığınız şey" : "What you are not buying",
    notBuying: tr
      ? [
          "Bitmiş çok oyunculu satranç ürünü",
          "Spor motoru paketi veya WorldSports",
          "Garantili getiri veya yatırım tavsiyesi",
          "Veri düzlemi READY öncesi “canlı ürün” iddiası"
        ]
      : [
          "A finished multiplayer chess product",
          "A sports engine bundle or WorldSports",
          "Guaranteed returns or investment advice",
          "A “live product” claim before data-plane READY"
        ],
    interestTitle: tr ? "İlgi kaydı" : "Register interest",
    interestBody: tr
      ? "Stripe henüz bağlı değil. E-posta ile ilgi kaydı oluşturun; kurucu manuel onboarding yapar. Kayıt yalnızca tarayıcınızda saklanır ve dışa aktarılabilir."
      : "Stripe is not wired yet. Register interest by email; the founder runs manual onboarding. Records stay in your browser and can be exported.",
    emailPlaceholder: tr ? "E-posta adresiniz" : "Your email",
    notePlaceholder: tr ? "Kısa not (isteğe bağlı)" : "Short note (optional)",
    submitCta: tr ? "İlgi kaydı oluştur" : "Register interest",
    mailCta: tr ? "E-posta ile yaz" : "Email directly",
    mailSubject: tr
      ? "Rhizoh Founder Circle — ilgi kaydı"
      : "Rhizoh Founder Circle — interest",
    exportedNote: tr ? "Kayıt oluşturuldu (yerel)." : "Interest recorded (local).",
    backAcademy: tr ? "← Academy" : "← Academy",
    honestyNote: tr
      ? "Üyeler oyuncu değil araştırma tanığıdır. Agents may influence interpretation, never execution."
      : "Members are research witnesses, not gamers. Agents may influence interpretation, never execution."
  });
}
