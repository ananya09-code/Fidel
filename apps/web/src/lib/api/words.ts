
export type DictionaryTranslation = {
  language_code: string;
  meaning: string;
  context_note: string | null;
};

export type DictionaryAudio = {
  available: boolean;
  url: string | null;
  speaker_id: string | null;
  speed: string | null;
};

export type DictionaryWord = {
  id: string;
  language_code: string;
  text: string;
  transliteration: string | null;
  content_type: string;
  category: string;
  difficulty: string;
  meaning: string;
  translations: DictionaryTranslation[];
  audio: DictionaryAudio | null;
};

export type DictionaryPagination = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type DictionaryResponse = {
  data: DictionaryWord[];
  meta: {
    request_id: string;
    pagination: DictionaryPagination;
  };
};

export type DictionaryOverviewProps = {
  words?: DictionaryWord[];
  onPracticeWord?: (word: DictionaryWord) => void;
};
export interface Word {
  id: number;
  word: string;
  translation: string;
  language: string;
  pronunciation?: string | null;
  audio_url?: string | null;
  example_sentence?: string | null;
  created_at?: string;
}

export interface WordsResponse {
  items: Word[];
  total: number;
  page: number;
  page_size: number;
}

export interface GetWordsParams {
  language?: string;
  page?: number;
  page_size?: number;
  search?: string;
}

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export async function getWords(
  params: GetWordsParams = {},
  signal?: AbortSignal,
): Promise<WordsResponse> {
  const query = new URLSearchParams();

  if (params.language) query.set("language", params.language);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.page_size !== undefined) {
    query.set("page_size", String(params.page_size));
  }
  if (params.search) query.set("search", params.search);

  const response = await fetch(
    `${API_URL}/api/v1/words?${query.toString()}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch words: ${response.status}`);
  }

  return response.json() as Promise<WordsResponse>;
}
