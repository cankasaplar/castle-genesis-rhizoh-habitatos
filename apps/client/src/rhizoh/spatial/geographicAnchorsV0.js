/**
 * B0 — Geographic semantic anchors (v0).
 *
 * Anchor = semantic spatial reference, NOT a scene object.
 * No Cesium / Three / DOM / shader — data + queries only.
 *
 * @see docs/RHIZOH_PROJECTION_DISCIPLINE_V0.md
 * @see docs/RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md
 * @see docs/RHIZOH_SPATIAL_EMBODIMENT_FINAL_LOCK_V1.md
 * @see docs/ANCHOR_TRUTH_TABLE_V0.md
 * @see spatialAnchorResolverV0.js
 */

/**
 * Reducer / pipeline friendly epistemic weights (0–1).
 * @typedef {{
 *   stability: number,
 *   interaction: number,
 *   divergence: number,
 *   continuity: number,
 *   archivalDensity: number
 * }} EpistemicProfileV0
 */

/**
 * @typedef {{
 *   coupling: string,
 *   driftSensitivity: number
 * }} AtmosphericAffinityV0
 */

/**
 * @typedef {{
 *   id: string,
 *   lat: number,
 *   lon: number,
 *   districtLabel: string,
 *   influenceRadiusKm: number,
 *   epistemicProfile: EpistemicProfileV0,
 *   atmosphericAffinity: AtmosphericAffinityV0
 * }} GeographicSemanticAnchorV0
 */

/**
 * Hybrid globe / ilk oturum açılışında **world-layer kalibrasyon kökü** (atmosferik / projection bootstrap;
 * **kullanıcının canonical HOME_BASE kimlik anchor’ı değil**).
 *
 * Sarıyer burada **hardcoded destiny** değil; yalnızca mühendislik kalibrasyonu ve düşük-entropy atmosfer
 * rezonansı için fabrika kökü. Kimlik ve süreklilik için birincil anchor → `primaryAnchorResolverV0`
 * + güvenli profil `homeAnchor` (`homeAnchorAuthorityV0.js`).
 * Beşiktaş / Kadıköy: sonraki fazda throughput + divergence overlay (ayrı PR).
 */
export const RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0 = "anchor_sariyer_stability";

/** @type {readonly GeographicSemanticAnchorV0[]} */
const ISTANBUL_SEMANTIC_ANCHORS_V0 = Object.freeze([
  Object.freeze({
    id: "anchor_sariyer_stability",
    lat: 41.1169,
    lon: 29.0567,
    districtLabel: "Sarıyer",
    influenceRadiusKm: 5.0,
    epistemicProfile: Object.freeze({
      stability: 0.92,
      interaction: 0.21,
      divergence: 0.14,
      continuity: 0.81,
      archivalDensity: 0.33
    }),
    atmosphericAffinity: Object.freeze({
      coupling: "bosphorus_north_forest",
      driftSensitivity: 0.26
    })
  }),
  Object.freeze({
    id: "anchor_kadikoy_divergence",
    lat: 40.9909,
    lon: 29.0303,
    districtLabel: "Kadıköy",
    influenceRadiusKm: 4.2,
    epistemicProfile: Object.freeze({
      stability: 0.54,
      interaction: 0.74,
      divergence: 0.81,
      continuity: 0.59,
      archivalDensity: 0.29
    }),
    atmosphericAffinity: Object.freeze({
      coupling: "maritime_anatolian",
      driftSensitivity: 0.42
    })
  }),
  Object.freeze({
    id: "anchor_besiktas_pressure",
    lat: 41.0422,
    lon: 29.0075,
    districtLabel: "Beşiktaş",
    influenceRadiusKm: 3.5,
    epistemicProfile: Object.freeze({
      stability: 0.61,
      interaction: 0.89,
      divergence: 0.44,
      continuity: 0.52,
      archivalDensity: 0.41
    }),
    atmosphericAffinity: Object.freeze({
      coupling: "bosphorus_urban_corridor",
      driftSensitivity: 0.35
    })
  }),
  Object.freeze({
    id: "anchor_uskudar_continuity",
    lat: 41.0225,
    lon: 29.015,
    districtLabel: "Üsküdar",
    influenceRadiusKm: 4.0,
    epistemicProfile: Object.freeze({
      stability: 0.72,
      interaction: 0.46,
      divergence: 0.33,
      continuity: 0.86,
      archivalDensity: 0.48
    }),
    atmosphericAffinity: Object.freeze({
      coupling: "maritime_historic_shore",
      driftSensitivity: 0.3
    })
  }),
  Object.freeze({
    id: "anchor_fatih_archival",
    lat: 41.0086,
    lon: 28.9802,
    districtLabel: "Fatih",
    influenceRadiusKm: 3.8,
    epistemicProfile: Object.freeze({
      stability: 0.76,
      interaction: 0.52,
      divergence: 0.24,
      continuity: 0.67,
      archivalDensity: 0.9
    }),
    atmosphericAffinity: Object.freeze({
      coupling: "peninsula_dense_urban",
      driftSensitivity: 0.24
    })
  })
]);

/**
 * @returns {readonly GeographicSemanticAnchorV0[]}
 */
export function getGeographicSemanticAnchorsV0() {
  return ISTANBUL_SEMANTIC_ANCHORS_V0;
}

/**
 * @param {string} id
 * @returns {GeographicSemanticAnchorV0 | undefined}
 */
export function getGeographicSemanticAnchorByIdV0(id) {
  const want = String(id || "");
  return ISTANBUL_SEMANTIC_ANCHORS_V0.find((a) => a.id === want);
}

/**
 * Cesium hybrid v0 ve projection ilk bağlama için **world-layer** sabit kök anchor (Sarıyer = kalibrasyon,
 * kullanıcı HOME_BASE değil — `getRhizohCalibrationRootAnchorV0` vs `primaryAnchorResolverV0`).
 * @returns {GeographicSemanticAnchorV0}
 */
export function getRhizohCalibrationRootAnchorV0() {
  const a = getGeographicSemanticAnchorByIdV0(RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0);
  if (!a) {
    throw new Error("getRhizohCalibrationRootAnchorV0: calibration root missing from ISTANBUL_SEMANTIC_ANCHORS_V0");
  }
  return a;
}
