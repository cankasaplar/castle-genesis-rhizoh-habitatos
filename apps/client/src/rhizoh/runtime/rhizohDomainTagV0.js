/**
 * Domain tag layer v0.1 — host + overlay federation tags (Sprint 38).
 */

import { resolveDomainIdFromPathV0 } from "./rhizohDomainGateV0.js";
import { resolveWorldDomainFromPathV0 } from "./rhizohWorldDomainRoutesV0.js";
import {
  getActiveFederationOverlayNodeV0,
  resolveFederationNodeFromProductSurfaceV0
} from "./rhizohDomainGraphV0.js";

export const RHIZOH_DOMAIN_TAG_SCHEMA_V0 = "rhizoh.domain_tag.v1";

/**
 * @param {{
 *   pathname?: string,
 *   surfaceId?: string | null,
 *   drawerId?: string | null,
 *   hostDomain?: string | null,
 *   overlayDomain?: string | null,
 *   overlayNode?: string | null
 * }} [ctx]
 */
export function resolveRhizohDomainTagsV0(ctx = {}) {
  const pathname =
    ctx.pathname ||
    (typeof window !== "undefined" ? String(window.location.pathname || "/") : "/");
  const domainId = ctx.hostDomain || resolveDomainIdFromPathV0(pathname);
  const worldDomain = resolveWorldDomainFromPathV0(pathname);
  const surfaceId = ctx.surfaceId ? String(ctx.surfaceId) : null;
  const drawerId = ctx.drawerId ? String(ctx.drawerId) : null;
  const overlayNode =
    ctx.overlayNode ||
    ctx.overlayDomain ||
    (drawerId ? resolveFederationNodeFromProductSurfaceV0(drawerId) : null) ||
    getActiveFederationOverlayNodeV0();

  /** @type {string[]} */
  const tags = [`host:${domainId}`];
  if (worldDomain) tags.push(`world:${worldDomain}`);
  if (surfaceId && surfaceId !== "world") tags.push(`surface:${surfaceId}`);
  if (overlayNode) tags.push(`overlay:${overlayNode}`);
  if (drawerId) tags.push(`drawer:${drawerId}`);

  return Object.freeze({
    schema: RHIZOH_DOMAIN_TAG_SCHEMA_V0,
    domainId,
    hostDomain: domainId,
    overlayDomain: overlayNode,
    overlayNode,
    worldDomain,
    surfaceId,
    drawerId,
    tags: Object.freeze([...tags])
  });
}

/**
 * @param {ReturnType<typeof resolveRhizohDomainTagsV0>} tagSnapshot
 * @param {HTMLElement | null | undefined} el
 */
export function applyRhizohDomainTagsToElementV0(el, tagSnapshot) {
  if (!el || !tagSnapshot) return;
  el.setAttribute("data-rhizoh-domain-id", tagSnapshot.domainId);
  el.setAttribute("data-rhizoh-host-domain", tagSnapshot.hostDomain || tagSnapshot.domainId);
  if (tagSnapshot.overlayNode) {
    el.setAttribute("data-rhizoh-overlay-domain", tagSnapshot.overlayNode);
  } else {
    el.removeAttribute("data-rhizoh-overlay-domain");
  }
  if (tagSnapshot.worldDomain) {
    el.setAttribute("data-rhizoh-world-domain", tagSnapshot.worldDomain);
  } else {
    el.removeAttribute("data-rhizoh-world-domain");
  }
  if (tagSnapshot.surfaceId) {
    el.setAttribute("data-rhizoh-product-surface", tagSnapshot.surfaceId);
  } else {
    el.removeAttribute("data-rhizoh-product-surface");
  }
  if (tagSnapshot.drawerId) {
    el.setAttribute("data-rhizoh-drawer-open", tagSnapshot.drawerId);
  } else {
    el.removeAttribute("data-rhizoh-drawer-open");
  }
  el.setAttribute("data-rhizoh-domain-tags", tagSnapshot.tags.join(","));
}
