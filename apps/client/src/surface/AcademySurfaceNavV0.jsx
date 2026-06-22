import React from "react";
import { Link } from "react-router-dom";

const linkCls =
  "rounded-md px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] transition-colors";

/**
 * Product Academy nav — research (own threads) separate from genesis ops surfaces.
 * @param {{ active: "home" | "research" | "observe" | "docs" }} props
 */
export function AcademySurfaceNavV0({ active }) {
  const pill = (key) =>
    active === key
      ? "bg-teal-500/25 text-teal-100 ring-1 ring-teal-400/35"
      : "text-white/45 hover:bg-white/[0.06] hover:text-white/75";

  return (
    <nav
      className="flex flex-wrap items-center gap-1 rounded-lg border border-white/[0.08] bg-black/25 px-2 py-1.5"
      aria-label="Academy"
    >
      <Link to="/academy" className={`${linkCls} ${pill("home")}`}>
        Home
      </Link>
      <Link to="/academy/research" className={`${linkCls} ${pill("research")}`}>
        Research
      </Link>
      <Link to="/academy/observe" className={`${linkCls} ${pill("observe")}`}>
        Observe live
      </Link>
      <Link to="/genesis/academy" className={`${linkCls} ${pill("docs")}`}>
        Docs
      </Link>
      <Link to="/" className={`${linkCls} text-white/35 hover:text-white/60`}>
        Rhizoh shell
      </Link>
    </nav>
  );
}
