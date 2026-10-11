import { useMemo } from "react";
import { useLocation } from "react-router-dom";

export function useActiveRouteIds(): {
  activeTopicId?: string;
  activeNoteId?: string;
} {
  const location = useLocation();

  const activeTopicId = useMemo(() => {
    const match = /^\/topics\/([^/]+)/.exec(location.pathname);
    return match ? match[1] : undefined;
  }, [location.pathname]);

  const activeNoteId = useMemo(() => {
    const match = /^\/notes\/([^/]+)/.exec(location.pathname);
    return match ? match[1] : undefined;
  }, [location.pathname]);

  return { activeTopicId, activeNoteId };
}
