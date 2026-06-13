/**
 * World-space media engine — local capture, record, encrypted archive (localStorage).
 */

import { encryptMediaBlobV0, decryptMediaBlobV0 } from "./worldSpaceMediaCryptoV0.js";

export const WORLD_SPACE_MEDIA_ENGINE_SCHEMA_V0 = "rhizoh.world_space_media_engine.v0";
export const WORLD_SPACE_MEDIA_ARCHIVE_LS_KEY_V0 = "rhizoh.worldSpaceMediaArchive.v0";
export const WORLD_SPACE_MEDIA_ARCHIVE_EVENT_V0 = "rhizoh:world-space-media-archive-v0";

/**
 * @returns {ReadonlyArray<object>}
 */
export function listMediaArchiveEntriesV0() {
  if (typeof window === "undefined") return Object.freeze([]);
  try {
    const raw = window.localStorage.getItem(WORLD_SPACE_MEDIA_ARCHIVE_LS_KEY_V0);
    if (!raw) return Object.freeze([]);
    const parsed = JSON.parse(raw);
    return Object.freeze(Array.isArray(parsed) ? parsed : []);
  } catch {
    return Object.freeze([]);
  }
}

/**
 * @param {object} entry
 */
function appendArchiveEntryV0(entry) {
  const rows = [...listMediaArchiveEntriesV0()];
  rows.unshift(entry);
  const capped = rows.slice(0, 24);
  window.localStorage.setItem(WORLD_SPACE_MEDIA_ARCHIVE_LS_KEY_V0, JSON.stringify(capped));
  try {
    window.dispatchEvent(
      new CustomEvent(WORLD_SPACE_MEDIA_ARCHIVE_EVENT_V0, {
        detail: Object.freeze({ count: capped.length })
      })
    );
  } catch {
    /* noop */
  }
}

/**
 * @param {{ audio?: boolean, video?: boolean, mimeType?: string }} [opts]
 */
export async function createWorldSpaceMediaCaptureV0(opts = {}) {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("getUserMedia_unavailable");
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: opts.audio !== false,
    video: opts.video === true
  });
  const mimeType =
    opts.mimeType ||
    (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm");

  /** @type {Blob[]} */
  const chunks = [];
  const recorderOpts = MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : undefined;
  const recorder = new MediaRecorder(stream, recorderOpts);

  recorder.ondataavailable = (ev) => {
    if (ev.data?.size > 0) chunks.push(ev.data);
  };

  let recording = false;

  return Object.freeze({
    stream,
    mimeType: recorder.mimeType || mimeType,
    start() {
      if (recording) return;
      chunks.length = 0;
      recording = true;
      recorder.start(500);
    },
    stop() {
      return new Promise((resolve, reject) => {
        if (!recording) {
          resolve(Object.freeze({ blob: new Blob([], { type: mimeType }), chunks: [] }));
          return;
        }
        recording = false;
        recorder.onstop = () => {
          for (const track of stream.getTracks()) track.stop();
          const blob = chunks.length ? new Blob(chunks, { type: recorder.mimeType || mimeType }) : new Blob([], { type: mimeType });
          resolve(Object.freeze({ blob, chunks: chunks.slice() }));
        };
        recorder.onerror = () => reject(new Error("media_recorder_error"));
        try {
          if (recorder.state !== "inactive") recorder.stop();
        } catch (e) {
          for (const track of stream.getTracks()) track.stop();
          reject(e);
        }
      });
    },
    abort() {
      recording = false;
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        /* noop */
      }
      for (const track of stream.getTracks()) track.stop();
    }
  });
}

/**
 * @param {Awaited<ReturnType<createWorldSpaceMediaCaptureV0>>} capture
 * @param {{ passphrase: string, title?: string, source?: string }} opts
 */
export async function stopCaptureAndArchiveV0(capture, opts) {
  const { blob } = await capture.stop();
  if (!blob.size) return Object.freeze({ ok: false, reason: "empty_recording" });
  const encrypted = await encryptMediaBlobV0(blob, opts.passphrase);
  const entry = Object.freeze({
    id: `arch_${Date.now().toString(36)}`,
    schema: WORLD_SPACE_MEDIA_ENGINE_SCHEMA_V0,
    title: String(opts.title || "World Space Recording").slice(0, 120),
    source: String(opts.source || "world_space_media_tube"),
    createdAtMs: Date.now(),
    byteLength: blob.size,
    mimeType: blob.type,
    encrypted
  });
  appendArchiveEntryV0(entry);
  return Object.freeze({ ok: true, entry });
}

/**
 * @param {string} entryId
 * @param {string} passphrase
 */
export async function decryptArchiveEntryV0(entryId, passphrase) {
  const row = listMediaArchiveEntriesV0().find((e) => e.id === entryId);
  if (!row?.encrypted) return Object.freeze({ ok: false, reason: "not_found" });
  const blob = await decryptMediaBlobV0(row.encrypted, passphrase);
  return Object.freeze({ ok: true, blob, entry: row });
}

/** @internal vitest */
export function resetMediaArchiveForTestsV0() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WORLD_SPACE_MEDIA_ARCHIVE_LS_KEY_V0);
  } catch {
    /* noop */
  }
}
