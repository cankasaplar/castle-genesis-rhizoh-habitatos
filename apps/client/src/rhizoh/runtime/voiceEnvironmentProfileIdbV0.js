/**
 * VEPM IndexedDB — persistent environment profiles (non-PII fingerprint keys).
 */

export const VOICE_ENV_PROFILE_IDB_NAME_V0 = "castle.rhizoh.voice_env_profile.v0";
export const VOICE_ENV_PROFILE_IDB_VERSION_V0 = 1;
export const VOICE_ENV_PROFILE_IDB_STORE_V0 = "profiles";

/** @type {Promise<IDBDatabase> | null} */
let dbPromise = null;

/**
 * @returns {Promise<IDBDatabase>}
 */
function openVoiceEnvProfileDbV0() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("indexeddb_unavailable"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(VOICE_ENV_PROFILE_IDB_NAME_V0, VOICE_ENV_PROFILE_IDB_VERSION_V0);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(VOICE_ENV_PROFILE_IDB_STORE_V0)) {
          db.createObjectStore(VOICE_ENV_PROFILE_IDB_STORE_V0, { keyPath: "profileKey" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("idb_open_failed"));
    });
  }
  return dbPromise;
}

/**
 * @param {string} profileKey
 */
export async function readVoiceEnvProfileFromIdbV0(profileKey) {
  const key = String(profileKey || "");
  if (!key) return null;
  const db = await openVoiceEnvProfileDbV0();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VOICE_ENV_PROFILE_IDB_STORE_V0, "readonly");
    const store = tx.objectStore(VOICE_ENV_PROFILE_IDB_STORE_V0);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error("idb_read_failed"));
  });
}

/**
 * @param {object} record
 */
export async function writeVoiceEnvProfileToIdbV0(record) {
  if (!record?.profileKey) return false;
  const db = await openVoiceEnvProfileDbV0();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VOICE_ENV_PROFILE_IDB_STORE_V0, "readwrite");
    const store = tx.objectStore(VOICE_ENV_PROFILE_IDB_STORE_V0);
    const req = store.put(record);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error || new Error("idb_write_failed"));
  });
}

export async function clearVoiceEnvProfilesFromIdbV0() {
  if (typeof indexedDB === "undefined") return false;
  const db = await openVoiceEnvProfileDbV0();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VOICE_ENV_PROFILE_IDB_STORE_V0, "readwrite");
    const store = tx.objectStore(VOICE_ENV_PROFILE_IDB_STORE_V0);
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error || new Error("idb_clear_failed"));
  });
}

/** @internal vitest */
export function __resetVoiceEnvProfileIdbPromiseForTestV0() {
  dbPromise = null;
}
