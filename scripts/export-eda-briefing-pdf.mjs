#!/usr/bin/env node
/**
 * Export EDA external briefing pack → combined PDF
 * @see docs/outreach/EDA_EXTERNAL_BRIEFING_V1.0/
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(
  root,
  "docs/outreach/EDA_EXTERNAL_BRIEFING_V1.0/EDA_EXTERNAL_BRIEFING_COMBINED_SOURCE_V1.0.md"
);
const outDir = join(root, "docs/outreach/EDA_EXTERNAL_BRIEFING_V1.0/export");
const pdfOut = join(outDir, "Castle_Genesis_Rhizoh_External_Briefing_v1.0.pdf");
const htmlOut = join(outDir, "Castle_Genesis_Rhizoh_External_Briefing_v1.0.html");

mkdirSync(outDir, { recursive: true });

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", ...opts });
}

function stripFrontmatter(md) {
  if (md.startsWith("---")) {
    const end = md.indexOf("---", 3);
    if (end !== -1) return md.slice(end + 3).trimStart();
  }
  return md;
}

function preprocessMd(md) {
  return stripFrontmatter(md).replace(/\\newpage/g, '<div class="page-break"></div>');
}

const PRINT_CSS = `
@page { size: A4; margin: 2cm 2.2cm; }
body {
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #111;
}
h1 { font-size: 20pt; margin: 0 0 0.6em; page-break-after: avoid; }
h2 { font-size: 14pt; margin: 1.1em 0 0.4em; page-break-after: avoid; }
h3 { font-size: 12pt; margin: 0.9em 0 0.35em; }
p, li { orphans: 3; widows: 3; }
table { border-collapse: collapse; width: 100%; margin: 0.7em 0; font-size: 10pt; }
th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
th { background: #f0f4f8; }
hr { border: none; border-top: 1px solid #ddd; margin: 1.2em 0; }
.page-break { page-break-before: always; break-before: page; height: 0; }
pre, code { font-family: Consolas, "Courier New", monospace; font-size: 8.5pt; }
pre {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  padding: 10px 12px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.35;
}
blockquote { border-left: 3px solid #6b8cae; margin: 0.8em 0; padding-left: 1em; color: #333; }
.cover-meta { margin-top: 1.5em; }
`;

function wrapHtml(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Castle Genesis / Rhizoh — External Briefing v1.0</title>
<style>${PRINT_CSS}</style>
</head>
<body>${body}</body>
</html>`;
}

async function mdToHtml(md) {
  const { marked } = await import("marked");
  marked.setOptions({ gfm: true, breaks: false });
  return marked.parse(preprocessMd(md));
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean);
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  const which = run("where", ["chrome"], { shell: true });
  if (which.status === 0 && which.stdout?.trim()) {
    return which.stdout.trim().split(/\r?\n/)[0];
  }
  return null;
}

function pdfReady(pdfPath) {
  if (!existsSync(pdfPath)) return false;
  try {
    return statSync(pdfPath).size > 4096;
  } catch {
    return false;
  }
}

function printPdf(browser, htmlPath, pdfPath) {
  const fileUrl = pathToFileURL(resolve(htmlPath)).href;
  run(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--no-pdf-header-footer",
      `--print-to-pdf=${resolve(pdfPath)}`,
      fileUrl
    ],
    { timeout: 120000, shell: false }
  );
  return pdfReady(pdfPath);
}

if (!existsSync(src)) {
  console.error("Missing source:", src);
  process.exit(1);
}

const md = readFileSync(src, "utf8");
let body;
try {
  body = await mdToHtml(md);
} catch (e) {
  console.error("Install marked: npm install marked --no-save");
  console.error(e?.message || e);
  process.exit(1);
}

const html = wrapHtml(body);
writeFileSync(htmlOut, html, "utf8");

const browser = findBrowser();
if (browser && printPdf(browser, htmlOut, pdfOut)) {
  console.log(JSON.stringify({ ok: true, pdf: pdfOut, html: htmlOut }, null, 2));
  process.exit(0);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      format: "html",
      html: htmlOut,
      pdf: pdfOut,
      message: "PDF failed — open HTML in browser → Print → Save as PDF (A4)"
    },
    null,
    2
  )
);
