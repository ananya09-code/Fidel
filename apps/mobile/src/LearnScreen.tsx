import { useState } from "react";
import { Text, View } from "react-native";
import type { LearningPathResponse, ProgressSummary } from "@/lib/api/learning";
import { learningLanguages } from "@/lib/languages";
import { Character } from "./Character";
import { Button, Icon, Label, Press, row, usePalette } from "./ui";

type Props = {
  path: LearningPathResponse;
  progress: ProgressSummary;
  openLesson: (id: string) => void;
  goReview: () => void;
  goQuest: () => void;
};

export function LearnScreen({ path, progress, openLesson, goReview, goQuest }: Props) {
  const color = usePalette();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const lessons = path.levels.flatMap((level) => level.lessons);
  const completed = new Set(progress.completed_lesson_keys);
  const finished = lessons.filter((lesson) => completed.has(lesson.id)).length;
  const attempt = progress.in_progress.find((item) => lessons.some((lesson) => lesson.id === item.lesson_key) && !completed.has(item.lesson_key));
  const next = lessons.find((lesson) => lesson.id === attempt?.lesson_key) ?? lessons.find((lesson) => !completed.has(lesson.id));
  const gold = color.gold;
  const heading = (value: string, size: number, strong = false) => <Text accessibilityRole="header" style={{ color: color.ink, fontFamily: strong ? "ManropeBold" : "Manrope", fontSize: size, lineHeight: size * 1.35, letterSpacing: size > 20 ? -0.5 : 0 }}>{value}</Text>;
  return <View style={{ gap: 22 }}>
    <Press label="Explore Fidel Quest village conversations" onPress={goQuest}
      style={[row, { minHeight: 150, padding: 20, borderRadius: 8, backgroundColor: "#173a30", overflow: "hidden" }]}>
      <View style={{ flex: 1, gap: 7 }}>
        <Label strong size={12} style={{ color: "#e9a033" }}>Fidel Quest</Label>
        <Label strong size={22} style={{ color: "#f5f7f0", letterSpacing: -0.6 }}>The village is waiting.</Label>
        <Label size={12} style={{ color: "#d1ded4" }}>Use the words you’ve learned in short conversations. Each new word opens another door.</Label>
        <Label strong size={12} style={{ color: "#f5f7f0" }}>Explore the village  ↗</Label>
      </View>
      <Character language={path.language_code} questId="first" width={65} />
    </Press>
    <View style={{ gap: 7 }}>{heading("Your learning path", 25)}<Label muted size={13}>{learningLanguages[path.language_code].name} · One conversation at a time.</Label></View>
    {!lessons.length ? <View style={{ paddingVertical: 24 }}><Label>No lessons are available for this language yet.</Label></View> : <>
      <View style={{ backgroundColor: color.tint, borderRadius: 8, padding: 20, gap: 17 }}>
        <View style={[row, { gap: 14 }]}>
          <Character language={path.language_code} topic={next?.title} width={55} />
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Label muted size={13}>{next ? attempt ? "Pick up where you left off" : "Your next lesson" : "Every lesson completed"}</Label>
            {heading(next?.title ?? "Look how far you’ve come.", 22)}
            <Label muted size={13}>{next ? `${next.word_count} words${attempt ? ` · ${attempt.question_index} of ${attempt.question_count} practice questions finished` : ""}` : "Keep familiar words fresh with a review."}</Label>
          </View>
        </View>
        <Button kind="gold" title={next ? attempt ? "Continue lesson" : "Start lesson" : "Review words"} icon="arrow" onPress={() => next ? openLesson(next.id) : goReview()} style={{ width: "100%", minHeight: 48 }} />
      </View>
      <View style={{ gap: 11 }}>
        <Label size={14}>{finished} of {lessons.length} lessons completed</Label>
        <View style={[row, { gap: 12 }]}>
          <View accessibilityRole="progressbar" accessibilityLabel="Learning path completion" accessibilityValue={{ min: 0, max: lessons.length, now: finished }} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: color.line, overflow: "hidden" }}>
            <View style={{ height: 5, width: `${finished / lessons.length * 100}%`, backgroundColor: gold }} />
          </View>
          <Label muted size={12}>{Math.round(finished / lessons.length * 100)}%</Label>
        </View>
      </View>
      {path.levels.map((level) => {
        const done = level.lessons.filter((lesson) => completed.has(lesson.id)).length;
        const active = level.lessons.some((lesson) => lesson.id === next?.id);
        const open = expanded[level.id] ?? (active || (!next && done > 0));
        return <View key={level.id} style={{ borderWidth: 1, borderColor: color.line, borderRadius: 8, overflow: "hidden" }}>
          <Press label={`${level.title}, ${done} of ${level.lessons.length} completed`} expanded={open} onPress={() => setExpanded({ ...expanded, [level.id]: !open })}
            style={[row, { minHeight: 80, paddingHorizontal: 16, gap: 12 }]}>
            <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: done === level.lessons.length && done > 0 ? color.ink : active ? gold : color.line, alignItems: "center", justifyContent: "center" }}>
              {done === level.lessons.length && done > 0 ? <Icon name="check" size={14} /> : active ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: gold }} /> : null}
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>{heading(level.title, 16, true)}<Label muted size={12}>{level.subtitle} · {level.total_words} words</Label></View>
            <Label muted size={13}>{done}/{level.lessons.length}</Label>
            <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}><Icon name="chevron" size={18} /></View>
          </Press>
          {open && <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 18 }}>
            {level.lessons.map((lesson, index) => {
              const state = completed.has(lesson.id) ? "done" : lesson.id === next?.id ? "active" : "locked";
              const shifted = index % 2 === 1;
              return <View key={lesson.id}>
                <View style={[row, { minHeight: 80, gap: 14, paddingLeft: shifted ? 34 : 0 }]}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: state === "active" ? gold : state === "done" ? color.ink : color.tint, alignItems: "center", justifyContent: "center" }}>
                    <Icon name={state === "done" ? "check" : state === "active" ? "play" : "lock"} size={20} tint={state === "done" ? color.paper : state === "active" ? color.goldInk : color.muted} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    {heading(lesson.title, 15, true)}
                    <Label muted size={13}>{lesson.subtitle}</Label>
                    <Label muted size={12}>{lesson.word_count} {lesson.word_count === 1 ? "word" : "words"} · {state === "done" ? "Completed" : state === "active" ? "Up next" : "Finish previous lessons to unlock"}</Label>
                  </View>
                  {state !== "locked" && <Press label={`${state === "done" ? "Practise" : "Start"} ${lesson.title}`} onPress={() => openLesson(lesson.id)} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><Icon name="arrow" size={20} /></Press>}
                </View>
                {index < level.lessons.length - 1 && <View accessible={false} style={{ height: 70, width: 88, marginTop: -16, marginBottom: -16 }}>
                  {Array.from({ length: 12 }, (_, dot) => {
                    const t = dot / 11;
                    const curve = t * t * (3 - 2 * t);
                    const x = shifted ? 58 - 34 * curve : 24 + 34 * curve;
                    return <View key={dot} style={{ position: "absolute", left: x - 2, top: t * 66, width: 4, height: 4,
                      borderRadius: 2, backgroundColor: state === "done" ? color.ink : color.muted,
                      opacity: state === "done" ? 0.8 : 0.42 }} />;
                  })}
                </View>}
              </View>;
            })}
          </View>}
        </View>;
      })}
    </>}
  </View>;
}
