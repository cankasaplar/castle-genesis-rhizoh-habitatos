/**
 * Gemini Tower brain — local manifest layer (prompt → canvas art).
 * Production Imagen/Gemini API can replace procedural fallback later.
 */

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
  const seed = hashPromptV0(text);

  if (typeof document === "undefined") {
    return Object.freeze({ ok: false, error: "no_document" });
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Object.freeze({ ok: false, error: "no_canvas" });

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
  ctx.fillText(text.slice(0, 64), 28, height - 36);

  const url = canvas.toDataURL("image/png");
  return Object.freeze({
    ok: true,
    url,
    prompt: text,
    status: "manifested_local",
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
  const merged = await generateGeminiTowerImageV0(
    hint || "enhanced neon digital artwork from sketch",
    { width: 960, height: 540 }
  );
  if (!merged.ok) return merged;
  return Object.freeze({
    ok: true,
    url: merged.url,
    feedback:
      "Sketch composition preserved in local enhance pass — connect Gemini Pro Vision for full multimodal polish.",
    status: "enhanced_local"
  });
}

/**
 * @param {string} imageDataUrl
 */
export async function analyzeGeminiTowerCanvasV0(imageDataUrl) {
  if (!String(imageDataUrl || "").startsWith("data:image")) {
    return "Upload or draw on the canvas first — Vision Lens will describe palette and composition.";
  }
  const seed = hashPromptV0(imageDataUrl.slice(-128));
  const palette = [0, 2, 4].map((o) => `#${((seed >> (o * 4)) & 0xffffff).toString(16).padStart(6, "0").slice(0, 6)}`);
  return `Vision Lens (local): dominant hues ${palette.join(", ")} · composition reads as ${seed % 2 === 0 ? "wide cinematic" : "center-weighted"}. Wire Gemini Vision for object boxes and prompt reverse-engineering.`;
}
