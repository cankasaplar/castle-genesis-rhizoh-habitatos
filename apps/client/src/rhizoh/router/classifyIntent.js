import { RHIZOH_INTENT, RHIZOH_SUB_INTENT } from "./intentTypes.js";

/**
 * @typedef {{ intent: string, subIntent: string, score: number }} IntentScore
 */

/** @type {Array<{ intent: string, sub: string, test: (t: string) => boolean, w: number }>} */
const RULES = [
  /* CRISIS */
  {
    intent: RHIZOH_INTENT.CRISIS,
    sub: RHIZOH_SUB_INTENT.BUG,
    w: 4,
    test: (t) =>
      /\b(rangeerror|invalid array|pvs|potentiallyvisible|webgl|context lost|stack|throw|exception|segfault)\b/i.test(t) ||
      /\b(çökt|çöküyor|crash|bug|hata|error|patlad|bozuk|düzelt|fix|debug|trace)\b/i.test(t)
  },
  {
    intent: RHIZOH_INTENT.CRISIS,
    sub: RHIZOH_SUB_INTENT.GATEWAY,
    w: 4,
    test: (t) =>
      /\b(gateway|ağ geçidi|401|403|429|500|502|503|websocket|ws\b|token|auth|bağlanamıyor)\b/i.test(t)
  },
  {
    intent: RHIZOH_INTENT.CRISIS,
    sub: RHIZOH_SUB_INTENT.PERFORMANCE,
    w: 3,
    test: (t) =>
      /\b(fps|donuyor|kasıyor|yavaş|latency|memory leak|ram|cpu|gpu|jank|stutter)\b/i.test(t)
  },
  {
    intent: RHIZOH_INTENT.CRISIS,
    sub: RHIZOH_SUB_INTENT.CONFUSION,
    w: 3,
    test: (t) =>
      /\b(anlamadım|ne bu|karışık|kayboldum|confus|lost|nedir bu|ne oluyor)\b/i.test(t)
  },
  /* BUILD */
  {
    intent: RHIZOH_INTENT.BUILD,
    sub: RHIZOH_SUB_INTENT.CODE,
    w: 3,
    test: (t) =>
      /\b(kod|refactor|api|typescript|javascript|jsx|commit|pr\b|lint|build|import|export|function)\b/i.test(t)
  },
  {
    intent: RHIZOH_INTENT.BUILD,
    sub: RHIZOH_SUB_INTENT.ARCHITECTURE,
    w: 3,
    test: (t) =>
      /\b(mimari|architecture|pipeline|modül|layer|router|kernel|sistem tasarım)\b/i.test(t)
  },
  {
    intent: RHIZOH_INTENT.BUILD,
    sub: RHIZOH_SUB_INTENT.DESIGN,
    w: 2,
    test: (t) => /\b(ui|ux|arayüz|tasarım|design|tema|font|renk|layout)\b/i.test(t)
  },
  {
    intent: RHIZOH_INTENT.BUILD,
    sub: RHIZOH_SUB_INTENT.WORLD,
    w: 3,
    test: (t) =>
      /\b(harita|cesium|real_map|globe|koordinat|flyto|terrain|tile|istanbul|dünya)\b/i.test(t)
  },
  {
    intent: RHIZOH_INTENT.BUILD,
    sub: RHIZOH_SUB_INTENT.MEMORY,
    w: 2,
    test: (t) =>
      /\b(hafıza|memory|continuity|codex|kimlik|persona|transcript|session)\b/i.test(t)
  },
  {
    intent: RHIZOH_INTENT.BUILD,
    sub: RHIZOH_SUB_INTENT.SYSTEM,
    w: 2,
    test: (t) =>
      /\b(deploy|firebase|hosting|env|docker|ci|cd|gateway|rate limit|audit)\b/i.test(t)
  },
  /* PLAY */
  {
    intent: RHIZOH_INTENT.PLAY,
    sub: RHIZOH_SUB_INTENT.NONE,
    w: 3,
    test: (t) =>
      /\b(dene|deney|sandbox|oyna|simüle|what if|şunu dene|random|eğlence)\b/i.test(t)
  },
  /* REFLECT */
  {
    intent: RHIZOH_INTENT.REFLECT,
    sub: RHIZOH_SUB_INTENT.NONE,
    w: 3,
    test: (t) =>
      /\b(düşün|felsefe|anlam|neden|hayat|öz|derin|medit|reflect|contemplat)\b/i.test(t)
  },
  /* CHAT (düşük öncelik — son çare) */
  {
    intent: RHIZOH_INTENT.CHAT,
    sub: RHIZOH_SUB_INTENT.NONE,
    w: 1,
    test: (t) => t.length > 0
  }
];

function continuityBoost(text, continuity) {
  const c = continuity && typeof continuity === "object" ? continuity : {};
  let crisis = 0;
  let build = 0;
  const gp = c.ghostPet && typeof c.ghostPet === "object" ? c.ghostPet : null;
  if (gp && Number(gp.confused) > 0.55) crisis += 2;
  const rr = Array.isArray(c.recentReality) ? c.recentReality : [];
  if (rr.some((line) => /error|hata|crash|çök/i.test(String(line || "")))) crisis += 1.5;
  if (c.codex && typeof c.codex === "object" && Array.isArray(c.codex.discoveries) && c.codex.discoveries.length > 0)
    build += 1;
  return { crisis, build };
}

function runtimeBoost(text, runtime) {
  const r = runtime && typeof runtime === "object" ? runtime : {};
  let crisis = 0;
  if (r.mapSurfaceActive === false && /\b(harita|map|cesium|real)\b/i.test(text)) crisis += 1.5;
  if (String(r.governanceState || "").toUpperCase() === "FROZEN") crisis += 1;
  return { crisis };
}

/**
 * @param {string} rawText
 * @param {Record<string, unknown>} [continuity]
 * @param {Record<string, unknown>} [runtime]
 * @returns {{ intent: string, subIntent: string, confidence: number }}
 */
export function classifyIntent(rawText, continuity = {}, runtime = {}) {
  const text = String(rawText || "").trim();
  if (!text) {
    return { intent: RHIZOH_INTENT.SILENCE, subIntent: RHIZOH_SUB_INTENT.NONE, confidence: 0.5 };
  }

  const scores = new Map();
  const subByIntent = new Map();

  for (const rule of RULES) {
    if (!rule.test(text)) continue;
    const prev = scores.get(rule.intent) || 0;
    const next = prev + rule.w;
    scores.set(rule.intent, next);
    if (!subByIntent.has(rule.intent) || rule.w >= (subByIntent.get(rule.intent)?._w || 0)) {
      subByIntent.set(rule.intent, { sub: rule.sub, _w: rule.w });
    }
  }

  const { crisis: cCrisis, build: cBuild } = continuityBoost(text, continuity);
  const { crisis: rCrisis } = runtimeBoost(text, runtime);
  if (cCrisis || rCrisis) {
    scores.set(RHIZOH_INTENT.CRISIS, (scores.get(RHIZOH_INTENT.CRISIS) || 0) + cCrisis + rCrisis);
  }
  if (cBuild) {
    scores.set(RHIZOH_INTENT.BUILD, (scores.get(RHIZOH_INTENT.BUILD) || 0) + cBuild * 0.5);
  }

  let bestIntent = RHIZOH_INTENT.CHAT;
  let bestScore = 0;
  let second = 0;
  for (const [intent, sc] of scores) {
    if (sc > bestScore) {
      second = bestScore;
      bestScore = sc;
      bestIntent = intent;
    } else if (sc > second) second = sc;
  }

  const subEntry = subByIntent.get(bestIntent);
  const subIntent = subEntry?.sub || RHIZOH_SUB_INTENT.NONE;

  const confidence = Math.min(0.98, 0.38 + (bestScore / (bestScore + second + 4)) * 0.55);

  return {
    intent: bestIntent,
    subIntent,
    confidence: Math.round(confidence * 100) / 100
  };
}
