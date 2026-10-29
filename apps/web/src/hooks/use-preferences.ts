import { useAuth } from "@clerk/tanstack-react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getPreferences,
  updatePreferences,
  type UserPreferencesUpdate,
} from "@/lib/api/preferences";

export const preferencesQueryKeys = {
  byUser: (userId: string | null | undefined) =>
    ["auth", "preferences", userId ?? "signed-out"] as const,
};

export function usePreferences() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();

  return useQuery({
    queryKey: preferencesQueryKeys.byUser(userId),
    queryFn: async ({ signal }) => {
      const token = await getToken();
      if (!token) throw new Error("Your session expired. Please sign in again.");
      return getPreferences(token, signal);
    },
    enabled: isLoaded && Boolean(isSignedIn && userId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useUpdatePreferences() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: UserPreferencesUpdate) => {
      const token = await getToken();
      if (!token) throw new Error("Your session expired. Please sign in again.");
      return updatePreferences(token, update);
    },
    onSuccess: (preferences) => {
      queryClient.setQueryData(
        preferencesQueryKeys.byUser(userId),
        preferences,
      );
    },
  });
}
