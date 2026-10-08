import React from "react";
import ReactDOM from "react-dom/client";
import { RhizohAppShell } from "../apps/client/src/rhizoh/shell/RhizohAppShell.jsx";
import "./index.css";

const rootEl = document.getElementById("root") || document.getElementById("app");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <RhizohAppShell />
    </React.StrictMode>
  );
}
