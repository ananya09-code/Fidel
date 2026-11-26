import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AccessibilityInfo, Animated, Easing, PanResponder, View } from "react-native";
import {
  checkpointLesson, completeLesson, getLessonAttempt, getLessonWords, getProgress,
  saveLessonAnswer, startLesson, type LessonAttempt,
} from "@/lib/api/learning";
import { completeReview, getReviews, getSpacedReviews, saveReviewAnswer, startReview, type ReviewSession } from "@/lib/api/reviews";
import { topicName, type Course } from "./LearnerScreens";
import { listeningIndices, matchingIndices, shuffleExercise } from "../../web/src/components/learn-ui/lesson/exercise-plan";
import { sentenceAfterWord } from "../../web/src/components/learn-ui/lesson/sentence-plan";
import { getSentenceExercises, type SentenceExercise } from "@/lib/api/sentences";
import { MatchingRound } from "./MatchingRound";
import { SentenceRound } from "./SentenceRound";
import { useFeedback } from "./feedback";
import { Audio, Button, Card, Copy, grow, Heading, Icon, Label, Loading, PageHeading, Press, Problem, Progress, row, Teacher, usePalette, WordText } from "./ui";

type Choice = { id: string; meaning: string; amharic: string | null };
type Feedback = { correct: boolean; word: string; meaning: string; amharic: string | null };

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

function Word({ text, audio, pronunciation, showAudio = true }: { text: string; audio?: string | null; pronunciation?: string | null; showAudio?: boolean }) {
  return <View style={{ gap: 2, alignItems: "center" }}>
    <WordText size={35} style={{ textAlign: "center" }}>{text}</WordText>
    {pronunciation && <Label muted size={14} style={{ textAlign: "center" }}>{pronunciation}</Label>}
    {showAudio && (audio ? <Audio key={audio} url={audio} compact label={text} /> : <Label muted size={12}>No approved recording yet.</Label>)}
  </View>;
}

function StudyCard({ children, transitionKey, direction, previous, next }: {
  children: React.ReactNode; transitionKey: string; direction: number; previous?: () => void; next?: () => void;
}) {
  const position = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const previousKey = useRef(transitionKey);
  const reduced = useRef(true);
  useEffect(() => {
    let mounted = true;
    const update = (value: boolean) => { reduced.current = value; if (value) { position.setValue(0); opacity.setValue(1); } };
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", update);
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (!mounted) return;
      update(value);
    });
    return () => { mounted = false; sub.remove(); position.stopAnimation(); opacity.stopAnimation(); };
  }, [position, opacity]);
  useEffect(() => {
    if (previousKey.current === transitionKey) return;
    previousKey.current = transitionKey;
    if (reduced.current) { position.setValue(0); opacity.setValue(1); return; }
    position.setValue(direction * 90);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(position, { toValue: 0, duration: 440, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [transitionKey, direction, position, opacity]);
  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => !!(previous || next) && Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
    onPanResponderMove: (_, gesture) => { if (!reduced.current) position.setValue(Math.max(-150, Math.min(150, gesture.dx * 0.8))); },
    onPanResponderRelease: (_, gesture) => {
      if (!reduced.current) Animated.timing(position, { toValue: 0, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      if (gesture.dx < -55) next?.();
      if (gesture.dx > 55) previous?.();
    },
    onPanResponderTerminate: () => position.setValue(0),
  });
  return <Animated.View {...pan.panHandlers} style={{ opacity, transform: [{ translateX: position },
    { rotate: position.interpolate({ inputRange: [-260, 0, 260], outputRange: ["-2deg", "0deg", "2deg"] }) }] }}>
    <Card style={{ minHeight: 380, justifyContent: "center", paddingHorizontal: 20, gap: 20, borderRadius: 16 }}>{children}</Card>
  </Animated.View>;
}

function Meanings({ meaning, amharic }: Pick<Choice, "meaning" | "amharic">) {
  const color = usePalette();
  return <View style={{ flexDirection: "row", gap: 16, alignItems: "flex-start", marginTop: 10 }}>
    <View style={grow}><Label muted size={12}>Amharic</Label><WordText size={18}>{amharic ?? "Translation unavailable"}</WordText></View>
    <View style={[grow, { borderLeftWidth: 1, borderColor: color.line, paddingLeft: 16 }]}>
      <Label muted size={12}>English</Label><Label strong size={18}>{meaning}</Label>
    </View>
  </View>;
}

function Status({ feedback }: { feedback: Feedback }) {
  const color = usePalette();
  return <View accessibilityLiveRegion="polite"><Card style={{ backgroundColor: feedback.correct ? color.tint : color.errorBg }}>
    <View style={row}><Teacher size={33} /><View style={grow}>
      <Label strong style={{ color: feedback.correct ? color.success : color.error }}>
        {feedback.correct ? "That’s right." : `${feedback.word} means ${feedback.meaning}.`}
      </Label>
      {!feedback.correct && feedback.amharic && <WordText size={13}>{feedback.amharic}</WordText>}
    </View></View>
  </Card></View>;
}

function Choices({ options, pending, choose, mode = "word", answered = false, correctId, selectedId }: {
  options: (Choice & { text?: string })[]; pending: boolean; choose: (option: Choice) => void;
  mode?: "word" | "meaning"; answered?: boolean; correctId?: string; selectedId?: string;
}) {
  const color = usePalette();
  return <View style={{ gap: 8 }}>
    <Heading>{mode === "meaning" ? "Choose the meaning you heard" : "Choose the matching word"}</Heading>
    {options.map((option, index) => <Press key={option.id} onPress={() => choose(option)} disabled={pending} dimDisabled={!answered}
      label={mode === "meaning" ? `${option.meaning}, ${option.amharic ?? "Amharic translation unavailable"}` : option.text ?? option.id}
      style={[row, { minHeight: 58, borderWidth: 1, borderColor: answered && option.id === correctId ? color.success : answered && option.id === selectedId ? color.error : color.line,
        borderRadius: 8, backgroundColor: answered && option.id === correctId ? color.tint : answered && option.id === selectedId ? color.errorBg : color.panel, padding: 12 }]}>
      <Label muted size={12}>{String.fromCharCode(65 + index)}</Label>
      <View style={grow}>{mode === "meaning" ? <><Label strong>{option.meaning}</Label><WordText size={13}>{option.amharic ?? "Translation unavailable"}</WordText></> : <WordText size={19}>{option.text ?? option.id}</WordText>}</View>
      {answered && option.id === correctId && <Icon name="check" size={17} tint={color.success} />}
      {answered && option.id === selectedId && selectedId !== correctId && <Icon name="close" size={17} tint={color.error} />}
    </Press>)}
  </View>;
}

function StudyHeader({ title, detail, value, total }: { title: string; detail?: string; value: number; total: number }) {
  return <View style={{ gap: 8 }}>
    <View style={row}><View style={grow}><PageHeading title={title} detail={detail} /></View><Label muted size={13} strong>{value}/{total}</Label></View>
    <Progress label={title + " progress"} value={value} total={total} />
  </View>;
}

export function Lesson({ token, language, lessonId, back, onStepChange }: Course & { lessonId: string; back: () => void; onStepChange: () => void }) {
  const color = usePalette();
  const playFeedback = useFeedback();
  const client = useQueryClient();
  const key = ["attempt", lessonId];
  const lesson = useQuery({ queryKey: ["lesson", language, lessonId], queryFn: ({ signal }) => getLessonWords(lessonId, language, signal) });
  const progress = useQuery({ queryKey: ["progress", language], queryFn: ({ signal }) => getProgress(token, language, signal) });
  const attemptQuery = useQuery({ queryKey: key, queryFn: ({ signal }) => getLessonAttempt(token, lessonId, signal) });
  const [finished, setFinished] = useState<LessonAttempt>();
  const [feedback, setFeedback] = useState<Feedback>();
  const [wordLimit, setWordLimit] = useState(10);
  const [cardIndex, setCardIndex] = useState<number>();
  const [motion, setMotion] = useState(0);
  const [heldIndex, setHeldIndex] = useState<number>();
  const [selectedId, setSelectedId] = useState<string>();
  const [matchingStarted, setMatchingStarted] = useState(false);
  const [matchingDismissed, setMatchingDismissed] = useState(false);
  const [readInstead, setReadInstead] = useState<string>();
  const [nextSentence, setNextSentence] = useState<SentenceExercise>();
  const [showSentence, setShowSentence] = useState(false);
  const [sentenceLoading, setSentenceLoading] = useState(false);
  const shownSentences = useRef(new Set<string>());
  const save = useMutation({
    mutationFn: (action: () => Promise<LessonAttempt>) => action(),
    onSuccess: (result) => {
      client.setQueryData(key, result.status === "completed" ? null : result);
      if (result.status === "completed") {
        void playFeedback("complete");
        setFinished(result);
        void client.invalidateQueries({ queryKey: ["progress"] });
        void client.invalidateQueries({ queryKey: ["dashboard"] });
        void client.invalidateQueries({ queryKey: ["reviews"] });
        void client.invalidateQueries({ queryKey: ["spaced"] });
        void client.invalidateQueries({ queryKey: ["vocabulary", language] });
      }
    },
  });
  if (finished) return <Card style={{ backgroundColor: color.tint, alignItems: "flex-start" }}>
    <Teacher /><PageHeading title="Session saved" detail={`${finished.correct_count} of ${finished.answers.length} correct.`} />
    <Button title="Back to Learn" onPress={back} primary icon="arrow" style={{ alignSelf: "stretch" }} />
  </Card>;
  if (lesson.isPending || progress.isPending || attemptQuery.isPending) return <Loading label="Loading lesson" />;
  const error = lesson.error ?? progress.error ?? attemptQuery.error;
  if (error) return <Problem error={error} retry={() => { void lesson.refetch(); void progress.refetch(); void attemptQuery.refetch(); }} />;
  const data = lesson.data;
  if (!data?.words.length || !progress.data) return <Card><Heading>No words yet</Heading><Copy>This lesson has no words ready yet.</Copy><Button title="Back to Learn" onPress={back} /></Card>;
  const attempt = attemptQuery.data;
  const practiced = new Set(progress.data.practiced_word_ids_by_lesson[lessonId] ?? []);
  const answered = new Set(attempt?.answers.map((answer) => answer.question_id));
  const outstanding = data.words.filter((word) => !practiced.has(word.id) || answered.has(word.id));
  const words = outstanding.length ? outstanding : data.words;
  const size = Math.min(wordLimit, words.length);
  const session = words.slice(0, attempt?.question_count ?? size);
  const title = topicName(data.lesson.category);
  const move = (stage: "vocabulary" | "practice", index: number) => {
    if (!attempt || save.isPending) return;
    save.mutate(() => checkpointLesson(token, attempt.id, stage, index), { onSuccess: () => {
      setMotion(index < (cardIndex ?? attempt.question_index) && stage === "vocabulary" ? -1 : 1);
      if (stage === "vocabulary") setCardIndex(index);
      if (stage === "practice") onStepChange();
    } });
  };
  if (!attempt) return <Card style={{ backgroundColor: color.tint }}>
    <Teacher /><PageHeading title={title} detail="Meet the words, hear how they sound, then put your memory to work." />
    <Heading>Words in this session</Heading>
    <Copy>{words.length} {words.length === 1 ? "word" : "words"} available</Copy>
    <View style={row}>{Array.from(new Set([5, 10, 15, 20, Math.min(words.length, 20)])).filter((limit) => limit > 0 && limit <= words.length).sort((a,b) => a-b).map((limit) =>
      <Button key={limit} title={String(limit)} kind={size === limit ? "gold" : undefined}
        onPress={() => setWordLimit(limit)} style={{ flex: 1 }} />)}</View>
    {save.error && <Problem error={save.error} />}
    <Button title="Start learning" kind="gold" icon="arrow" busy={save.isPending} onPress={() => save.mutate(() => startLesson(token, lessonId, {
      difficulty: data.lesson.difficulty ?? "beginner", category_key: data.lesson.category,
      category_label: title, question_count: size,
    }), { onSuccess: onStepChange })} />
  </Card>;

  const choice = (word: typeof words[number]): Choice & { text: string } => ({
    id: word.id,
    text: word.text,
    meaning: word.translations.find((entry) => entry.language_code === "en")?.meaning ?? word.meaning ?? word.text,
    amharic: word.translations.find((entry) => entry.language_code === "am")?.meaning ?? null,
  });
  const practice = attempt.stage === "practice";
  const nextUnanswered = session.findIndex((word) => !answered.has(word.id));
  const index = practice ? heldIndex ?? nextUnanswered : Math.min(cardIndex ?? attempt.question_index, session.length - 1);
  const round = matchingIndices(session.map((item) => ({ id: item.id, word: item.text, meaning: choice(item).meaning })), "practice");
  const inRound = practice && (round.includes(index) || matchingStarted) && !matchingDismissed;
  const listening = practice && index >= 0 && listeningIndices(session.map((item) => ({ id: item.id, word: item.text, meaning: choice(item).meaning, audioUrl: item.audio?.available ? item.audio.url : null })), "practice").includes(index)
    && readInstead !== session[index]?.id;
  const word = session[index];
  if (showSentence && nextSentence) return <SentenceRound key={nextSentence.id} token={token} language={language} exercise={nextSentence}
    onContinue={() => { setShowSentence(false); setNextSentence(undefined); setHeldIndex(undefined); setSelectedId(undefined); setFeedback(undefined); onStepChange(); }} />;
  if (inRound) {
    const roundWords = round.map((position) => session[position]);
    const initialAnswers = Object.fromEntries(attempt.answers.filter((answer) => roundWords.some((item) => item.id === answer.question_id)).map((answer) => [answer.question_id, answer.is_correct]));
    return <>
      <StudyHeader title="Match the pairs" detail={title} value={attempt.answers.length} total={session.length} />
      <MatchingRound key={attempt.id + round.map((position) => session[position].id).join("|")} words={roundWords.map((item) => ({ ...choice(item), text: item.text }))}
        initialAnswers={initialAnswers}
        onAnswer={async (wordId, selectedWordId) => {
          setMatchingStarted(true);
          await save.mutateAsync(() => saveLessonAnswer(token, attempt.id, {
            question_id: wordId, word_id: wordId, selected_word_id: selectedWordId,
            question_index: session.findIndex((item) => item.id === wordId), question_type: "matching",
          }));
          onStepChange();
        }} onComplete={() => { setMatchingDismissed(true); setMatchingStarted(false); onStepChange(); }} />
    </>;
  }
  if (!word) return <>
    <StudyHeader title="Practise" detail={title} value={session.length} total={session.length} />
    {feedback && <Status feedback={feedback} />}
    <Card>
      <Heading>Finish this session</Heading>
      {save.error && <Problem error={save.error} />}
      <Button title="Save session" onPress={() => save.mutate(() => completeLesson(token, attempt.id), { onSuccess: onStepChange })} kind="gold" icon="check" busy={save.isPending} />
    </Card>
  </>;
  const target = choice(word);
  const previous = index > 0 && !save.isPending ? () => move("vocabulary", index - 1) : undefined;
  const next = !save.isPending ? () => index < session.length - 1 ? move("vocabulary", index + 1) : move("practice", 0) : undefined;
  return <>
    <StudyHeader title={practice ? "Practise" : "Flashcards"} detail={title} value={index + 1} total={session.length} />
    {practice ? <>
      {feedback && <Status feedback={feedback} />}
      {listening ? <Card style={{ backgroundColor: color.tint }}><Heading>Listening challenge</Heading>
        {word.audio?.available && word.audio.url ? <Audio key={word.id} url={word.audio.url} label={word.text} /> : <Copy>No approved recording yet.</Copy>}
        <Button kind="quiet" title="Read the word instead" onPress={() => setReadInstead(word.id)} />
      </Card> : <Card style={{ backgroundColor: color.tint }}><Heading>Find the matching word</Heading><Meanings {...target} /></Card>}
    </> : <StudyCard transitionKey={word.id} direction={motion} previous={previous} next={index < session.length - 1 ? next : undefined}>
      <Word text={word.text} pronunciation={word.transliteration} showAudio={false} />
      <Meanings {...target} />
      {word.translations.find((entry) => entry.language_code === "en")?.context_note &&
        <Label muted size={13} style={{ textAlign: "center" }}>{word.translations.find((entry) => entry.language_code === "en")?.context_note}</Label>}
      <View style={{ alignItems: "center" }}>{word.audio?.available && word.audio.url ?
        <Audio key={word.id} url={word.audio.url} label={word.text} /> : <Label muted size={12}>No approved recording yet.</Label>}</View>
    </StudyCard>}
    {save.error && <Problem error={save.error} />}
    {practice ? <>
      <Choices options={shuffleExercise(choicesFor(target, data.words.map(choice)), word.id + "-options")} mode={listening ? "meaning" : "word"}
        pending={save.isPending || answered.has(word.id)} answered={answered.has(word.id)} correctId={word.id} selectedId={selectedId}
        choose={(option) => save.mutate(() => saveLessonAnswer(token, attempt.id, {
          question_id: word.id, word_id: word.id, selected_word_id: option.id, question_index: index,
        }), { onSuccess: () => {
          setHeldIndex(index); setSelectedId(option.id); setFeedback({ correct: option.id === word.id, word: word.text, ...target });
          void playFeedback(option.id === word.id ? "correct" : "retry"); onStepChange();
          if (option.id === word.id) {
            setSentenceLoading(true);
            void getSentenceExercises(token, language).then((catalogue) => {
              const eligible = sentenceAfterWord(catalogue.exercises, word.id, shownSentences.current);
              if (eligible) { shownSentences.current.add(eligible.id); setNextSentence(eligible); }
            }).catch(() => undefined).finally(() => setSentenceLoading(false));
          }
        } })} />
      {answered.has(word.id) && <Button title={sentenceLoading ? "Checking sentence practice" : "Continue"} kind="gold" icon="arrow"
        busy={sentenceLoading} onPress={() => {
          if (nextSentence) { setShowSentence(true); setReadInstead(undefined); onStepChange(); return; }
          setHeldIndex(undefined); setSelectedId(undefined); setFeedback(undefined); setReadInstead(undefined); onStepChange();
        }} />}
    </> :
      <View style={row}>
        <Button title="Previous" icon="back" style={grow} disabled={!previous} onPress={() => previous?.()} />
        <Button title={index < session.length - 1 ? "Next word" : "Start practice"} kind="gold" icon="arrow"
          style={{ flex: 1.35 }} busy={save.isPending} disabled={!next} onPress={() => next?.()} />
      </View>}
  </>;
}

export function Review({ token, language, goLearn, goDictionary, onStepChange, startImmediately = false, onAutoStartHandled }: Course & {
  goLearn: () => void; goDictionary: () => void; onStepChange: () => void;
  startImmediately?: boolean; onAutoStartHandled: () => void;
}) {
  const color = usePalette();
  const playFeedback = useFeedback();
  const client = useQueryClient();
  const overview = useQuery({ queryKey: ["reviews", language], queryFn: ({ signal }) => getReviews(token, language, signal) });
  const spaced = useQuery({ queryKey: ["spaced", language], queryFn: ({ signal }) => getSpacedReviews(token, language, signal) });
  const [session, setSession] = useState<ReviewSession>();
  const [dismissed, setDismissed] = useState<string>();
  const [feedback, setFeedback] = useState<Feedback>();
  const [showAll, setShowAll] = useState(false);
  const [heldWordId, setHeldWordId] = useState<string>();
  const [selectedId, setSelectedId] = useState<string>();
  const [matchingStarted, setMatchingStarted] = useState(false);
  const [matchingDismissed, setMatchingDismissed] = useState(false);
  const [readInstead, setReadInstead] = useState<string>();
  const [reviewMode, setReviewMode] = useState<"manual" | "spaced">();
  const save = useMutation({
    mutationFn: (action: () => Promise<ReviewSession>) => action(),
    onSuccess: (result) => {
      setSession(result);
      onStepChange();
      if (result.status === "completed") {
        void playFeedback("complete");
        void client.invalidateQueries({ queryKey: ["reviews", language] });
        void client.invalidateQueries({ queryKey: ["spaced", language] });
        void client.invalidateQueries({ queryKey: ["dashboard", language] });
        void client.invalidateQueries({ queryKey: ["vocabulary", language] });
      }
    },
  });
  const active = session ?? [overview.data?.active_session, spaced.data?.active_session].find((item) => item && item.id !== dismissed);
  const isQuiz = reviewMode === "spaced" || (!!active && spaced.data?.active_session?.id === active.id);
  const nextWord = active?.words.find((candidate) => !active.answers.some((answer) => answer.word_id === candidate.id));
  const word = active?.words.find((candidate) => candidate.id === heldWordId) ?? nextWord;
  const wordIndex = word && active ? active.words.findIndex((candidate) => candidate.id === word.id) : -1;
  const round = active ? matchingIndices(active.words.map((item) => ({ id: item.id, word: item.text, meaning: item.meaning })), "quiz") : [];
  const inRound = !!active && !matchingDismissed && (round.includes(wordIndex) || matchingStarted);
  const listening = !!active && wordIndex >= 0 && listeningIndices(active.words.map((item) => ({ id: item.id, word: item.text, meaning: item.meaning, audioUrl: item.audio_url })), "quiz").includes(wordIndex)
    && readInstead !== word?.id;
  const queue = overview.data?.queue ?? [];
  const history = overview.data?.history ?? [];
  const due = spaced.data?.due_count ?? 0;
  useEffect(() => {
    if (active && spaced.data?.active_session?.id === active.id) setReviewMode("spaced");
  }, [active?.id, spaced.data?.active_session?.id]);
  useEffect(() => {
    if (!startImmediately || overview.isPending || spaced.isPending) return;
    onAutoStartHandled();
    if (!active && queue.length) { setReviewMode("manual"); save.mutate(() => startReview(token, "manual", language)); }
  }, [startImmediately, overview.isPending, spaced.isPending, active?.id, queue.length]);
  if (active?.status === "completed") return <Card style={{ backgroundColor: color.tint }}>
    <Teacher /><PageHeading title={isQuiz ? "Quiz saved" : "Review saved"} detail={`${active.correct_count} of ${active.total_count} correct.`} />
    <Button title="Back to review" primary onPress={() => { setDismissed(active.id); setFeedback(undefined); setSession(undefined); setReviewMode(undefined); onStepChange(); }} />
  </Card>;
  if (active && inRound) {
    const roundWords = round.map((position) => active.words[position]);
    const initialAnswers = Object.fromEntries(active.answers.filter((answer) => roundWords.some((item) => item.id === answer.word_id)).map((answer) => [answer.word_id, answer.is_correct]));
    return <>
      <StudyHeader title="Match the pairs" value={active.answers.length} total={active.total_count} />
      <MatchingRound key={active.id + round.map((position) => active.words[position].id).join("|")}
        words={roundWords.map((item) => ({ id: item.id, text: item.text, meaning: item.meaning, amharic: item.amharic }))}
        initialAnswers={initialAnswers}
        onAnswer={async (wordId, selectedWordId) => {
          setMatchingStarted(true);
          await save.mutateAsync(() => saveReviewAnswer(token, active.id, wordId, selectedWordId));
        }} onComplete={() => { setMatchingDismissed(true); setMatchingStarted(false); onStepChange(); }} />
    </>;
  }
  if (active) return <>
    <StudyHeader title={isQuiz ? "Quiz" : "Review"} value={Math.min(active.answers.length + 1, active.total_count)} total={active.total_count} />
    {feedback && <Status feedback={feedback} />}
    {save.error && <Problem error={save.error} />}
    {word ? <>
      {listening ? <Card style={{ backgroundColor: color.tint }}><Heading>Listening challenge</Heading>
        {word.audio_url ? <Audio key={word.id} url={word.audio_url} label={word.text} /> : <Copy>No approved recording yet.</Copy>}
        <Button kind="quiet" title="Read the word instead" onPress={() => setReadInstead(word.id)} />
      </Card> : <Card style={{ backgroundColor: color.tint }}><Heading>Choose the right word</Heading><Meanings meaning={word.meaning} amharic={word.amharic} /></Card>}
      <Choices options={shuffleExercise(choicesFor(word, active.choice_words.length ? active.choice_words : active.words), word.id + "-options")}
        mode={listening ? "meaning" : "word"} pending={save.isPending || active.answers.some((answer) => answer.word_id === word.id)}
        answered={active.answers.some((answer) => answer.word_id === word.id)} correctId={word.id} selectedId={selectedId}
        choose={(option) => save.mutate(() => saveReviewAnswer(token, active.id, word.id, option.id), {
          onSuccess: () => { setHeldWordId(word.id); setSelectedId(option.id); setFeedback({ correct: option.id === word.id, word: word.text, meaning: word.meaning, amharic: word.amharic }); void playFeedback(option.id === word.id ? "correct" : "retry"); },
        })} />
      {active.answers.some((answer) => answer.word_id === word.id) && <Button title="Continue" kind="gold" icon="arrow"
        onPress={() => { setHeldWordId(undefined); setSelectedId(undefined); setFeedback(undefined); setReadInstead(undefined); onStepChange(); }} />}
    </> : <Button title={isQuiz ? "Finish quiz" : "Finish review"} kind="gold" icon="check" busy={save.isPending} onPress={() => save.mutate(() => completeReview(token, active.id))} />}
  </>;
  return <>
    <PageHeading title="Review" detail="Bring familiar words back to mind." />
    {(overview.isPending || spaced.isPending) && <Loading label="Loading reviews and quizzes" />}
    {(overview.error || spaced.error) && <Problem error={overview.error ?? spaced.error} retry={() => { void overview.refetch(); void spaced.refetch(); }} />}
    {save.error && <Problem error={save.error} />}
    {!!overview.data && <>
      <Card style={{ backgroundColor: color.tint }}>
        <View style={row}><Teacher size={55} /><View style={grow}>
          <Heading>{queue.length ? `${queue.length} ${queue.length === 1 ? "word" : "words"} to revisit` : "Your review queue is clear"}</Heading>
          <Label muted size={13}>{queue.length ? "Practise words you’ve set aside for another look." : "Words you mark for review will appear here."}</Label>
        </View></View>
        {queue.length ? <Button kind="gold" title="Start review" icon="arrow" busy={save.isPending}
          onPress={() => { setReviewMode("manual"); save.mutate(() => startReview(token, "manual", language)); }} /> :
          <Button title="Explore lessons" icon="arrow" onPress={goLearn} />}
      </Card>
    </>}
    {!!spaced.data && <Card>
      <Heading>Quiz</Heading>
      <Copy>{due ? `${due} ${due === 1 ? "word is" : "words are"} due for practice.` : "No quiz due today."}</Copy>
      {due > 0 && <Button primary title="Start quiz" icon="arrow" busy={save.isPending} onPress={() => { setReviewMode("spaced"); save.mutate(() => startReview(token, "spaced", language)); }} />}
      {!due && spaced.data.next_review_at && <Label muted size={13}>Next quiz: {new Date(spaced.data.next_review_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</Label>}
    </Card>}
    {!!overview.data && <>
      <Card>
        <Heading>Words to revisit</Heading>
        {queue.length ? queue.slice(0, showAll ? undefined : 6).map((word) => <View key={word.id}
          style={[row, { borderTopWidth: 1, borderColor: color.line, paddingTop: 8 }]}>
          <View style={grow}><WordText size={20}>{word.text}</WordText><Label muted size={13}>{word.meaning}{word.amharic && ` · ${word.amharic}`}</Label></View>
          {word.audio_url && <Audio url={word.audio_url} compact label={word.text} />}
        </View>) : <Button kind="quiet" title="Find a word" icon="arrow" onPress={goDictionary} style={{ alignSelf: "flex-start", paddingHorizontal: 0 }} />}
        {queue.length > 6 && <Button title={showAll ? "Show fewer words" : `Show all ${queue.length} words`} onPress={() => setShowAll(!showAll)} />}
      </Card>
      <Card>
        <Heading>Recent practice</Heading>
        {history.length ? history.slice(0, 5).map((item) => <View key={item.id} style={[row, { borderTopWidth: 1, borderColor: color.line, paddingTop: 10 }]}>
          <Label style={grow} muted size={13}>{new Date(item.completed_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</Label>
          <Label strong size={14}>{item.correct_count}/{item.total_count} correct</Label>
        </View>) : <Copy>Finish a review to see your results here.</Copy>}
      </Card>
    </>}
  </>;
}
