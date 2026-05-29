/**
 * Tenant narrative isolation v0 — scoped derived state, fingerprinting, cross-tenant leak detection.
 * @see docs/ops/TENANT_NARRATIVE_ISOLATION_V1.0.md
 */

import { createHash } from "node:crypto";

export const NARRATIVE_TENANT_ISOLATION_SCHEMA_V0 = "rhizoh.narrative_tenant_isolation.v0";

export const PLATFORM_TENANT_ID_V0 = "__platform__";

export const TENANT_SCOPE_KIND_V0 = Object.freeze({
  TENANT: "tenant",
  PLATFORM_AGGREGATE: "platform_aggregate"
});

const TENANT_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

/**
 * @param {unknown} tenantId
 */
export function normalizeTenantIdV0(tenantId) {
  const id = String(tenantId ?? "").trim();
  if (!id) throw new Error("tenant_id_empty");
  if (id.length > 128) throw new Error("tenant_id_too_long");
  if (!TENANT_ID_RE.test(id)) throw new Error("tenant_id_invalid_charset");
  return id;
}

/**
 * @param {{ tenantId?: string, platformScope?: boolean, principal?: string | null }} opts
 */
/**
 * Resolve tenant from hardening HTTP context (header > authenticated uid > platform).
 * @param {{ ok?: boolean, uid?: string } | null} auth
 * @param {import('http').IncomingMessage} req
 */
export function resolveHardeningTenantIdV0(auth, req) {
  const header = String(req?.headers?.["x-castle-tenant-id"] || "").trim();
  if (header) return normalizeTenantIdV0(header);
  if (auth?.ok && auth.uid) return normalizeTenantIdV0(`uid:${String(auth.uid).slice(0, 96)}`);
  return null;
}

export function resolveNarrativeTenantScopeV0(opts = {}) {
  if (opts.tenantId) {
    const tenantId = normalizeTenantIdV0(opts.tenantId);
    return Object.freeze({
      schema: NARRATIVE_TENANT_ISOLATION_SCHEMA_V0,
      tenantId,
      scope: TENANT_SCOPE_KIND_V0.TENANT,
      principal: opts.principal ?? null,
      globalRawAllowed: false,
      globalDerivedAllowed: false,
      noGlobalDerivedState: true
    });
  }
  if (opts.platformScope === true || opts.platformScope !== false) {
    return Object.freeze({
      schema: NARRATIVE_TENANT_ISOLATION_SCHEMA_V0,
      tenantId: PLATFORM_TENANT_ID_V0,
      scope: TENANT_SCOPE_KIND_V0.PLATFORM_AGGREGATE,
      principal: opts.principal ?? null,
      globalRawAllowed: true,
      globalDerivedAllowed: false,
      noGlobalDerivedState: true
    });
  }
  throw new Error("narrative_tenant_scope_required:pass_tenantId_or_platformScope");
}

/**
 * @param {ReturnType<typeof resolveNarrativeTenantScopeV0>} scope
 * @param {string | null | undefined} isolationProbe — CI-only private marker
 */
export function buildTenantScopeEnvelopeV0(scope, isolationProbe = null) {
  return Object.freeze({
    ...scope,
    isolationProbe: isolationProbe ? String(isolationProbe) : null,
    derivedBinding: "tenant_scoped_only",
    exportMustNotReuseAcrossTenants: scope.scope === TENANT_SCOPE_KIND_V0.TENANT
  });
}

/**
 * Stable payload for fingerprint (excludes volatile timestamps).
 * @param {object} narrativeExport
 */
export function narrativeFingerprintPayloadV0(narrativeExport) {
  const ts = narrativeExport?.tenantScope;
  return Object.freeze({
    tenantId: ts?.tenantId,
    scope: ts?.scope,
    isolationProbe: ts?.isolationProbe ?? null,
    systemState: narrativeExport?.systemState,
    headline: narrativeExport?.interpretation?.headline,
    trustPosture: narrativeExport?.validation?.trustPosture,
    derived: Object.freeze({
      health: narrativeExport?.stateLayers?.derived?.systemState?.health,
      risk: narrativeExport?.stateLayers?.derived?.systemState?.risk,
      globalDerivedState: narrativeExport?.stateLayers?.derived?.globalDerivedState ?? false
    })
  });
}

/**
 * @param {object} narrativeExport
 */
export function computeNarrativeFingerprintV0(narrativeExport) {
  const canonical = JSON.stringify(narrativeFingerprintPayloadV0(narrativeExport));
  const digest = createHash("sha256").update(canonical, "utf8").digest("hex");
  return Object.freeze({
    schema: "rhizoh.narrative_fingerprint.v0",
    algorithm: "sha256",
    digest,
    shortCode: digest.slice(0, 12)
  });
}

/**
 * Screenshot / clip scope watermark — must appear on ops surfaces that can be shared.
 * @param {object} narrativeExport
 */
export function buildScreenshotScopeWatermarkV0(narrativeExport) {
  const scope = narrativeExport?.tenantScope;
  const fp = narrativeExport?.narrativeFingerprint || computeNarrativeFingerprintV0(narrativeExport);
  const tenantId = scope?.tenantId || PLATFORM_TENANT_ID_V0;
  const scopeKind = scope?.scope || TENANT_SCOPE_KIND_V0.PLATFORM_AGGREGATE;

  return Object.freeze({
    schema: "rhizoh.screenshot_scope_watermark.v0",
    tenantId,
    scope: scopeKind,
    fingerprintShort: fp.shortCode,
    nonBinding: true,
    doNotCrop: Object.freeze(["raw_metrics", "disclaimer", "watermark"]),
    lines: Object.freeze({
      tr: `KAPSAM: ${tenantId} · ${scopeKind} · fp:${fp.shortCode} · karar değil / yürütme yok`,
      en: `SCOPE: ${tenantId} · ${scopeKind} · fp:${fp.shortCode} · non-binding / no execution`
    })
  });
}

/**
 * Stamp tenant scope onto signals (RAW may remain platform-wide; envelope tags provenance).
 * @param {object} signals
 * @param {ReturnType<typeof buildTenantScopeEnvelopeV0>} tenantScope
 */
export function tagSignalsWithTenantScopeV0(signals, tenantScope) {
  return Object.freeze({
    ...signals,
    tenantScope,
    source:
      tenantScope.scope === TENANT_SCOPE_KIND_V0.TENANT
        ? `tenant_scoped_ops:${tenantScope.tenantId}`
        : "platform_aggregate_ops"
  });
}

/**
 * @param {object} stateLayers
 * @param {ReturnType<typeof buildTenantScopeEnvelopeV0>} tenantScope
 */
export function sealDerivedLayersForTenantV0(stateLayers, tenantScope) {
  const derived = stateLayers?.derived;
  if (!derived) throw new Error("tenant_isolation:missing_derived_layer");

  return Object.freeze({
    ...stateLayers,
    derived: Object.freeze({
      ...derived,
      tenantScoped: true,
      globalDerivedState: false,
      tenantId: tenantScope.tenantId,
      scope: tenantScope.scope,
      isolationProbe: tenantScope.isolationProbe,
      notDecision: true,
      notShareableAcrossTenants: tenantScope.exportMustNotReuseAcrossTenants
    })
  });
}

/**
 * @param {object} narrativeExport
 * @param {string} foreignTenantId
 */
/**
 * @param {object} narrativeExport
 * @param {string} foreignTenantId
 * @param {string} [foreignIsolationProbe]
 */
export function collectCrossTenantLeakHitsV0(narrativeExport, foreignTenantId, foreignIsolationProbe) {
  const foreign = String(foreignTenantId || "").trim();
  if (!foreign) return [];

  const selfTenant = narrativeExport?.tenantScope?.tenantId;
  const serialized = JSON.stringify(narrativeExport);

  /** @type {string[]} */
  const hits = [];

  if (foreign !== selfTenant && serialized.includes(`"tenantId":"${foreign}"`)) {
    hits.push(`embedded_foreign_tenant_id:${foreign}`);
  }
  if (foreign !== selfTenant && serialized.includes(`tenant_scoped_ops:${foreign}`)) {
    hits.push(`foreign_signal_source:${foreign}`);
  }
  if (foreignIsolationProbe && serialized.includes(foreignIsolationProbe)) {
    hits.push(`foreign_isolation_probe:${foreignIsolationProbe}`);
  }

  return hits;
}

/**
 * @param {object} exportA
 * @param {object} exportB
 */
export function assertNarrativeTenantIsolationV0(exportA, exportB) {
  const tenantA = exportA?.tenantScope?.tenantId;
  const tenantB = exportB?.tenantScope?.tenantId;
  if (!tenantA || !tenantB) throw new Error("tenant_isolation:missing_tenant_scope");
  if (tenantA === tenantB) throw new Error("tenant_isolation:distinct_tenants_required");

  if (exportA?.stateLayers?.derived?.globalDerivedState !== false) {
    throw new Error("tenant_isolation:exportA_global_derived_not_disabled");
  }
  if (exportB?.stateLayers?.derived?.globalDerivedState !== false) {
    throw new Error("tenant_isolation:exportB_global_derived_not_disabled");
  }

  const leakIntoB = collectCrossTenantLeakHitsV0(
    exportB,
    tenantA,
    exportA?.tenantScope?.isolationProbe || undefined
  );
  const leakIntoA = collectCrossTenantLeakHitsV0(
    exportA,
    tenantB,
    exportB?.tenantScope?.isolationProbe || undefined
  );

  if (leakIntoB.length > 0 || leakIntoA.length > 0) {
    throw new Error(
      `tenant_narrative_cross_leak:A->B=${leakIntoB.join(",")};B->A=${leakIntoA.join(",")}`
    );
  }

  const fpA = exportA?.narrativeFingerprint?.digest;
  const fpB = exportB?.narrativeFingerprint?.digest;
  if (fpA && fpB && fpA === fpB) {
    throw new Error("tenant_isolation:identical_fingerprints_for_distinct_tenants");
  }

  const probeA = exportA?.tenantScope?.isolationProbe;
  const probeB = exportB?.tenantScope?.isolationProbe;
  if (probeA && JSON.stringify(exportB).includes(probeA)) {
    throw new Error(`tenant_isolation:probe_A_visible_in_B:${probeA}`);
  }
  if (probeB && JSON.stringify(exportA).includes(probeB)) {
    throw new Error(`tenant_isolation:probe_B_visible_in_A:${probeB}`);
  }

  return true;
}

/**
 * @param {object} narrativeExport
 */
export function assertTenantScopedDerivedInvariantV0(narrativeExport) {
  const d = narrativeExport?.stateLayers?.derived;
  if (!d) throw new Error("tenant_isolation:missing_derived");
  if (d.globalDerivedState !== false) {
    throw new Error("tenant_isolation:global_derived_state_forbidden");
  }
  if (d.tenantScoped !== true) throw new Error("tenant_isolation:derived_not_tenant_scoped");
  if (!narrativeExport?.tenantScope?.tenantId) throw new Error("tenant_isolation:missing_envelope");
  if (d.tenantId !== narrativeExport.tenantScope.tenantId) {
    throw new Error("tenant_isolation:derived_tenant_id_mismatch");
  }
  return true;
}
