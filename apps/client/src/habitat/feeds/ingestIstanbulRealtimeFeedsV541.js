/**
 * vNext-541 — Beşli gerçek-zaman paket: hava (Open-Meteo) + sismik (USGS) + trafik/transit/etkinlik (opsiyonel URL + ritim).
 */

import { aggregateRegionalSnapshots } from "../../kernel/render/regionalSnapshotAggregator.js";
import {
  stubRegionalSnapshotsFromFeeds,
  buildIstanbulBridgePayloadFromRegionalMap
} from "../../scene/istanbulBiomePresetV540.js";
import { fetchOpenMeteoIstanbulComposite } from "./openMeteoIstanbul.js";
import { fetchUsgsMarmaraMicroseism } from "./seismicUsgsMarmara.js";
import {
  trafficRushFallback,
  transitCommuterPulseFallback,
  eventsCrowdFallback,
  gridInfrastructureHealthFallback,
  fetchOptionalNormalized01
} from "./trafficTransitEventsV541.js";

/**
 * @param {object} [opts]
 * @param {AbortSignal} [opts.signal]
 * @param {string} [opts.trafficUrl] GET → normalized intensity; boşsa rush ritmi
 * @param {string} [opts.eventsUrl] GET → normalized crowd; boşsa hafta sonu / akşam ritmi
 * @param {string} [opts.gridUrl] GET → gridHealth 0–1 (şebeke / altyapı proxy)
 * @param {number} [opts.now] ms epoch (test)
 */
export async function ingestIstanbulRealtimeFeedsV541(opts = {}) {
  const signal = opts.signal;
  const now = opts.now ?? Date.now();
  const feedMeta = {};

  const [wx, sx] = await Promise.all([
    fetchOpenMeteoIstanbulComposite({ signal }).catch((e) => {
      feedMeta.weatherError = String(e?.message || e);
      return { composite01: 0.5, raw: null };
    }),
    fetchUsgsMarmaraMicroseism({ signal }).catch((e) => {
      feedMeta.seismicError = String(e?.message || e);
      return { microseism01: 0.06, eventCount: 0, maxMagnitude: 0 };
    })
  ]);

  feedMeta.weather = wx;
  feedMeta.seismic = sx;

  const traffic = await fetchOptionalNormalized01(opts.trafficUrl, signal, () => trafficRushFallback(now));
  const transit = transitCommuterPulseFallback(now);
  const events = await fetchOptionalNormalized01(opts.eventsUrl, signal, () => eventsCrowdFallback(now));
  const gridHealth = await fetchOptionalNormalized01(opts.gridUrl, signal, () => gridInfrastructureHealthFallback(now));

  const feedScalars = Object.freeze({
    weather: wx.composite01,
    traffic,
    transit,
    events,
    microseism: sx.microseism01,
    gridHealth
  });

  const tPhase = now * 0.00006;
  const snaps = stubRegionalSnapshotsFromFeeds(
    {
      weather: feedScalars.weather,
      traffic: feedScalars.traffic,
      transit: feedScalars.transit,
      events: feedScalars.events,
      microseism: feedScalars.microseism,
      gridHealth: feedScalars.gridHealth
    },
    tPhase
  );
  const regionalMap = aggregateRegionalSnapshots(snaps);

  const weatherSummary = Object.freeze({
    meanGlow: feedScalars.weather,
    trafficStress: feedScalars.traffic,
    culturalNovelty: feedScalars.events,
    seismicMicro: feedScalars.microseism,
    transitPulse: feedScalars.transit,
    gridLatentStress: Math.max(0, Math.min(1, 1 - feedScalars.gridHealth)),
    gridHealth: feedScalars.gridHealth
  });

  return Object.freeze({
    regionalMap,
    snapshots: snaps,
    feedScalars,
    feedMeta: Object.freeze(feedMeta),
    weatherSummary
  });
}

/**
 * Tam bridge input (async): gerçek ingest → atlas + canonical regionalMap.
 * @param {object} [opts] ingest opts + buildIstanbulBridgePayloadFromRegionalMap opts
 */
export async function buildIstanbulBridgeInputV541(opts = {}) {
  const ing = await ingestIstanbulRealtimeFeedsV541(opts);
  return {
    ...buildIstanbulBridgePayloadFromRegionalMap(ing.regionalMap, {
      weatherSummary: { ...ing.weatherSummary },
      epochHash: opts.epochHash ?? `0xist-live-${Date.now()}`,
      parentEpochHash: opts.parentEpochHash
    }),
    feedScalars: ing.feedScalars,
    feedMeta: ing.feedMeta
  };
}
