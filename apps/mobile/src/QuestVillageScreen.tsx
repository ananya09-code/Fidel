import { useState } from "react";
import { Image, View } from "react-native";
import type { QuestItem, QuestOverview } from "@/lib/api/quests";
import { characterForQuest } from "@/lib/character-cast";
import { learningLanguages, type LearningLanguage } from "@/lib/languages";
import { Audio, Button, Icon, Label, Press, row, usePalette, WordText } from "./ui";
import { Character } from "./Character";

type Props = {
  overview: QuestOverview;
  language: LearningLanguage;
  onEnter: (quest: QuestItem) => void;
  goDictionary: () => void;
  pending?: boolean;
};

const houses = [
  { x: 137, y: 242 }, { x: 506, y: 310 }, { x: 351, y: 206 },
  { x: 213, y: 472 }, { x: 479, y: 515 },
];

export function QuestVillageScreen({ overview, language, onEnter, goDictionary, pending = false }: Props) {
  const color = usePalette();
  const [mapWidth, setMapWidth] = useState(340);
  const [inspected, setInspected] = useState<string>();
  const [limit, setLimit] = useState(12);
  const next = overview.quests.find((quest) => !quest.state?.completed) ?? overview.quests.at(-1);
  const guide = next ? characterForQuest(language, next.id, next.character) : undefined;
  const scale = mapWidth / 680;
  const heading = (text: string, size: number) => <Label strong size={size} style={{ letterSpacing: -0.4 }}>{text}</Label>;

  return <View style={{ gap: 22 }}>
    <View style={{ gap: 6 }}>
      <Label muted size={12}>{learningLanguages[language].name} · Conversations</Label>
      {heading("Fidel Quest.", 27)}
      <Label muted size={14}>A few words. A new place to belong.</Label>
    </View>
    <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line, paddingVertical: 11 }}>
      <Label muted size={12}>{overview.quests.length} little adventures · Your conversations are saved as you go.</Label>
    </View>
    <View style={{ borderWidth: 1, borderColor: color.line, borderRadius: 12, overflow: "hidden", backgroundColor: color.panel }}>
      <View style={{ padding: 18, gap: 5 }}>
        {heading("A village of little conversations", 19)}
        <Label muted size={13}>Follow the path. Knock on a door. Let your words take you inside.</Label>
        <Label muted size={12}>{overview.quests.filter((quest) => quest.state?.completed).length} / {overview.quests.length} visited</Label>
      </View>
      <View onLayout={(event) => setMapWidth(event.nativeEvent.layout.width)} style={{ width: "100%", aspectRatio: 680 / 620, backgroundColor: color.paper }}>
        <Image source={color.dark ? require("../assets/quest/village-dark.png") : require("../assets/quest/village.png")}
          resizeMode="stretch" style={{ width: "100%", height: "100%" }} />
        <View style={{ position: "absolute", top: 8, alignSelf: "center", backgroundColor: "#193b31", paddingHorizontal: 15, paddingVertical: 4, borderRadius: 4 }}>
          <Label strong size={12} style={{ color: "#f8faf7" }}>The village trail</Label>
        </View>
        {overview.quests.slice(0, houses.length).map((quest, index) => {
          const house = houses[index];
          const name = characterForQuest(language, quest.id, quest.character).name;
          const done = Boolean(quest.state?.completed);
          return <Press key={quest.id} label={`${quest.title} with ${name}${quest.locked && !done ? ", locked" : ""}`}
            disabled={pending || (quest.locked && !done)} onPress={() => onEnter(quest)}
            style={{ position: "absolute", left: house.x * scale - 42, top: house.y * scale - 36,
              width: 84, height: 94, alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ alignSelf: "flex-end", width: 24, height: 24, borderRadius: 12,
              backgroundColor: done || !quest.locked ? color.gold : color.panel,
              borderWidth: 1, borderColor: done || !quest.locked ? color.gold : color.line,
              alignItems: "center", justifyContent: "center" }}>
              {done || quest.locked ? <Icon name={done ? "check" : "lock"} size={13} tint={done ? color.goldInk : color.muted} /> :
                <Label strong size={11} style={{ color: color.goldInk }}>{index + 1}</Label>}
            </View>
            <View style={{ alignItems: "center", paddingHorizontal: 5, paddingVertical: 3, borderRadius: 4,
              backgroundColor: color.paper, borderWidth: 1, borderColor: color.line, maxWidth: 84 }}>
              <Label strong size={11} style={{ textAlign: "center" }}>{quest.title}</Label>
              <Label muted size={10}>{name}</Label>
            </View>
          </Press>;
        })}
      </View>
      <View style={{ padding: 14, borderTopWidth: 1, borderColor: color.line }}>
        <Label muted size={12}>Each door opens with the previous conversation and its collected words.</Label>
      </View>
    </View>
    {next && <View style={{ borderWidth: 1, borderColor: color.line, borderRadius: 12, padding: 18, gap: 15, backgroundColor: color.tint }}>
      <View style={[row, { gap: 12 }]}>
        <Character language={language} questId={next.id} width={46} />
        <View style={{ flex: 1, gap: 3 }}><Label muted size={12}>A note from {guide?.name}</Label>{heading(next.title, 18)}</View>
      </View>
      <Label muted size={13}>{next.description}</Label>
      <View style={{ borderTopWidth: 1, borderColor: color.line, paddingTop: 13, gap: 10 }}>
        <View style={[row, { justifyContent: "space-between" }]}>
          {heading("Pack for this conversation", 14)}
          <Label muted size={12}>{next.required.length - next.missing_words.length} / {next.required.length} words</Label>
        </View>
        {next.required.map((term) => <View key={term.key} style={[row, { borderTopWidth: 1, borderColor: color.line, paddingTop: 9 }]}>
          <Icon name={next.missing_words.includes(term.key) ? "lock" : "check"} size={16} tint={next.missing_words.includes(term.key) ? color.muted : color.success} />
          <View style={{ flex: 1, gap: 2 }}><WordText size={17}>{term.text}</WordText><Label muted size={11}>{term.english} · {term.amharic}</Label></View>
        </View>)}
      </View>
      {next.reasons.map((reason) => <Label key={reason} muted size={12}>{reason}</Label>)}
      <Button kind="gold" title={next.state?.completed ? "Revisit conversation" : next.state ? "Continue conversation" : "Start conversation"}
        icon="arrow" disabled={pending || (next.locked && !next.state?.completed)} onPress={() => onEnter(next)} />
      {next.missing_words.length > 0 && <Button kind="quiet" title="Find the missing words" icon="arrow" onPress={goDictionary} />}
    </View>}
    <View style={{ borderWidth: 1, borderColor: color.line, borderRadius: 12, padding: 18, gap: 10, backgroundColor: color.panel }}>
      <View style={[row, { justifyContent: "space-between" }]}>{heading("Words in your pouch", 18)}<Label muted size={12}>{overview.bank.length} collected</Label></View>
      <Label muted size={12}>Tap a word to unpack its meaning and hear it.</Label>
      {overview.bank.length ? overview.bank.slice(0, limit).map((word) => <View key={word.id} style={{ borderTopWidth: 1, borderColor: color.line }}>
        <Press label={`${word.text}, ${word.meaning}`} expanded={inspected === word.id} onPress={() => setInspected(inspected === word.id ? undefined : word.id)}
          style={[row, { minHeight: 50, gap: 10 }]}><WordText size={17}>{word.text}</WordText><View style={{ flex: 1 }} /><Icon name="chevron" size={15} /></Press>
        {inspected === word.id && <View style={{ paddingBottom: 12, gap: 8 }}>
          <Label size={12}>{word.meaning} · {word.amharic ?? "Translation unavailable"}</Label>
          {word.audio_url ? <Audio url={word.audio_url} label={word.text} compact /> : <Label muted size={11}>No approved recording yet.</Label>}
        </View>}
      </View>) : <Label muted size={13}>Learn a word to fill your pouch.</Label>}
      {overview.bank.length > limit && <Button title="More bank words" onPress={() => setLimit(limit + 12)} />}
    </View>
  </View>;
}
