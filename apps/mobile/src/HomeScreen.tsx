import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Text, View } from "react-native";
import type { DashboardSummary } from "@/lib/api/dashboard";
import type { DictionaryWord, WordCategory } from "@/lib/api/words";
import { learningLanguages, type LearningLanguage } from "@/lib/languages";
import { studyWeek } from "@/lib/weekly-streak";
import { Character } from "./Character";
import { Audio, Button, Icon, Label, Loading, Press, Problem, row, Teacher, usePalette, WordText } from "./ui";

type Loadable<T> = { data?: T; pending?: boolean; error?: unknown; retry?: () => void };
type Props = {
  data: DashboardSummary;
  language: LearningLanguage;
  word: Loadable<DictionaryWord | null>;
  topics: Loadable<WordCategory[]>;
  quiz: Loadable<{ due_count: number; active_session?: unknown }>;
  quest?: { id: string; title: string; locked: boolean; missingWords: number; name: string };
  openLesson: (id: string) => void;
  goLearn: () => void;
  goReview: () => void;
  goProfile: () => void;
  openDictionary: (topic?: string) => void;
  goQuest: () => void;
};

const topicName = (value: string) => value.replace(/[_-]/g, " ").replace(/^./, (letter) => letter.toUpperCase());

function GoalThread({ learned, goal }: { learned: number; goal: number }) {
  const color = usePalette();
  const fraction = Math.min(1, Math.max(0, learned / goal));
  const [width, setWidth] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const progress = useRef(new Animated.Value(fraction)).current;

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(fraction);
      return;
    }
    const motion = Animated.timing(progress, {
      toValue: fraction, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    });
    motion.start();
    return () => motion.stop();
  }, [fraction, progress, reducedMotion]);

  const fillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [0, width] });
  const knotLeft = progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(0, width - 10)] });
  return <View accessibilityRole="progressbar" accessibilityLabel="Daily word goal"
    accessibilityValue={{ min: 0, max: goal, now: Math.min(learned, goal) }}
    onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    style={{ height: 12, justifyContent: "center" }}>
    <View style={{ height: 4, borderRadius: 2, backgroundColor: color.line }} />
    <Animated.View style={{ position: "absolute", top: 4, left: 0, height: 4, width: fillWidth,
      borderRadius: 2, backgroundColor: color.gold }} />
    {learned > 0 && <Animated.View style={{ position: "absolute", top: 1, left: knotLeft, width: 10, height: 10,
      borderWidth: 1, borderColor: color.panel, backgroundColor: color.gold,
      transform: [{ rotate: "45deg" }] }} />}
  </View>;
}

function StreakWeave() {
  const color = usePalette();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const across = useRef(new Animated.Value(0)).current;
  const down = useRef(new Animated.Value(0)).current;
  const thread = "#eda334";
  const diamond = (key: number) => <View key={key} style={{ width: 9, height: 9, margin: 2,
    borderWidth: 1, borderColor: thread, transform: [{ rotate: "45deg" }], alignItems: "center", justifyContent: "center" }}>
    <View style={{ width: 2, height: 2, backgroundColor: thread }} />
  </View>;
  const band = (vertical: boolean, count: number) => <View style={{ flexDirection: vertical ? "column" : "row" }}>
    {Array.from({ length: count }, (_, index) => diamond(index))}
  </View>;

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (reducedMotion || !size.width || !size.height) return;
    across.setValue(0);
    down.setValue(0);
    const horizontal = Animated.loop(Animated.sequence([
      Animated.timing(across, { toValue: size.width + 104, duration: 12000, easing: Easing.linear, useNativeDriver: true }),
      Animated.delay(2400),
    ]));
    const vertical = Animated.loop(Animated.sequence([
      Animated.timing(down, { toValue: size.height + 78, duration: 15000, easing: Easing.linear, useNativeDriver: true }),
      Animated.delay(3000),
    ]));
    horizontal.start();
    vertical.start();
    return () => { horizontal.stop(); vertical.stop(); };
  }, [across, down, reducedMotion, size.height, size.width]);

  return <View pointerEvents="none" accessible={false}
    onLayout={(event) => {
      const { width, height } = event.nativeEvent.layout;
      setSize((previous) => previous.width === width && previous.height === height ? previous : { width, height });
    }}
    style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden" }}>
    <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, opacity: color.dark ? 0.23 : 0.42 }}>
      {Array.from({ length: Math.ceil(size.height / 78) + 1 }, (_, index) =>
        <View key={index} style={{ position: "absolute", top: 28 + index * 78, left: -6 }}>
          {band(false, Math.ceil(size.width / 13) + 2)}
        </View>)}
      {Array.from({ length: Math.ceil(size.width / 78) + 1 }, (_, index) =>
        <View key={index} style={{ position: "absolute", left: 28 + index * 78, top: -6 }}>
          {band(true, Math.ceil(size.height / 13) + 2)}
        </View>)}
    </View>
    {!reducedMotion && size.width > 0 && <Animated.View style={{ position: "absolute", left: -110, top: 28, opacity: 0.8,
      transform: [{ translateX: across }] }}>{band(false, 8)}</Animated.View>}
    {!reducedMotion && size.height > 0 && <Animated.View style={{ position: "absolute", left: 28, top: -84, opacity: 0.65,
      transform: [{ translateY: down }] }}>{band(true, 6)}</Animated.View>}
  </View>;
}

export function HomeScreen({ data, language, word, topics, quiz, quest, openLesson, goLearn, goReview, goProfile, openDictionary, goQuest }: Props) {
  const color = usePalette();
  const accent = color.dark ? "#ef965a" : "#c65b1d";
  const streakSurface = color.dark ? "#10291e" : "#ffffff";
  const streakInk = color.dark ? "#e8f0e7" : color.ink;
  const streakMuted = color.dark ? "#bfd2c1" : color.muted;
  const [showMeanings, setShowMeanings] = useState(true);
  const [showTopics, setShowTopics] = useState(false);
  const current = data.current_lesson;
  const remaining = Math.max(0, data.daily_word_goal - data.words_learned_today);
  const goal = Math.max(1, data.daily_word_goal);
  const week = studyWeek(data.weekly_activity);
  const heading = (value: string) => <Text accessibilityRole="header" style={{ color: color.ink, fontFamily: "Manrope", fontSize: 17, lineHeight: 25 }}>{value}</Text>;
  const panel = { padding: 20, borderRadius: 8, backgroundColor: color.tint, gap: 18 } as const;
  const link = (label: string, onPress: () => void) => <Press label={label} onPress={onPress} style={[row, { minHeight: 44, gap: 7 }]}>
    <Label size={13}>{label}</Label><Icon name="arrow" size={15} />
  </Press>;

  return <View style={{ gap: 20 }}>
    <View style={{ gap: 8, paddingBottom: 6 }}>
      <Text accessibilityRole="header" style={{ color: color.ink, fontFamily: "Manrope", fontSize: 25, lineHeight: 34, letterSpacing: -0.7 }}>
        {language === "om" ? "Akkam" : "ሰላም"}. A little more, every day.
      </Text>
      <Label muted size={13}>{learningLanguages[language].name}</Label>
    </View>

    <View style={{ gap: 16 }}>
      <View style={{ padding: 18, borderWidth: 1, borderColor: color.line, borderRadius: 14,
        backgroundColor: color.panel, gap: 18 }}>
        <View style={[row, { justifyContent: "space-between", alignItems: "flex-start" }]}>
          <Label muted size={13}>Today’s word goal</Label>
          <Label muted size={12}>{remaining ? `${remaining} ${remaining === 1 ? "word" : "words"} to go` : "Goal complete"}</Label>
        </View>
        <View style={[row, { alignItems: "baseline", gap: 7 }]}>
          <Label size={36} style={{ fontVariant: ["tabular-nums"], lineHeight: 42 }}>{data.words_learned_today}</Label>
          <Label muted size={15}>/ {data.daily_word_goal} words</Label>
        </View>
        <GoalThread learned={data.words_learned_today} goal={goal} />
        <View style={[row, { borderTopWidth: 1, borderColor: color.line, paddingTop: 16 }]}>
          {([["Words learned", data.learned_words, "In your vocabulary"], ["Lessons completed", data.lessons_completed, "On your learning path"]] as const).map(([title, value, detail], index) =>
            <View key={title} style={{ flex: 1, minWidth: 0, paddingLeft: index ? 15 : 0,
              borderLeftWidth: index ? 1 : 0, borderColor: color.line, gap: 3 }}>
              <Label muted size={12}>{title}</Label>
              <Label size={27} style={{ fontVariant: ["tabular-nums"] }}>{value}</Label>
              <Label muted size={11}>{detail}</Label>
            </View>)}
        </View>
      </View>
      <View style={{ padding: 18, borderWidth: 1, borderColor: color.dark ? "#284436" : color.line,
        borderRadius: 14, backgroundColor: streakSurface, gap: 12, overflow: "hidden" }}>
        <StreakWeave />
        <View style={[row, { justifyContent: "space-between" }]}>
          <Text accessibilityRole="header" style={{ color: streakInk, fontFamily: "Manrope", fontSize: 17 }}>Study streak</Text>
          <Press label="Activity" onPress={goProfile} style={[row, { minHeight: 44, gap: 7 }]}>
            <Label size={13} style={{ color: streakInk }}>Activity</Label><Icon name="arrow" size={15} tint={streakInk} />
          </Press>
        </View>
        <View style={[row, { alignItems: "baseline", gap: 5 }]}><Label size={27} style={{ color: streakInk }}>{data.streak_days}</Label><Label size={13} style={{ color: streakMuted }}>{data.streak_days === 1 ? "day" : "days"}</Label></View>
        <View style={[row, { justifyContent: "space-between", gap: 4, paddingVertical: 6 }]}>
          {week.map((day) => <View key={day.date} accessible accessibilityLabel={day.fullLabel + ": " + (day.state === "studied" ? "studied" : day.state === "upcoming" ? "upcoming" : "no study recorded")}
            style={{ flex: 1, alignItems: "center", gap: 14 }}>
            <Label size={12} style={{ color: day.isToday ? color.dark ? "#eda334" : color.ink : streakMuted }}>{day.label}</Label>
            <View style={{ width: 23, height: 23, margin: 5, transform: [{ rotate: "45deg" }], borderRadius: 2,
              borderWidth: day.isToday ? 2.5 : 1.5, borderColor: day.isToday || day.state === "studied" ? "#eda334" : color.dark ? "#769082" : "#9eaca0",
              backgroundColor: day.state === "studied" ? "#eda334" : streakSurface,
              opacity: day.state === "upcoming" ? 0.55 : 1 }} />
          </View>)}
        </View>
        <Label size={12} style={{ color: streakMuted }}>A day counts when you practise or learn.</Label>
      </View>
    </View>

    <View style={{ padding: 18, borderRadius: 16, backgroundColor: color.tint, gap: 16 }}>
      <View style={[row, { alignItems: "flex-start", gap: 10 }]}>
        <View style={{ flex: 1, gap: 7 }}>
          <Label muted size={12}>{current ? "Pick up where you left off" : "Your next lesson"}</Label>
          <Text accessibilityRole="header" style={{ color: color.ink, fontFamily: "ManropeBold", fontSize: 24, lineHeight: 30, letterSpacing: -0.5 }}>
            {current ? topicName(current.title) : "Find your first words"}
          </Text>
          <Label muted size={13}>{current?.stage === "practice" ? "Time to put these words into practice." : current ? "Your lesson is ready when you are." : "Choose a topic and start learning."}</Label>
        </View>
        <Character language={language} topic={current?.title ?? "greetings"} width={62} />
      </View>
      {current && <View style={{ gap: 7 }}>
        <View style={[row, { justifyContent: "space-between" }]}><Label muted size={12}>Session progress</Label><Label size={12}>{current.question_index} / {current.question_count}</Label></View>
        <View accessibilityRole="progressbar" accessibilityLabel="Lesson session progress"
          accessibilityValue={{ min: 0, max: Math.max(1, current.question_count), now: Math.min(current.question_index, current.question_count) }}
          style={{ height: 5, borderRadius: 3, overflow: "hidden", backgroundColor: color.line }}>
          <View style={{ width: (current.question_count ? Math.min(100, current.question_index / current.question_count * 100) : 0) + "%", height: 5, backgroundColor: color.gold }} />
        </View>
      </View>}
      <Button kind="gold" title={current ? "Continue lesson" : "Start learning"} icon="arrow"
        onPress={() => current ? openLesson(current.lesson_key) : goLearn()} style={{ width: "100%", minHeight: 50 }} />
    </View>

    <View style={panel}>
      <View style={[row, { justifyContent: "space-between" }]}>{heading("Word of the day")}
        <Label muted size={12}>{learningLanguages[language].name}</Label></View>
      {word.pending ? <Loading label="Loading word of the day" /> : word.error ? <Problem error={word.error} retry={word.retry} /> : word.data ? <>
        <View style={[row, { alignItems: "center", minHeight: 77 }]}><View style={{ flex: 1 }}><WordText size={32}>{word.data.text}</WordText>
          {word.data.transliteration && <Label muted size={13}>{word.data.transliteration}</Label>}</View><Teacher size={58} /></View>
        {showMeanings && <View style={{ gap: 9, paddingVertical: 6 }}>
          <View style={row}><Label muted size={12} style={{ width: 60 }}>English</Label><Label size={14} style={{ flex: 1 }}>{word.data.translations.find((item) => item.language_code === "en")?.meaning ?? word.data.meaning ?? "Translation unavailable"}</Label></View>
          <View style={row}><Label muted size={12} style={{ width: 60 }}>Amharic</Label><WordText size={14} style={{ flex: 1 }}>{word.data.translations.find((item) => item.language_code === "am")?.meaning ?? "Translation unavailable"}</WordText></View>
        </View>}
        <View style={[row, { justifyContent: "space-between" }]}>
          {word.data.audio.url ? <Audio url={word.data.audio.url} label={word.data.text} /> : <Label muted size={12}>Audio is not available yet.</Label>}
          <Press label={showMeanings ? "Hide meanings" : "Show meanings"} onPress={() => setShowMeanings(!showMeanings)} style={{ minHeight: 44, justifyContent: "center" }}>
            <Label size={13} style={{ textDecorationLine: "underline", textDecorationColor: accent }}>{showMeanings ? "Try to recall" : "Show meanings"}</Label>
          </Press>
        </View>
      </> : <Label muted>No daily word available yet.</Label>}
    </View>

    {quest && <View style={[row, { padding: 12, borderWidth: 1, borderColor: color.line, borderRadius: 8, flexWrap: "wrap" }]}>
      <Character language={language} questId={quest.id} width={48} />
      <View style={{ flex: 1, minWidth: 180 }}>{heading(quest.title)}<Label muted size={13}>{quest.locked ? "Collect " + quest.missingWords + " " + (quest.missingWords === 1 ? "word" : "words") + " to visit " + quest.name + "." : quest.name + " is waiting at the next door."}</Label></View>
      {link(quest.locked ? "See the village" : "Continue your quest", goQuest)}
    </View>}

    <View style={panel}>
      {heading("Quiz yourself.")}
      {quiz.pending ? <Loading label="Loading quiz availability" /> : quiz.error ? <Problem error={quiz.error} retry={quiz.retry} /> : <>
        <Label muted>{quiz.data?.active_session ? "Your quiz is ready to continue." : quiz.data?.due_count ? quiz.data.due_count + " words are ready for a quiz." : "Learn at least two words. Your first quiz opens 3 days after learning."}</Label>
        <Label size={13}>Multiple choice  ·  Saved as you go</Label>
        <View style={[row, { justifyContent: "space-between" }]}><Label size={26}>{quiz.data?.due_count ?? 0} <Label size={13} muted>questions ready</Label></Label>{link(quiz.data?.due_count ? "Start quiz" : "Learn more words", quiz.data?.due_count ? goReview : goLearn)}</View>
      </>}
    </View>

    <View style={panel}>
      <View style={[row, { justifyContent: "space-between" }]}>{heading("Learn by topic")}{link("Dictionary", () => openDictionary())}</View>
      {topics.pending ? <Loading label="Loading topics" /> : topics.error ? <Problem error={topics.error} retry={topics.retry} /> : topics.data?.length ? <>
        {topics.data.slice(0, showTopics ? undefined : 4).map((item) => <Press key={item.name} label={"Open " + topicName(item.name)} onPress={() => openDictionary(item.name)}
          style={[row, { minHeight: 48, borderBottomWidth: 1, borderColor: color.line, justifyContent: "space-between" }]}>
          <Label size={14} style={{ flex: 1 }}>{topicName(item.name)}</Label><Label muted size={13}>{item.word_count} {item.word_count === 1 ? "word" : "words"}</Label><Icon name="arrow" size={15} />
        </Press>)}
        {topics.data.length > 4 && <Press label={showTopics ? "Fewer topics" : "More topics"} onPress={() => setShowTopics(!showTopics)} style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}>
          <Label size={13} style={{ textDecorationLine: "underline" }}>{showTopics ? "Fewer topics" : "More topics (" + (topics.data.length - 4) + ")"}</Label>
        </Press>}
      </> : <Label muted>No topics available yet.</Label>}
    </View>

    <View style={panel}>
      <View style={[row, { justifyContent: "space-between" }]}>{heading("Recent learning")}{link("Your activity", goProfile)}</View>
      {data.recent_activity.length ? data.recent_activity.slice(0, 3).map((item, index) => <View key={item.occurred_at + "-" + index}
        style={[row, { borderBottomWidth: 1, borderColor: color.line, paddingVertical: 8, justifyContent: "space-between" }]}>
        <View style={{ flex: 1 }}><Label size={14}>{topicName(item.title)}</Label><Label muted size={12}>{item.kind === "lesson" ? "Lesson" : "Review"} · {new Date(item.occurred_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</Label></View>
        <Label size={14}>{item.correct_count} / {item.total_count} correct</Label>
      </View>) : <Label muted>Your completed lessons and reviews will appear here. Start a lesson to make your first entry.</Label>}
    </View>
  </View>;
}
