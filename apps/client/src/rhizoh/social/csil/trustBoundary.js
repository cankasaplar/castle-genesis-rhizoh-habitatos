/**
 * Trust boundary — varlık sınıfı + ilişki aşamasına göre izinler.
 */

import { ENTITY_CLASS } from "./identityResolution.js";
import { REL_STAGE } from "./relationshipGraph.js";

/**
 * @param {{
 *   hearPrivateContext?: boolean,
 *   accessMemory?: boolean,
 *   issueCommands?: boolean,
 *   modifyWorld?: boolean
 * }} p
 */
export function defaultPermissions(p = {}) {
  return {
    hearPrivateContext: !!p.hearPrivateContext,
    accessMemory: !!p.accessMemory,
    issueCommands: !!p.issueCommands,
    modifyWorld: !!p.modifyWorld,
    accessLevel: String(p.accessLevel || "observe-only")
  };
}

/**
 * @param {string} stage
 * @param {string} entityClass
 */
export function permissionsFor(stage, entityClass) {
  const st = String(stage || REL_STAGE.UNKNOWN);
  const cl = String(entityClass || ENTITY_CLASS.UNKNOWN);

  if (cl === ENTITY_CLASS.AMBIENT) {
    return defaultPermissions({
      hearPrivateContext: false,
      accessMemory: false,
      issueCommands: false,
      modifyWorld: false,
      accessLevel: "observe-only"
    });
  }
  if (cl === ENTITY_CLASS.AI_AGENT) {
    return defaultPermissions({
      hearPrivateContext: st === REL_STAGE.TRUSTED || st === REL_STAGE.BONDED,
      accessMemory: true,
      issueCommands: true,
      modifyWorld: st !== REL_STAGE.UNKNOWN && st !== REL_STAGE.SEEN,
      accessLevel: st === REL_STAGE.UNKNOWN || st === REL_STAGE.SEEN ? "limited-response" : "verified"
    });
  }
  if (cl === ENTITY_CLASS.GHOST_PET) {
    return defaultPermissions({
      hearPrivateContext: false,
      accessMemory: true,
      issueCommands: false,
      modifyWorld: false,
      accessLevel: "limited-response"
    });
  }
  if (cl === ENTITY_CLASS.HUMAN_GUEST || cl === ENTITY_CLASS.UNKNOWN) {
    if (st === REL_STAGE.UNKNOWN || st === REL_STAGE.SEEN) {
      return defaultPermissions({
        hearPrivateContext: false,
        accessMemory: false,
        issueCommands: false,
        modifyWorld: false,
        accessLevel: "observe-only"
      });
    }
    if (st === REL_STAGE.INTRODUCED) {
      return defaultPermissions({
        hearPrivateContext: false,
        accessMemory: false,
        issueCommands: false,
        modifyWorld: false,
        accessLevel: "limited-response"
      });
    }
    if (st === REL_STAGE.KNOWN) {
      return defaultPermissions({
        hearPrivateContext: false,
        accessMemory: true,
        issueCommands: false,
        modifyWorld: false,
        accessLevel: "normal-interaction"
      });
    }
    return defaultPermissions({
      hearPrivateContext: true,
      accessMemory: true,
      issueCommands: false,
      modifyWorld: false,
      accessLevel: "memory-write-enabled"
    });
  }

  // human_user
  if (st === REL_STAGE.UNKNOWN || st === REL_STAGE.SEEN) {
    return defaultPermissions({
      hearPrivateContext: false,
      accessMemory: true,
      issueCommands: true,
      modifyWorld: false,
      accessLevel: "normal-interaction"
    });
  }
  if (st === REL_STAGE.INTRODUCED || st === REL_STAGE.KNOWN) {
    return defaultPermissions({
      hearPrivateContext: false,
      accessMemory: true,
      issueCommands: true,
      modifyWorld: true,
      accessLevel: "memory-write-enabled"
    });
  }
  return defaultPermissions({
    hearPrivateContext: true,
    accessMemory: true,
    issueCommands: true,
    modifyWorld: true,
    accessLevel: "verified"
  });
}
