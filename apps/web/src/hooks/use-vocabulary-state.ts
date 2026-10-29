import { useAuth } from "@clerk/tanstack-react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getVocabularyState,
  updateVocabularyState,
  type VocabularyStateUpdate,
} from "@/lib/api/vocabulary";

const key = (userId: string | null | undefined) =>
  ["auth", "vocabulary-state", userId ?? "signed-out"] as const;

export function useVocabularyState() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  return useQuery({
    queryKey: key(userId),
    queryFn: async ({ signal }) => {
      const token = await getToken();
      if (!token) throw new Error("Your session expired. Please sign in again.");
      return getVocabularyState(token, signal);
    },
    enabled: isLoaded && Boolean(isSignedIn && userId),
    staleTime: 30_000,
    retry: false,
  });
}

export function useUpdateVocabularyState() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ wordId, update }: { wordId: string; update: VocabularyStateUpdate }) => {
      const token = await getToken();
      if (!token) throw new Error("Your session expired. Please sign in again.");
      return updateVocabularyState(token, wordId, update);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<{ data: typeof saved[] }>(key(userId), (current) => ({
        data: [saved, ...(current?.data ?? []).filter((item) => item.word_id !== saved.word_id)],
      }));
    },
  });
}
