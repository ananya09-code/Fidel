import { useQuery } from "@tanstack/react-query";
import { getWords, type GetWordsParams } from "@/services/word";

export function useWords(params: GetWordsParams = {}) {
  return useQuery({
    queryKey: ["words", params],
    queryFn: ({ signal }) => getWords(params, signal),
  });
}
