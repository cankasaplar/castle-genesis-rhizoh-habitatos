import React from "react";
import { Link } from "react-router-dom";

const linkCls =
  "rounded-md px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] transition-colors";

/**
 * @param {{ active: "hub" | "academy" | "portal" | "observe" }} props
 */
export function GenesisSurfaceNav({ active }) {
  const pill = (key) =>
    active === key
      ? "bg-violet-500/25 text-violet-100 ring-1 ring-violet-400/35"
      : "text-white/45 hover:bg-white/[0.06] hover:text-white/75";

  return (
    <nav
      className="flex flex-wrap items-center gap-1 rounded-lg border border-white/[0.08] bg-black/25 px-2 py-1.5"
      aria-label="Genesis observability"
    >
      <Link to="/genesis/hub" className={`${linkCls} ${pill("hub")}`}>
        Hub
      </Link>
      <Link to="/academy/observe" className={`${linkCls} ${pill("observe")}`} title="SSE · replay · evolution (product surface)">
        Observe live
      </Link>
      <Link to="/genesis/academy" className={`${linkCls} ${pill("academy")}`}>
        Academy
      </Link>
      <Link to="/genesis/portal" className={`${linkCls} ${pill("portal")}`}>
        Legacy portal
      </Link>
      <Link to="/" className={`${linkCls} text-white/35 hover:text-white/60`}>
        Rhizoh shell
      </Link>
    </nav>
  );
}
