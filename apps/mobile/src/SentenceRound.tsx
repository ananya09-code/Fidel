import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { View } from "react-native";
import { submitSentenceAnswer, type SentenceExercise } from "@/lib/api/sentences";
import type { LearningLanguage } from "@/lib/languages";
import type { ApiToken } from "./api";
import { Character } from "./Character";
import { Audio, Button, Card, Copy, grow, Heading, Label, Press, Problem, row, usePalette, WordText } from "./ui";

export function SentenceRound({ token, language, exercise, onContinue }: {
  token: ApiToken; language: LearningLanguage; exercise: SentenceExercise; onContinue: () => void;
}) {
  const color = usePalette();
  const client = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const save = useMutation({
    mutationFn: () => submitSentenceAnswer(token, exercise.id, selected),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["dashboard", language] }); },
  });
  const result = save.data;
  return <>
    <Heading>Build a sentence</Heading>
    <Card style={{ backgroundColor: color.tint }}>
      <View style={[row, { alignItems: "flex-start" }]}>
        <Character language={language} width={82} />
        <View style={grow}><Label muted size={12}>Your companion says</Label>
          <Heading>{exercise.meaning ?? "Listen and put the words in order."}</Heading>
          {exercise.meaning_amharic && <WordText size={15}>{exercise.meaning_amharic}</WordText>}
        </View>
      </View>
      {exercise.audio_url && <Audio url={exercise.audio_url} label="the sentence" />}
    </Card>
    <Copy>Put the words in the order you would say them.</Copy>
    <Card><Label muted size={12}>Your sentence</Label>
      <View style={[row, { flexWrap: "wrap" }]}>
        {selected.length ? selected.map((id) => {
          const tile = exercise.tiles.find((entry) => entry.id === id)!;
          return <Press key={id} label={`Remove ${tile.text}`} disabled={save.isPending} onPress={() => { setSelected(selected.filter((item) => item !== id)); save.reset(); }}
            style={{ minHeight: 44, paddingHorizontal: 10, justifyContent: "center", borderRadius: 6, backgroundColor: color.tint, borderWidth: 1, borderColor: color.line }}>
            <WordText size={17}>{tile.text}</WordText>
          </Press>;
        }) : <Label muted>Choose the first word</Label>}
      </View>
    </Card>
    <Card><Label muted size={12}>Word bank</Label><View style={[row, { flexWrap: "wrap" }]}>
      {exercise.tiles.map((tile) => <Press key={tile.id} label={`Add ${tile.text}`} disabled={selected.includes(tile.id) || save.isPending || !!result?.is_correct}
        onPress={() => { setSelected([...selected, tile.id]); save.reset(); }} style={{ minHeight: 44, paddingHorizontal: 10,
          justifyContent: "center", borderRadius: 6, borderWidth: 1, borderColor: color.line, backgroundColor: color.panel }}>
        <WordText size={17}>{tile.text}</WordText>
      </Press>)}
    </View></Card>
    {result && <Card style={{ backgroundColor: result.is_correct ? color.tint : color.errorBg }}>
      <Heading>{result.is_correct ? "You built it." : "Try another order."}</Heading>
      <Copy>{result.is_correct ? result.sentence ?? "Your sentence is saved." : result.hint ?? "Choose a different order."}</Copy>
    </Card>}
    {save.error && <Problem error={save.error} />}
    {!result?.is_correct && <Button title="Check" kind="gold" icon="arrow" disabled={selected.length !== exercise.tiles.length} busy={save.isPending} onPress={() => save.mutate()} />}
    <Button title={result?.is_correct ? "Continue practice" : "Skip for now"} kind="quiet" onPress={onContinue} />
  </>;
}
