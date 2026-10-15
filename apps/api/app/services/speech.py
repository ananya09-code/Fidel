"""Speech-input preparation and Addis AI audio generation.

Shared by the CLI script (``scripts/generate_vocabulary_audio.py``) and the
batch API so there is exactly one implementation of the speech rules.
"""

from __future__ import annotations

import os
import re
from pathlib import Path

from addisai import AddisAI

API_ROOT = Path(__file__).resolve().parents[2]
LANGUAGE_CODE = "om"
DEFAULT_VOICE_ID = "om-hawi"
SPEED = "normal"
OUTPUT_FORMAT = "mp3_44100"


def create_addis_client(api_key: str | None = None) -> AddisAI:
    """Initialize the Addis AI client."""
    if api_key is None:
        from dotenv import load_dotenv

        load_dotenv(API_ROOT / ".env")
        api_key = os.getenv("ADDIS_API_KEY")

    if not api_key:
        raise RuntimeError(f"ADDIS_API_KEY is missing from {API_ROOT / '.env'}")

    return AddisAI(api_key=api_key)


def make_speech_text(word: str, content_type: str) -> str:
    """Build the text handed to the speech model.

    The stored vocabulary text is never modified. An isolated word is sent
    with exactly two trailing dots (``"akkam"`` -> ``"akkam.."``), which makes
    the ``om-hawi`` voice pronounce it as one natural, properly closed word
    instead of a clipped fragment. Multi-word phrases and sentences are sent
    verbatim (``"akkam jirta"`` -> ``"akkam jirta"``).

    The dots exist only in this speech input; PostgreSQL keeps the original
    text and translations untouched.
    """
    text_value = (word or "").strip()

    if not text_value:
        return ""

    is_single_word = content_type == "word" and len(text_value.split()) == 1

    if is_single_word:
        # rstrip trailing dots so the result is always "<word>.." and the
        # function stays idempotent.
        return f"{text_value.rstrip('.')}.."

    return text_value


def clean_word_text(raw_text: str) -> str:
    """Return a usable vocabulary word, or raise for blank/invalid text."""
    text_value = (raw_text or "").strip()

    if not text_value:
        raise ValueError("Vocabulary text is empty.")

    # Reject whitespace-separated letters ("a k k a m"), which the model
    # would read out letter by letter, and hard punctuation-only text.
    if len(text_value) > 1 and " " not in text_value:
        if len(text_value.split("-")) >= 4:
            raise ValueError(f"Text looks like a spelled-out word: {text_value!r}")

    if not any(ch.isalnum() for ch in text_value):
        raise ValueError(f"Text contains no letters or digits: {text_value!r}")

    return text_value


def safe_filename(value: str) -> str:
    """Create a safe temporary filename."""
    value = re.sub(r"[^\w-]+", "-", value.strip(), flags=re.UNICODE)
    return value.strip("-") or "word"


def generate_mp3(
    addis: AddisAI,
    speech_text: str,
    output_path: Path,
    voice_id: str = DEFAULT_VOICE_ID,
) -> int | None:
    """Generate an MP3 and return its duration in milliseconds."""
    clip = addis.voice.generate(
        voice_id=voice_id,
        text=speech_text,
        language=LANGUAGE_CODE,
        output_format=OUTPUT_FORMAT,
    )

    clip.to_file(str(output_path))

    duration = getattr(clip, "duration_seconds", None)

    if duration is None:
        return None

    return round(duration * 1000)


def build_storage_key(word_id: str, voice_id: str, speed: str, attempt: int = 1) -> str:
    """Build the object key for a recording.

    The first attempt keeps the established key exactly as-is. Regeneration
    attempts get an ``-aN`` suffix so the previous MP3 is never overwritten.
    """
    suffix = "" if attempt <= 1 else f"-a{attempt}"
    return f"afaan-oromoo/words/{word_id}/{voice_id}-{speed}{suffix}.mp3"