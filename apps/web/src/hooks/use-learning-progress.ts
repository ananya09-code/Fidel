import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";

import { getLessonAttempt, getProgress } from "@/lib/api/learning";
import { usePreferences } from "@/hooks/use-preferences";
import type { LearningLanguage } from "@/lib/languages";

export const learningProgressKeys = {
  all: (userId: string | null | undefined, languageCode: string) =>
    ["auth", "learning-progress", userId ?? "signed-out", languageCode] as const,
  lesson: (userId: string | null | undefined, lessonKey: string) =>
    ["auth", "learning-progress", userId ?? "signed-out", lessonKey] as const,
};

export function useLearningProgress(course?: LearningLanguage) {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const preferences = usePreferences();
  const languageCode = course ?? preferences.data?.learning_language;
  return useQuery({
    queryKey: learningProgressKeys.all(userId, languageCode ?? "unselected"),
    queryFn: async ({ signal }) => {
      return getProgress(getToken, languageCode!, signal);
    },
    enabled: isLoaded && Boolean(isSignedIn && userId && languageCode), staleTime: 30_000, retry: false,
  });
}

export function useLessonProgress(lessonKey: string) {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  return useQuery({
    queryKey: learningProgressKeys.lesson(userId, lessonKey),
    queryFn: async ({ signal }) => {
      return getLessonAttempt(getToken, lessonKey, signal);
    },
    enabled: isLoaded && Boolean(isSignedIn && userId && lessonKey),
    staleTime: 30_000, retry: false,
  });
}
