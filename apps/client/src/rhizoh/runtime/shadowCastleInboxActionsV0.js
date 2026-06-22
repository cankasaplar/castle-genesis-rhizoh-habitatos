/**
 * Shadow castle inbox item actions — fly to pin, chess arena, or match invite accept.
 * RESEARCH-ONLY · interpretive routing only.
 */

import { CHESS_GAME_MODE_V0 } from "./chessArenaEngineV0.js";
import { acceptShadowCastleMatchInviteV0, SHADOW_INBOX_KIND_MATCH_INVITE_V0 } from "./matchCastleInboxBridgeV0.js";
import { RHIZOH_OPEN_CHESS_ARENA_EVENT_V1 } from "./symbyoMapIntentBridgeV0.js";
import { flyToInboxItemPinV0 } from "./shadowCastleInboxFlyV0.js";
import { readBoundShadowCastlePeerV0 } from "./shadowCastlePeerRegistryV0.js";

export const SHADOW_INBOX_ACTION_V0 = Object.freeze({
  FLY_TO_PIN: "fly_to_pin",
  OPEN_CHESS_ARENA: "open_chess_arena",
  ACCEPT_MATCH_INVITE: "accept_match_invite"
});

/**
 * @param {object} item
 */
export function resolveShadowInboxItemActionV0(item) {
  const kind = String(item?.kind || "").toLowerCase();
  const eventType = String(item?.eventType || "").toLowerCase();
  if (kind === SHADOW_INBOX_KIND_MATCH_INVITE_V0 || eventType === "chess.match_invite") {
    return SHADOW_INBOX_ACTION_V0.ACCEPT_MATCH_INVITE;
  }
  if (kind === "chess" || eventType.startsWith("chess.")) {
    return SHADOW_INBOX_ACTION_V0.OPEN_CHESS_ARENA;
  }
  return SHADOW_INBOX_ACTION_V0.FLY_TO_PIN;
}

function openChessArenaFromInboxV0(item, opts = {}) {
  const tr = opts.uiLocale === "tr";
  const bound = readBoundShadowCastlePeerV0();
  const peerCastle =
    item?.isRealPeer && bound?.uid
      ? Object.freeze({
          uid: bound.uid,
          displayName: bound.displayName || bound.uid.slice(0, 8),
          gatewayClientId: bound.gatewayClientId || null
        })
      : item?.hostCastleUid
        ? Object.freeze({
            uid: String(item.hostCastleUid),
            displayName: String(item.hostDisplayName || item.hostCastleUid).slice(0, 48),
            gatewayClientId: item.hostGatewayClientId || null
          })
        : null;

  const useHumanHuman = Boolean(peerCastle) || item?.isRealPeer === true;
  const initialMode = useHumanHuman
    ? CHESS_GAME_MODE_V0.HUMAN_HUMAN
    : CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH;

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, {
        detail: Object.freeze({
          source: "shadow_castle_inbox",
          node: Object.freeze({
            id: "chess_arena",
            type: "zone",
            label: "CHESS",
            name: tr ? "Kale Satranç Arenası" : "Castle Chess Arena",
            color: "#22d3ee"
          }),
          peerCastle,
          initialMode,
          autoPlay: true,
          shadowInboxItem: item
        })
      })
    );
  }
  return Object.freeze({ ok: true, action: SHADOW_INBOX_ACTION_V0.OPEN_CHESS_ARENA, initialMode });
}

/**
 * @param {object} item
 * @param {{ uiLocale?: string, closeMediaTube?: () => void }} [opts]
 */
export async function runShadowInboxItemActionV0(item, opts = {}) {
  const action = resolveShadowInboxItemActionV0(item);

  if (action === SHADOW_INBOX_ACTION_V0.ACCEPT_MATCH_INVITE) {
    opts.closeMediaTube?.();
    const accepted = await acceptShadowCastleMatchInviteV0(item);
    return Object.freeze({
      ok: accepted.ok === true,
      action,
      accepted,
      interpretationOnly: true
    });
  }

  if (action === SHADOW_INBOX_ACTION_V0.OPEN_CHESS_ARENA) {
    opts.closeMediaTube?.();
    return openChessArenaFromInboxV0(item, opts);
  }

  flyToInboxItemPinV0(item, { zoom: 14 });
  return Object.freeze({ ok: true, action: SHADOW_INBOX_ACTION_V0.FLY_TO_PIN });
}
