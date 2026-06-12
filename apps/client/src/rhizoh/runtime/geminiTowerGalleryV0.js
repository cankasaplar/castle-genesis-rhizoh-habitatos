import { GEMINI_TOWER_GALLERY_STORAGE_KEY_V0 } from "./geminiTowerDesignV0.js";

export const GEMINI_TOWER_GALLERY_UPDATED_EVENT_V0 = "gemini-tower-gallery-updated-v0";

/**
 * @returns {object[]}
 */
export function readGeminiTowerGalleryV0() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GEMINI_TOWER_GALLERY_STORAGE_KEY_V0) || "[]";
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {object[]} gallery
 */
function writeGeminiTowerGalleryV0(gallery) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GEMINI_TOWER_GALLERY_STORAGE_KEY_V0, JSON.stringify(gallery.slice(0, 48)));
  try {
    window.dispatchEvent(new CustomEvent(GEMINI_TOWER_GALLERY_UPDATED_EVENT_V0));
  } catch {
    /* noop */
  }
}

/**
 * @param {{ image: string, prompt?: string }} art
 */
export function saveGeminiTowerGalleryWorkV0(art) {
  const image = String(art?.image || "").trim();
  if (!image) return null;
  const gallery = readGeminiTowerGalleryV0();
  const entry = Object.freeze({
    id: Date.now(),
    image,
    prompt: String(art?.prompt || "").slice(0, 240),
    date: new Date().toLocaleDateString()
  });
  gallery.unshift(entry);
  writeGeminiTowerGalleryV0(gallery);
  return entry;
}
