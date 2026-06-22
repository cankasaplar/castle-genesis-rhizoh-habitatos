#!/usr/bin/env node
/**
 * Export Rhizoh Paper v0.1 preprint artifacts:
 *   - docs/academic/preprint/paper-v0.1.md
 *   - docs/academic/preprint/paper-v0.1.html
 *   - docs/academic/preprint/paper-v0.1.pdf
 *
 * Usage: npm run academic:export-preprint
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "docs/academic/RHIZOH_DISTRIBUTED_REALITY_CONSTRUCTION_PAPER_V0.1.md");
const outDir = join(root, "docs/academic/preprint");
const outMd = join(outDir, "paper-v0.1.md");
const outHtml = join(outDir, "paper-v0.1.html");
const outPdf = join(outDir, "paper-v0.1.pdf");

async function ensurePngFigures() {
  const figDir = join(root, "docs/academic/figures");
  const names = ["architecture", "authority-state-machine"];
  if (names.every((n) => existsSync(join(figDir, `${n}.png`)))) return;
  const { Resvg } = await import("@resvg/resvg-js");
  for (const name of names) {
    const svg = readFileSync(join(figDir, `${name}.svg`), "utf8");
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
    writeFileSync(join(figDir, `${name}.png`), resvg.render().asPng());
  }
}

function mdToSimpleHtml(md) {
  let html = md
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^\|(.+)\|$/gm, (line) => {
      const cells = line.split("|").filter(Boolean).map((c) => c.trim());
      if (cells.every((c) => /^-+$/.test(c))) return "";
      return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
    });

  html = html.replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, (block) => `<table>${block}</table>\n`);
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`);
  html = html.replace(/\n\n/g, "</p><p>");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Rhizoh Paper v0.1</title>
<style>
body{font-family:Georgia,serif;max-width:820px;margin:2rem auto;line-height:1.55;color:#111}
h1{font-size:1.6rem} h2{font-size:1.25rem;margin-top:1.6rem} h3{font-size:1.05rem}
code,pre{font-family:ui-monospace,monospace;font-size:0.9em}
pre{background:#f4f4f5;padding:0.75rem;overflow:auto;border-radius:6px}
table{border-collapse:collapse;width:100%;margin:1rem 0;font-size:0.92rem}
td,th{border:1px solid #ccc;padding:0.35rem 0.5rem}
img{max-width:100%;height:auto;margin:1rem 0}
</style></head><body><p>${html}</p></body></html>`;
}

async function htmlToPdf(htmlPath, pdfPath) {
  const chrome = process.env.CHROME_PATH || "/usr/local/bin/google-chrome";
  const userDataDir = `/tmp/rhizoh-chrome-pdf-${process.pid}`;
  const res = spawnSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      `--user-data-dir=${userDataDir}`,
      `--print-to-pdf=${pdfPath}`,
      `file://${htmlPath}`
    ],
    { encoding: "utf8", timeout: 45_000 }
  );
  if (res.status !== 0 || !existsSync(pdfPath)) {
    throw new Error(res.stderr || "chrome_pdf_failed");
  }
}

mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, "figures"), { recursive: true });

await ensurePngFigures();

let md = readFileSync(src, "utf8");
const figureBlock = `
![Rhizoh architecture](figures/architecture.png)

*Figure 1. Client simulator, gateway finalizer, observability split.*

![Authority state machine](figures/authority-state-machine.png)

*Figure 2. Formal transition model: preview, propose, validate, commit, reconcile, reduce.*

`;

if (!md.includes("Figure 1. Client simulator")) {
  md = md.replace("## 5. Architecture", `${figureBlock}\n## 5. Architecture`);
}

writeFileSync(outMd, md, "utf8");
for (const name of ["architecture", "authority-state-machine"]) {
  const png = join(root, "docs/academic/figures", `${name}.png`);
  const svg = join(root, "docs/academic/figures", `${name}.svg`);
  if (existsSync(png)) copyFileSync(png, join(outDir, "figures", `${name}.png`));
  if (existsSync(svg)) copyFileSync(svg, join(outDir, "figures", `${name}.svg`));
}

const html = mdToSimpleHtml(md);
writeFileSync(outHtml, html, "utf8");

try {
  await htmlToPdf(outHtml, outPdf);
  console.log(`[export-paper-preprint] Wrote ${outPdf}`);
} catch (e) {
  console.warn(`[export-paper-preprint] PDF skipped: ${e?.message || e}`);
  console.warn("[export-paper-preprint] HTML + Markdown available; use browser Print to PDF");
}

console.log(`[export-paper-preprint] Wrote ${outMd}`);
console.log(`[export-paper-preprint] Wrote ${outHtml}`);
