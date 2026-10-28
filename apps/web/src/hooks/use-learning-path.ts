import { useQuery } from "@tanstack/react-query";
import { getLearningPath } from "@/lib/api/learning";

export function useLearningPath(languageCode: string) {
  return useQuery({
    queryKey: ["learning-path", languageCode],
    queryFn: ({ signal }) => getLearningPath(languageCode, signal),
    staleTime: 5 * 60 * 1000,
  });
}
