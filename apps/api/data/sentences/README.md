# Build a sentence content

Exercises are authored as JSON and must be checked by a fluent speaker before import. No sample translation or sentence is shipped as published learning content.

Each item needs `language_code` (`am`, `om`, or `ti`), `sentence` (the full spoken text), `meaning` (English), `meaning_amharic`, `tiles`, and `accepted_order`. A tile has `word` (the exact text of an existing approved vocabulary entry) and `text` (the form shown in the sentence). `accepted_order` lists the zero-based tile indexes in correct order. Repeated words may appear in multiple tiles.

```json
[
  {
    "language_code": "om",
    "sentence": "<speaker-reviewed sentence>",
    "meaning": "<speaker-reviewed meaning>",
    "meaning_amharic": "<speaker-reviewed Amharic meaning>",
    "tiles": [
      {"word": "<exact approved word>", "text": "<display form>"},
      {"word": "<exact approved word>", "text": "<display form>"}
    ],
    "accepted_order": [1, 0]
  }
]
```

Preview with `uv run python scripts/import_sentences.py --file reviewed.json`. After migration `0014_sentence_building` is applied to the intended database and the content is reviewed, add `--write` to insert draft sentences and their exercise definitions. The command is idempotent for an existing sentence; changing an existing exercise requires an editorial review and a separate update. In Audio review, select **Sentences**, generate recordings, and approve each recording. The learner exercise stays locked until the full sentence audio is approved and the learner has learned every required word.
