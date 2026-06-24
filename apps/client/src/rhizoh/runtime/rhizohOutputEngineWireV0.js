/**
 * Output Engine DevTools wire — RESEARCH-ONLY
 */

import { buildRhizohOutputPackV0, formatRhizohOutputPackMarkdownV0 } from "./rhizohOutputEngineV0.js";
import { copyTextSafeV0 } from "./rhizohClipboardSafeV0.js";
import { exportJsonSafeV0 } from "../ingress/exportJsonSafeV0.js";

export function printRhizohOutputPackV0(opts = {}) {
  const pack = buildRhizohOutputPackV0(opts);
  if (typeof console !== "undefined") {
    console.log(pack.markdown);
  }
  return Object.freeze({ printed: true, pack });
}

export async function copyRhizohOutputPackV0(opts = {}) {
  const pack = buildRhizohOutputPackV0(opts);
  const copy = await copyTextSafeV0(pack.markdown, {
    filename: "rhizoh-output-pack-v1.txt",
    logOnFallback: true
  });
  return Object.freeze({
    copied: copy.ok,
    method: copy.method,
    hint: copy.hint,
    pack
  });
}

export async function exportRhizohOutputPackJsonV0(opts = {}) {
  const pack = buildRhizohOutputPackV0(opts);
  const { programs, markdown, ...jsonBody } = pack;
  const json = JSON.stringify(
    Object.freeze({
      ...jsonBody,
      programs
    }),
    null,
    2
  );
  const result = await exportJsonSafeV0(json, "rhizoh-output-pack-v1.json");
  return Object.freeze({ ...result, pack });
}

export function ensureRhizohOutputEngineDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  window.__rhizoh.outputPack = (opts = {}) => buildRhizohOutputPackV0(opts);
  window.__rhizoh.printOutputPack = (opts = {}) => printRhizohOutputPackV0(opts);
  window.__rhizoh.copyOutputPack = (opts = {}) => copyRhizohOutputPackV0(opts);
  window.__rhizoh.exportOutputPackJson = (opts = {}) => exportRhizohOutputPackJsonV0(opts);

  return window.__rhizoh.outputPack;
}
