/**
 * Match single-writer policy v0 — Client = Reality Simulator · Server = Reality Finalizer.
 * commitAuthority is DERIVED on server ack only — never a client identity.
 * effectiveCommitWriter is the SSOT for who actually wrote authoritative truth.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_MATCH_COMMIT_AUTHORITY_ROADMAP_V1.md
 */

export const MATCH_SINGLE_WRITER_SCHEMA_V0 = "castle.rhizoh.match_single_writer_policy.v0";

/** Client lane authorities — simulation only, never real commit. */
export const MATCH_CLIENT_AUTHORITY_V0 = Object.freeze({
  PROPOSAL: "client_shadow",
  PREVIEW: "client_preview",
  SIMULATION: "client_simulation"
});

/** Server commit authority — sole real commit writer (derived, not client-displayed). */
export const MATCH_SERVER_COMMIT_AUTHORITY_V0 = Object.freeze({
  SERVER: "server"
});

/** SSOT: who actually wrote authoritative truth log entries. */
export const MATCH_EFFECTIVE_COMMIT_WRITER_V0 = Object.freeze({
  PENDING_SERVER: "pending_server",
  SERVER: "server"
});

export const MATCH_REALITY_ROLE_V0 = Object.freeze({
  CLIENT_SIMULATOR: "reality_simulator",
  SERVER_FINALIZER: "reality_finalizer"
});

export const MATCH_TRUTH_PROVENANCE_V0 = Object.freeze({
  GATEWAY_ACK: "gateway_ack",
  SHADOW_REHEARSAL_HARNESS: "shadow_rehearsal_harness",
  CLIENT_PREVIEW: "client_preview"
});

export const MATCH_TRUTH_LOG_LANE_V0 = Object.freeze({
  AUTHORITATIVE: "authoritative",
  PREVIEW: "preview"
});

/**
 * @param {{ provenance?: string | null }} ctx
 */
export function isGatewayAuthoritativeCommitV0(ctx = {}) {
  return ctx.provenance === MATCH_TRUTH_PROVENANCE_V0.GATEWAY_ACK;
}

/**
 * @param {{ provenance?: string | null }} ctx
 */
export function isShadowRehearsalHarnessCommitV0(ctx = {}) {
  return ctx.provenance === MATCH_TRUTH_PROVENANCE_V0.SHADOW_REHEARSAL_HARNESS;
}

/**
 * @param {{ provenance?: string | null, type?: string }} ctx
 */
export function canAppendAuthoritativeCommitV0(ctx = {}) {
  if (ctx.type !== "CommitMove") return true;
  return isGatewayAuthoritativeCommitV0(ctx) || isShadowRehearsalHarnessCommitV0(ctx);
}

/**
 * Derived — commitAuthority exists only after server finalizes. Never on client simulation.
 * @param {{ gatewayReady?: boolean, provenance?: string | null }} ctx
 */
export function deriveCommitAuthorityV0(ctx = {}) {
  const gatewayReady = ctx.gatewayReady === true || isGatewayAuthoritativeCommitV0(ctx);
  return gatewayReady ? MATCH_SERVER_COMMIT_AUTHORITY_V0.SERVER : null;
}

/**
 * SSOT — who actually wrote authoritative truth.
 * @param {{ gatewayReady?: boolean, provenance?: string | null }} ctx
 */
export function deriveEffectiveCommitWriterV0(ctx = {}) {
  const gatewayReady = ctx.gatewayReady === true || isGatewayAuthoritativeCommitV0(ctx);
  return gatewayReady
    ? MATCH_EFFECTIVE_COMMIT_WRITER_V0.SERVER
    : MATCH_EFFECTIVE_COMMIT_WRITER_V0.PENDING_SERVER;
}

/**
 * Client-side authority bundle — never includes commitAuthority.
 */
export function getClientRealityAuthoritiesV0() {
  return Object.freeze({
    proposalAuthority: MATCH_CLIENT_AUTHORITY_V0.PROPOSAL,
    previewAuthority: MATCH_CLIENT_AUTHORITY_V0.PREVIEW,
    simulationAuthority: MATCH_CLIENT_AUTHORITY_V0.SIMULATION,
    clientIsCommitAuthority: false,
    realityRole: MATCH_REALITY_ROLE_V0.CLIENT_SIMULATOR,
    interpretationOnly: true
  });
}

export function getMatchSingleWriterPolicyV0(ctx = {}) {
  const gatewayReady = ctx.gatewayReady === true || isGatewayAuthoritativeCommitV0(ctx);
  const client = getClientRealityAuthoritiesV0();
  const effectiveCommitWriter = deriveEffectiveCommitWriterV0({ gatewayReady });
  const commitAuthority = deriveCommitAuthorityV0({ gatewayReady });

  return Object.freeze({
    schema: MATCH_SINGLE_WRITER_SCHEMA_V0,
    singleWriterRule: true,
    ...client,
    effectiveCommitWriter,
    commitAuthority,
    serverAuthoritative: gatewayReady,
    serverRealityRole: gatewayReady ? MATCH_REALITY_ROLE_V0.SERVER_FINALIZER : null,
    clientMayAuthoritativeCommit: false,
    shadowRehearsal: !gatewayReady,
    interpretationOnly: true
  });
}

/**
 * Log vocabulary for dispatch chains — separates client vs server fields.
 * @param {{ gatewayReady?: boolean, lane?: string }} ctx
 */
export function buildMatchTruthChainAuthorityV0(ctx = {}) {
  const gatewayReady = ctx.gatewayReady === true;
  const client = getClientRealityAuthoritiesV0();
  const effectiveCommitWriter = deriveEffectiveCommitWriterV0({ gatewayReady });
  const commitAuthority = deriveCommitAuthorityV0({ gatewayReady });

  if (ctx.lane === MATCH_TRUTH_LOG_LANE_V0.PREVIEW || !gatewayReady) {
    return Object.freeze({
      ...client,
      effectiveCommitWriter,
      commitAuthority: null,
      interpretationOnly: true
    });
  }

  return Object.freeze({
    ...client,
    effectiveCommitWriter,
    commitAuthority,
    serverRealityRole: MATCH_REALITY_ROLE_V0.SERVER_FINALIZER,
    interpretationOnly: true
  });
}
