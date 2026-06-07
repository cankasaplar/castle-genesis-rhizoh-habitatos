/**
 * Studio Live Room — legacy aliases; SSOT = assetRegistryV1.js
 */

import { ASSETS } from "./assetRegistryV1.js";

export const STUDIO_MODEL_OCTO_V0 = ASSETS.octo;
export const STUDIO_MODEL_SHANE_V0 = "/models/shane-core.glb";
export const STUDIO_MODEL_RH_GLOWING_V0 = ASSETS.rhizoh;
export const STUDIO_MODEL_ROBOT_V0 = ASSETS.ambient.robot;
export const STUDIO_MODEL_MEDUSA_V0 = ASSETS.ambient.medusa;
export const STUDIO_MODEL_FOX_V0 = ASSETS.ambient.fox;

/** Maps legacy asset:// refs to served URLs. */
export const STUDIO_ASSET_URL_MAP_V0 = Object.freeze({
  "asset://castle/pet/shane-core.glb": STUDIO_MODEL_RH_GLOWING_V0,
  "asset://castle/pet/octo-blue-ringed.glb": STUDIO_MODEL_OCTO_V0,
  "asset://castle/pet/rh-glowing-energy-figure.glb": STUDIO_MODEL_RH_GLOWING_V0
});
