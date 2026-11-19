import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AccessibilityInfo, Animated, Text, View } from "react-native";
import type { ApiToken } from "./api";
import {
  checkpointLesson, completeLesson, getLessonAttempt, getLessonWords, getProgress,
  saveLessonAnswer, startLesson, type LessonAttempt,
} from "@/lib/api/learning";
import { completeReview, getReviews, getSpacedReviews, saveReviewAnswer, startReview, type ReviewSession } from "@/lib/api/reviews";
import type { LearningLanguage } from "@/lib/languages";
import { Audio, Button, Card, Copy, Loading, Problem, Title, usePalette } from "./ui";

type Course = { token: ApiToken; language: LearningLanguage };
type Choice = { id: string; meaning: string; amharic: string | null };

function choicesFor(target: Choice, pool: Choice[]) {
  const used = new Set([target.meaning.toLowerCase()]);
  const choices = [target];
  for (const word of pool) {
    if (word.id === target.id) continue;
    const meaning = word.meaning.toLowerCase();
    if (used.has(meaning)) continue;
    used.add(meaning);
    choices.push(word);
    if (choices.length === 4) break;
  }
  return choices.sort((a, b) => a.id.localeCompare(b.id));
}

function Word({ text, audio }: { text: string; audio?: string | null }) {
  const color = usePalette();
  return <>
    <Text selectable style={{ color: color.ink, fontWeight: "700", fontSize: 38, textAlign: "center", paddingVertical: 18 }}>{text}</Text>
    {audio ? <Audio key={audio} url={audio} /> : <Copy>Pronunciation audio unavailable.</Copy>}
  </>;
}

function StudyCard({ children }: { children: React.ReactNode }) {
  const position = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let mounted = true;
      void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!mounted || reduced) return;
      position.setValue(12);
      Animated.spring(position, { toValue: 0, useNativeDriver: true, speed: 24, bounciness: 0 }).start();
    });
    return () => { mounted = false; position.stopAnimation(); };
  }, [position]);
  return <Animated.View style={{ transform: [{ translateX: position }] }}><Card>{children}</Card></Animated.View>;
}

export function Lesson({ token, language, lessonId, back }: Course & { lessonId: string; back: () => void }) {
  const client = useQueryClient();
  const key = ["attempt", lessonId];
  const lesson = useQuery({ queryKey: ["lesson", language, lessonId], queryFn: ({ signal }) => getLessonWords(lessonId, language, signal) });
  const progress = useQuery({ queryKey: ["progress", language], queryFn: ({ signal }) => getProgress(token, language, signal) });
  const attemptQuery = useQuery({ queryKey: key, queryFn: ({ signal }) => getLessonAttempt(token, lessonId, signal) });
  const [finished, setFinished] = useState<LessonAttempt>();
  const [feedback, setFeedback] = useState<string>();
  const [revealed, setRevealed] = useState(false);
  const save = useMutation({
    mutationFn: (action: () => Promise<LessonAttempt>) => action(),
    onSuccess: (result) => {
      client.setQueryData(key, result.status === "completed" ? null : result);
      if (result.status === "completed") {
        setFinished(result);
        void client.invalidateQueries({ queryKey: ["progress"] });
        void client.invalidateQueries({ queryKey: ["dashboard"] });
        void client.invalidateQueries({ queryKey: ["reviews"] });
        void client.invalidateQueries({ queryKey: ["spaced"] });
      }
    },
  });
  if (lesson.isPending || progress.isPending || attemptQuery.isPending) return <Loading />;
  const error = lesson.error ?? progress.error ?? attemptQuery.error;
  if (error) return <Problem error={error} retry={() => { void lesson.refetch(); void progress.refetch(); void attemptQuery.refetch(); }} />;
  const data = lesson.data;
  if (!data?.words.length || !progress.data) return <Copy>This lesson has no words ready yet.</Copy>;
  const attempt = attemptQuery.data;
  const practiced = new Set(progress.data.practiced_word_ids_by_lesson[lessonId] ?? []);
  const answered = new Set(attempt?.answers.map((answer) => answer.question_id));
  const outstanding = data.words.filter((word) => !practiced.has(word.id) || answered.has(word.id));
  const words = outstanding.length ? outstanding : data.words;
  const size = Math.min(10, words.length);
  const session = words.slice(0, attempt?.question_count ?? size);
  const title = data.lesson.category.replaceAll("_", " ");
  const move = (stage: "vocabulary" | "practice", index: number) => {
    if (!attempt) return;
    save.mutate(() => checkpointLesson(token, attempt.id, stage, index), { onSuccess: () => setRevealed(false) });
  };
  if (finished) return <Card>
    <Title>Session saved</Title>
    <Copy>{finished.correct_count} of {finished.answers.length} correct.</Copy>
    <Button title="Back to Learn" onPress={back} primary />
  </Card>;
  if (!attempt) return <Card>
    <Title>{title}</Title>
    <Copy>{size} words in this session</Copy>
    {save.error && <Problem error={save.error} />}
    <Button title="Start flashcards" primary disabled={save.isPending} onPress={() => save.mutate(() => startLesson(token, lessonId, {
      difficulty: data.lesson.difficulty ?? "beginner", category_key: data.lesson.category,
      category_label: title, question_count: size,
    }))} />
  </Card>;

  const choice = (word: typeof words[number]): Choice => ({
    id: word.id,
    meaning: word.translations.find((entry) => entry.language_code === "en")?.meaning ?? word.meaning ?? word.text,
    amharic: word.translations.find((entry) => entry.language_code === "am")?.meaning ?? null,
  });
  const practice = attempt.stage === "practice";
  const index = practice ? session.findIndex((word) => !answered.has(word.id)) : Math.min(attempt.question_index, session.length - 1);
  const word = session[index];
  if (!word) return <Card>
    <Title>Finish this session</Title>
    {save.error && <Problem error={save.error} />}
    <Button title="Save session" onPress={() => save.mutate(() => completeLesson(token, attempt.id))} primary disabled={save.isPending} />
  </Card>;
  const target = choice(word);
  return <>
    <Title>{practice ? "Practise" : "Flashcards"}</Title>
    <Copy>{title} · {practice ? answered.size + 1 : index + 1} of {session.length}</Copy>
    <StudyCard key={word.id}>
      <Word key={word.id} text={word.text} audio={word.audio?.available ? word.audio.url : null} />
      {!practice && word.transliteration && <Copy>{word.transliteration}</Copy>}
      {!practice && revealed && <><Copy>{target.meaning}</Copy>{target.amharic && <Copy>{target.amharic}</Copy>}</>}
      {!practice && !revealed && <Button title="Show meaning" onPress={() => setRevealed(true)} />}
    </StudyCard>
    {save.error && <Problem error={save.error} />}
    {practice ? <>
      {feedback && <Copy>{feedback}</Copy>}
      <Copy>Choose the meaning.</Copy>
      {choicesFor(target, data.words.map(choice)).map((option) =>
        <Button key={option.id} title={option.amharic ? `${option.meaning} · ${option.amharic}` : option.meaning}
          disabled={save.isPending} onPress={() => save.mutate(() => saveLessonAnswer(token, attempt.id, {
            question_id: word.id, word_id: word.id, selected_word_id: option.id, question_index: index,
          }), { onSuccess: () => setFeedback(option.id === word.id ? "Correct." : `${word.text} means ${target.meaning}.`) })} />)}
    </> : <View style={{ gap: 8 }}>
      <Button title={index < session.length - 1 ? "Next word" : "Start practice"} primary disabled={save.isPending || !revealed}
        onPress={() => index < session.length - 1 ? move("vocabulary", index + 1) : move("practice", 0)} />
      {index > 0 && <Button title="Previous word" disabled={save.isPending} onPress={() => move("vocabulary", index - 1)} />}
    </View>}
  </>;
}

export function Review({ token, language }: Course) {
  const client = useQueryClient();
  const overview = useQuery({ queryKey: ["reviews", language], queryFn: ({ signal }) => getReviews(token, language, signal) });
  const spaced = useQuery({ queryKey: ["spaced", language], queryFn: ({ signal }) => getSpacedReviews(token, language, signal) });
  const [session, setSession] = useState<ReviewSession>();
  const [feedback, setFeedback] = useState<string>();
  const save = useMutation({
    mutationFn: (action: () => Promise<ReviewSession>) => action(),
    onSuccess: (result) => {
      setSession(result);
      if (result.status === "completed") {
        void client.invalidateQueries({ queryKey: ["reviews", language] });
        void client.invalidateQueries({ queryKey: ["spaced", language] });
        void client.invalidateQueries({ queryKey: ["dashboard", language] });
      }
    },
  });
  if (overview.isPending || spaced.isPending) return <Loading />;
  const active = session ?? overview.data?.active_session ?? spaced.data?.active_session;
  const word = active?.words.find((candidate) => !active.answers.some((answer) => answer.word_id === candidate.id));
  return <>
    <Title>Review</Title>
    {(overview.error || spaced.error) && <Problem error={overview.error ?? spaced.error} retry={() => { void overview.refetch(); void spaced.refetch(); }} />}
    {save.error && <Problem error={save.error} />}
    {active?.status === "completed" ? <Card>
      <Copy>Review saved. {active.correct_count} of {active.total_count} correct.</Copy>
      <Button title="Back to review" onPress={() => { setFeedback(undefined); setSession(undefined); }} />
    </Card> : active ? word ? <>
      <Copy>{active.answers.length + 1} of {active.total_count}</Copy>
      <Card><Word key={word.id} text={word.text} audio={word.audio_url} /></Card>
      {feedback && <Copy>{feedback}</Copy>}
      {choicesFor(word, active.choice_words.length ? active.choice_words : active.words).map((option) =>
        <Button key={option.id} title={option.amharic ? `${option.meaning} · ${option.amharic}` : option.meaning} disabled={save.isPending}
          onPress={() => save.mutate(() => saveReviewAnswer(token, active.id, word.id, option.id), {
            onSuccess: () => setFeedback(option.id === word.id ? "Correct." : `${word.text} means ${word.meaning}.`),
          })} />)}
    </> : <Button title="Finish review" primary disabled={save.isPending} onPress={() => save.mutate(() => completeReview(token, active.id))} /> : <>
      <Card><Copy>{spaced.data?.due_count ?? 0} words due for a quiz</Copy>
        <Button title="Start quiz" primary disabled={save.isPending || !spaced.data?.due_count}
          onPress={() => save.mutate(() => startReview(token, "spaced", language))} />
      </Card>
      <Card><Copy>{overview.data?.queue.length ?? 0} words flagged for review</Copy>
        <Button title="Practise flagged words" disabled={save.isPending || !overview.data?.queue.length}
          onPress={() => save.mutate(() => startReview(token, "manual", language))} />
      </Card>
    </>}
  </>;
}
