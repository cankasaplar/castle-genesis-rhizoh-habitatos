/**
 * CORE-ELIGIBLE — Living world persistence UX (session-local, observation only).
 *
 * Makes continuity *felt*: last visit, welcome back, yesterday echo, session/world memory.
 * Does not advance sealer epoch or write WAL authority.
 */

export const LIVING_WORLD_PERSISTENCE_SCHEMA_V0 = "castle.rhizoh.living_world_persistence.v0";
const STORAGE_KEY_V0 = "rhizoh.living_world.persistence.v0";
const SESSION_ACTIVE_SUFFIX_V0 = ":session_active";

function nowMs() {
  return Date.now();
}

/**
 * @param {string} instanceId
 */
function storageKeyForInstanceV0(instanceId) {
  return `${STORAGE_KEY_V0}:${String(instanceId || "default")}`;
}

/**
 * @param {number} atMs
 * @returns {string}
 */
export function formatRelativeVisitTrV0(atMs) {
  const t = Number(atMs);
  if (!Number.isFinite(t) || t <= 0) return "ilk kez";
  const delta = Math.max(0, nowMs() - t);
  const min = Math.floor(delta / 60_000);
  if (min < 2) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} saat önce`;
  const d = Math.floor(h / 24);
  if (d === 1) return "dün";
  if (d < 8) return `${d} gün önce`;
  return new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

/**
 * @param {unknown} raw
 */
export function parseLivingWorldPersistenceV0(raw) {
  if (!raw || typeof raw !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  if (o.schema !== LIVING_WORLD_PERSISTENCE_SCHEMA_V0) return null;
  return {
    schema: LIVING_WORLD_PERSISTENCE_SCHEMA_V0,
    worldInstanceId: String(o.worldInstanceId || ""),
    firstSeenAtMs: Number(o.firstSeenAtMs) || 0,
    lastVisitAtMs: Number(o.lastVisitAtMs) || 0,
    lastSessionEndAtMs: Number(o.lastSessionEndAtMs) || 0,
    visitCount: Math.max(0, Number(o.visitCount) || 0),
    lastWeatherType: String(o.lastWeatherType || "unknown"),
    lastCastleAffordance: String(o.lastCastleAffordance || ""),
    lastAtmosphereLead: String(o.lastAtmosphereLead || "")
  };
}

/**
 * @param {string} worldInstanceId
 */
export function readLivingWorldPersistenceV0(worldInstanceId) {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKeyForInstanceV0(worldInstanceId));
    if (!raw) return null;
    return parseLivingWorldPersistenceV0(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * @param {import('./livingWorldPersistenceUxV0.js').ReturnType<typeof parseLivingWorldPersistenceV0>} record
 */
function writeLivingWorldPersistenceV0(record) {
  if (typeof sessionStorage === "undefined" || !record?.worldInstanceId) return;
  try {
    sessionStorage.setItem(storageKeyForInstanceV0(record.worldInstanceId), JSON.stringify(record));
  } catch {
    /* quota */
  }
}

/**
 * Call on each RLL-O frame (or mount) — updates visit rhythm.
 *
 * @param {{
 *   worldInstanceId: string,
 *   weatherType?: string,
 *   castleAffordanceId?: string,
 *   atmosphereLead?: string
 * }} io
 */
function sessionActiveKeyV0(worldInstanceId) {
  return `${storageKeyForInstanceV0(worldInstanceId)}${SESSION_ACTIVE_SUFFIX_V0}`;
}

/**
 * @param {string} worldInstanceId
 */
function isBrowserSessionActiveV0(worldInstanceId) {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(sessionActiveKeyV0(worldInstanceId)) === "1";
  } catch {
    return false;
  }
}

/**
 * @param {string} worldInstanceId
 */
function markBrowserSessionActiveV0(worldInstanceId) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(sessionActiveKeyV0(worldInstanceId), "1");
  } catch {
    /* noop */
  }
}

/**
 * @param {string} worldInstanceId
 */
export function clearBrowserSessionActiveForTestV0(worldInstanceId) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(sessionActiveKeyV0(worldInstanceId));
  } catch {
    /* noop */
  }
}

/**
 * Session open — increments visit count once per tab session.
 *
 * @param {{ worldInstanceId: string }} io
 */
export function openLivingWorldBrowserSessionV0(io) {
  const id = String(io?.worldInstanceId || "");
  if (!id || isBrowserSessionActiveV0(id)) {
    return { opened: false, ...touchLivingWorldPersistenceTickV0({ worldInstanceId: id }) };
  }
  markBrowserSessionActiveV0(id);

  const t = nowMs();
  const prev = readLivingWorldPersistenceV0(id);
  const gapMs = prev ? t - Number(prev.lastVisitAtMs) : 0;
  const sealedBefore = Boolean(prev?.lastSessionEndAtMs && prev.lastSessionEndAtMs > 0);
  const isReturnVisit = Boolean(
    prev && (sealedBefore || (prev.visitCount > 0 && gapMs > 90_000))
  );

  const next = {
    schema: LIVING_WORLD_PERSISTENCE_SCHEMA_V0,
    worldInstanceId: id,
    firstSeenAtMs: prev?.firstSeenAtMs || t,
    lastVisitAtMs: t,
    lastSessionEndAtMs: prev?.lastSessionEndAtMs || 0,
    visitCount: (prev?.visitCount || 0) + 1,
    lastWeatherType: prev?.lastWeatherType || "unknown",
    lastCastleAffordance: prev?.lastCastleAffordance || "",
    lastAtmosphereLead: prev?.lastAtmosphereLead || ""
  };
  writeLivingWorldPersistenceV0(next);

  return {
    opened: true,
    isReturnVisit,
    visitCount: next.visitCount,
    firstSeenAtMs: next.firstSeenAtMs,
    lastVisitGapMs: gapMs,
    previous: prev
  };
}

/**
 * Living tick — updates atmosphere snapshot only (no visit inflation).
 *
 * @param {{
 *   worldInstanceId: string,
 *   weatherType?: string,
 *   castleAffordanceId?: string,
 *   atmosphereLead?: string
 * }} io
 */
export function touchLivingWorldPersistenceTickV0(io) {
  const id = String(io?.worldInstanceId || "");
  if (!id) return { isReturnVisit: false, visitCount: 0 };

  const t = nowMs();
  const prev = readLivingWorldPersistenceV0(id);
  const gapMs = prev ? t - Number(prev.lastVisitAtMs) : 0;
  const sealedBefore = Boolean(prev?.lastSessionEndAtMs && prev.lastSessionEndAtMs > 0);
  const isReturnVisit = Boolean(
    prev && (sealedBefore || (prev.visitCount > 0 && gapMs > 90_000))
  );

  const next = {
    schema: LIVING_WORLD_PERSISTENCE_SCHEMA_V0,
    worldInstanceId: id,
    firstSeenAtMs: prev?.firstSeenAtMs || t,
    lastVisitAtMs: t,
    lastSessionEndAtMs: prev?.lastSessionEndAtMs || 0,
    visitCount: prev?.visitCount || 0,
    lastWeatherType: String(io.weatherType || prev?.lastWeatherType || "unknown"),
    lastCastleAffordance: String(io.castleAffordanceId || prev?.lastCastleAffordance || ""),
    lastAtmosphereLead: String(io.atmosphereLead || prev?.lastAtmosphereLead || "")
  };
  writeLivingWorldPersistenceV0(next);

  return {
    isReturnVisit,
    visitCount: next.visitCount,
    firstSeenAtMs: next.firstSeenAtMs,
    lastVisitGapMs: gapMs,
    previous: prev
  };
}

/** @deprecated use openLivingWorldBrowserSessionV0 + touchLivingWorldPersistenceTickV0 */
export function touchLivingWorldPersistenceV0(io) {
  return touchLivingWorldPersistenceTickV0(io);
}

/** Persist “session end” snapshot for “dün ne olmuştu” on next visit. */
export function sealLivingWorldSessionSnapshotV0(worldInstanceId) {
  const id = String(worldInstanceId || "");
  if (!id) return;
  const cur = readLivingWorldPersistenceV0(id);
  if (!cur) return;
  writeLivingWorldPersistenceV0({
    ...cur,
    lastSessionEndAtMs: nowMs()
  });
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(sessionActiveKeyV0(id));
    } catch {
      /* noop */
    }
  }
}

/**
 * @param {ReturnType<typeof readLivingWorldPersistenceV0>} persistence
 * @param {ReturnType<typeof touchLivingWorldPersistenceV0>} touch
 * @param {{
 *   atmosphereLead?: string,
 *   worldEcho?: string,
 *   weatherType?: string,
 *   timeZone?: string
 * }} [live]
 */
export function buildLivingWorldPersistenceCopyV0(persistence, touch, live = {}) {
  const returning = Boolean(touch?.isReturnVisit);
  const visitCount = touch?.visitCount ?? persistence?.visitCount ?? 0;
  const lastEnd = persistence?.lastSessionEndAtMs || touch?.previous?.lastVisitAtMs || 0;

  const welcomeHeadline = returning ? "Geri geldin" : "Hoş geldin";
  const welcomeSub =
    visitCount <= 1
      ? "Bu dünya örneği seninle birlikte nefes almaya başlıyor."
      : `${visitCount}. ziyaret — ritim tanınıyor.`;

  const lastVisitLabel = lastEnd > 0 ? formatRelativeVisitTrV0(lastEnd) : "—";
  const sessionMemory =
    persistence?.lastAtmosphereLead || persistence?.lastWeatherType
      ? `Son oturum: ${persistence.lastAtmosphereLead || persistence.lastWeatherType} — Castle continuity hatırlanıyor.`
      : "İlk oturum hafızası henüz yazılmadı; birkaç dakika kalınca oluşur.";

  const yesterdayLine =
    lastEnd > 0 && persistence?.lastAtmosphereLead
      ? `Dün burada: ${persistence.lastAtmosphereLead}`
      : lastEnd > 0
        ? `Son ayrılış ${formatRelativeVisitTrV0(lastEnd)} — dünya o zamanki ritimde kalmış olabilir.`
        : "Dün özeti yok — bu oturum ilk iz.";

  const yourSpaceLine = live.worldEcho
    ? `Senin alanın · ${live.worldEcho}`
    : `Senin alanın · ${live.timeZone || "—"} dil ve saat dilimi tohumu`;

  const worldNowLine = live.atmosphereLead || "Dünya nabzı yükleniyor…";

  const castleContinuity =
    persistence?.lastCastleAffordance
      ? `Castle continuity: son mod ${persistence.lastCastleAffordance.replace("castle.interact.", "")}.`
      : "Castle continuity: henüz iz yok.";

  const worldContinuity = `World continuity: ${live.weatherType || persistence?.lastWeatherType || "—"} · gözlem modu`;

  return Object.freeze({
    welcomeHeadline,
    welcomeSub,
    lastVisitLabel,
    sessionMemory,
    yesterdayLine,
    yourSpaceLine,
    worldNowLine,
    castleContinuity,
    worldContinuity,
    visitCount,
    returning
  });
}

export function clearLivingWorldPersistenceForTestV0(worldInstanceId) {
  if (typeof sessionStorage === "undefined") return;
  try {
    if (worldInstanceId) {
      sessionStorage.removeItem(storageKeyForInstanceV0(worldInstanceId));
    } else {
      for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(STORAGE_KEY_V0)) sessionStorage.removeItem(k);
      }
    }
  } catch {
    /* noop */
  }
}
