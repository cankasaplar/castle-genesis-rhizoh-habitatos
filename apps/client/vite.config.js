import { copyFileSync, existsSync } from "fs";
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const firebaseObj = resolveFirebaseConfigObject(env);
  const castleAppId = env.VITE_CASTLE_APP_ID || "castle-vnext-core";
  const cesiumBuildRootPath = "../../node_modules/cesium/Build";
  const cesiumBuildPath = "../../node_modules/cesium/Build/Cesium";
  return {
    // İleride SharedArrayBuffer + Worker ECS için: COOP + COEP (Cesium harici varlıkları etkileyebilir).
    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "credentialless"
      }
    },
    preview: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "credentialless"
      }
    },
    plugins: [
      react(),
      cesium({
        cesiumBuildRootPath,
        cesiumBuildPath,
        cesiumBaseUrl: "cesium/"
      }),
      emitFirebaseSpaFallback(),
      legacyStudioHtmlRedirectsPlugin()
    ],
    define: {
      __firebase_config: JSON.stringify(JSON.stringify(firebaseObj)),
      __app_id: JSON.stringify(castleAppId)
    }
  };
});
