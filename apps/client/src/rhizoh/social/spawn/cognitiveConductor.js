/**
 * cognitiveConductor — collapse multi sub-thread biases into one chorus for the LLM (anti parliament).
 */

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

function mixL1(a, b) {
  const x = a && typeof a === "object" ? a : {};
  const y = b && typeof b === "object" ? b : {};
  return (
    Math.abs(Number(x.BUILD) - Number(y.BUILD)) +
    Math.abs(Number(x.CRISIS) - Number(y.CRISIS)) +
    Math.abs(Number(x.PLAY) - Number(y.PLAY)) +
    Math.abs(Number(x.OBSERVE) - Number(y.OBSERVE))
  );
}

/**
 * @param {unknown[]} threads — typically status==="active" only
 * @param {Record<string, unknown>} [_context]
 */
export function conductCognitiveChorus(threads, _context = {}) {
  const raw = Array.isArray(threads) ? threads.filter((t) => t && String(t.status || "active") === "active") : [];
  if (!raw.length) {
    return {
      dominantTheme: null,
      minorThemes: [],
      conflictNote: "",
      mergedBias: { BUILD: 0, CRISIS: 0, PLAY: 0, OBSERVE: 0 },
      promptBlock: "",
      mergedRoleHint: ""
    };
  }

  const weights = raw.map((t) => {
    const w = Math.max(0.08, Number(t.utilityAccumulator) || 0.1);
    return { t, w };
  });
  const s = weights.reduce((a, b) => a + b.w, 0);
  const norm = weights.map(({ t, w }) => ({ t, w: w / s }));
  norm.sort((a, b) => b.w - a.w);

  const dom = norm[0].t;
  const minorThemes = norm.slice(1, 4).map((x) => String(x.t.role || ""));

  const mb = { BUILD: 0, CRISIS: 0, PLAY: 0, OBSERVE: 0 };
  for (const { t, w } of norm) {
    const m = t.sourceIntentMix && typeof t.sourceIntentMix === "object" ? t.sourceIntentMix : {};
    mb.BUILD += w * Number(m.BUILD || 0);
    mb.CRISIS += w * Number(m.CRISIS || 0);
    mb.PLAY += w * Number(m.PLAY || 0);
    mb.OBSERVE += w * Number(m.OBSERVE || 0);
  }

  let conflictNote = "";
  if (raw.length >= 2) {
    let maxD = 0;
    for (let i = 0; i < raw.length; i += 1) {
      const mi = raw[i].sourceIntentMix && typeof raw[i].sourceIntentMix === "object" ? raw[i].sourceIntentMix : {};
      for (let j = i + 1; j < raw.length; j += 1) {
        const mj = raw[j].sourceIntentMix && typeof raw[j].sourceIntentMix === "object" ? raw[j].sourceIntentMix : {};
        maxD = Math.max(maxD, mixL1(mi, mj));
      }
    }
    const roles = raw.map((x) => String(x.role || ""));
    const roleSpread = new Set(roles).size;
    if (maxD > 0.26 || roleSpread >= 3) {
      conflictNote = `intent_mix_divergence≈${maxD.toFixed(2)} roles=${roles.join("/")} — follow dominant chorus only`;
    }
  }

  const mbR = {
    BUILD: Math.round(mb.BUILD * 1000) / 1000,
    CRISIS: Math.round(mb.CRISIS * 1000) / 1000,
    PLAY: Math.round(mb.PLAY * 1000) / 1000,
    OBSERVE: Math.round(mb.OBSERVE * 1000) / 1000
  };

  const promptBlock = [
    `Dominant: ${String(dom.role || "")} (${String(dom.temperamentBias || "")}) · merged bias B${mbR.BUILD} C${mbR.CRISIS} P${mbR.PLAY} O${mbR.OBSERVE}`,
    minorThemes.length ? `Minor: ${minorThemes.join(", ")}` : "",
    conflictNote ? `Note: ${conflictNote}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  return {
    dominantTheme: String(dom.role || ""),
    minorThemes,
    conflictNote,
    mergedBias: mbR,
    promptBlock,
    mergedRoleHint: String(dom.role || "")
  };
}

/**
 * @param {unknown[]} threads
 * @param {Record<string, unknown>} [context]
 */
export function formatCognitiveChorusForPrompt(threads, context) {
  const active = (Array.isArray(threads) ? threads : []).filter((t) => t && String(t.status || "") === "active").slice(0, 3);
  const chorus = conductCognitiveChorus(active, context);
  if (!chorus.promptBlock) return "";
  return ["Cognitive conductor (single chorus — avoid conflicting sub-thread pulls):", chorus.promptBlock].join("\n");
}
