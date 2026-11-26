import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollView, TextInput, View } from "react-native";
import { getQuests, replyToQuest, startQuest, type QuestItem, type QuestReply, type QuestState } from "@/lib/api/quests";
import type { Course } from "./LearnerScreens";
import { Character } from "./Character";
import { QuestVillageScreen } from "./QuestVillageScreen";
import { Button, Card, Copy, grow, Heading, Label, Loading, Press, Problem, Progress, row, usePalette, WordText } from "./ui";

const fidelFamilies = [
  "ሀሁሂሃሄህሆ", "ለሉሊላሌልሎ", "ሐሑሒሓሔሕሖ", "መሙሚማሜምሞ", "ሠሡሢሣሤሥሦ", "ረሩሪራሬርሮ",
  "ሰሱሲሳሴስሶ", "ሸሹሺሻሼሽሾ", "ቀቁቂቃቄቅቆ", "ቐቑቒቓቔቕቖ", "በቡቢባቤብቦ", "ተቱቲታቴትቶ",
  "ቸቹቺቻቼችቾ", "ኀኁኂኃኄኅኆ", "ነኑኒናኔንኖ", "ኘኙኚኛኜኝኞ", "አኡኢኣኤእኦ", "ከኩኪካኬክኮ",
  "ኸኹኺኻኼኽኾ", "ወዉዊዋዌውዎ", "ዐዑዒዓዔዕዖ", "ዘዙዚዛዜዝዞ", "ዠዡዢዣዤዥዦ", "የዩዪያዬይዮ",
  "ደዱዲዳዴድዶ", "ጀጁጂጃጄጅጆ", "ገጉጊጋጌግጎ", "ጠጡጢጣጤጥጦ", "ጨጩጪጫጬጭጮ", "ጰጱጲጳጴጵጶ",
  "ጸጹጺጻጼጽጾ", "ፀፁፂፃፄፅፆ", "ፈፉፊፋፌፍፎ", "ፐፑፒፓፔፕፖ", "ቨቩቪቫቬቭቮ",
];

export function Quest({ token, language, goDictionary }: Course & { goDictionary: () => void }) {
  const color = usePalette();
  const client = useQueryClient();
  const overview = useQuery({ queryKey: ["quests", language], queryFn: ({ signal }) => getQuests(token, language, signal) });
  const [selected, setSelected] = useState<string>();
  const [saved, setSaved] = useState<QuestState>();
  const [name, setName] = useState("");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [family, setFamily] = useState(fidelFamilies[16]);
  const [hint, setHint] = useState(false);
  const [feedback, setFeedback] = useState<string>();
  const [limit, setLimit] = useState(12);
  const item = overview.data?.quests.find((quest) => quest.id === selected);
  const state = saved ?? item?.state;
  const step = item && state ? item.steps[state.step_index] : undefined;
  const ownName = overview.data?.quests.flatMap((quest) => quest.state?.answers ?? []).find((answer) => answer.step_id === "name")?.text
    ?? state?.answers.find((answer) => answer.step_id === "name")?.text ?? "";
  const prompt = (value: string) => value.replaceAll("{name}", ownName);

  const start = useMutation({
    mutationFn: (quest: QuestItem) => startQuest(token, language, quest.id),
    onSuccess: (result, quest) => { setSelected(quest.id); setSaved(result); setFeedback(undefined); setHint(false); setName(""); },
  });
  const reply = useMutation({
    mutationFn: (answer: QuestReply) => replyToQuest(token, language, selected!, answer),
    onSuccess: (result) => {
      setSaved(result.state);
      setFeedback(result.accepted ? undefined : result.feedback ?? "Let’s try that together.");
      if (result.accepted) { setName(""); setHint(false); }
      else setHint(true);
      void client.invalidateQueries({ queryKey: ["quests", language] });
    },
  });
  const leave = () => { setSelected(undefined); setSaved(undefined); setFeedback(undefined); void overview.refetch(); };
  const answer = (wordId?: string) => {
    if (!item || !state || !step || reply.isPending) return;
    const value = name.trim();
    if (!wordId && !value) return;
    reply.mutate({ expected_step: state.step_index, version: item.version, ...(wordId ? { word_id: wordId } : { name: value }) });
  };
  const insert = (letter: string) => {
    const value = name.slice(0, selection.start) + letter + name.slice(selection.end);
    if (Array.from(value).length > 40) return;
    const position = selection.start + letter.length;
    setName(value);
    setSelection({ start: position, end: position });
  };

  if (overview.isPending) return <Loading label="Loading Fidel Quest" />;
  if (overview.error || !overview.data) return <Problem error={overview.error} retry={() => void overview.refetch()} />;
  if (selected && item && state) return <>
    <Button kind="quiet" icon="back" title="Back to the village" onPress={leave} />
    <Card style={{ backgroundColor: color.tint }}>
      <View style={row}><Character language={language} questId={item.id} width={48} /><View style={grow}><Heading>{item.title}</Heading><Label muted size={12}>{state.step_index} / {item.steps.length} replies saved</Label></View></View>
      <Progress value={state.step_index} total={item.steps.length} label="Conversation progress" />
    </Card>
    <View accessibilityLiveRegion="polite" style={{ gap: 10 }}>
      {state.answers.map((entry) => <View key={entry.step_id} style={{ gap: 5 }}>
        <Card style={{ alignSelf: "flex-start", backgroundColor: color.tint, maxWidth: "90%" }}><Copy>{prompt(item.steps.find((part) => part.id === entry.step_id)?.prompt ?? "")}</Copy></Card>
        <Card style={{ alignSelf: "flex-end", backgroundColor: color.panel, maxWidth: "90%" }}><Label muted size={11}>You · saved</Label><WordText size={18}>{entry.text}</WordText></Card>
      </View>)}
      <Card style={{ backgroundColor: color.tint }}><View style={row}><Character language={language} questId={item.id} width={42} /><Heading>{step ? prompt(step.prompt) : "A little conversation, a new connection."}</Heading></View></Card>
    </View>
    {feedback && <Card style={{ backgroundColor: color.errorBg }}><Label style={{ color: color.error }}>{feedback}</Label></Card>}
    {reply.error && <Problem error={reply.error} />}
    {state.completed ? <Card><Heading>Conversation completed and saved.</Heading><Button title="Back to the village" kind="gold" icon="arrow" onPress={leave} /></Card> :
      step?.kind === "name" ? <Card><Heading>Your name in {language === "om" ? "Qubee" : "fidel"}</Heading><Copy>Your own spelling is welcome.</Copy>
        <TextInput accessibilityLabel="Your name" value={name} onChangeText={setName} maxLength={40} autoCorrect={false}
          selection={selection} onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
          style={{ minHeight: 50, borderWidth: 1, borderColor: color.line, borderRadius: 7, paddingHorizontal: 12, color: color.ink, fontSize: 19 }} />
        {language !== "om" && <>
          <Button kind="quiet" title={keyboardOpen ? "Hide Fidel keyboard" : "Fidel character keyboard"} onPress={() => setKeyboardOpen(!keyboardOpen)} />
          {keyboardOpen && <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
              {fidelFamilies.map((entry) => <Press key={entry} selected={entry === family} label={`Letter family ${entry}`}
                onPress={() => setFamily(entry)} style={{ minHeight: 44, padding: 8, borderWidth: 1,
                  borderColor: entry === family ? color.gold : color.line, borderRadius: 6 }}><WordText size={16}>{entry[0]}</WordText></Press>)}
            </ScrollView>
            <View style={[row, { gap: 3 }]}>{Array.from(family).map((letter) => <Press key={letter} label={`Insert ${letter}`} onPress={() => insert(letter)}
              style={{ flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: color.line, borderRadius: 5 }}>
              <WordText size={20}>{letter}</WordText></Press>)}</View>
            <Button kind="quiet" title="Insert a space" onPress={() => insert(" ")} />
          </>}
        </>}
        <Button title="Reply" kind="gold" icon="arrow" busy={reply.isPending} disabled={!name.trim()} onPress={() => answer()} />
      </Card> : <Card><Heading>Reply from your word bank</Heading><Copy>Choose a collected word. No typing needed.</Copy>
        <Label muted size={12}>{overview.data.bank.length} words collected</Label>
        {overview.data.bank.slice(0, limit).map((word) => <Press key={word.id} onPress={() => answer(word.id)} disabled={reply.isPending}
          style={{ minHeight: 54, borderTopWidth: 1, borderColor: color.line, paddingVertical: 8 }}>
          <WordText size={18}>{word.text}</WordText><Label muted size={12}>{word.meaning} · {word.amharic ?? "Translation unavailable"}</Label>
        </Press>)}
        {overview.data.bank.length > limit && <Button title="More bank words" onPress={() => setLimit(limit + 12)} />}
        <Button kind="quiet" title={hint ? "Hide hint" : "A little hint"} onPress={() => setHint(!hint)} />
        {hint && item.required.filter((term) => step?.accepts.includes(term.key)).map((term) =>
          <Label key={term.key} size={13}>{term.text} · {term.english} · {term.amharic}</Label>)}
      </Card>}
  </>;
  return <>
    {start.error && <Problem error={start.error} />}
    <QuestVillageScreen overview={overview.data} language={language} onEnter={(quest) => start.mutate(quest)} goDictionary={goDictionary} pending={start.isPending} />
  </>;
}
