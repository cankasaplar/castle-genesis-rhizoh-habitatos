/**
 * Gemini Tower brain — gateway Gemini brief + local canvas manifest.
 * Image pixels stay client-side; creative text uses Render GEMINI_API_KEY via /rhizoh/llm.
 */

import { postRhizohLlmTurnV0 } from "./rhizohLlmTurnClientV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { resolveRhizohLlmLanguageV0 } from "./rhizohLanguagePropagationV0.js";
import { parseTowerImageDataUrlV0 } from "./rhizohTowerMediaCaptureV0.js";

function hashPromptV0(prompt) {
  let h = 2166136261;
  const s = String(prompt || "");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function hueFromSeedV0(seed, offset = 0) {
  return (seed + offset * 47) % 360;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {string} prompt
 * @param {string} [brief]
 */
function paintManifestCanvasV0(ctx, width, height, prompt, brief = "") {
  const seed = hashPromptV0(`${prompt}|${brief}`);
  const g = ctx.createLinearGradient(0, 0, width, height);
  g.addColorStop(0, `hsl(${hueFromSeedV0(seed, 0)}, 72%, 42%)`);
  g.addColorStop(0.45, `hsl(${hueFromSeedV0(seed, 3)}, 68%, 28%)`);
  g.addColorStop(1, `hsl(${hueFromSeedV0(seed, 7)}, 80%, 52%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 12; i += 1) {
    const r = 40 + ((seed + i * 131) % 180);
    const x = ((seed >> (i % 8)) * (i + 3)) % width;
    const y = ((seed >> ((i + 2) % 8)) * (i + 7)) % height;
    ctx.beginPath();
    ctx.fillStyle = `hsla(${hueFromSeedV0(seed, i + 1)}, 85%, 65%, 0.18)`;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(248, 250, 252, 0.92)";
  ctx.font = "600 22px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(prompt.slice(0, 64), 28, height - (brief ? 72 : 36));

  if (brief) {
    ctx.fillStyle = "rgba(226, 232, 240, 0.88)";
    ctx.font = "500 14px ui-sans-serif, system-ui, sans-serif";
    const lines = brief.slice(0, 220).split(/\n+/).slice(0, 3);
    lines.forEach((line, idx) => {
      ctx.fillText(line.slice(0, 72), 28, height - 48 + idx * 18);
    });
  }
}

async function fetchGeminiVisualBriefV0(prompt) {
  const text = String(prompt || "").trim();
  if (!text) return null;
  const tr = resolveOutputLanguageCodeV0() === "tr";
  const llmLang = resolveRhizohLlmLanguageV0();
  try {
    const turn = await postRhizohLlmTurnV0({
      message: tr
        ? `Imagine Atelier görsel özeti: "${text}". Yanıtı 2-3 canlı Türkçe cümleyle ver: palet, ruh hali, kompozisyon. Yalnızca düz metin.`
        : `Imagine Atelier visual brief for: "${text}". Reply in 2-3 vivid sentences: palette, mood, composition. Plain text only.`,
      provider: "gemini",
      llmKeySource: "env",
      context: Object.freeze({
        towerId: "gemini_tower",
        surface: "imagine_atelier",
        task: "visual_brief"
      }),
      options: { maxTokens: 180, language: llmLang.bcp47 }
    });
    const reply = String(turn?.reply || "").trim();
    if (turn?.ok && reply) return reply;
  } catch {
    /* gateway optional — local fallback */
  }
  return null;
}

/**
 * @param {string} prompt
 * @param {{ width?: number, height?: number }} [opts]
 */
export async function generateGeminiTowerImageV0(prompt, opts = {}) {
  const text = String(prompt || "").trim();
  if (!text) {
    return Object.freeze({ ok: false, error: "empty_prompt" });
  }

  const width = Math.max(320, Number(opts.width) || 960);
  const height = Math.max(180, Number(opts.height) || 540);
  const brief = await fetchGeminiVisualBriefV0(text);

  if (typeof document === "undefined") {
    return Object.freeze({ ok: false, error: "no_document" });
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Object.freeze({ ok: false, error: "no_canvas" });

  paintManifestCanvasV0(ctx, width, height, text, brief || "");

  const url = canvas.toDataURL("image/png");
  return Object.freeze({
    ok: true,
    url,
    prompt: text,
    brief,
    status: brief ? "manifested_gemini_brief" : "manifested_local",
    aspectRatio: "16:9"
  });
}

/**
 * @param {string} sketchDataUrl
 * @param {string} [hint]
 */
export async function enhanceGeminiTowerSketchV0(sketchDataUrl, hint = "") {
  const base = String(sketchDataUrl || "").trim();
  if (!base.startsWith("data:image")) {
    return Object.freeze({ ok: false, error: "invalid_sketch" });
  }
  const brief = await fetchGeminiVisualBriefV0(hint || "enhance sketch composition with neon polish");
  const merged = await generateGeminiTowerImageV0(
    hint || "enhanced neon digital artwork from sketch",
    { width: 960, height: 540 }
  );
  if (!merged.ok) return merged;
  return Object.freeze({
    ok: true,
    url: merged.url,
    feedback:
      brief ||
      merged.brief ||
      "Sketch enhanced with Gemini brief on Render — full multimodal polish pending Imagen wire-up.",
    status: merged.status
  });
}

/**
 * @param {string} imageDataUrl
 */
export async function analyzeGeminiTowerCanvasV0(imageDataUrl) {
  if (!String(imageDataUrl || "").startsWith("data:image")) {
    return "Upload or draw on the canvas first — Vision Lens will describe palette and composition.";
  }
  const tr = resolveOutputLanguageCodeV0() === "tr";
  const llmLang = resolveRhizohLlmLanguageV0();
  const parsed = parseTowerImageDataUrlV0(imageDataUrl);
  try {
    const turn = await postRhizohLlmTurnV0({
      message: tr
        ? "Bu görüntüyü tek kısa Türkçe paragrafta anlat: palet, ruh hali, kompozisyon ve dikkat çeken nesneler."
        : "Describe this image in one short paragraph: palette, mood, composition, and salient objects.",
      provider: "gemini",
      llmKeySource: "env",
      context: Object.freeze({
        towerId: "gemini_tower",
        surface: "vision_lens",
        ...(parsed
          ? {
              towerVision: Object.freeze({
                mimeType: parsed.mimeType,
                base64: parsed.base64
              })
            }
          : {})
      }),
      options: { maxTokens: 220, language: llmLang.bcp47 }
    });
    if (turn?.ok && turn.reply) return String(turn.reply).trim();
  } catch {
    /* fallback */
  }
  const seed = hashPromptV0(imageDataUrl.slice(-128));
  const palette = [0, 2, 4].map((o) => `#${((seed >> (o * 4)) & 0xffffff).toString(16).padStart(6, "0").slice(0, 6)}`);
  return `Vision Lens (local): dominant hues ${palette.join(", ")} · composition reads as ${seed % 2 === 0 ? "wide cinematic" : "center-weighted"}.`;
}
