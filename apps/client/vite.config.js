import { copyFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/** Dev/preview: old static studio URLs -> SPA routes */
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

/** Resolve Firebase credentials if present */
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
    (projectId ? "https://" + projectId + "-default-rtdb.firebaseio.com" : "");
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

/** Copy Stockfish single-thread assets */
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
        if (!existsSync(src)) {
          console.warn("[stockfish-guard] warning: missing optional source asset: " + src);
          continue;
        }
        copyFileSync(src, dest);
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
      const wasmPath = path.join(distRoot, "stockfish-nnue-16-single.wasm");
      const jsPath = path.join(distRoot, "stockfish-nnue-16-single.js");
      if (existsSync(wasmPath) && existsSync(jsPath)) {
        console.log("[stockfish-guard] OK - Stockfish NNUE single-thread assets in dist/chess-engine/");
      }
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
  const castleAppId = env.VITE_CASTLE_APP_ID || "rhizoh-chess-platform";

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
    server: {
      host: true,
      port: 5173,
      strictPort: false,
      open: "/",
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "credentialless"
      },
      proxy: {
        "/api/chess": {
          target: gatewayUpstream,
          changeOrigin: true,
          secure: true,
          ws: true
        },
        "/api/lab": {
          target: gatewayUpstream,
          changeOrigin: true,
          secure: true,
          ws: true
        },
        "/api/gatewayProxy": {
          target: gatewayUpstream,
          changeOrigin: true,
          secure: true,
          ws: true,
          rewrite: (p) => p.replace(/^\/api\/gatewayProxy\/?/, "") || "/"
        }
      }
    },
    preview: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "credentialless"
      },
      proxy: {
        "/api/chess": {
          target: gatewayUpstream,
          changeOrigin: true,
          secure: true,
          ws: true
        },
        "/api/lab": {
          target: gatewayUpstream,
          changeOrigin: true,
          secure: true,
          ws: true
        },
        "/api/gatewayProxy": {
          target: gatewayUpstream,
          changeOrigin: true,
          secure: true,
          ws: true,
          rewrite: (p) => p.replace(/^\/api\/gatewayProxy\/?/, "") || "/"
        }
      }
    },
    plugins: [
      react(),
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