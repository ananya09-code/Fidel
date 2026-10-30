import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";

import { getDashboard } from "@/lib/api/dashboard";

export function useDashboard() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  return useQuery({
    queryKey: ["auth", "dashboard", userId ?? "signed-out"],
    queryFn: async ({ signal }) => {
      const token = await getToken();
      if (!token) throw new Error("Your session expired. Please sign in again.");
      return getDashboard(token, signal);
    },
    enabled: isLoaded && Boolean(isSignedIn && userId),
    staleTime: 30_000,
    retry: false,
  });
}
