import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { usePreferences } from "@/hooks/use-preferences";
import { getSpacedReviews } from "@/lib/api/reviews";
import { MemoryCheckView } from "./MemoryCheckView";

export function MemoryCheck() {
  const { getToken, userId, isLoaded, isSignedIn } = useAuth();
  const preferences = usePreferences();
  const language = preferences.data?.learning_language ?? "om";
  const query = useQuery({
    queryKey: ["auth", "spaced-reviews", userId, language],
    queryFn: async ({ signal }) => {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again to load your quiz.");
      return getSpacedReviews(token, language, signal);
    },
    enabled: isLoaded && Boolean(isSignedIn && userId) && preferences.isSuccess,
    staleTime: 30_000, refetchInterval: 60_000, retry: false,
  });
  return <MemoryCheckView data={query.data} loading={query.isPending && !preferences.isError} error={preferences.error?.message ?? query.error?.message} onRetry={() => { void preferences.refetch(); void query.refetch(); }} />;
}
