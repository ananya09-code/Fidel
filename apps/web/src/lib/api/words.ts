import { z } from "zod";

import { apiFetch } from "@/lib/api";

export const dictionaryTranslationSchema = z.object({
  language_code: z.string(),
  meaning: z.string(),
  context_note: z.string().nullable(),
});

export const dictionaryAudioSchema = z.object({
  available: z.boolean(),
  url: z.string().nullable(),
  speaker_id: z.string().nullable(),
  speed: z.string().nullable(),
});

export const dictionaryWordSchema = z.object({
  id: z.string(),
  language_code: z.string(),
  text: z.string(),
  transliteration: z.string().nullable(),
  content_type: z.string(),
  category: z.string(),
  difficulty: z.string(),
  meaning: z.string().nullable(),
  translations: z.array(dictionaryTranslationSchema),
  audio: dictionaryAudioSchema,
});

export const dictionaryPaginationSchema = z.object({
  page: z.number(),
  page_size: z.number(),
  total_items: z.number(),
  total_pages: z.number(),
  has_next: z.boolean(),
  has_previous: z.boolean(),
});

export const dictionaryResponseSchema = z.object({
  data: z.array(dictionaryWordSchema),
  meta: z.object({
    request_id: z.string(),
    pagination: dictionaryPaginationSchema,
  }),
});

export type DictionaryTranslation = z.infer<
  typeof dictionaryTranslationSchema
>;
export type DictionaryAudio = z.infer<typeof dictionaryAudioSchema>;
export type DictionaryWord = z.infer<typeof dictionaryWordSchema>;
export type DictionaryPagination = z.infer<
  typeof dictionaryPaginationSchema
>;
export type DictionaryResponse = z.infer<typeof dictionaryResponseSchema>;

export type DictionaryOverviewProps = {
  words?: DictionaryWord[];
  onPracticeWord?: (word: DictionaryWord) => void;
};

export type GetWordsParams = {
  language_code?: string;
  category?: string;
  difficulty?: string;
  content_type?: "word" | "phrase" | "sentence";
  page?: number;
  page_size?: number;
  search?: string;
};

export function getWords(
  params: GetWordsParams = {},
  signal?: AbortSignal,
): Promise<DictionaryResponse> {
  const query = new URLSearchParams();

  if (params.language_code) query.set("language_code", params.language_code);
  if (params.category) query.set("category", params.category);
  if (params.difficulty) query.set("difficulty", params.difficulty);
  if (params.content_type) query.set("content_type", params.content_type);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.page_size !== undefined) {
    query.set("page_size", String(params.page_size));
  }
  if (params.search) query.set("search", params.search);

  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  return apiFetch(
    `/api/v1/words${suffix}`,
    dictionaryResponseSchema,
    signal ? { signal } : undefined,
  );
}
