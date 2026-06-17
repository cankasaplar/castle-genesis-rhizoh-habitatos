import React, { useEffect, useState } from "react";
import { RhizohChessArenaWorkspaceV0 } from "./RhizohChessArenaWorkspaceV0.jsx";
import { RhizohChessClusterArenaV0 } from "./RhizohChessClusterArenaV0.jsx";
import { RHIZOH_OPEN_CHESS_ARENA_EVENT_V1 } from "../rhizoh/runtime/symbyoMapIntentBridgeV0.js";
import { RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0 } from "../rhizoh/runtime/chessGameClusterV0.js";
import {
  ensureRhizohCoreSubsystemsBootV0,
  ensureRhizohLearningCoreBootV0
} from "../rhizoh/runtime/rhizohCoreSubsystemBootV0.js";
import { isRhizohLegalPendingHoldV0 } from "../rhizoh/runtime/rhizohLegalPendingWaitLoopV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

/**
 * Core subsystem host — chess + cluster + learning; legal/world independent.
 */
export function RhizohCoreSubsystemHostV0({ userId = "" } = {}) {
  const [chessArena, setChessArena] = useState(null);
  const [clusterOpen, setClusterOpen] = useState(false);
  const uiLocale = readUiLocaleV0();

  useEffect(() => {
    ensureRhizohCoreSubsystemsBootV0({ userId });
    if (isRhizohLegalPendingHoldV0()) {
      const t = window.setTimeout(() => setClusterOpen(true), 3_500);
      return () => window.clearTimeout(t);
    }
    return undefined;
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
    const onClusterArena = () => setClusterOpen(true);
    window.addEventListener(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, onChessArena);
    window.addEventListener(RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0, onClusterArena);
    return () => {
      window.removeEventListener(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, onChessArena);
      window.removeEventListener(RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0, onClusterArena);
    };
  }, []);

  return (
    <>
      {chessArena ? (
        <RhizohChessArenaWorkspaceV0
          open
          node={chessArena.node}
          peerCastle={chessArena.peerCastle || null}
          initialMode={chessArena.initialMode || null}
          autoPlay={Boolean(chessArena.autoPlay)}
          onClose={() => setChessArena(null)}
          uiLocale={uiLocale}
        />
      ) : null}
      <RhizohChessClusterArenaV0
        open={clusterOpen}
        onClose={() => setClusterOpen(false)}
        uiLocale={uiLocale}
      />
    </>
  );
}
