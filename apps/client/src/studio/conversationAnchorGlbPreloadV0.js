import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { resolveConversationAnchorModelUrlV0 } from "./conversationAnchorSpeciesV0.js";

/** @type {Map<string, Promise<object>>} */
const preloadByUrl = new Map();

/**
 * @param {string} [speciesId]
 */
export function preloadConversationAnchorGlbV0(speciesId) {
  const url = resolveConversationAnchorModelUrlV0(speciesId);
  if (!preloadByUrl.has(url)) {
    const loader = new GLTFLoader();
    preloadByUrl.set(
      url,
      new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      })
    );
  }
  return preloadByUrl.get(url);
}

/** @internal vitest */
export function __resetConversationAnchorGlbPreloadForTestV0() {
  preloadByUrl.clear();
}
