/**
 * Studio Live Room v1 — asset registry (scene never hardcodes paths).
 */

export const STUDIO_ASSET_REGISTRY_SCHEMA_V1 = "castle.studio.asset_registry.v1";

export const ASSETS = Object.freeze({
  rhizoh: "/models/rh-glowing-energy-figure.glb",
  octo: "/models/octo-blue-ringed.glb",
  ambient: Object.freeze({
    fox: "/models/fox1.glb",
    medusa: "/models/medusa-bust.glb",
    robot: "/models/translucent-humanoid-robot.glb"
  })
});

/** @type {readonly { key: string, url: string, layer: "stage" | "ambient", role: string }[]} */
export const STUDIO_ASSET_MANIFEST_V1 = Object.freeze([
  { key: "rhizoh", url: ASSETS.rhizoh, layer: "stage", role: "Rhizoh" },
  { key: "octo", url: ASSETS.octo, layer: "stage", role: "Octo" },
  { key: "fox", url: ASSETS.ambient.fox, layer: "ambient", role: "Fox" },
  { key: "medusa", url: ASSETS.ambient.medusa, layer: "ambient", role: "Medusa" },
  { key: "robot", url: ASSETS.ambient.robot, layer: "ambient", role: "Robot" }
]);

/**
 * @param {string | null | undefined} modelRef
 * @returns {string | null}
 */
export function resolveAssetRegistryUrlV1(modelRef) {
  const raw = String(modelRef || "").trim();
  if (!raw) return null;
  if (raw.startsWith("/") || raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw === ASSETS.rhizoh || raw === ASSETS.octo) return raw;
  for (const u of Object.values(ASSETS.ambient)) {
    if (raw === u) return u;
  }
  if (raw.startsWith("asset://")) {
    const tail = raw.replace(/^asset:\/\//, "").replace(/^\/+/, "");
    return `/${tail}`;
  }
  return null;
}
