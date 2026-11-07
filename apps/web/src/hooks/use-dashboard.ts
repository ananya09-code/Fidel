import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";

import { getDashboard, getStudyActivity } from "@/lib/api/dashboard";

export function useStudyActivity() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  return useQuery({
    queryKey: ["auth", "dashboard", userId ?? "signed-out", "activity"],
    queryFn: async ({ signal }) => {
      return getStudyActivity(getToken, signal);
    },
    enabled: isLoaded && Boolean(isSignedIn && userId),
    staleTime: 30_000,
    retry: false,
  });
}

export function useDashboard() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  return useQuery({
    queryKey: ["auth", "dashboard", userId ?? "signed-out"],
    queryFn: async ({ signal }) => {
      return getDashboard(getToken, signal);
    },
    enabled: isLoaded && Boolean(isSignedIn && userId),
    staleTime: 30_000,
    retry: false,
  });
}
