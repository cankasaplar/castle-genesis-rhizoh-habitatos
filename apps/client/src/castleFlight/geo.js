/** İstanbul viewport → REAL_MAP sahne koordinatları (digital twin projection). */

export const ISTANBUL_GEO = { latMin: 40.92, latMax: 41.22, lonMin: 28.85, lonMax: 29.25 };
export const ISTANBUL_SPAN = { x: 14000, z: 11000 };

export const ISTANBUL_POI = {
  FATIH: { lat: 41.0086, lon: 28.9802, label: "Fatih · Ayasofya" },
  KADIKOY: { lat: 40.9923, lon: 29.0244, label: "Kadıköy" },
  BESIKTAS: { lat: 41.0422, lon: 29.0086, label: "Beşiktaş" },
  USKUDAR: { lat: 41.0227, lon: 29.0153, label: "Üsküdar" }
};

export function latLonToSceneXZ(lat, lon, spanX = ISTANBUL_SPAN.x, spanZ = ISTANBUL_SPAN.z) {
  const x = ((lon - ISTANBUL_GEO.lonMin) / (ISTANBUL_GEO.lonMax - ISTANBUL_GEO.lonMin) - 0.5) * spanX;
  const z = ((lat - ISTANBUL_GEO.latMin) / (ISTANBUL_GEO.latMax - ISTANBUL_GEO.latMin) - 0.5) * spanZ;
  return { x, z };
}

export function sceneXZToLatLon(x, z, spanX = ISTANBUL_SPAN.x, spanZ = ISTANBUL_SPAN.z) {
  const lon = (x / spanX + 0.5) * (ISTANBUL_GEO.lonMax - ISTANBUL_GEO.lonMin) + ISTANBUL_GEO.lonMin;
  const lat = (z / spanZ + 0.5) * (ISTANBUL_GEO.latMax - ISTANBUL_GEO.latMin) + ISTANBUL_GEO.latMin;
  return { lat, lon };
}
