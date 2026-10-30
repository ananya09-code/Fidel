import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getWordCategories,
  getWords,
  type GetWordsParams,
} from "@/lib/api/words";

export function useWords(params: GetWordsParams = {}) {
  return useQuery({
    queryKey: ["words", params],
    queryFn: ({ signal }) => getWords(params, signal),
  });
}

export function useInfiniteWords(params: Omit<GetWordsParams, "page"> = {}) {
  return useInfiniteQuery({
    queryKey: ["words", "infinite", params],
    queryFn: ({ pageParam, signal }) =>
      getWords({ ...params, page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.pagination.has_next
        ? lastPage.meta.pagination.page + 1
        : undefined,
  });
}

export function useWordCategories(languageCode: string) {
  return useQuery({
    queryKey: ["words", "categories", languageCode],
    queryFn: ({ signal }) => getWordCategories(languageCode, signal),
    staleTime: 5 * 60_000,
  });
}

export function useDailyWord(languageCode: string) {
  return useQuery({
    queryKey: ["words", "daily", languageCode],
    queryFn: async ({ signal }) => {
      const response = await getWords(
        { language_code: languageCode, audio_available: true, page_size: 100 },
        signal,
      );
      const candidates = response.data.filter(
        (word) => word.audio.available && word.audio.url,
      );
      if (candidates.length === 0) return null;

      const dayKey = new Date().toISOString().slice(0, 10);
      const dayNumber = Number(dayKey.replaceAll("-", ""));
      return candidates[dayNumber % candidates.length];
    },
    staleTime: 60 * 60_000,
  });
}
