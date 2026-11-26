import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pressable, View } from "react-native";
import { getDashboard, type DashboardSummary } from "@/lib/api/dashboard";
import { getLearningPath, getProgress } from "@/lib/api/learning";
import { getSpacedReviews } from "@/lib/api/reviews";
import { getQuests } from "@/lib/api/quests";
import { getWordCategories, getWords } from "@/lib/api/words";
import { learningLanguages, type LearningLanguage } from "@/lib/languages";
import { studyWeek } from "@/lib/weekly-streak";
import { characterForQuest } from "@/lib/character-cast";
import type { ApiToken } from "./api";
import { Character } from "./Character";
import { HomeScreen } from "./HomeScreen";
import { LearnScreen } from "./LearnScreen";
import { Button, Card, Copy, grow, Heading, Icon, Label, Loading, PageHeading, Press, Problem, Progress, row, Title, usePalette } from "./ui";

export type Course = { token: ApiToken; language: LearningLanguage };
export const topicName = (category: string) => category.replace(/[_-]/g, " ").replace(/^./, (first) => first.toUpperCase());

export function WordGoal({ data }: { data: DashboardSummary }) {
  const remaining = Math.max(0, data.daily_word_goal - data.words_learned_today);
  return <View style={{ gap: 6 }}>
    <Heading>Today’s word goal</Heading>
    <Label size={30} strong style={{ fontVariant: ["tabular-nums"] }}>
      {data.words_learned_today} <Label size={14} muted>/ {data.daily_word_goal} words</Label>
    </Label>
    <Progress value={data.words_learned_today} total={data.daily_word_goal} label="Today’s word goal" />
    <Label size={13} muted>{remaining ? `${remaining} more ${remaining === 1 ? "word" : "words"} to reach your goal.` : "Today’s goal reached. Nicely done."}</Label>
  </View>;
}

export function Streak({ data, onProfile }: { data: DashboardSummary; onProfile: () => void }) {
  const color = usePalette();
  const week = studyWeek(data.weekly_activity);
  return <View style={{ borderTopWidth: 1, borderColor: color.line, paddingTop: 14, gap: 9 }}>
    <View style={row}>
      <View style={grow}><Heading>Study streak</Heading></View>
      <Button kind="quiet" title="Activity" icon="arrow" onPress={onProfile} style={{ paddingHorizontal: 0 }} />
    </View>
    <Label size={24} strong>{data.streak_days} <Label muted size={14}>{data.streak_days === 1 ? "day" : "days"}</Label></Label>
    {week.length > 0 && <View style={[row, { justifyContent: "space-between", gap: 4 }]}>
      {week.map((day) => <View key={day.date} accessible accessibilityLabel={`${day.fullLabel}: ${day.state === "studied" ? "studied" : day.state === "upcoming" ? "upcoming" : "no study recorded"}`}
        style={{ flex: 1, alignItems: "center", gap: 7 }}>
        <Label size={11} muted strong={day.isToday}>{day.label}</Label>
        <View style={{ width: 14, height: 14, marginVertical: 4, borderRadius: 2, borderWidth: day.isToday ? 2 : 1,
          opacity: day.state === "upcoming" ? 0.55 : 1, transform: [{ rotate: "45deg" }],
          borderColor: day.isToday ? color.gold : day.state === "studied" ? color.ink : color.line,
          backgroundColor: day.state === "studied" ? (day.isToday ? color.gold : color.ink) : color.tint }} />
      </View>)}
    </View>}
  </View>;
}

export function Home({ token, language, openLesson, goLearn, goReview, goProfile, openDictionary, goQuest }: Course & {
  openLesson: (id: string) => void; goLearn: () => void; goReview: () => void; goProfile: () => void; goQuest: () => void;
  openDictionary: (topic?: string) => void;
}) {
  const dashboard = useQuery({ queryKey: ["dashboard", language], queryFn: ({ signal }) => getDashboard(token, language, signal) });
  const topics = useQuery({ queryKey: ["categories", language], queryFn: ({ signal }) => getWordCategories(language, signal), staleTime: 300_000 });
  const quiz = useQuery({ queryKey: ["spaced", language], queryFn: ({ signal }) => getSpacedReviews(token, language, signal) });
  const quests = useQuery({ queryKey: ["quests", language], queryFn: ({ signal }) => getQuests(token, language, signal) });
  const word = useQuery({ queryKey: ["daily-word", language], staleTime: 60 * 60_000, queryFn: async ({ signal }) => {
    const result = await getWords({ language_code: language, audio_available: true, page_size: 100 }, signal);
    const available = result.data.filter((item) => item.audio.available && item.audio.url);
    const day = Number(new Date().toISOString().slice(0, 10).replaceAll("-", ""));
    return available[day % available.length] ?? null;
  } });
  if (dashboard.isPending) return <Loading label="Loading your dashboard" />;
  if (dashboard.error || !dashboard.data) return <Problem error={dashboard.error} retry={() => void dashboard.refetch()} />;
  const nextQuest = quests.data?.quests.find((item) => !item.state?.completed);
  const cast = nextQuest && characterForQuest(language, nextQuest.id, nextQuest.character);
  return <HomeScreen data={dashboard.data} language={language}
    word={{ data: word.data, pending: word.isPending, error: word.error, retry: () => void word.refetch() }}
    topics={{ data: topics.data?.data, pending: topics.isPending, error: topics.error, retry: () => void topics.refetch() }}
    quiz={{ data: quiz.data, pending: quiz.isPending, error: quiz.error, retry: () => void quiz.refetch() }}
    quest={nextQuest && cast ? { id: nextQuest.id, title: nextQuest.title, locked: nextQuest.locked,
      missingWords: nextQuest.missing_words.length, name: cast.name } : undefined}
    openLesson={openLesson} goLearn={goLearn} goReview={goReview} goProfile={goProfile}
    openDictionary={openDictionary} goQuest={goQuest} />;
}

export function Learn({ token, language, openLesson, goReview, goQuest }: Course & { openLesson: (id: string) => void; goReview: () => void; goDictionary: () => void; goQuest: () => void }) {
  const path = useQuery({ queryKey: ["path", language], queryFn: ({ signal }) => getLearningPath(language, signal) });
  const progress = useQuery({ queryKey: ["progress", language], queryFn: ({ signal }) => getProgress(token, language, signal) });
  if (path.isPending || progress.isPending) return <Loading label="Loading your learning path" />;
  if (path.error || progress.error || !path.data || !progress.data) return <Problem error={path.error ?? progress.error} retry={() => { void path.refetch(); void progress.refetch(); }} />;
  return <LearnScreen path={path.data} progress={progress.data} openLesson={openLesson} goReview={goReview} goQuest={goQuest} />;
}
