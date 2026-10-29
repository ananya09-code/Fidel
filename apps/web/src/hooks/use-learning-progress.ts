import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";

import { getLessonAttempt, getProgress } from "@/lib/api/learning";

export const learningProgressKeys = {
  all: (userId: string | null | undefined) =>
    ["auth", "learning-progress", userId ?? "signed-out"] as const,
  lesson: (userId: string | null | undefined, lessonKey: string) =>
    ["auth", "learning-progress", userId ?? "signed-out", lessonKey] as const,
};

export function useLearningProgress() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  return useQuery({
    queryKey: learningProgressKeys.all(userId),
    queryFn: async ({ signal }) => {
      const token = await getToken();
      if (!token) throw new Error("Your session expired. Please sign in again.");
      return getProgress(token, signal);
    },
    enabled: isLoaded && Boolean(isSignedIn && userId), staleTime: 30_000, retry: false,
  });
}

export function useLessonProgress(lessonKey: string) {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  return useQuery({
    queryKey: learningProgressKeys.lesson(userId, lessonKey),
    queryFn: async ({ signal }) => {
      const token = await getToken();
      if (!token) throw new Error("Your session expired. Please sign in again.");
      return getLessonAttempt(token, lessonKey, signal);
    },
    enabled: isLoaded && Boolean(isSignedIn && userId && lessonKey),
    staleTime: 30_000, retry: false,
  });
}
