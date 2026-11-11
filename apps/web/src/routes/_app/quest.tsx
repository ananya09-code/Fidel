import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageState } from "@/components/common-ui/PageState";
import { QuestExperience } from "@/components/quest-ui/QuestExperience";
import { usePreferences } from "@/hooks/use-preferences";
import { getQuests, startQuest, replyToQuest } from "@/lib/api/quests";
import type { LearningLanguage } from "@/lib/languages";

export const Route = createFileRoute("/_app/quest")({ component: QuestPage });

function QuestPage() {
  const preferences = usePreferences();
  const { userId } = useAuth();
  if (preferences.isPending)
    return (
      <div className="app-page-frame">
        <PageState kind="loading" title="Opening Fidel Quest" />
      </div>
    );
  if (preferences.isError || !preferences.data)
    return (
      <div className="app-page-frame">
        <h1>Fidel Quest</h1>
        <PageState
          kind="error"
          title="Couldn't load your language"
          description={preferences.error?.message}
          actionLabel="Try again"
          onAction={() => void preferences.refetch()}
        />
      </div>
    );
  return (
    <QuestWithVocabulary
      key={`${userId}:${preferences.data.learning_language}`}
      initialLanguage={preferences.data.learning_language}
    />
  );
}

function QuestWithVocabulary({
  initialLanguage,
}: {
  initialLanguage: LearningLanguage;
}) {
  const { userId, getToken } = useAuth();
  const [language, setLanguage] = useState(initialLanguage);
  const quests = useQuery({
    queryKey: ["auth", "quests", userId, language],
    queryFn: ({ signal }) => getQuests(getToken, language, signal),
    enabled: Boolean(userId),
    staleTime: 30_000,
    retry: false,
  });
  if (quests.isPending)
    return <PageState kind="loading" title="Opening your adventures" />;
  if (quests.isError || !quests.data)
    return (
      <PageState
        kind="error"
        title="Couldn't load your adventures"
        description={quests.error?.message}
        actionLabel="Try again"
        onAction={() => void quests.refetch()}
      />
    );
  return (
    <QuestExperience
      key={`${userId}:${language}`}
      overview={quests.data}
      onLanguage={setLanguage}
      onStart={async (key) => {
        const state = await startQuest(getToken, language, key);
        await quests.refetch();
        return state;
      }}
      onReply={async (key, reply) => {
        const result = await replyToQuest(getToken, language, key, reply);
        await quests.refetch();
        return result;
      }}
      onRefresh={() => void quests.refetch()}
    />
  );
}
