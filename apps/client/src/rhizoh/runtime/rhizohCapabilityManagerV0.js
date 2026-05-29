/**
 * Rhizoh capability manager (v0) — **UI shell facade** only.
 *
 * **V1 mühür:** Gerçek snapshot `getRenderCapabilitySnapshotV0()` içinde üretilir (`rhizohRenderCapabilityV0.js`).
 * Bu dosya yalnızca kısa import yolları ve geriye dönük isim için; **spatial / live projection composer**
 * burayı import etmemeli — aksi halde projection → policy sızıntısı riski doğar.
 *
 * @see rhizohRenderCapabilityV0.js
 * @see docs/RHIZOH_SPATIAL_EMBODIMENT_FINAL_LOCK_V1.md
 */

import {
  RENDER_CAPABILITY_SCHEMA_V0,
  getRenderCapabilitySnapshotV0,
  rhizohInteractEnabledV0,
  rhizohObserveAlwaysEnabledV0,
  rhizohWriteEnabledV0
} from "./rhizohRenderCapabilityV0.js";

export {
  RENDER_CAPABILITY_SCHEMA_V0,
  getRenderCapabilitySnapshotV0,
  rhizohInteractEnabledV0,
  rhizohObserveAlwaysEnabledV0,
  rhizohWriteEnabledV0
};

/** @deprecated `RENDER_CAPABILITY_SCHEMA_V0` ile aynı sabit; tek şema. */
export const RHIZOH_CAPABILITY_SCHEMA_V0 = RENDER_CAPABILITY_SCHEMA_V0;

/**
 * @deprecated Prefer `getRenderCapabilitySnapshotV0()` — aynı referans; projection katmanı import etmemeli.
 * @returns {ReturnType<typeof getRenderCapabilitySnapshotV0>}
 */
export const getRhizohCapabilitySnapshotV0 = getRenderCapabilitySnapshotV0;
