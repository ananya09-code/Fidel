import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { useRouterState } from "@tanstack/react-router";
import { analyticsAllowed, initializeAnalytics, syncAnalyticsIdentity, trackPage } from "@/lib/analytics";

export function Analytics() {
  const { isLoaded, userId } = useAuth();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const lastPage = useRef<string | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    void (async () => {
      // Do not initialize on authentication or admin pages.
      if (analyticsAllowed(path)) await initializeAnalytics();
      if (cancelled) return;
      syncAnalyticsIdentity(userId ?? null);
      if (lastPage.current !== path) { trackPage(path); lastPage.current = path; }
    })().catch(() => { /* Usage analytics must not interrupt the app. */ });
    return () => { cancelled = true; };
  }, [isLoaded, userId, path]);
  return null;
}
