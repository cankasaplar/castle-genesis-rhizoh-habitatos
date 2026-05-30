#!/usr/bin/env node
/**
 * Export RHIZOH_LEGAL_PACK_PRIMARY_PDF_SOURCE_V1.0.md → PDF
 * 1) pandoc + pdflatex/xelatex (if installed)
 * 2) marked + Chrome/Edge headless --print-to-pdf
 * 3) print-ready HTML only (browser Print → PDF)
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "docs/legal/RHIZOH_LEGAL_PACK_PRIMARY_PDF_SOURCE_V1.0.md");
const outDir = join(root, "docs/exports/legal");
const pdfOut = join(outDir, "Rhizoh_Legal_Pack_Primary_v1.0_DRAFT.pdf");
const htmlOut = join(outDir, "Rhizoh_Legal_Pack_Primary_v1.0_DRAFT.html");

mkdirSync(outDir, { recursive: true });

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", shell: true, ...opts });
  return { ok: r.status === 0, stdout: r.stdout, stderr: r.stderr, status: r.status };
}

function stripFrontmatter(md) {
  if (md.startsWith("---")) {
    const end = md.indexOf("---", 3);
    if (end !== -1) return md.slice(end + 3).trimStart();
  }
  return md;
}

function preprocessMd(md) {
  return stripFrontmatter(md)
    .replace(/\\newpage/g, "\n\n<div class=\"page-break\"></div>\n\n");
}

const PRINT_CSS = `
@page { size: A4; margin: 2.2cm 2.5cm; }
* { box-sizing: border-box; }
body {
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.45;
  color: #111;
  max-width: 100%;
  margin: 0;
  padding: 0;
}
h1 { font-size: 18pt; margin: 1.2em 0 0.5em; page-break-after: avoid; }
h2 { font-size: 14pt; margin: 1em 0 0.4em; page-break-after: avoid; }
h3 { font-size: 12pt; margin: 0.8em 0 0.3em; }
p, li { orphans: 3; widows: 3; }
table { border-collapse: collapse; width: 100%; margin: 0.8em 0; font-size: 10pt; }
th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
th { background: #f5f5f5; }
hr { border: none; border-top: 1px solid #ddd; margin: 1.5em 0; }
.page-break { page-break-before: always; break-before: page; height: 0; margin: 0; }
blockquote { border-left: 3px solid #999; margin: 0.8em 0; padding: 0.2em 0 0.2em 1em; color: #333; }
code { font-size: 0.9em; background: #f4f4f4; padding: 0.1em 0.3em; }
.cover-meta { margin: 1em 0 1.5em; }
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

function wrapHtml(body) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Rhizoh Legal Pack v1.0 DRAFT</title>
<style>${PRINT_CSS}</style>
</head>
<body>
${body}
</body>
</html>`;
}

async function mdToHtml(md) {
  let marked;
  try {
    marked = (await import("marked")).marked;
  } catch {
    console.error("Package 'marked' not found. Run: npm install marked --no-save");
    process.exit(1);
  }
  marked.setOptions({ gfm: true, breaks: false });
  return marked.parse(preprocessMd(md));
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean);
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  const which = run("where", ["chrome"]);
  if (which.ok && which.stdout.trim()) {
    return which.stdout.trim().split(/\r?\n/)[0];
  }
  return null;
}

function printPdfWithBrowser(browser, htmlPath, pdfPath) {
  const fileUrl = pathToFileURL(resolve(htmlPath)).href;
  const args = [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--virtual-time-budget=5000",
    "--no-pdf-header-footer",
    `--print-to-pdf=${resolve(pdfPath)}`,
    fileUrl
  ];
  const r = spawnSync(browser, args, { encoding: "utf8", timeout: 120000 });
  return r.status === 0 && existsSync(pdfPath);
}

function tryPandoc() {
  const pandoc = run("pandoc", ["--version"]);
  if (!pandoc.ok) return null;

  for (const engine of ["pdflatex", "xelatex"]) {
    const extra =
      engine === "xelatex"
        ? ["-V", "mainfont=DejaVu Sans"]
        : [];
    const pdf = run("pandoc", [
      src,
      "-o",
      pdfOut,
      `--pdf-engine=${engine}`,
      "-V",
      "geometry:margin=2.5cm",
      "-V",
      "lang=tr",
      "--metadata",
      "title=Rhizoh Legal Pack v1.0 DRAFT",
      ...extra
    ]);
    if (pdf.ok && existsSync(pdfOut)) return { format: "pdf", path: pdfOut, engine: `pandoc+${engine}` };
  }
  return null;
}

const md = readFileSync(src, "utf8");
const pandocResult = tryPandoc();
if (pandocResult) {
  console.log(JSON.stringify({ ok: true, ...pandocResult }, null, 2));
  process.exit(0);
}

const body = await mdToHtml(md);
const html = wrapHtml(body);
writeFileSync(htmlOut, html, "utf8");

const browser = findBrowser();
if (browser) {
  const ok = printPdfWithBrowser(browser, htmlOut, pdfOut);
  if (ok) {
    console.log(
      JSON.stringify(
        { ok: true, format: "pdf", path: pdfOut, engine: "chrome-headless", html: htmlOut },
        null,
        2
      )
    );
    process.exit(0);
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      format: "html",
      path: htmlOut,
      message:
        "PDF engine unavailable. Open HTML in Chrome → Ctrl+P → Save as PDF (A4, margins default).",
      pdfPath: pdfOut
    },
    null,
    2
  )
);
