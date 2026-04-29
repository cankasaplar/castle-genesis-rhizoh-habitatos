const CACHE_TTL_MS = 60_000;
const MAX_QUERY_CHARS = 80;

const cache = new Map();

function safeText(value) {
  return String(value || "").trim().slice(0, MAX_QUERY_CHARS);
}

async function fetchJson(url) {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.data;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Open data source failed (${res.status})`);
  const json = await res.json();
  cache.set(url, { at: now, data: json });
  return json;
}

export async function queryOpenData(payload) {
  const provider = safeText(payload?.provider).toLowerCase();
  const query = safeText(payload?.query);
  if (!provider || !query) throw new Error("provider and query are required.");

  if (provider === "wikipedia") {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const json = await fetchJson(url);
    return {
      provider,
      query,
      title: json.title || query,
      summary: json.extract || "",
      url: json.content_urls?.desktop?.page || null
    };
  }

  if (provider === "openmeteo") {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const geo = await fetchJson(geoUrl);
    const place = geo.results?.[0];
    if (!place) return { provider, query, summary: "Location not found." };
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,wind_speed_10m`;
    const weather = await fetchJson(weatherUrl);
    return {
      provider,
      query,
      location: place.name,
      country: place.country,
      current: weather.current || {}
    };
  }

  if (provider === "geocastle") {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const geo = await fetchJson(geoUrl);
    const place = geo.results?.[0];
    if (!place) return { provider, query, summary: "Location not found." };

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,wind_speed_10m,weather_code`;
    const weather = await fetchJson(weatherUrl);

    // OpenTraffic approximation: road density proxy from OSM overpass in bounding box.
    const pad = 0.05;
    const south = place.latitude - pad;
    const west = place.longitude - pad;
    const north = place.latitude + pad;
    const east = place.longitude + pad;
    const overpassQuery = `[out:json][timeout:10];(way["highway"](${south},${west},${north},${east}););out count;`;
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    let traffic = { roadCount: null, level: "unknown", source: "osm-overpass" };
    try {
      const roadData = await fetchJson(overpassUrl);
      const count = Number(roadData?.elements?.[0]?.tags?.ways) || Number(roadData?.elements?.length) || 0;
      const level = count > 250 ? "high" : count > 120 ? "medium" : "low";
      traffic = { roadCount: count, level, source: "osm-overpass" };
    } catch {
      traffic = { roadCount: null, level: "unknown", source: "osm-overpass" };
    }

    return {
      provider,
      query,
      location: place.name,
      country: place.country,
      lat: Number(place.latitude),
      lng: Number(place.longitude),
      weather: weather.current || {},
      traffic
    };
  }

  if (provider === "github") {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=3`;
    const json = await fetchJson(url);
    return {
      provider,
      query,
      items: (json.items || []).map((i) => ({
        name: i.full_name,
        stars: i.stargazers_count,
        url: i.html_url
      }))
    };
  }

  throw new Error("Unsupported provider. Use wikipedia | openmeteo | geocastle | github.");
}
