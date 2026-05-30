#!/usr/bin/env node
/**
 * Offline / CI: JSON probe snapshot → Markdown rapor (stdout).
 *
 * Kullanım:
 *   node scripts/continuity-probe-report.mjs path/to/probe-snapshot.json
 *   node scripts/continuity-probe-report.mjs  < probe.json
 *
 * JSON, `runOperationalContinuityProbeV1` çıktısı ile aynı şekilde olmalıdır.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const modPath = join(root, "apps/client/src/rhizoh/runtime/continuityAssessmentExportV1.js");
const { formatContinuityProbeReportMarkdown } = await import(pathToFileURL(modPath).href);

const arg = process.argv[2];
const raw = arg && arg !== "-" ? readFileSync(arg, "utf8") : readFileSync(0, "utf8");
const data = JSON.parse(raw);
process.stdout.write(formatContinuityProbeReportMarkdown(data));
