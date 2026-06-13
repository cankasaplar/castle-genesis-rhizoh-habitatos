/**
 * FER-1 Vault crypto v0 — PBKDF2 + AES-GCM for JSON memory payloads.
 */

export const FER1_VAULT_CRYPTO_SCHEMA_V0 = "rhizoh.fer1_vault_crypto.v0";

const PBKDF2_ITERATIONS = 120_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(b64) {
  const binary = atob(String(b64 || ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * @param {string} passphrase
 * @param {Uint8Array} salt
 */
async function deriveKeyV0(passphrase, salt) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * @param {object} payload
 * @param {string} passphrase
 */
export async function encryptFer1JsonV0(payload, passphrase) {
  const pass = String(passphrase || "").trim();
  if (!pass) throw new Error("passphrase_required");
  if (!crypto?.subtle) throw new Error("web_crypto_unavailable");
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKeyV0(pass, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return Object.freeze({
    schema: FER1_VAULT_CRYPTO_SCHEMA_V0,
    algo: "AES-GCM",
    kdf: "PBKDF2-SHA256",
    iterations: PBKDF2_ITERATIONS,
    saltB64: toBase64(salt),
    ivB64: toBase64(iv),
    ciphertextB64: toBase64(ciphertext)
  });
}

/**
 * @param {object} envelope
 * @param {string} passphrase
 */
export async function decryptFer1JsonV0(envelope, passphrase) {
  const pass = String(passphrase || "").trim();
  if (!pass) throw new Error("passphrase_required");
  if (!crypto?.subtle) throw new Error("web_crypto_unavailable");
  const salt = fromBase64(envelope.saltB64);
  const iv = fromBase64(envelope.ivB64);
  const ciphertext = fromBase64(envelope.ciphertextB64);
  const key = await deriveKeyV0(pass, salt);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  const json = new TextDecoder().decode(plaintext);
  return JSON.parse(json);
}
