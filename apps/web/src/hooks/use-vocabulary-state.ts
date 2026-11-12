import { useAuth } from "@clerk/tanstack-react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getVocabularyState,
  updateVocabularyState,
  type VocabularyStateUpdate,
} from "@/lib/api/vocabulary";
import { usePreferences } from "@/hooks/use-preferences";

const key = (userId: string | null | undefined, languageCode: string) =>
  ["auth", "vocabulary-state", userId ?? "signed-out", languageCode] as const;

export function useVocabularyState() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const preferences = usePreferences();
  const languageCode = preferences.data?.learning_language;
  return useQuery({
    queryKey: key(userId, languageCode ?? "unselected"),
    queryFn: async ({ signal }) => {
      return getVocabularyState(getToken, languageCode!, signal);
    },
    enabled: isLoaded && Boolean(isSignedIn && userId && languageCode),
    staleTime: 30_000,
    retry: false,
  });
}

export function useUpdateVocabularyState() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ wordId, update }: { wordId: string; update: VocabularyStateUpdate }) => {
      return updateVocabularyState(getToken, wordId, update);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["auth", "vocabulary-state", userId ?? "signed-out"] }),
        queryClient.invalidateQueries({ queryKey: ["auth", "spaced-reviews", userId ?? "signed-out"] }),
        queryClient.invalidateQueries({ queryKey: ["auth", "reviews", userId ?? "signed-out"] }),
        queryClient.invalidateQueries({ queryKey: ["auth", "dashboard", userId ?? "signed-out"] }),
      ]);
    },
  });
}
