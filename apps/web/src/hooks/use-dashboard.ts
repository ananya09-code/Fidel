import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";

import { getDashboard, getStudyActivity } from "@/lib/api/dashboard";
import { usePreferences } from "@/hooks/use-preferences";

export function useStudyActivity() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const preferences = usePreferences();
  const languageCode = preferences.data?.learning_language;
  return useQuery({
    queryKey: ["auth", "dashboard", userId ?? "signed-out", "activity", languageCode],
    queryFn: async ({ signal }) => {
      return getStudyActivity(getToken, languageCode!, signal);
    },
    enabled: isLoaded && Boolean(isSignedIn && userId && languageCode),
    staleTime: 30_000,
    retry: false,
  });
}

export function useDashboard() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const preferences = usePreferences();
  const languageCode = preferences.data?.learning_language;
  return useQuery({
    queryKey: ["auth", "dashboard", userId ?? "signed-out", languageCode],
    queryFn: async ({ signal }) => {
      return getDashboard(getToken, languageCode!, signal);
    },
    enabled: isLoaded && Boolean(isSignedIn && userId && languageCode),
    staleTime: 30_000,
    retry: false,
  });
}
