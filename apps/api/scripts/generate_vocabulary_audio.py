from app.services.storage import upload_audio
from app.db.database import SessionLocal
from addisai import AddisAI
from sqlalchemy import text
from dotenv import load_dotenv
import sys
import os
import argparse
import re
import tempfile
from pathlib import Path

# --------------------------------------------------
# Configure Python imports BEFORE importing app
# --------------------------------------------------

API_ROOT = Path(__file__).resolve().parents[1]

if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

# --------------------------------------------------
# Third-party imports
# --------------------------------------------------


# --------------------------------------------------
# Project imports
# --------------------------------------------------


# Load apps/api/.env
load_dotenv(API_ROOT / ".env")

LANGUAGE_CODE = "om"
DEFAULT_VOICE_ID = "om-hawi"
SPEED = "normal"


def create_addis_client():
    """Initialize the Addis AI client."""
    api_key = os.getenv("ADDIS_API_KEY")

    if not api_key:
        raise RuntimeError(
            f"ADDIS_API_KEY is missing from {API_ROOT / '.env'}"
        )

    return AddisAI(api_key=api_key)


def make_speech_text(word: str, content_type: str) -> str:
    """Add a pause after isolated words for better pronunciation."""
    if content_type == "word":
        return f"{word}..."

    return word


def safe_filename(value: str) -> str:
    """Create a safe temporary filename."""
    value = re.sub(r"[^\w-]+", "-", value.strip(), flags=re.UNICODE)
    return value.strip("-") or "word"


def generate_mp3(
    addis,
    speech_text: str,
    output_path: Path,
    voice_id: str,
) -> int | None:
    """Generate an MP3 and return its duration in milliseconds."""
    clip = addis.voice.generate(
        voice_id=voice_id,
        text=speech_text,
        language=LANGUAGE_CODE,
        output_format="mp3_44100",
    )

    clip.to_file(str(output_path))

    duration = getattr(clip, "duration_seconds", None)

    if duration is None:
        return None

    return round(duration * 1000)


def main():
    parser = argparse.ArgumentParser(
        description="Generate and upload Afaan Oromoo vocabulary audio."
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=5,
        help="Maximum number of words to process.",
    )

    parser.add_argument(
        "--voice",
        default=DEFAULT_VOICE_ID,
        help="Addis AI voice ID.",
    )

    args = parser.parse_args()

    if args.limit < 1:
        parser.error("--limit must be at least 1")

    voice_id = args.voice
    addis = create_addis_client()

    generated = 0
    failed = 0

    print(f"API directory: {API_ROOT}")
    print(f"Language: Afaan Oromoo ({LANGUAGE_CODE})")
    print(f"Voice: {voice_id}")
    print(f"Limit: {args.limit}")

    with SessionLocal() as session:
        words = session.execute(
            text("""
                SELECT
                    w.id,
                    w.text,
                    w.content_type
                FROM words AS w
                WHERE w.language_code = :language_code
                  AND NOT EXISTS (
                      SELECT 1
                      FROM audio_recordings AS a
                      WHERE a.word_id = w.id
                        AND a.speed = :speed
                        AND a.speaker_id = :speaker_id
                  )
                ORDER BY w.created_at, w.text
                LIMIT :limit
            """),
            {
                "language_code": LANGUAGE_CODE,
                "speed": SPEED,
                "speaker_id": voice_id,
                "limit": args.limit,
            },
        ).mappings().all()

        print(f"\nEligible words found: {len(words)}")

        if not words:
            print("No words need audio for this voice and speed.")
            return

        for word in words:
            word_id = str(word["id"])
            original_text = word["text"]
            content_type = word["content_type"]

            storage_key = (
                f"afaan-oromoo/words/{word_id}/"
                f"{voice_id}-{SPEED}.mp3"
            )

            print(f"\nProcessing: {original_text}")

            try:
                speech_text = make_speech_text(
                    original_text,
                    content_type,
                )

                # Temporary files are removed automatically.
                with tempfile.TemporaryDirectory() as temp_dir:
                    output_path = (
                        Path(temp_dir)
                        / f"{safe_filename(original_text)}.mp3"
                    )

                    # 1. Generate the audio.
                    duration_ms = generate_mp3(
                        addis,
                        speech_text,
                        output_path,
                        voice_id,
                    )

                    if (
                        not output_path.is_file()
                        or output_path.stat().st_size == 0
                    ):
                        raise RuntimeError(
                            "Addis AI produced an empty MP3."
                        )

                    print(
                        f"Generated: {output_path.stat().st_size:,} bytes"
                    )

                    # 2. Upload audio to Neon object storage.
                    upload_audio(
                        str(output_path),
                        storage_key,
                    )

                print(f"Uploaded: {storage_key}")

                # 3. Register the uploaded audio in PostgreSQL.
                session.execute(
                    text("""
                        INSERT INTO audio_recordings (
                            word_id,
                            storage_key,
                            speaker_id,
                            speed,
                            duration_ms,
                            status
                        )
                        VALUES (
                            :word_id,
                            :storage_key,
                            :speaker_id,
                            :speed,
                            :duration_ms,
                            'pending'
                        )
                        ON CONFLICT (word_id, storage_key) DO NOTHING
                    """),
                    {
                        "word_id": word_id,
                        "storage_key": storage_key,
                        "speaker_id": voice_id,
                        "speed": SPEED,
                        "duration_ms": duration_ms,
                    },
                )

                session.commit()
                generated += 1

                print("Database record saved: pending")

            except Exception as exc:
                session.rollback()
                failed += 1

                print(f"FAILED: {original_text}")
                print(f"Error: {exc}")

    print("\n" + "=" * 40)
    print("AUDIO GENERATION SUMMARY")
    print("=" * 40)
    print(f"Successfully processed: {generated}")
    print(f"Failed: {failed}")
    print("Recording status: pending review")


if __name__ == "__main__":
    main()
