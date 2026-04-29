import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const raw = env.VITE_FIREBASE_CONFIG || "{}";
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
      })
    ],
    define: {
      __firebase_config: JSON.stringify(raw),
      __app_id: JSON.stringify(castleAppId)
    }
  };
});
