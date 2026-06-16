import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, statSync } from "fs";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

/** Dev/preview: old static studio URLs → SPA routes (files removed from `public/`). */
function legacyStudioHtmlRedirectsPlugin() {
  const map = {
    "/greenroom-ultimate.html": "/greenroom/main",
    "/octoai-studio.html": "/studio?focus=octo",
    "/spiralmmo-castlebyck.html": "/spiral"
  };
  const attach = (server) => {
    server.middlewares.use((req, res, next) => {
      const p = req.url?.split("?")[0];
      if (p && map[p]) {
        res.statusCode = 302;
        res.setHeader("Location", map[p]);
        res.end();
        return;
      }
      next();
    });
  };
  return {
    name: "castle-legacy-studio-html-redirects",
    configureServer: attach,
    configurePreviewServer: attach
  };
}

/**
 * vite-plugin-cesium copies the Cesium runtime (Cesium.js + Assets/ThirdParty/Workers/Widgets)
 * inside a single try/catch that only console.errors on failure. On this Windows/Defender host
 * those fs-extra copies fail transiently and SILENTLY — shipping a build whose index.html
 * references /cesium/Cesium.js (+ /cesium/Widgets/widgets.css) while the files are absent.
 * Firebase then serves the SPA shell for the missing asset (MIME text/html) → "Cesium is not
 * defined" and a blank globe on rhizoh.com.
 *
 * This guard is the safety net: it re-copies any missing piece of the runtime from
 * node_modules using Node's built-in fs (reliable here), then HARD-FAILS the build if the
 * essential entrypoints cannot be produced. A broken globe can no longer reach production.
 */
function assertCesiumRuntimeCopied({ cesiumBuildPath, cesiumBaseUrl }) {
  const MIN_CESIUM_JS_BYTES = 1024 * 1024; // real Cesium.js is ~5.8MB; tiny means a bad copy
  const RUNTIME_DIRS = ["Assets", "ThirdParty", "Workers", "Widgets"];
  return {
    name: "castle-assert-cesium-runtime-copied",
    closeBundle() {
      const srcRoot = path.resolve(process.cwd(), cesiumBuildPath);
      const destRoot = path.resolve(process.cwd(), "dist", cesiumBaseUrl);
      try {
        mkdirSync(destRoot, { recursive: true });
      } catch (err) {
        if (err?.code !== "EEXIST") throw err;
      }

      // Cesium.js entrypoint (referenced by a <script> tag in index.html).
      const srcJs = path.join(srcRoot, "Cesium.js");
      const destJs = path.join(destRoot, "Cesium.js");
      const needJs = !existsSync(destJs) || statSync(destJs).size < MIN_CESIUM_JS_BYTES;
      if (needJs) {
        if (!existsSync(srcJs)) {
          throw new Error(
            `[cesium-guard] Source Cesium.js missing at ${srcJs}. Run \`npm install\` (cesium build assets absent) before building.`
          );
        }
        copyFileSync(srcJs, destJs);
      }

      // Runtime asset folders (Workers/Assets/ThirdParty/Widgets) loaded from CESIUM_BASE_URL.
      for (const dir of RUNTIME_DIRS) {
        const destDir = path.join(destRoot, dir);
        if (!existsSync(destDir)) {
          const srcDir = path.join(srcRoot, dir);
          if (existsSync(srcDir)) {
            cpSync(srcDir, destDir, { recursive: true, force: true });
          }
        }
      }

      // Hard verification of the two entrypoints index.html references directly.
      const bytes = existsSync(destJs) ? statSync(destJs).size : 0;
      if (bytes < MIN_CESIUM_JS_BYTES) {
        throw new Error(
          `[cesium-guard] dist/${cesiumBaseUrl}Cesium.js missing or too small (${bytes} bytes, expected >= ${MIN_CESIUM_JS_BYTES}).`
        );
      }
      const widgetsCss = path.join(destRoot, "Widgets", "widgets.css");
      if (!existsSync(widgetsCss)) {
        throw new Error(`[cesium-guard] dist/${cesiumBaseUrl}Widgets/widgets.css missing — Cesium UI styles absent.`);
      }
      // eslint-disable-next-line no-console
      console.log(
        `[cesium-guard] OK — Cesium runtime verified in dist/${cesiumBaseUrl} (Cesium.js ${bytes} bytes + ${RUNTIME_DIRS.join(", ")}).`
      );
    }
  };
}

/** Firebase Hosting: 404.html fallback when a release is missing rewrites edge cases; mirrors SPA shell. */
function emitFirebaseSpaFallback() {
  return {
    name: "emit-firebase-spa-fallback",
    closeBundle() {
      const dist = path.resolve(process.cwd(), "dist");
      const idx = path.join(dist, "index.html");
      const e404 = path.join(dist, "404.html");
      if (existsSync(idx)) {
        copyFileSync(idx, e404);
      }
    }
  };
}

/** Tek satır JSON (VITE_FIREBASE_CONFIG) veya ayrı VITE_FIREBASE_* anahtarları — ikinci grup birinciyi geçersiz kılmaz; biri yeterli. */
function resolveFirebaseConfigObject(env) {
  const combined = env.VITE_FIREBASE_CONFIG;
  if (combined && String(combined).trim() !== "" && combined !== "{}") {
    try {
      const j = JSON.parse(combined);
      if (j && typeof j === "object" && !Array.isArray(j) && (j.apiKey || j.projectId || j.project_id)) {
        return j;
      }
    } catch {
      /* split env fallback */
    }
  }
  const apiKey = env.VITE_FIREBASE_API_KEY || "";
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN || "";
  const projectId = env.VITE_FIREBASE_PROJECT_ID || "";
  const storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET || "";
  const messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID || "";
  const appId = env.VITE_FIREBASE_APP_ID || "";
  const measurementId = env.VITE_FIREBASE_MEASUREMENT_ID || "";
  const databaseURL =
    env.VITE_FIREBASE_DATABASE_URL ||
    (projectId ? `https://${projectId}-default-rtdb.firebaseio.com` : "");
  if (!apiKey && !projectId) return {};
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(measurementId ? { measurementId } : {}),
    ...(databaseURL ? { databaseURL } : {})
  };
}

/** Copy Stockfish single-thread assets — npm package main field points at missing file. */
function copyStockfishAssetsPlugin() {
  const files = ["stockfish-nnue-16-single.js", "stockfish-nnue-16-single.wasm"];
  const pkgRoot = path.resolve(process.cwd(), "../../node_modules/stockfish/src");
  const publicRoot = path.resolve(process.cwd(), "public/chess-engine");
  const distRoot = path.resolve(process.cwd(), "dist/chess-engine");

  const copyAll = () => {
    for (const destRoot of [publicRoot, distRoot]) {
      mkdirSync(destRoot, { recursive: true });
      for (const name of files) {
        const src = path.join(pkgRoot, name);
        const dest = path.join(destRoot, name);
        if (existsSync(src)) copyFileSync(src, dest);
      }
    }
  };

  return {
    name: "castle-copy-stockfish-assets",
    buildStart() {
      copyAll();
    },
    closeBundle() {
      copyAll();
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const gatewayUpstream = String(
    env.VITE_LIVE_GATEWAY_BASE || "https://castle-genesis-rhizoh-habitatos.onrender.com"
  )
    .trim()
    .replace(/\/+$/, "");
  const firebaseObj = resolveFirebaseConfigObject(env);
  const castleAppId = env.VITE_CASTLE_APP_ID || "castle-vnext-core";
  const cesiumBuildRootPath = "../../node_modules/cesium/Build";
  const cesiumBuildPath = "../../node_modules/cesium/Build/Cesium";
  const stockfishSinglePath = path.resolve(
    process.cwd(),
    "../../node_modules/stockfish/src/stockfish-nnue-16-single.js"
  );
  const stabilizationGraphLockPath = path.resolve(process.cwd(), "..", "..", "scripts", "stabilization-graph.sha256.lock");
  let stabilizationGraphSha256Lock = "";
  try {
    if (existsSync(stabilizationGraphLockPath)) {
      stabilizationGraphSha256Lock = readFileSync(stabilizationGraphLockPath, "utf8").trim().split("\n")[0] || "";
    }
  } catch {
    stabilizationGraphSha256Lock = "";
  }
  return {
    // İleride SharedArrayBuffer + Worker ECS için: COOP + COEP (Cesium harici varlıkları etkileyebilir).
    server: {
      host: true,
      port: 5173,
      strictPort: false,
      open: "/",
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "credentialless"
      },
      /** Local dev: same-origin proxy (Firebase `gatewayProxyV0` parity). Avoids CORS when port !== 5173. */
      proxy: {
        "/api/gatewayProxy": {
          target: gatewayUpstream,
          changeOrigin: true,
          secure: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/api\/gatewayProxy\/?/, "") || "/"
        }
      }
    },
    preview: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "credentialless"
      },
      proxy: {
        "/api/gatewayProxy": {
          target: gatewayUpstream,
          changeOrigin: true,
          secure: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/api\/gatewayProxy\/?/, "") || "/"
        }
      }
    },
    plugins: [
      react(),
      cesium({
        cesiumBuildRootPath,
        cesiumBuildPath,
        cesiumBaseUrl: "cesium/"
      }),
      assertCesiumRuntimeCopied({ cesiumBuildPath, cesiumBaseUrl: "cesium/" }),
      copyStockfishAssetsPlugin(),
      emitFirebaseSpaFallback(),
      legacyStudioHtmlRedirectsPlugin()
    ],
    resolve: {
      alias: {
        stockfish: stockfishSinglePath
      }
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },
    define: {
      __firebase_config: JSON.stringify(JSON.stringify(firebaseObj)),
      __app_id: JSON.stringify(castleAppId),
      __CASTLE_STABILIZATION_GRAPH_SHA256_LOCK__: JSON.stringify(stabilizationGraphSha256Lock)
    }
  };
});
