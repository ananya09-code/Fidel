import { useEffect, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollView, TextInput, View } from "react-native";
import { getWordCategories, getWords } from "@/lib/api/words";
import { getVocabularyState, updateVocabularyState, type VocabularyStateUpdate } from "@/lib/api/vocabulary";
import { learningLanguages, type LearningLanguage } from "@/lib/languages";
import type { ApiToken } from "./api";
import { topicName } from "./LearnerScreens";
import { Audio, Button, Card, Copy, grow, Heading, Icon, IconButton, Label, Loading, PageHeading, Press, Problem, row, usePalette, WordText } from "./ui";

export function Dictionary({ token, language, initialTopic, goReview }: { token: ApiToken; language: LearningLanguage; initialTopic?: string; goReview: () => void }) {
  const color = usePalette();
  const client = useQueryClient();
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState(initialTopic);
  const [expanded, setExpanded] = useState<string>();
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const key = ["vocabulary", language];
  const categories = useQuery({ queryKey: ["categories", language], queryFn: ({ signal }) => getWordCategories(language, signal), staleTime: 300_000 });
  const words = useInfiniteQuery({
    queryKey: ["dictionary", language, search, topic],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => getWords({ language_code: language, category: topic, search, page: pageParam, page_size: 20 }, signal),
    getNextPageParam: ({ meta }) => meta.pagination.has_next ? meta.pagination.page + 1 : undefined,
  });
  const vocabulary = useQuery({ queryKey: key, queryFn: ({ signal }) => getVocabularyState(token, language, signal) });
  const save = useMutation({
    mutationFn: ({ wordId, change }: { wordId: string; change: VocabularyStateUpdate }) => updateVocabularyState(token, wordId, change),
    onSuccess: (result) => {
      client.setQueryData<typeof vocabulary.data>(key, (old) => old ? { data: [...old.data.filter((item) => item.word_id !== result.word_id), result] } : old);
      void client.invalidateQueries({ queryKey: key });
      void client.invalidateQueries({ queryKey: ["reviews", language] });
      void client.invalidateQueries({ queryKey: ["spaced", language] });
      void client.invalidateQueries({ queryKey: ["dashboard", language] });
    },
  });
  const list = words.data?.pages.flatMap((page) => page.data) ?? [];
  const visible = favoritesOnly ? list.filter((word) => vocabulary.data?.data.some((state) => state.word_id === word.id && state.is_favorite)) : list;
  const total = words.data?.pages[0]?.meta.pagination.total_items;
  const stateByWord = new Map(vocabulary.data?.data.map((state) => [state.word_id, state]));
  const find = (value: string) => { setExpanded(undefined); setSearch(value.trim()); };
  useEffect(() => {
    const timeout = setTimeout(() => find(input), 250);
    return () => clearTimeout(timeout);
  }, [input]);
  const topics = categories.data?.data ?? [];
  const visibleTopics = topic && !topics.some((entry) => entry.name === topic) ? [topic, ...topics.map((entry) => entry.name)] : topics.map((entry) => entry.name);
  return <>
    <PageHeading title="Dictionary" detail={`Explore words in ${learningLanguages[language].name}.`} />
    <View style={[row, { paddingLeft: 12, borderColor: color.line, backgroundColor: color.panel, borderWidth: 1, borderRadius: 8, minHeight: 48 }]}>
      <Icon name="search" size={18} tint={color.muted} />
      <TextInput accessibilityLabel="Search vocabulary" placeholder="Find a word" placeholderTextColor={color.muted}
        value={input} onChangeText={setInput} onSubmitEditing={() => find(input)} returnKeyType="search" autoCapitalize="none"
        style={[grow, { color: color.ink, fontFamily: "Manrope", paddingVertical: 10, fontSize: 15 }]} />
      {input.length > 0 && <IconButton name="close" label="Clear search" onPress={() => { setInput(""); find(""); }} />}
      <Button kind="quiet" title="Search" onPress={() => find(input)} style={{ paddingHorizontal: 9 }} />
    </View>
    {categories.error && <Problem error={categories.error} retry={() => void categories.refetch()} />}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 7 }}>
      {[undefined, ...visibleTopics].map((name) => <Press key={name ?? "all"} selected={name === topic} onPress={() => { setTopic(name); setExpanded(undefined); }}
        style={{ minHeight: 44, justifyContent: "center", borderWidth: 1, borderColor: name === topic ? color.ink : color.line,
          borderRadius: 7, paddingHorizontal: 12, backgroundColor: name === topic ? color.tint : color.panel }}>
        <Label size={13} strong={name === topic}>{name ? topicName(name) : "All topics"}</Label>
      </Press>)}
    </ScrollView>
    {vocabulary.error && <Problem error={vocabulary.error} retry={() => void vocabulary.refetch()} />}
    {save.error && <Problem error={save.error} />}
    {!search && !topic && !favoritesOnly && list[0] && !words.isPending && !vocabulary.isPending && <Card style={{ backgroundColor: color.tint }}>
      <Label muted size={12}>Featured word · {topicName(list[0].category)}</Label>
      <WordText size={33}>{list[0].text}</WordText>
      {list[0].transliteration && <Label muted size={13}>{list[0].transliteration}</Label>}
      <View style={row}>
        <View style={grow}><Label muted size={12}>English</Label><Label strong>{list[0].translations.find((item) => item.language_code === "en")?.meaning ?? list[0].meaning ?? "Translation unavailable"}</Label></View>
        <View style={grow}><Label muted size={12}>Amharic</Label><WordText size={15}>{list[0].translations.find((item) => item.language_code === "am")?.meaning ?? "Translation unavailable"}</WordText></View>
      </View>
      <View style={row}>
        {list[0].audio.available && list[0].audio.url ? <Audio url={list[0].audio.url} label={list[0].text} /> : <Label muted size={12}>No approved recording yet.</Label>}
        <Button title={stateByWord.get(list[0].id)?.is_favorite ? "Saved" : "Save favorite"} kind="quiet"
          disabled={save.isPending || !vocabulary.data} onPress={() => save.mutate({ wordId: list[0].id, change: { is_favorite: !stateByWord.get(list[0].id)?.is_favorite } })} />
      </View>
    </Card>}
    {words.isPending ? <Loading label="Loading vocabulary" /> : words.error && !list.length ? <Problem error={words.error} retry={() => void words.refetch()} /> :
      !visible.length ? <Card><Heading>{favoritesOnly ? "No favorites in these words" : "No words found"}</Heading>
        <Copy>{favoritesOnly ? "Save a word or load more words to keep looking." : search || topic ? "Try another search or browse all topics." : "No words are available for this course yet."}</Copy>
        <Button title="Clear filters" onPress={() => { setFavoritesOnly(false); setTopic(undefined); setInput(""); find(""); }} />
      </Card> : <Card style={{ gap: 0, paddingVertical: 0 }}>
        <View style={[row, { paddingVertical: 13 }]}><View style={grow}><Heading>{topic ? topicName(topic) : "Vocabulary"}</Heading></View>
          <Label muted size={13}>{favoritesOnly ? `${visible.length} favorites in loaded words` : `${list.length} of ${total ?? list.length} words`}</Label></View>
        <Button title="Favorites" kind={favoritesOnly ? "gold" : "quiet"} onPress={() => setFavoritesOnly(!favoritesOnly)} />
        {visible.map((word) => {
          const state = stateByWord.get(word.id);
          const saved = state?.is_favorite ?? false;
          const opened = expanded === word.id;
          const english = word.translations.find((translation) => translation.language_code === "en");
          const amharic = word.translations.find((translation) => translation.language_code === "am");
          const meaning = english?.meaning ?? word.meaning ?? "Meaning unavailable";
          return <View key={word.id} style={{ borderTopWidth: 1, borderColor: color.line }}>
            <View style={row}>
              <Press onPress={() => { save.reset(); setExpanded(opened ? undefined : word.id); }} expanded={opened}
                style={[grow, row, { minHeight: 66, paddingVertical: 9 }]}>
                <View style={grow}>
                  <WordText size={21}>{word.text}</WordText>
                  <Label muted size={12}>{topicName(word.category)}</Label>
                  <View style={row}><View style={grow}><Label muted size={11}>English</Label><Label size={13}>{meaning}</Label></View>
                    <View style={grow}><Label muted size={11}>Amharic</Label><WordText size={13}>{amharic?.meaning ?? "Translation unavailable"}</WordText></View></View>
                  {state?.learning_state !== undefined && state.learning_state !== "learning" &&
                    <Label size={12} strong style={{ color: state.learning_state === "learned" ? color.success : color.muted }}>
                      {state.learning_state === "learned" ? "Learned" : "Needs review"}
                    </Label>}
                </View>
                <View style={{ transform: [{ rotate: opened ? "180deg" : "0deg" }] }}><Icon name="chevron" size={17} tint={color.muted} /></View>
              </Press>
              <IconButton name="bookmark" label={saved ? `Remove ${word.text} from favorites` : `Save ${word.text} as favorite`}
                tint={saved ? (color.dark ? "#efb567" : "#955810") : color.muted} disabled={!vocabulary.data || save.isPending}
                onPress={() => save.mutate({ wordId: word.id, change: { is_favorite: !saved } })} />
            </View>
            {opened && <View style={{ gap: 8, paddingBottom: 14 }}>
              {word.transliteration && <Label muted size={13}>{word.transliteration}</Label>}
              {word.audio.available && word.audio.url ? <Audio url={word.audio.url} label={word.text} /> : <Label muted size={13}>No approved recording yet.</Label>}
              <View style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}>
                <Button title={state?.learning_state === "learned" ? "Learned" : "Mark as learned"} icon="check"
                  disabled={!vocabulary.data || save.isPending || stateByWord.get(word.id)?.learning_state === "learned"}
                  onPress={() => save.mutate({ wordId: word.id, change: { learning_state: "learned" } })} />
                <Button title={state?.learning_state === "needs_review" ? "In review queue" : "Needs review"}
                  disabled={!vocabulary.data || save.isPending || stateByWord.get(word.id)?.learning_state === "needs_review"}
                  onPress={() => save.mutate({ wordId: word.id, change: { learning_state: "needs_review" } })} />
              </View>
              <Button title="Practice this word" kind="gold" icon="arrow" disabled={!vocabulary.data || save.isPending}
                onPress={() => save.mutate({ wordId: word.id, change: { learning_state: "needs_review" } }, { onSuccess: goReview })} />
            </View>}
          </View>;
        })}
      </Card>}
    {words.isFetchNextPageError ? <Problem error={words.error} retry={() => void words.fetchNextPage()} /> :
      words.hasNextPage && <Button title="Load more words" busy={words.isFetchingNextPage} onPress={() => void words.fetchNextPage()} />}
  </>;
}
