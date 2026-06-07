import { ASSETS } from "./assetRegistryV1.js";
import { STUDIO_ASSET_URL_MAP_V0 } from "./studioLiveRoomModelRefsV0.js";

/**
 * @param {string | null | undefined} modelRef
 * @returns {string | null}
 */
export function resolveStudioModelUrlV0(modelRef) {
  const raw = String(modelRef || "").trim();
  if (!raw) return null;
  if (raw.startsWith("/")) return raw;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const mapped = STUDIO_ASSET_URL_MAP_V0[raw];
  if (mapped) return mapped;
  if (raw.startsWith("asset://")) {
    const tail = raw.replace(/^asset:\/\//, "").replace(/^\/+/, "");
    return `/${tail}`;
  }
  return null;
}

export function defaultStudioLiveRoomModelUrlsV0() {
  return Object.freeze({
    octo: ASSETS.octo,
    shane: ASSETS.rhizoh
  });
}
