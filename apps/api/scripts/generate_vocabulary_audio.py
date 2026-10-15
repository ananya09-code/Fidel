import sys
import argparse
import tempfile
from pathlib import Path

# --------------------------------------------------
# Configure Python imports BEFORE importing app
# --------------------------------------------------

API_ROOT = Path(__file__).resolve().parents[1]

if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.services.storage import (  # noqa: E402
    delete_audio,
    upload_audio,
)
from app.services.speech import (  # noqa: E402
    DEFAULT_VOICE_ID,
    LANGUAGE_CODE,
    SPEED,
    clean_word_text,
    create_addis_client,
    generate_mp3,
    make_speech_text,
    safe_filename,
)
from app.db.database import SessionLocal  # noqa: E402
from sqlalchemy import text  # noqa: E402
from dotenv import load_dotenv  # noqa: E402

# --------------------------------------------------
# Third-party imports
# --------------------------------------------------


# --------------------------------------------------
# Project imports
# --------------------------------------------------


# Load apps/api/.env
load_dotenv(API_ROOT / ".env")

# The speech helpers now live in app.services.speech so the batch API and this
# script share one implementation. They are re-exported here so existing
# callers and tests keep working.

__all__ = [
    "DEFAULT_VOICE_ID",
    "LANGUAGE_CODE",
    "SPEED",
    "clean_word_text",
    "create_addis_client",
    "generate_mp3",
    "main",
    "make_speech_text",
    "safe_filename",
]


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
    uploaded = 0
    inserted = 0
    failed = 0
    orphaned = []

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

        print(f"\nEligible words selected: {len(words)}")

        if not words:
            print("No words need audio for this voice and speed.")
            return

        for word in words:
            word_id = str(word["id"])
            raw_text = word["text"]
            content_type = word["content_type"]

            storage_key = (
                f"afaan-oromoo/words/{word_id}/"
                f"{voice_id}-{SPEED}.mp3"
            )

            print(f"\nProcessing: {raw_text}")

            uploaded_this_run = False

            try:
                original_text = clean_word_text(raw_text)

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
                    generated += 1

                    # 2. Upload audio to object storage. If this fails we
                    # never reach the database insert below.
                    upload_audio(
                        str(output_path),
                        storage_key,
                    )
                    uploaded_this_run = True
                    uploaded += 1

                print(f"Uploaded: {storage_key}")

                # 3. Register the uploaded audio in PostgreSQL. Status stays
                # 'pending' -- pronunciation review is a separate, human step.
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
                inserted += 1

                print("Database record saved: pending")

            except Exception as exc:
                session.rollback()
                failed += 1

                print(f"FAILED: {raw_text}")
                print(f"Error: {exc}")

                # The object may already be in storage; remove it so we do
                # not leave an upload with no database record.
                if uploaded_this_run:
                    try:
                        delete_audio(storage_key)
                        print(
                            f"Cleaned up orphaned object: {storage_key}"
                        )
                    except Exception as cleanup_exc:
                        orphaned.append(storage_key)
                        print(
                            "ORPHANED OBJECT (could not delete): "
                            f"{storage_key}"
                        )
                        print(f"Cleanup error: {cleanup_exc}")

    print("\n" + "=" * 40)
    print("AUDIO GENERATION SUMMARY")
    print("=" * 40)
    print(f"Words selected:      {len(words)}")
    print(f"Audio generated:     {generated}")
    print(f"Uploads succeeded:  {uploaded}")
    print(f"Rows inserted:      {inserted}")
    print(f"Failed:             {failed}")
    print(f"Orphaned objects:   {len(orphaned)}")
    print("Recording status: pending review")


if __name__ == "__main__":
    main()
