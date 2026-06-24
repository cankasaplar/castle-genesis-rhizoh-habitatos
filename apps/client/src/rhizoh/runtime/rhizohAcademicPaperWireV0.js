/**
 * Academic paper v0.1 — browser download / copy (no terminal).
 * RESEARCH-ONLY
 */

import { copyTextSafeV0 } from "./rhizohClipboardSafeV0.js";

export const RHIZOH_ACADEMIC_PAPER_WIRE_SCHEMA_V0 = "castle.rhizoh.academic_paper_wire.v0";

export const RHIZOH_ACADEMIC_PAPER_PUBLIC_MD_V0 = "/rhizoh/academic/paper-v0.1.md";
export const RHIZOH_ACADEMIC_PAPER_PUBLIC_HTML_V0 = "/rhizoh/academic/paper-v0.1.html";
export const RHIZOH_ACADEMIC_PAPER_PUBLIC_PDF_V0 = "/rhizoh/academic/paper-v0.1.pdf";

/**
 * @param {{ locale?: string }} [opts]
 */
export function buildRhizohAcademicPaperPackV0(opts = {}) {
  const tr = String(opts.locale || "tr") === "tr";
  return Object.freeze({
    schema: RHIZOH_ACADEMIC_PAPER_WIRE_SCHEMA_V0,
    interpretationOnly: true,
    title: tr
      ? "Rhizoh: Event-Sourced Authority Arbitration for Distributed Reality Construction"
      : "Rhizoh: Event-Sourced Authority Arbitration for Distributed Reality Construction",
    version: "v0.1",
    markdownUrl: RHIZOH_ACADEMIC_PAPER_PUBLIC_MD_V0,
    htmlUrl: RHIZOH_ACADEMIC_PAPER_PUBLIC_HTML_V0,
    pdfUrl: RHIZOH_ACADEMIC_PAPER_PUBLIC_PDF_V0,
    academyResearch: "/academy/research",
    academyLanding: "/academy",
    readInBrowser: `https://rhizoh.com${RHIZOH_ACADEMIC_PAPER_PUBLIC_MD_V0}`,
    atMs: Date.now()
  });
}

/**
 * @param {{ locale?: string }} [opts]
 */
export async function fetchRhizohAcademicPaperMarkdownV0(opts = {}) {
  const url = RHIZOH_ACADEMIC_PAPER_PUBLIC_MD_V0;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return Object.freeze({ ok: false, reason: `http_${res.status}`, url });
  }
  const markdown = await res.text();
  return Object.freeze({
    ok: true,
    url,
    markdown,
    byteLength: markdown.length,
    pack: buildRhizohAcademicPaperPackV0(opts)
  });
}

/**
 * Trigger browser download of paper markdown (works without terminal).
 * @param {{ locale?: string, filename?: string }} [opts]
 */
export async function downloadRhizohAcademicPaperV0(opts = {}) {
  const fetched = await fetchRhizohAcademicPaperMarkdownV0(opts);
  if (!fetched.ok) return fetched;
  const filename = String(opts.filename || "rhizoh-paper-v0.1.md");
  const blob = new Blob([fetched.markdown], { type: "text/markdown;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
  return Object.freeze({ ok: true, method: "download", filename, byteLength: fetched.byteLength });
}

/**
 * @param {{ locale?: string }} [opts]
 */
export async function copyRhizohAcademicPaperAbstractV0(opts = {}) {
  const tr = String(opts.locale || "tr") === "tr";
  const abstract = tr
    ? "Rhizoh — event-sourced authority arbitration; client simüle eder, gateway commit verir. Gözlem ≠ yürütme. Paper v0.1: rhizoh.com/rhizoh/academic/paper-v0.1.md"
    : "Rhizoh — event-sourced authority arbitration; client simulates, gateway commits. Observation ≠ execution. Paper v0.1: rhizoh.com/rhizoh/academic/paper-v0.1.md";
  return copyTextSafeV0(abstract, { fallbackFilename: "rhizoh-paper-abstract.txt" });
}

export function ensureRhizohAcademicPaperWireV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.paperV01 = (opts = {}) => buildRhizohAcademicPaperPackV0(opts);
  window.__rhizoh.downloadPaperV01 = (opts = {}) => downloadRhizohAcademicPaperV0(opts);
  window.__rhizoh.copyPaperAbstract = (opts = {}) => copyRhizohAcademicPaperAbstractV0(opts);
  return window.__rhizoh.paperV01;
}
