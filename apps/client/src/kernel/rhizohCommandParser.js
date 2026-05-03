/**
 * Rhizoh DSL — SPAWN / PURGE / TCEE WAKE köprüsü (komut satırı + LLM öncesi yakalama).
 *
 * Örnek:
 * SPAWN CASTLE --owner u-abc --lat 41.0082 --lon 28.9784 --type SANCTUARY
 * PURGE CASTLE --owner u-abc
 * WAKE
 * WAKE --reason manual
 * HIBERNATE TCEE
 */

function parseFlags(rest) {
  const out = {};
  const re = /--([a-zA-Z0-9_-]+)\s+(\S+)/g;
  let m;
  while ((m = re.exec(String(rest || "")))) {
    out[m[1].toLowerCase()] = m[2];
  }
  return out;
}

/**
 * @param {string} line
 * @returns {{ verb: "SPAWN_CASTLE"|"PURGE_CASTLE"|"WAKE_TCEE"|"SLEEP_TCEE", args: Record<string, string> } | null}
 */
export function parseDSL(line) {
  const s = String(line || "").trim();
  if (!s) return null;
  const upper = s.toUpperCase();
  // Locale-safe: tek kelime "wake" (Türkçe klavye dışı)
  if (/^wake$/i.test(s)) {
    return { verb: "WAKE_TCEE", args: {} };
  }
  if (upper === "WAKE" || upper.startsWith("WAKE(") || upper.startsWith("WAKE ")) {
    const rest = upper.startsWith("WAKE ") ? s.slice(5).trim() : "";
    return {
      verb: "WAKE_TCEE",
      args: rest ? parseFlags(rest) : {}
    };
  }
  if (upper === "HIBERNATE TCEE" || upper === "SLEEP TCEE") {
    return { verb: "SLEEP_TCEE", args: {} };
  }
  if (upper.startsWith("SPAWN CASTLE")) {
    const rest = s.slice("SPAWN CASTLE".length).trim();
    const f = parseFlags(rest);
    return {
      verb: "SPAWN_CASTLE",
      args: {
        owner: f.owner || "GUEST",
        lat: f.lat,
        lon: f.lon,
        type: (f.type || "SANCTUARY").toUpperCase()
      }
    };
  }
  if (upper.startsWith("PURGE CASTLE")) {
    const rest = s.slice("PURGE CASTLE".length).trim();
    const f = parseFlags(rest);
    return {
      verb: "PURGE_CASTLE",
      args: {
        owner: f.owner || "GUEST"
      }
    };
  }
  return null;
}

/**
 * Tek satırda tam DSL yoksa ama kullanıcı kale kurmak istiyorsa ipucu (koordinatsız).
 * @returns {"NEEDS_GEOLOCATION"|null}
 */
export function detectCastleIntentWithoutCoords(message) {
  const m = String(message || "").toLowerCase();
  if (/spawn\s+castle\s+--/.test(m) && /--lat\b/.test(m) && /--lon\b/.test(m)) return null;
  if (
    /kendi\s+kalemi|kişisel\s+kale|kisisel\s+kale|personal\s+castle|sovereign\s+castle|kalemi\s+kur|kale\s+kur|locate\s*&\s*spawn/i.test(
      m
    )
  ) {
    return "NEEDS_GEOLOCATION";
  }
  return null;
}
