import React, { useEffect, useState } from "react";
import { RhizohChessArenaWorkspaceV0 } from "./RhizohChessArenaWorkspaceV0.jsx";
import { RhizohChessClusterArenaV0 } from "./RhizohChessClusterArenaV0.jsx";
import { RhizohObservationProofPanelV0 } from "./RhizohObservationProofPanelV0.jsx";
import { RHIZOH_OPEN_CHESS_ARENA_EVENT_V1 } from "../rhizoh/runtime/symbyoMapIntentBridgeV0.js";
import { RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0 } from "../rhizoh/runtime/chessGameClusterV0.js";
import { RHIZOH_CLOSE_CHESS_CLUSTER_ARENA_EVENT_V0 } from "../rhizoh/runtime/chessEngineContentionGateV0.js";
import {
  ensureRhizohCoreSubsystemsBootV0,
  ensureRhizohLearningCoreBootV0
} from "../rhizoh/runtime/rhizohCoreSubsystemBootV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";
import { shouldRhizohCoreHostOwnChessArenaV0, isRhizohWorldSpaceMapStageV0 } from "../rhizoh/runtime/rhizohWorldSurfacePolicyV0.js";
import { dispatchOpenRhizohLearningChannelV0 } from "../rhizoh/runtime/sovereignWorldMapNodesV0.js";

/**
 * Core subsystem host — chess + cluster + learning; legal/world independent.
 */
export function RhizohCoreSubsystemHostV0({ userId = "" } = {}) {
  const [chessArena, setChessArena] = useState(null);
  const [clusterOpen, setClusterOpen] = useState(false);
  const uiLocale = readUiLocaleV0();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const coreHostOwnsChessArenaV0 = shouldRhizohCoreHostOwnChessArenaV0({ pathname });
  const worldSpaceMapStage = isRhizohWorldSpaceMapStageV0({ pathname });

  useEffect(() => {
    ensureRhizohCoreSubsystemsBootV0({ userId });
  }, [userId]);

  useEffect(() => {
    if (userId) ensureRhizohLearningCoreBootV0(userId);
  }, [userId]);

  useEffect(() => {
    const onChessArena = (ev) => {
      if (!shouldRhizohCoreHostOwnChessArenaV0()) return;
      const detail = ev?.detail;
      if (!detail?.node) return;
      setClusterOpen(false);
      setChessArena(detail);
    };
    const onClusterArena = (ev) => {
      if (isRhizohWorldSpaceMapStageV0({ pathname: window.location.pathname })) {
        dispatchOpenRhizohLearningChannelV0({
          source: ev?.detail?.source || "cluster_arena"
        });
        return;
      }
      setChessArena(null);
      setClusterOpen(true);
    };
    const onCloseClusterArena = () => setClusterOpen(false);
    window.addEventListener(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, onChessArena);
    window.addEventListener(RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0, onClusterArena);
    window.addEventListener(RHIZOH_CLOSE_CHESS_CLUSTER_ARENA_EVENT_V0, onCloseClusterArena);
    return () => {
      window.removeEventListener(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, onChessArena);
      window.removeEventListener(RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0, onClusterArena);
      window.removeEventListener(RHIZOH_CLOSE_CHESS_CLUSTER_ARENA_EVENT_V0, onCloseClusterArena);
    };
  }, []);

  return (
    <>
      <RhizohObservationProofPanelV0 />
      {chessArena && coreHostOwnsChessArenaV0 ? (
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
      {worldSpaceMapStage ? null : (
        <RhizohChessClusterArenaV0
          open={clusterOpen}
          onClose={() => setClusterOpen(false)}
          uiLocale={uiLocale}
        />
      )}
    </>
  );
}
