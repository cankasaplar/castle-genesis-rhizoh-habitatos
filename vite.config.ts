import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync
} from "fs";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Legacy redirects (UNCHANGED)
 */
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
 * Firebase SPA fallback
 */
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

/**
 * Firebase config resolver (UNCHANGED)
 */
function resolveFirebaseConfigObject(env) {
  const combined = env.VITE_FIREBASE_CONFIG;

  if (combined && String(combined).trim() !== "" && combined !== "{}") {
    try {
      const j = JSON.parse(combined);
      if (j && typeof j === "object" && (j.apiKey || j.projectId)) {
        return j;
      }
    } catch {}
  }

  const apiKey = env.VITE_FIREBASE_API_KEY || "";
  const projectId = env.VITE_FIREBASE_PROJECT_ID || "";

  if (!apiKey && !projectId) return {};

  return {
    apiKey,
    projectId
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const gatewayUpstream = String(
    env.VITE_LIVE_GATEWAY_BASE ||
      "https://castle-genesis-rhizoh-habitatos.onrender.com"
  )
    .trim()
    .replace(/\/+$/, "");

  const firebaseObj = resolveFirebaseConfigObject(env);

  const castleAppId = env.VITE_CASTLE_APP_ID || "castle-vnext-core";

  return {
    server: {
      host: true,
      port: 5173,
      proxy: {
        "/api/gatewayProxy": {
          target: gatewayUpstream,
          changeOrigin: true,
          secure: true,
          ws: true,
          rewrite: (p) =>
            p.replace(/^\/api\/gatewayProxy\/?/, "") || "/"
        }
      }
    },

    preview: {
      proxy: {
        "/api/gatewayProxy": {
          target: gatewayUpstream,
          changeOrigin: true,
          secure: true,
          ws: true
        }
      }
    },

    plugins: [
      react(),
      legacyStudioHtmlRedirectsPlugin(),
      emitFirebaseSpaFallback()
    ],

    define: {
      __firebase_config: JSON.stringify(JSON.stringify(firebaseObj)),
      __app_id: JSON.stringify(castleAppId)
    }
  };
});
