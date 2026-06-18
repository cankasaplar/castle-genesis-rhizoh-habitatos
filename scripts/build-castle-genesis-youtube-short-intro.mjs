#!/usr/bin/env node
/**
 * Build short (~45s) Castle Genesis YouTube embed clips (Honest Baseline — no sim-profile narration).
 * RESEARCH-ONLY — output for manual unlisted upload; set VITE_* video IDs in env.
 *
 * Usage:
 *   node scripts/build-castle-genesis-youtube-short-intro.mjs
 *   node scripts/build-castle-genesis-youtube-short-intro.mjs --variant chess --duration 45
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const VARIANTS = Object.freeze({
  honest: {
    slideSvg: "apps/client/public/ops/youtube-test/castle-genesis-short-embed-slide.svg",
    outName: "castle_genesis_short_honest_baseline.mp4",
    audioMaxSec: 0
  },
  chess: {
    slideSvg: "apps/client/public/ops/youtube-test/castle-genesis-chess-embed-slide.svg",
    outName: "castle_genesis_short_chess_broadcast.mp4",
    audioMaxSec: 0
  },
  manifesto_trim: {
    slideSvg: "apps/client/public/ops/youtube-test/castle-genesis-holding-slide.svg",
    outName: "castle_genesis_manifesto_trim_preview.mp4",
    audioMaxSec: 60
  }
});

function parseArgs(argv) {
  const out = { variant: "honest", durationSec: 45, audioPath: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--variant" && argv[i + 1]) out.variant = argv[++i];
    else if (a === "--duration" && argv[i + 1]) out.durationSec = Number(argv[++i]) || 45;
    else if (a === "--audio" && argv[i + 1]) out.audioPath = argv[++i];
  }
  return out;
}

function findManifestoAudio() {
  const candidates = [
    "Kendi_Yalanına_İnanmayan_Yapay_Zeka_Rhizoh.m4a",
    "Kendi_Yalanina_Inanmayan_Yapay_Zeka_Rhizoh.m4a",
    "Kendi_Yalanına_İnanmayan_Yapay_Zeka_Rhizoh.mp3"
  ];
  for (const name of candidates) {
    const p = path.join(repoRoot, name);
    if (fs.existsSync(p)) return p;
  }
  return "";
}

function exportPng(svgPath, pngPath) {
  const exportJs = path.join(repoRoot, "scripts/export-youtube-holding-slide-png.mjs");
  if (!fs.existsSync(exportJs)) {
    throw new Error(`Missing ${exportJs}`);
  }
  const r = spawnSync("node", [exportJs, svgPath, pngPath], { cwd: repoRoot, stdio: "inherit" });
  if (r.status !== 0 || !fs.existsSync(pngPath)) {
    throw new Error(`PNG export failed for ${svgPath}`);
  }
}

function runFfmpeg(args) {
  const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${args.join(" ")}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const variant = VARIANTS[args.variant] || VARIANTS.honest;
  const exportDir = path.join(repoRoot, "docs/exports/media/youtube");
  fs.mkdirSync(exportDir, { recursive: true });

  const svgPath = path.join(repoRoot, variant.slideSvg);
  const pngPath = path.join(exportDir, `${path.basename(variant.outName, ".mp4")}.png`);
  const outPath = path.join(exportDir, variant.outName);

  if (!fs.existsSync(svgPath)) throw new Error(`Slide missing: ${svgPath}`);
  exportPng(svgPath, pngPath);

  const durationSec = Math.max(15, Math.min(120, args.durationSec));
  const audioMaxSec = variant.audioMaxSec || 0;
  const audioPath = args.audioPath || (audioMaxSec > 0 ? findManifestoAudio() : "");

  if (outPath && fs.existsSync(outPath)) fs.unlinkSync(outPath);

  if (audioPath && audioMaxSec > 0 && fs.existsSync(audioPath)) {
    runFfmpeg([
      "-y",
      "-loop",
      "1",
      "-framerate",
      "1",
      "-i",
      pngPath,
      "-i",
      audioPath,
      "-t",
      String(audioMaxSec),
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-tune",
      "stillimage",
      "-pix_fmt",
      "yuv420p",
      "-r",
      "1",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-shortest",
      "-movflags",
      "+faststart",
      outPath
    ]);
  } else {
    runFfmpeg([
      "-y",
      "-loop",
      "1",
      "-framerate",
      "1",
      "-i",
      pngPath,
      "-f",
      "lavfi",
      "-i",
      "anullsrc=channel_layout=stereo:sample_rate=44100",
      "-t",
      String(durationSec),
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-tune",
      "stillimage",
      "-pix_fmt",
      "yuv420p",
      "-r",
      "1",
      "-c:a",
      "aac",
      "-b:a",
      "64k",
      "-shortest",
      "-movflags",
      "+faststart",
      outPath
    ]);
  }

  const sizeMb = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2);
  console.log(`VIDEO=${outPath}`);
  console.log(`VARIANT=${args.variant}`);
  console.log(`DURATION_SEC=${durationSec}`);
  console.log(`SIZE_MB=${sizeMb}`);
  console.log("");
  console.log("Upload unlisted → set env:");
  if (args.variant === "chess") console.log("  VITE_CASTLE_GENESIS_YOUTUBE_CHESS_VIDEO_ID=<id>");
  else if (args.variant === "manifesto_trim")
    console.log("  VITE_CASTLE_GENESIS_YOUTUBE_FULL_VIDEO_ID=<id>");
  else console.log("  VITE_CASTLE_GENESIS_YOUTUBE_SHORT_VIDEO_ID=<id>");
}

main();
