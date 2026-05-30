#!/usr/bin/env node
/**
 * Üretim öncesi ortam değişkeni kontrolü (anahtar değerlerini yazdırmaz).
 * Kullanım:
 *   node scripts/verify-production-env.mjs
 *   node scripts/verify-production-env.mjs --target=client
 *   node scripts/verify-production-env.mjs --target=gateway
 *   node scripts/verify-production-env.mjs --strict
 *
 * Dosyalar: apps/client/.env.production, apps/gateway/.env (veya .env.local)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function parseEnv(text) {
  const out = {};
  if (!text) return out;
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function loadFirstExisting(relPaths) {
  for (const rel of relPaths) {
    const full = path.join(root, rel);
    if (fs.existsSync(full)) {
      return { path: rel, env: parseEnv(fs.readFileSync(full, "utf8")) };
    }
  }
  return { path: null, env: {} };
}

function mergeProcessEnv(base) {
  return { ...base, ...process.env };
}

function checkFirebaseConfig(env, errors, warnings, strict) {
  const raw = env.VITE_FIREBASE_CONFIG;
  const splitOk =
    String(env.VITE_FIREBASE_API_KEY || "").trim() !== "" &&
    String(env.VITE_FIREBASE_PROJECT_ID || "").trim() !== "";

  if (raw && String(raw).trim() !== "" && raw !== "{}") {
    try {
      const j = JSON.parse(raw);
      if (!j.apiKey && !j.api_key) warnings.push("VITE_FIREBASE_CONFIG içinde apiKey görünmüyor.");
      if (!j.projectId && !j.project_id) warnings.push("VITE_FIREBASE_CONFIG içinde projectId görünmüyor.");
      if (strict && (!j.apiKey || !(j.projectId || j.project_id))) {
        errors.push("VITE_FIREBASE_CONFIG strict modda geçerli apiKey + projectId bekleniyor.");
      }
    } catch {
      errors.push("VITE_FIREBASE_CONFIG geçerli JSON değil.");
    }
    return;
  }

  if (splitOk) return;

  errors.push(
    "Firebase Web yapılandırması eksik: VITE_FIREBASE_CONFIG (tek satır JSON) veya VITE_FIREBASE_API_KEY + VITE_FIREBASE_PROJECT_ID birlikte."
  );
}

function providerKeyName(provider) {
  const p = String(provider || "openai").toLowerCase();
  const map = {
    openai: "OPENAI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    gemini: "GOOGLE_API_KEY veya GEMINI_API_KEY",
    xai: "XAI_API_KEY",
    deepseek: "DEEPSEEK_API_KEY",
    mistral: "MISTRAL_API_KEY",
    openrouter: "OPENROUTER_API_KEY"
  };
  return map[p] || "OPENAI_API_KEY";
}

function checkGatewayLiveBaseOriginAlignment(env, errors, warnings, strict) {
  const httpLlm = String(env.VITE_GATEWAY_HTTP || env.VITE_RHIZOH_LLM_HTTP || "").trim();
  const liveBase = String(env.VITE_LIVE_GATEWAY_BASE || "").trim().replace(/\/+$/, "");
  if (!httpLlm || !liveBase) return;
  try {
    const uLlm = new URL(httpLlm);
    const uLive = new URL(/^https?:\/\//i.test(liveBase) ? liveBase : `https://${liveBase}`);
    if (uLlm.origin !== uLive.origin) {
      const msg = `Gateway origin drift: VITE_GATEWAY_HTTP/VITE_RHIZOH_LLM_HTTP (${uLlm.origin}) ≠ VITE_LIVE_GATEWAY_BASE (${uLive.origin}) — Genesis SSE vs LLM/runtime split riski; aynı Render host’a kilitle.`;
      if (strict) errors.push(msg);
      else warnings.push(msg);
    }
  } catch {
    /* URL parse hatalarında diğer kontroller yeterli */
  }
}

function runClient(env, strict) {
  const errors = [];
  const warnings = [];
  checkFirebaseConfig(env, errors, warnings, strict);

  const ws = env.VITE_GATEWAY_WS || env.VITE_GATEWAY_WS_URL || "";
  if (!ws) errors.push("VITE_GATEWAY_WS veya VITE_GATEWAY_WS_URL boş — gateway WebSocket adresi gerekli.");
  else if (!ws.startsWith("wss://")) warnings.push("Üretimde gateway WebSocket için wss:// önerilir.");

  const httpLlm = env.VITE_GATEWAY_HTTP || env.VITE_RHIZOH_LLM_HTTP || "";
  if (!httpLlm) warnings.push("VITE_GATEWAY_HTTP veya VITE_RHIZOH_LLM_HTTP boş — Rhizoh uzak LLM kullanılamaz.");
  else if (!httpLlm.startsWith("https://")) warnings.push("Üretimde Rhizoh HTTP için https:// önerilir.");

  if (!env.VITE_GATEWAY_TOKEN && strict) {
    warnings.push("VITE_GATEWAY_TOKEN boş — gateway CASTLE_GATEWAY_TOKEN ile eşleşmeli (genelde üretimde dolu olmalı).");
  }

  checkGatewayLiveBaseOriginAlignment(env, errors, warnings, strict);

  const appId = env.VITE_CASTLE_APP_ID || "castle-vnext-core";
  if (!env.VITE_CASTLE_APP_ID) warnings.push(`VITE_CASTLE_APP_ID boş — varsayılan kullanılacak: ${appId}`);

  if (!env.VITE_CESIUM_ION_TOKEN) {
    warnings.push("VITE_CESIUM_ION_TOKEN boş — Cesium Ion küre/terrain kısıtlı kalabilir (fallback OSM).");
  }

  return { errors, warnings, label: "apps/client/.env.production (veya build env)" };
}

function runGateway(env, strict) {
  const errors = [];
  const warnings = [];

  const persist = env.CASTLE_REQUIRE_FIREBASE_PERSIST === "true";
  if (persist) {
    if (!env.FIREBASE_PROJECT_ID) errors.push("CASTLE_REQUIRE_FIREBASE_PERSIST=true iken FIREBASE_PROJECT_ID zorunlu.");
    if (!env.FIREBASE_CLIENT_EMAIL) errors.push("CASTLE_REQUIRE_FIREBASE_PERSIST=true iken FIREBASE_CLIENT_EMAIL zorunlu.");
    if (!env.FIREBASE_PRIVATE_KEY) errors.push("CASTLE_REQUIRE_FIREBASE_PERSIST=true iken FIREBASE_PRIVATE_KEY zorunlu.");
  } else {
    warnings.push("CASTLE_REQUIRE_FIREBASE_PERSIST=false — Firestore kalıcılığı kapalı olabilir.");
  }

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    if (strict) warnings.push("Firebase Admin üçlüsü eksik — üretimde token doğrulama / Firestore Admin çalışmayabilir.");
  }

  const provider = env.CASTLE_LLM_PROVIDER || "openai";
  const keyHint = providerKeyName(provider);
  const keyPresent =
    provider === "openai"
      ? !!env.OPENAI_API_KEY
      : provider === "anthropic"
        ? !!env.ANTHROPIC_API_KEY
        : provider === "gemini"
          ? !!(env.GOOGLE_API_KEY || env.GEMINI_API_KEY)
          : provider === "xai"
            ? !!env.XAI_API_KEY
            : provider === "deepseek"
              ? !!env.DEEPSEEK_API_KEY
              : provider === "mistral"
                ? !!env.MISTRAL_API_KEY
                : provider === "openrouter"
                  ? !!env.OPENROUTER_API_KEY
                  : !!env.OPENAI_API_KEY;

  if (!keyPresent) errors.push(`Seçilen LLM sağlayıcısı (${provider}) için ${keyHint} ortamda yok.`);

  if (!env.CASTLE_GATEWAY_TOKEN && strict) {
    warnings.push("CASTLE_GATEWAY_TOKEN boş — istemci ile paylaşımlı token üretimde önerilir.");
  }

  const cors = env.CASTLE_HTTP_CORS_ORIGIN || "";
  if (cors === "*" && strict) warnings.push("CASTLE_HTTP_CORS_ORIGIN=* geniş — mümkünse https://castle-genesis.web.app gibi sabitleyin.");

  return { errors, warnings, label: "apps/gateway/.env" };
}

function main() {
  const argv = process.argv.slice(2);
  const strict = argv.includes("--strict");
  let target = "all";
  const tArg = argv.find((a) => a.startsWith("--target="));
  if (tArg) target = tArg.split("=")[1] || "all";

  console.log("Castle — üretim ortamı doğrulaması\n");

  let exitCode = 0;

  if (target === "client" || target === "all") {
    const loaded = loadFirstExisting(["apps/client/.env.production"]);
    const env = mergeProcessEnv(loaded.env);
    const { errors, warnings, label } = runClient(env, strict);
    console.log(`[Client] Kaynak: ${loaded.path || "(dosya yok — yalnızca process.env)"}`);
    console.log(`         Beklenen: apps/client/.env.production.example → .env.production kopyalayın\n`);
    for (const w of warnings) console.warn(`  ⚠ ${w}`);
    for (const e of errors) {
      console.error(`  ✖ ${e}`);
      exitCode = 1;
    }
    if (!warnings.length && !errors.length) console.log("  ✓ Client kontrolleri geçti.\n");
    else console.log("");
  }

  if (target === "gateway" || target === "all") {
    const loaded = loadFirstExisting(["apps/gateway/.env.local", "apps/gateway/.env"]);
    const env = mergeProcessEnv(loaded.env);
    const { errors, warnings, label } = runGateway(env, strict);
    console.log(`[Gateway] Kaynak: ${loaded.path || "(dosya yok — yalnızca process.env)"}`);
    console.log(`          Beklenen: apps/gateway/.env.production.example → .env veya barındırıcı secret\n`);
    for (const w of warnings) console.warn(`  ⚠ ${w}`);
    for (const e of errors) {
      console.error(`  ✖ ${e}`);
      exitCode = 1;
    }
    if (!warnings.length && !errors.length) console.log("  ✓ Gateway kontrolleri geçti.\n");
    else console.log("");
  }

  if (target === "all") {
    const clientLoaded = loadFirstExisting(["apps/client/.env.production"]);
    const gwLoaded = loadFirstExisting(["apps/gateway/.env.local", "apps/gateway/.env"]);
    const vApp = clientLoaded.env.VITE_CASTLE_APP_ID || "castle-vnext-core";
    const gApp = gwLoaded.env.CASTLE_ARTIFACT_APP_ID || "castle-vnext-core";
    if (clientLoaded.path && gwLoaded.path && vApp !== gApp) {
      console.warn(`⚠ App ID uyumsuzluğu: istemci VITE_CASTLE_APP_ID=${vApp} ≠ gateway CASTLE_ARTIFACT_APP_ID=${gApp}\n`);
    }
  }

  if (exitCode !== 0) {
    console.error("Özet: hataları giderin; uyarılar için docs/PRODUCTION_LAUNCH_CHECKLIST.md dosyasına bakın.\n");
  } else {
    console.log("Özet: bloklayıcı hata yok. GitHub Actions secret listesi ve tam liste için ENV_KEYS.md kullanın.\n");
  }

  process.exit(exitCode);
}

main();
