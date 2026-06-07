#!/usr/bin/env node
/**
 * Cesium executor forbidden-path guard — spatial movement must route through executor.
 * @see docs/CESIUM_EXECUTOR_SPEC_V1.md §5
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(import.meta.dirname, "..");
const scanRoot = join(root, "apps/client/src");

const EXEMPT_SEGMENTS = ["__tests__", "__research__"];

/** Layer may define legacy flyTo* API surface (executor calls internally). */
const FLYTO_ALLOWLIST = new Set([
  "apps/client/src/castleFlight/CesiumRealMapLayer.jsx",
  "apps/client/src/castleFlight/cesiumCommandExecutorV0.js"
]);

/** applyRhizohWorldMapToolV0 — warn outside tool module until full grammar consolidation. */
const MAP_TOOL_ALLOWLIST = new Set([
  "apps/client/src/rhizoh/runtime/rhizohWorldMapToolV0.js",
  "apps/client/src/rhizoh/runtime/rhizohWorldSurfacePolicyV0.js",
  "apps/client/src/AppRhizoh528T0.jsx"
]);

const FAIL_RULES = [
  { id: "flyToCustom", re: /\.flyToCustom\s*\(/ },
  { id: "flyToIstanbul", re: /\.flyToIstanbul\s*\(/ },
  { id: "flyToBootstrapViewport", re: /\.flyToBootstrapViewport\s*\(/ },
  { id: "flyToTopologyGlobe", re: /\.flyToTopologyGlobe\s*\(/ },
  { id: "focusCastle", re: /\.focusCastle\s*\(/ },
  { id: "focusPOI", re: /\.focusPOI\s*\(/ },
  { id: "streetView", re: /\.streetView\s*\(/ },
  { id: "castleCesiumFlyTo", re: /__CASTLE_CESIUM__\?\.flyTo/ },
  { id: "scheduleRhizohWorldMapFlyV0", re: /scheduleRhizohWorldMapFlyV0/ }
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|jsx|mjs|cjs|ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

function isExempt(rel) {
  return EXEMPT_SEGMENTS.some((s) => rel.includes(s));
}

function scan() {
  const failures = [];
  const warnings = [];

  for (const file of walk(scanRoot)) {
    const rel = relative(root, file).replace(/\\/g, "/");
    if (isExempt(rel)) continue;

    const text = readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNo = i + 1;

      for (const rule of FAIL_RULES) {
        if (!rule.re.test(line)) continue;
        if (FLYTO_ALLOWLIST.has(rel)) continue;
        failures.push({ rel, lineNo, rule: rule.id, text: line.trim() });
      }

      if (/applyRhizohWorldMapToolV0\s*\(/.test(line) && !MAP_TOOL_ALLOWLIST.has(rel)) {
        warnings.push({
          rel,
          lineNo,
          rule: "applyRhizohWorldMapToolV0",
          text: line.trim(),
          kind: "future_fail"
        });
      }
    }
  }

  return { failures, warnings };
}

const { failures, warnings } = scan();

if (warnings.length) {
  console.warn(`[cesium-executor-forbidden] ${warnings.length} warning(s):`);
  for (const w of warnings) {
    console.warn(`  WARN ${w.rel}:${w.lineNo} ${w.rule} — ${w.text}`);
  }
}

if (failures.length) {
  console.error(`[cesium-executor-forbidden] ${failures.length} forbidden path(s):`);
  for (const f of failures) {
    console.error(`  FAIL ${f.rel}:${f.lineNo} ${f.rule} — ${f.text}`);
  }
  process.exit(1);
}

console.log("[cesium-executor-forbidden] OK — no forbidden spatial scatter paths");
