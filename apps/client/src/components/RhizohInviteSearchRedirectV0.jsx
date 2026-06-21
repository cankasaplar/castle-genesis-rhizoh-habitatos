import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { parseObserverInviteFromSearchV0 } from "../rhizoh/ingress/observerInviteLandingV0.js";

/**
 * Redirect legacy/root invite query params to /invite landing.
 */
export function RhizohInviteSearchRedirectV0() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname !== "/" && location.pathname !== "") return;
    const invite = parseObserverInviteFromSearchV0(location.search);
    if (!invite) return;
    navigate(`/invite${location.search}`, { replace: true });
  }, [location.pathname, location.search, navigate]);

  return null;
}
