import { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { DashboardSummary } from "@/lib/api/dashboard";
import type { DictionaryWord } from "@/lib/api/words";
import type { LearningPathResponse, ProgressSummary } from "@/lib/api/learning";
import type { QuestOverview } from "@/lib/api/quests";
import { HomeScreen } from "./HomeScreen";
import { LearnScreen } from "./LearnScreen";
import { QuestVillageScreen } from "./QuestVillageScreen";
import { Character } from "./Character";
import { Button, Icon, Label, palettes, Press, Progress, row, Teacher, Theme, WordText } from "./ui";

const today = new Date();
const date = (offset: number) => { const day = new Date(today); day.setDate(day.getDate() + offset); return day.toISOString().slice(0, 10); };
const data: DashboardSummary = {
  daily_word_goal: 5, words_learned_today: 1, study_minutes_today: 4, streak_days: 1,
  learned_words: 1, needs_review_words: 0, lessons_completed: 1, reviews_completed: 0, correct_answers: 3,
  current_lesson: { lesson_key: "animals", title: "Animals", stage: "flashcards", question_index: 0, question_count: 3 },
  weekly_activity: Array.from({ length: 7 }, (_, index) => ({ date: date(index - 6), minutes: index === 6 ? 4 : 0, events: index === 6 ? 1 : 0 })),
  recent_activity: [{ kind: "lesson", title: "Greetings", occurred_at: today.toISOString(), correct_count: 3, total_count: 3 }],
};
const word: DictionaryWord = {
  id: "preview-word", language_code: "om", text: "baga gammaddan", transliteration: null,
  content_type: "phrase", category: "greetings", difficulty: "beginner", meaning: "congratulations",
  translations: [
    { language_code: "en", meaning: "congratulations", context_note: null },
    { language_code: "am", meaning: "እንኳን ደስ አላችሁ", context_note: null },
  ], audio: { available: false, url: null, speaker_id: null, speed: null },
};
const previewOnly = () => Alert.alert("Home preview", "This is sample data for checking the design. Sign in to use saved lessons and words.");
const previewPath: LearningPathResponse = {
  language_code: "om", total_words: 68, levels: [
    { id: "beginner", title: "Beginner", subtitle: "Everyday words", order: 0, total_words: 49, lessons: [
      { id: "greetings", title: "Greetings", subtitle: "Start a conversation", order: 0, word_count: 5 },
      { id: "animals", title: "Animals", subtitle: "Words for the living world", order: 1, word_count: 4 },
      { id: "body", title: "Body", subtitle: "Talk about yourself", order: 2, word_count: 17 },
      { id: "everyday", title: "Everyday", subtitle: "For daily conversations", order: 3, word_count: 2 },
      { id: "family", title: "Family", subtitle: "People close to you", order: 4, word_count: 9 },
      { id: "food", title: "Food", subtitle: "At the table", order: 5, word_count: 12 },
    ] },
    { id: "intermediate", title: "Intermediate", subtitle: "Longer conversations", order: 1, total_words: 19, lessons: [
      { id: "travel", title: "Travel", subtitle: "Find your way", order: 0, word_count: 10 },
      { id: "work", title: "Work", subtitle: "Words for the day", order: 1, word_count: 9 },
    ] },
  ],
};
const previewProgress: ProgressSummary = {
  lessons_completed: 1, questions_answered: 5, correct_answers: 5, completed_lesson_keys: ["greetings"],
  practiced_word_ids_by_lesson: {}, in_progress: [],
};
const previewQuests: QuestOverview = {
  language_code: "om",
  quests: [
    ["intro", "Meet your guide", "Your name. Your first hello.", "guide"],
    ["cafe", "At the café", "A drink and a little kindness.", "host"],
    ["neighbor", "Meet a neighbor", "Make a new face feel familiar.", "guide"],
    ["market", "At the market", "Pick up a few things for home.", "host"],
    ["family", "A family visit", "Familiar words, familiar faces.", "guide"],
  ].map(([id, title, description, character], index) => ({
    id, title, description, character: character as "guide" | "host", version: 1,
    prerequisite: index ? ["intro", "cafe", "neighbor", "market"][index - 1] : null,
    required: index === 0 ? [{ key: "hello", text: "Akkam", english: "hello", amharic: "ሰላም", alternatives: [] }] : [],
    steps: index === 0 ? [{ id: "name", prompt: "Welcome! I’m your village guide. What’s your name?", accepts: [], kind: "name" as const }] : [],
    state: null, locked: index > 0, reasons: index > 0 ? ["Finish the previous conversation to open this door."] : [],
    missing_words: [], unavailable_words: [],
  })),
  bank: [{ id: "00000000-0000-4000-8000-000000000001", text: "Akkam", meaning: "hello", amharic: "ሰላም", category: "greetings", audio_url: null }],
};

export function HomePreview() {
  const color = palettes.light;
  const [page, setPage] = useState<"Home" | "Learn" | "Quest">("Home");
  const [conversation, setConversation] = useState(false);
  const [questStep, setQuestStep] = useState(0);
  const [previewName, setPreviewName] = useState("");
  const tab = page === "Quest" ? "Learn" : page;
  return <Theme.Provider value={color}><SafeAreaView style={{ flex: 1, backgroundColor: color.tint }}>
    <View style={{ paddingHorizontal: 18, minHeight: 58, borderBottomWidth: 1, borderColor: color.line, justifyContent: "center" }}>
      <View style={[row, { justifyContent: "space-between" }]}><View style={row}><Teacher size={35} />
        <Text style={{ color: color.ink, fontFamily: "Manrope", fontSize: 23 }}>Fidel<Text style={{ color: "#c65b1d" }}>.</Text></Text></View>
        <Label size={12} muted>{page} preview</Label></View>
    </View>
    <ScrollView key={`${page}-${conversation}`} style={{ backgroundColor: color.paper }} contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
      <View style={{ marginBottom: 18 }}><Label size={12} muted>Sample data · design preview</Label></View>
      {page === "Home" ? <HomeScreen data={data} language="om" word={{ data: word }} quiz={{ data: { due_count: 0 } }}
        topics={{ data: [{ name: "adjectives", word_count: 1 }, { name: "animals", word_count: 4 }, { name: "body", word_count: 17 }, { name: "common_expressions", word_count: 23 }, { name: "food", word_count: 8 }] }}
        quest={{ id: "intro", title: "Meet your guide", locked: false, missingWords: 0, name: "Hawwii" }}
        openLesson={previewOnly} goLearn={() => setPage("Learn")} goReview={previewOnly} goProfile={previewOnly} openDictionary={previewOnly} goQuest={() => { setConversation(false); setPage("Quest"); }} /> :
        page === "Learn" ? <LearnScreen path={previewPath} progress={previewProgress} openLesson={previewOnly} goReview={previewOnly} goQuest={() => { setConversation(false); setPage("Quest"); }} /> :
        <View style={{ gap: 16 }}><Press label={conversation ? "Back to village" : "Back to Learn"} onPress={() => conversation ? setConversation(false) : setPage("Learn")}>
          <Label muted size={13}>← Back to {conversation ? "village" : "Learn"}</Label></Press>
          {conversation ? <View style={{ gap: 16 }}>
            <View style={[row, { padding: 16, gap: 12, backgroundColor: color.tint, borderRadius: 8 }]}>
              <Character language="om" questId="intro" width={43} />
              <View style={{ flex: 1 }}><Label strong size={16}>Hawwii</Label><Label muted size={12}>Meet your guide · {questStep} / 2 replies</Label></View>
            </View>
            <Progress value={questStep} total={2} label="Sample conversation progress" />
            <View style={{ minHeight: 180, padding: 18, backgroundColor: color.tint, borderRadius: 8, gap: 14 }}>
              <Character language="om" questId="intro" width={72} />
              {questStep > 0 && <View style={{ alignSelf: "flex-end", padding: 11, backgroundColor: color.panel, borderRadius: 8 }}><Label muted size={11}>You · sample reply</Label><WordText size={18}>{previewName}</WordText></View>}
              <View style={{ alignSelf: "flex-start", padding: 13, backgroundColor: color.panel, borderRadius: 8 }}>
                <Label size={15}>{questStep === 0 ? "Welcome! I’m your village guide. What’s your name?" : questStep === 1 ? `Lovely to meet you, ${previewName}. Choose a word to say hello.` : "A little conversation, a new connection."}</Label>
              </View>
            </View>
            {questStep === 0 ? <View style={{ gap: 10 }}><Label strong>Your name in Qubee</Label><Label muted size={12}>Your own spelling is welcome.</Label>
              <TextInput accessibilityLabel="Your name" value={previewName} onChangeText={setPreviewName} maxLength={40}
                style={{ minHeight: 48, paddingHorizontal: 12, borderWidth: 1, borderColor: color.line, borderRadius: 7, backgroundColor: color.panel, color: color.ink, fontSize: 17 }} />
              <Button kind="gold" title="Reply" icon="arrow" disabled={!previewName.trim()} onPress={() => setQuestStep(1)} /></View> :
              questStep === 1 ? <View style={{ gap: 10 }}><Label strong>Reply from your word bank</Label><Label muted size={12}>Choose a collected word. No typing needed.</Label>
                <Press label="Akkam, hello" onPress={() => setQuestStep(2)} style={{ padding: 13, borderWidth: 1, borderColor: color.line, borderRadius: 8, backgroundColor: color.panel }}>
                  <WordText size={19}>Akkam</WordText><Label muted size={12}>hello · ሰላም</Label></Press></View> :
              <View style={{ gap: 10 }}><Label strong>Sample conversation finished.</Label><Button kind="gold" title="Back to village" onPress={() => setConversation(false)} /></View>}
          </View> : <QuestVillageScreen overview={previewQuests} language="om" onEnter={() => { setQuestStep(0); setPreviewName(""); setConversation(true); }} goDictionary={previewOnly} />}
        </View>}
    </ScrollView>
    <View style={[row, { borderTopWidth: 1, borderColor: color.line, paddingHorizontal: 8, paddingTop: 5 }]}>
      {(["Home", "Learn", "Review", "Dictionary", "Profile"] as const).map((name, index) => <Press key={name} label={name} onPress={name === "Home" || name === "Learn" ? () => { setConversation(false); setPage(name); } : previewOnly} style={{ flex: 1, minHeight: 62, alignItems: "center", justifyContent: "center", gap: 2 }}>
        <View style={{ borderRadius: 20, backgroundColor: name === tab ? color.line : "transparent", minWidth: 43, height: 29, alignItems: "center", justifyContent: "center" }}><Icon name={(["home", "learn", "review", "search", "profile"] as const)[index]} size={20} /></View>
        <Label size={11} strong={name === tab} muted={name !== tab}>{name}</Label>
      </Press>)}
    </View>
  </SafeAreaView></Theme.Provider>;
}
