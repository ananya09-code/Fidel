import { useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, TextInput } from "react-native";
import { getWords } from "@/lib/api/words";
import { getVocabularyState, updateVocabularyState } from "@/lib/api/vocabulary";
import type { LearningLanguage } from "@/lib/languages";
import type { ApiToken } from "./api";
import { Audio, Button, Card, Copy, Loading, Problem, Title, usePalette } from "./ui";

export function Dictionary({ token, language }: { token: ApiToken; language: LearningLanguage }) {
  const palette = usePalette();
  const client = useQueryClient();
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string>();
  const key = ["vocabulary", language];
  const words = useInfiniteQuery({
    queryKey: ["dictionary", language, search],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => getWords({
      language_code: language, search, page: pageParam, page_size: 20,
    }, signal),
    getNextPageParam: ({ meta }) => meta.pagination.has_next ? meta.pagination.page + 1 : undefined,
  });
  const vocabulary = useQuery({ queryKey: key, queryFn: ({ signal }) => getVocabularyState(token, language, signal) });
  const save = useMutation({
    mutationFn: ({ wordId, favorite }: { wordId: string; favorite: boolean }) => updateVocabularyState(token, wordId, { is_favorite: favorite }),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
  const list = words.data?.pages.flatMap((page) => page.data) ?? [];
  const find = () => { setExpanded(undefined); setSearch(input.trim()); };
  return <>
    <Title>Dictionary</Title>
    <TextInput accessibilityLabel="Search vocabulary" placeholder="Find a word" placeholderTextColor={palette.muted}
      value={input} onChangeText={setInput} onSubmitEditing={find} returnKeyType="search"
      style={{ color: palette.ink, backgroundColor: palette.panel, borderColor: palette.line, borderWidth: 1, borderRadius: 13, minHeight: 50, paddingHorizontal: 15 }} />
    <Button title="Search" primary onPress={find} />
    {words.isPending ? <Loading /> : words.error ?
      <Problem error={words.error} retry={() => void words.refetch()} /> :
      !list.length ? <Card><Copy>{search ? "No words found for that search." : "No words are available for this course yet."}</Copy></Card> : null}
    {vocabulary.error && <Problem error={vocabulary.error} retry={() => void vocabulary.refetch()} />}
    {save.error && <Problem error={save.error} />}
    {list.map((word) => {
      const favorite = vocabulary.data?.data.find((state) => state.word_id === word.id)?.is_favorite ?? false;
      const english = word.translations.find((translation) => translation.language_code === "en");
      const amharic = word.translations.find((translation) => translation.language_code === "am");
      return <Card key={word.id}>
        <Text selectable style={{ color: palette.ink, fontWeight: "800", fontSize: 23 }}>{word.text}</Text>
        <Copy>{english?.meaning ?? word.meaning ?? "Meaning unavailable."}</Copy>
        {amharic?.meaning && <Copy>{amharic.meaning}</Copy>}
        {expanded === word.id ? <>
          {word.audio.available && word.audio.url ? <Audio url={word.audio.url} /> : <Copy>Pronunciation audio unavailable.</Copy>}
          <Button title={favorite ? "Remove favorite" : "Save as favorite"} disabled={!vocabulary.data || save.isPending}
            onPress={() => save.mutate({ wordId: word.id, favorite: !favorite })} />
          <Button title="Close word" onPress={() => setExpanded(undefined)} />
        </> : <Button title="Open word" onPress={() => { save.reset(); setExpanded(word.id); }} />}
      </Card>;
    })}
    {words.hasNextPage && <Button title={words.isFetchingNextPage ? "Loading more…" : "Load more words"}
      disabled={words.isFetchingNextPage} onPress={() => void words.fetchNextPage()} />}
  </>;
}
