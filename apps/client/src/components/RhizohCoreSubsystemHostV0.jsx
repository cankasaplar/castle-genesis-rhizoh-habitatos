import React, { useEffect, useState } from "react";
import { RhizohChessArenaWorkspaceV0 } from "./RhizohChessArenaWorkspaceV0.jsx";
import { RHIZOH_OPEN_CHESS_ARENA_EVENT_V1 } from "../rhizoh/runtime/symbyoMapIntentBridgeV0.js";
import {
  ensureRhizohCoreSubsystemsBootV0,
  ensureRhizohLearningCoreBootV0
} from "../rhizoh/runtime/rhizohCoreSubsystemBootV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

/**
 * Core subsystem host — chess + learning boot; legal/world independent.
 * Mounted alongside app shell (including during ingress overlay).
 */
export function RhizohCoreSubsystemHostV0({ userId = "" } = {}) {
  const [chessArena, setChessArena] = useState(null);
  const uiLocale = readUiLocaleV0();

  useEffect(() => {
    ensureRhizohCoreSubsystemsBootV0({ userId });
  }, [userId]);

  useEffect(() => {
    if (userId) ensureRhizohLearningCoreBootV0(userId);
  }, [userId]);

  useEffect(() => {
    const onChessArena = (ev) => {
      const detail = ev?.detail;
      if (!detail?.node) return;
      setChessArena(detail);
    };
    window.addEventListener(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, onChessArena);
    return () => window.removeEventListener(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, onChessArena);
  }, []);

  if (!chessArena) return null;

  return (
    <RhizohChessArenaWorkspaceV0
      open
      node={chessArena.node}
      peerCastle={chessArena.peerCastle || null}
      initialMode={chessArena.initialMode || null}
      autoPlay={Boolean(chessArena.autoPlay)}
      onClose={() => setChessArena(null)}
      uiLocale={uiLocale}
    />
  );
}
