import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ASSETS } from "./assetRegistryV1.js";

/** @type {Promise<object> | null} */
let preloadPromise = null;

/** Warm Octo GLB cache early — room renders nest while this resolves. */
export function preloadOctoConversationGlbV1() {
  if (!preloadPromise) {
    const loader = new GLTFLoader();
    preloadPromise = new Promise((resolve, reject) => {
      loader.load(ASSETS.octo, resolve, undefined, reject);
    });
  }
  return preloadPromise;
}
