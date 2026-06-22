/**
 * Match single-writer policy v0 — server = sole authoritative commit writer.
 * Client = proposal + local prediction only. Shadow rehearsal harness is explicit opt-in.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_MATCH_COMMIT_AUTHORITY_ROADMAP_V1.md
 */

export const MATCH_SINGLE_WRITER_SCHEMA_V0 = "castle.rhizoh.match_single_writer_policy.v0";

export const MATCH_COMMIT_AUTHORITY_POLICY_V0 = Object.freeze({
  SERVER_PRIMARY: "server_primary"
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

export function getMatchSingleWriterPolicyV0(ctx = {}) {
  const gatewayReady = ctx.gatewayReady === true;
  return Object.freeze({
    schema: MATCH_SINGLE_WRITER_SCHEMA_V0,
    singleWriterRule: true,
    commitAuthorityPolicy: MATCH_COMMIT_AUTHORITY_POLICY_V0.SERVER_PRIMARY,
    proposalAuthority: "client_shadow",
    effectiveCommitWriter: gatewayReady ? "server" : "client_shadow",
    serverAuthoritative: gatewayReady,
    forkRiskWhenClientCommits: !gatewayReady,
    clientMayAuthoritativeCommit: false,
    shadowRehearsal: !gatewayReady,
    interpretationOnly: true
  });
}
