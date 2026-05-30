/**
 * CORE-ELIGIBLE — Human Experience Layer (HEL) for canonical entry.
 *
 * Adjacent to RCML — human copy only; no storage, no drift math.
 * - FTUE (first 30s story beats)
 * - Mental model simplicity (Rhizoh = ne?)
 * - Action loop closure (yaptım → değişti → oldu)
 * - Deployment persona (tz/locale/time UX tone)
 *
 * @see RCML map v1.0 — UI projects this via orchestrator only.
 */

export const LIVING_WORLD_ENTRY_HUMAN_LAYER_SCHEMA_V0 = "castle.rhizoh.living_world_entry_human.v0";

const TIMEZONE_PLACE_V0 = Object.freeze({
  "Europe/Istanbul": { tr: "İstanbul ritmi", en: "Istanbul rhythm" },
  "Europe/London": { tr: "Londra çizgisi", en: "London line" },
  "Europe/Berlin": { tr: "Berlin saati", en: "Berlin hour" },
  "America/New_York": { tr: "New York akışı", en: "New York flow" },
  "Asia/Tokyo": { tr: "Tokyo sabahı", en: "Tokyo morning" }
});

function isTurkishLocale(locale) {
  const l = String(locale || "").toLowerCase();
  return l.startsWith("tr");
}

/**
 * @param {string} timeZone
 */
function getLocalHourInTimeZoneV0(timeZone) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || "UTC",
      hour: "numeric",
      hour12: false
    }).formatToParts(new Date());
    const h = Number(parts.find((p) => p.type === "hour")?.value);
    return Number.isFinite(h) ? h : new Date().getHours();
  } catch {
    return new Date().getHours();
  }
}

/**
 * @param {number} hour
 * @param {boolean} tr
 */
function describeTimeOfDayV0(hour, tr) {
  if (hour >= 5 && hour < 9) return tr ? "şafak" : "dawn";
  if (hour >= 9 && hour < 12) return tr ? "sabah" : "morning";
  if (hour >= 12 && hour < 17) return tr ? "öğleden sonra" : "afternoon";
  if (hour >= 17 && hour < 21) return tr ? "akşam" : "evening";
  return tr ? "gece" : "night";
}

/**
 * @param {{
 *   timeZone?: string,
 *   locale?: string,
 *   atmosphereLead?: string
 * }} io
 */
export function deriveDeploymentPersonaV0(io) {
  const tz = String(io.timeZone || "UTC");
  const tr = isTurkishLocale(io.locale);
  const hour = getLocalHourInTimeZoneV0(tz);
  const tod = describeTimeOfDayV0(hour, tr);
  const placeEntry = TIMEZONE_PLACE_V0[tz];
  const placeSense = placeEntry ? (tr ? placeEntry.tr : placeEntry.en) : tr ? "yerel ritim" : "local rhythm";
  const culturalVariant = tr ? "tr_warm" : "en_warm";

  const greeting = tr
    ? `${placeSense} · ${tod} — dünya senin saatine göre nefes alıyor.`
    : `${placeSense} · ${tod} — the world breathes on your clock.`;

  const openingScene = tr
    ? `İlk sahne ${tod} tonunda açıldı${io.atmosphereLead ? ` — ${io.atmosphereLead}` : "."}`
    : `First scene opens in a ${tod} tone${io.atmosphereLead ? ` — ${io.atmosphereLead}` : "."}`;

  return Object.freeze({
    schema: LIVING_WORLD_ENTRY_HUMAN_LAYER_SCHEMA_V0,
    timeZone: tz,
    locale: io.locale || "und",
    timeOfDay: tod,
    placeSense,
    culturalVariant,
    greeting,
    openingScene
  });
}

/**
 * @param {{ returning?: boolean, locale?: string }} ctx
 */
export function buildMentalModelSimplicityV0(ctx = {}) {
  const tr = isTurkishLocale(ctx.locale);
  const oneLiner = tr
    ? "Rhizoh = yaşayan bir dünya hissi: dinlersin, yaklaşırsın; dünya küçük adımlarla seni hatırlar."
    : "Rhizoh = a living world you feel: listen, draw near; it remembers you in small steps.";
  const rhizohEquals = tr
    ? "Panel değil · oyun lobisi değil · gözlem ve yakınlık alanı."
    : "Not a dashboard · not a game lobby · a space for observation and nearness.";
  return Object.freeze({
    oneLiner,
    rhizohEquals,
    hideRcmlTerminology: true
  });
}

/**
 * @param {{ returning?: boolean, locale?: string, persona?: ReturnType<typeof deriveDeploymentPersonaV0> }} ctx
 */
export function buildFtueStoryFlowV0(ctx = {}) {
  const tr = isTurkishLocale(ctx.locale);
  if (ctx.returning) {
    return Object.freeze({
      active: false,
      beats: [],
      headline: null,
      guidanceLine: null
    });
  }

  const beats = tr
    ? Object.freeze([
        Object.freeze({
          step: 1,
          title: "Nefes",
          line: "Rhizoh senin için sessiz bir dünya örneği açar — henüz oyun yok, sadece his."
        }),
        Object.freeze({
          step: 2,
          title: "İzin",
          line: "Burada iz bırakırsın. Kimse senin yerine karar vermez; dünya küçük farklarla kayar."
        }),
        Object.freeze({
          step: 3,
          title: "İlk adım",
          line: "Dinle (Observe) — dünyayı dinle. Veya Castle'a yaklaş — yakınlık hissi."
        })
      ])
    : Object.freeze([
        Object.freeze({
          step: 1,
          title: "Breath",
          line: "Rhizoh opens a quiet world instance for you — not a game yet, only feeling."
        }),
        Object.freeze({
          step: 2,
          title: "Permission",
          line: "You leave traces here. No one decides for you; the world shifts in small steps."
        }),
        Object.freeze({
          step: 3,
          title: "First step",
          line: "Listen (Observe) — hear the world. Or draw near Castle — a sense of closeness."
        })
      ]);

  return Object.freeze({
    active: true,
    beats,
    headline: tr ? "İlk 30 saniye" : "First 30 seconds",
    guidanceLine: tr
      ? "Acele yok — bir nefes al, sonra tek bir adım seç."
      : "No rush — take one breath, then pick one step."
  });
}

/**
 * @param {{
 *   action?: string | null,
 *   feedbackLine?: string | null,
 *   locale?: string
 * }} io
 */
export function buildActionLoopClosureV0(io) {
  const action = String(io.action || "");
  const feedback = String(io.feedbackLine || "").trim();
  if (!action || !feedback) return null;

  const tr = isTurkishLocale(io.locale);
  const did =
    action === "observe"
      ? tr
        ? "Dinledin"
        : "You listened"
      : action === "enter_castle"
        ? tr
          ? "Castle'a yaklaştın"
          : "You drew near Castle"
        : tr
          ? "Bir adım attın"
          : "You took a step";

  return Object.freeze({
    schema: LIVING_WORLD_ENTRY_HUMAN_LAYER_SCHEMA_V0,
    did,
    changed: feedback,
    happened: tr
      ? "Dünya bunu hatırladı — geri döndüğünde küçük fark olarak hissedeceksin."
      : "The world remembered — when you return, you will feel it as a small difference.",
    closed: true
  });
}

/**
 * Human-facing action hints (replace technical RCML hints in UI).
 *
 * @param {{ locale?: string }} ctx
 */
export function buildHumanActionSurfaceCopyV0(ctx = {}) {
  const tr = isTurkishLocale(ctx.locale);
  return Object.freeze({
    observe: Object.freeze({
      label: tr ? "Dinle" : "Listen",
      hint: tr ? "Dünyayı dinle — henüz bir şey başlatmıyorsun." : "Listen to the world — you start nothing yet.",
      meaning: tr ? "Gözlem = sessiz iz; dünya hafif derinleşir." : "Observe = quiet trace; the world deepens slightly."
    }),
    enterCastle: Object.freeze({
      label: tr ? "Castle'a yaklaş" : "Draw near Castle",
      hint: tr ? "Yakınlık hissi — nabız ve atmosfer kayar." : "A sense of nearness — pulse and atmosphere shift.",
      meaning: tr ? "Castle = senin alanın; execution yok, sadece temas." : "Castle = your space; no execution, only contact."
    }),
    createCastle: Object.freeze({
      label: tr ? "Castle oluştur" : "Create Castle",
      hint: tr ? "Yakında — ayrı evren." : "Soon — a separate realm."
    })
  });
}

/**
 * Human why-here (no instance id, no RCML jargon).
 *
 * @param {{
 *   returning?: boolean,
 *   persona?: ReturnType<typeof deriveDeploymentPersonaV0>,
 *   locale?: string
 * }} ctx
 */
export function buildHumanWhyHereV0(ctx = {}) {
  const tr = isTurkishLocale(ctx.locale);
  const place = ctx.persona?.placeSense || (tr ? "bu ritim" : "this rhythm");
  if (ctx.returning) {
    return tr
      ? `Geri geldin çünkü ${place} seni tanıyor — dünya sen yokken de nefes aldı, şimdi seninle devam ediyor.`
      : `You returned because ${place} knows you — the world kept breathing; now it continues with you.`;
  }
  return tr
    ? `Buradasın çünkü ${place} ve ${ctx.persona?.timeOfDay || "şimdi"} birlikte senin ilk dünya örneğini açtı — merak etmek yeterli.`
    : `You are here because ${place} and ${ctx.persona?.timeOfDay || "now"} opened your first world instance — curiosity is enough.`;
}

/**
 * Simplify continuity copy for first visit (less technical).
 *
 * @param {{
 *   returning?: boolean,
 *   atmosphereLead?: string,
 *   persona?: ReturnType<typeof deriveDeploymentPersonaV0>,
 *   locale?: string,
 *   yesterdayTechnical?: string,
 *   todayTechnical?: string
 * }} ctx
 */
export function buildHumanContinuityCopyV0(ctx = {}) {
  const tr = isTurkishLocale(ctx.locale);
  if (!ctx.returning) {
    return Object.freeze({
      yesterday: tr ? "İlk açılış — dün yok, bugün başlıyor." : "First open — no yesterday, today begins.",
      todayChanged:
        ctx.atmosphereLead ||
        (tr ? "Dünya şimdi seninle ölçülüyor — küçük bir nabız." : "The world measures with you now — a small pulse."),
      whyHere: buildHumanWhyHereV0(ctx)
    });
  }
  return Object.freeze({
    yesterday: ctx.yesterdayTechnical || (tr ? "Önceki ziyaretin hatırlanıyor." : "Your last visit is remembered."),
    todayChanged:
      ctx.todayTechnical ||
      (tr ? "Küçük farklar var — ritim tanıdık." : "Small differences — the rhythm feels familiar."),
    whyHere: buildHumanWhyHereV0(ctx)
  });
}

/**
 * Compose full HEL block for orchestrator.
 *
 * @param {{
 *   returning?: boolean,
 *   locale?: string,
 *   timeZone?: string,
 *   atmosphereLead?: string,
 *   lastActionClosure?: { action?: string, feedbackLine?: string } | null,
 *   yesterdayTechnical?: string,
 *   todayTechnical?: string
 * }} input
 */
export function buildLivingWorldEntryHumanLayerV0(input) {
  const persona = deriveDeploymentPersonaV0({
    timeZone: input.timeZone,
    locale: input.locale,
    atmosphereLead: input.atmosphereLead
  });
  const mentalModel = buildMentalModelSimplicityV0({
    returning: input.returning,
    locale: input.locale
  });
  const ftue = buildFtueStoryFlowV0({
    returning: input.returning,
    locale: input.locale,
    persona
  });
  const actionLoopClosure = buildActionLoopClosureV0({
    action: input.lastActionClosure?.action,
    feedbackLine: input.lastActionClosure?.feedbackLine,
    locale: input.locale
  });
  const actionCopy = buildHumanActionSurfaceCopyV0({ locale: input.locale });
  const continuityHuman = buildHumanContinuityCopyV0({
    returning: input.returning,
    atmosphereLead: input.atmosphereLead,
    persona,
    locale: input.locale,
    yesterdayTechnical: input.yesterdayTechnical,
    todayTechnical: input.todayTechnical
  });

  const tr = isTurkishLocale(input.locale);
  const uiLabels = Object.freeze({
    continuity: tr ? "Süreklilik" : "Continuity",
    worldState: tr ? "Dünya" : "World",
    actions: tr ? "Ne yapmak istersin?" : "What would you like to do?",
    castlePresence: tr ? "Castle" : "Castle",
    readOnly: tr ? "salt okunur" : "read-only"
  });

  return Object.freeze({
    schema: LIVING_WORLD_ENTRY_HUMAN_LAYER_SCHEMA_V0,
    persona,
    mentalModel,
    ftue,
    actionLoopClosure,
    actionCopy,
    continuityHuman,
    uiLabels,
    showTechnicalMeta: Boolean(input.returning)
  });
}
