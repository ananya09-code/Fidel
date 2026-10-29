import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";

import { syncProfile } from "@/lib/api/profile";

export const profileQueryKeys = {
  byUser: (userId: string | null | undefined) =>
    ["auth", "profile", userId ?? "signed-out"] as const,
};

export function useProfile() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();

  return useQuery({
    queryKey: profileQueryKeys.byUser(userId),
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("Your session expired. Please sign in again.");
      }

      return syncProfile(token);
    },
    enabled: isLoaded && Boolean(isSignedIn && userId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
