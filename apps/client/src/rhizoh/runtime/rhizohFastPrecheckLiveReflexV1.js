/**
 * Fast precheck live reflex — snapshot + SpiralLive-style templates → TTS text.
 */

import { CANONICAL_INTENT_V1 } from "./rhizohCanonicalIntentV1.js";
import { formatSportMatchChipV0 } from "./worldMapLiveFeedV0.js";
import { formatWorldMapTrafficLineV0, formatWorldMapWeatherLineV0 } from "./worldMapLiveContextV0.js";

export const RHIZOH_FAST_PRECHECK_LIVE_REFLEX_SCHEMA_V1 = "castle.rhizoh.fast_precheck_live_reflex.v1";

/**
 * @param {string} headline
 * @param {number} [maxLen]
 */
export function truncateHeadlineV0(headline, maxLen = 120) {
  const t = String(headline || "").trim();
  if (!t || t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
}

/**
 * @param {import("./rhizohCanonicalLiveSnapshotV1.js").ReturnType<typeof import("./rhizohCanonicalLiveSnapshotV1.js").readCanonicalLiveSnapshotV1>} snapshot
 * @param {string} [locale]
 */
export function formatWeatherLiveReflexV1(snapshot, locale = "tr") {
  const tr = String(locale).toLowerCase().startsWith("tr");
  const city = snapshot?.geo?.label || (tr ? "bölgen" : "your area");
  const w = snapshot?.weather;
  if (!w?.live || !Number.isFinite(w.temperature)) {
    return tr
      ? `Şu an ${city} için canlı hava verisine ulaşamıyorum.`
      : `Live weather is unavailable for ${city} right now.`;
  }
  const desc = String(w.description || (tr ? "açık" : "clear"));
  const hum = Number.isFinite(w.humidity) ? w.humidity : null;
  const wind = Number.isFinite(w.windMs) ? w.windMs : null;
  if (tr) {
    let line = `${city}'da hava ${desc}, sıcaklık ${Math.round(w.temperature)}°C`;
    if (hum != null) line += `. Nem oranı yüzde ${hum}`;
    if (wind != null) line += `, rüzgar saniyede ${wind} metre`;
    return `${line}.`;
  }
  let line = `In ${city}, it's ${desc} at ${Math.round(w.temperature)}°C`;
  if (hum != null) line += `. Humidity is ${hum} percent`;
  if (wind != null) line += `, wind about ${wind} m/s`;
  return `${line}.`;
}

/**
 * @param {string} canonicalIntent
 * @param {ReturnType<typeof import("./rhizohCanonicalLiveSnapshotV1.js").readCanonicalLiveSnapshotV1>} snapshotData
 * @param {string} [locale]
 */
export function executeFastPrecheckReflexV0(canonicalIntent, snapshotData, locale = "tr") {
  const tr = String(locale).toLowerCase().startsWith("tr");
  const snap = snapshotData;
  const city = snap?.geo?.label || (tr ? "bölgen" : "your area");

  switch (canonicalIntent) {
    case CANONICAL_INTENT_V1.WEATHER_LIVE:
    case CANONICAL_INTENT_V1.WEATHER_STUB:
      return formatWeatherLiveReflexV1(snap, locale);

    case CANONICAL_INTENT_V1.TRAFFIC_QUERY: {
      const t = snap?.traffic;
      if (!t || t.level === "unknown") {
        return tr ? "Şu an trafik yoğunluk verisi alınamıyor." : "Traffic stream is currently offline.";
      }
      const line = formatWorldMapTrafficLineV0(
        {
          level: t.level,
          intensity: t.intensity,
          currentTravelTimeSec: 0,
          freeFlowTravelTimeSec: 0,
          currentSpeedKmh: 0,
          freeFlowSpeedKmh: 0,
          timestamp: snap.timestamp,
          confidence: 1,
          roadClosure: t.level === "closed"
        },
        locale
      );
      if (t.delayMinutes != null && t.delayMinutes > 0) {
        return tr
          ? `${city} — ${line}. Ortalama gecikme yaklaşık ${t.delayMinutes} dakika.`
          : `${city} — ${line}. Average delay about ${t.delayMinutes} minutes.`;
      }
      return tr ? `${city} — ${line}.` : `${city} — ${line}.`;
    }

    case CANONICAL_INTENT_V1.SPORTS_LIVE: {
      const live = snap?.sports?.liveMatches || [];
      const upcoming = snap?.sports?.upcomingMatches || [];
      const rows = live.length ? live : upcoming;
      if (!rows.length) {
        return tr ? "Yakın zamanda güncellenmiş maç skoru bulunmuyor." : "No live matches on the feed.";
      }
      const chips = rows.slice(0, 2).map((m) => formatSportMatchChipV0(m, locale).replace(/^[^\s]+\s/, ""));
      return tr ? `Canlı skorlar: ${chips.join(". ")}.` : `Latest scores: ${chips.join(". ")}.`;
    }

    case CANONICAL_INTENT_V1.SPORTS_FIXTURE: {
      const upcoming = snap?.sports?.upcomingMatches || [];
      if (!upcoming.length) {
        return tr ? "Yaklaşan maç listesi henüz yüklenmedi." : "Upcoming fixtures are not loaded yet.";
      }
      const chips = upcoming.slice(0, 3).map((m) => formatSportMatchChipV0(m, locale).replace(/^[^\s]+\s/, ""));
      return tr ? `Yaklaşan maçlar: ${chips.join(". ")}.` : `Upcoming fixtures: ${chips.join(". ")}.`;
    }

    case CANONICAL_INTENT_V1.NEWS_HEADLINES: {
      const headlines = snap?.news?.headlines || [];
      if (!headlines.length) {
        return tr ? "Gündem başlıkları henüz yüklenmedi." : "Headlines feed is currently empty.";
      }
      const line = headlines
        .slice(0, 3)
        .map((h) => truncateHeadlineV0(h.title, 120))
        .filter(Boolean)
        .join(". ");
      return tr ? `Öne çıkan başlıklar: ${line}.` : `Top headlines: ${line}.`;
    }

    case CANONICAL_INTENT_V1.BRIEFING_QUERY: {
      const weatherLine = snap?.weather?.live
        ? formatWorldMapWeatherLineV0(
            {
              temperature: snap.weather.temperature,
              description: snap.weather.description,
              weatherMain: snap.weather.description,
              cloudDensity: 0,
              humidity: (snap.weather.humidity || 0) / 100,
              rainIntensity: 0,
              wind: snap.weather.windMs || 0,
              timestamp: snap.timestamp
            },
            locale
          )
        : tr
          ? "hava verisi yok"
          : "no weather";
      const trafficLine = snap?.traffic
        ? formatWorldMapTrafficLineV0(
            {
              level: snap.traffic.level,
              intensity: snap.traffic.intensity,
              currentTravelTimeSec: 0,
              freeFlowTravelTimeSec: 0,
              currentSpeedKmh: 0,
              freeFlowSpeedKmh: 0,
              timestamp: snap.timestamp,
              confidence: 1,
              roadClosure: snap.traffic.level === "closed"
            },
            locale
          )
        : tr
          ? "trafik verisi yok"
          : "no traffic";
      const headline = truncateHeadlineV0(snap?.news?.headlines?.[0]?.title || "", 90);
      if (tr) {
        const newsPart = headline ? `Gündem: ${headline}.` : "Gündem başlığı henüz yok.";
        return `Kısa brifing. ${city} — ${weatherLine}, ${trafficLine}. ${newsPart}`;
      }
      const newsPart = headline ? `Headline: ${headline}.` : "No headline yet.";
      return `Quick briefing. ${city} — ${weatherLine}, ${trafficLine}. ${newsPart}`;
    }

    case CANONICAL_INTENT_V1.MAP_CONTEXT: {
      const weatherLine = snap?.weather?.live
        ? formatWorldMapWeatherLineV0(
            {
              temperature: snap.weather.temperature,
              description: snap.weather.description,
              weatherMain: snap.weather.description,
              cloudDensity: 0,
              humidity: (snap.weather.humidity || 0) / 100,
              rainIntensity: 0,
              wind: snap.weather.windMs || 0,
              timestamp: snap.timestamp
            },
            locale
          )
        : tr
          ? "hava verisi yok"
          : "no weather";
      const trafficLine = snap?.traffic
        ? formatWorldMapTrafficLineV0(
            {
              level: snap.traffic.level,
              intensity: snap.traffic.intensity,
              currentTravelTimeSec: 0,
              freeFlowTravelTimeSec: 0,
              currentSpeedKmh: 0,
              freeFlowSpeedKmh: 0,
              timestamp: snap.timestamp,
              confidence: 1,
              roadClosure: snap.traffic.level === "closed"
            },
            locale
          )
        : tr
          ? "trafik verisi yok"
          : "no traffic";
      return tr
        ? `${city} — ${weatherLine}, ${trafficLine}.`
        : `${city} — ${weatherLine}, ${trafficLine}.`;
    }

    default:
      return null;
  }
}
