import { useQuery } from "@tanstack/react-query";
import { getWords, type GetWordsParams } from "@/lib/api/words";

export function useWords(params: GetWordsParams = {}) {
  return useQuery({
    queryKey: ["words", params],
    queryFn: ({ signal }) => getWords(params, signal),
  });
}
