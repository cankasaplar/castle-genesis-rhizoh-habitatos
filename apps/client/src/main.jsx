import React from "react";
import ReactDOM from "react-dom/client";
import { CastleRootErrorBoundary } from "./boot/CastleRootErrorBoundary.jsx";
import { mountRhizohChessApplication } from "./boot/mountRhizohChessApplication.jsx";
import "../../../src/index.css";

// Decoupled Rhizoh Chess & AI Research Lab Entrypoint
const appEl = document.getElementById("app");
if (appEl) {
  void mountRhizohChessApplication({ appEl, RootErrorBoundary: CastleRootErrorBoundary });
}
