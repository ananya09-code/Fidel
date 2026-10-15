"""Tests for the speech-input builder used by the audio pipeline.

These tests only inspect the text that would be handed to Addis AI. They
never call the speech service, never touch object storage, and never write to
PostgreSQL.
"""

import importlib.util
from pathlib import Path

import pytest

SCRIPT_PATH = (
    Path(__file__).resolve().parents[1] / "scripts" / "generate_vocabulary_audio.py"
)


def _load_pipeline():
    """Load the pipeline script as a module without executing main()."""
    spec = importlib.util.spec_from_file_location(
        "generate_vocabulary_audio", SCRIPT_PATH
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


pipeline = _load_pipeline()
make_speech_text = pipeline.make_speech_text


# --------------------------------------------------
# Single words
# --------------------------------------------------


@pytest.mark.parametrize(
    ("word", "expected"),
    [
        ("akkam", "akkam.."),
        ("nagaa", "nagaa.."),
        ("akkam..", "akkam.."),
        ("akkam.", "akkam.."),
    ],
)
def test_single_word_gets_two_dots(word: str, expected: str) -> None:
    """A single word is sent with exactly two trailing dots."""
    assert make_speech_text(word, "word") == expected


def test_make_speech_text_is_idempotent() -> None:
    """Re-running the builder never stacks more than two dots."""
    once = make_speech_text("akkam", "word")
    assert make_speech_text(once, "word") == once == "akkam.."


def test_single_word_sent_to_addis_has_exactly_two_dots() -> None:
    """The speech payload for 'akkam'/'nagaa' is exactly '<word>..'."""
    assert make_speech_text("akkam", "word") == "akkam.."
    assert make_speech_text("nagaa", "word") == "nagaa.."


def test_single_word_without_dots_is_not_sent_verbatim() -> None:
    """The dots are appended by the builder, not stored in the vocabulary."""
    assert make_speech_text("nagaa", "word") != "nagaa"


# --------------------------------------------------
# Multi-word phrases and sentences
# --------------------------------------------------


@pytest.mark.parametrize(
    "phrase",
    ["akkam jirta", "akkam bultan", "akkam oolte"],
)
def test_multiword_phrase_is_unchanged(phrase: str) -> None:
    """Phrases and sentences are passed through untouched."""
    assert make_speech_text(phrase, "phrase") == phrase


def test_multiword_text_with_word_content_type_is_unchanged() -> None:
    """A multi-word string is never given dots, whatever the content type."""
    assert make_speech_text("akkam jirta", "word") == "akkam jirta"


def test_sentence_is_unchanged() -> None:
    """Sentence content types are sent verbatim."""
    text = "Akkaan jira."
    assert make_speech_text(text, "sentence") == text


# --------------------------------------------------
# Whitespace handling
# --------------------------------------------------


@pytest.mark.parametrize(
    "raw", [" akkam ", "\takkam\n", "   nagaa  "]
)
def test_surrounding_whitespace_is_stripped_for_single_words(raw: str) -> None:
    """Leading/trailing whitespace is removed before the dots are added."""
    result = make_speech_text(raw, "word")

    assert result == result.strip()
    assert result.endswith("..")
    assert result[:-2] == raw.strip()


@pytest.mark.parametrize("raw", [" akkam jirta ", "  akkam bultan  "])
def test_surrounding_whitespace_is_stripped_for_phrases(raw: str) -> None:
    """Phrases keep their internal spacing and lose only outer whitespace."""
    assert make_speech_text(raw, "phrase") == raw.strip()


# --------------------------------------------------
# Empty input
# --------------------------------------------------


@pytest.mark.parametrize("raw", ["", " ", "\t\n", None])
def test_empty_input_produces_empty_speech_text(raw) -> None:
    """Blank text is never sent to Addis AI (clean_word_text rejects it)."""
    assert make_speech_text(raw, "word") == ""
    assert make_speech_text(raw, "phrase") == ""