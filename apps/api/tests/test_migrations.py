"""Migration graph and fresh PostgreSQL schema generation tests."""

from contextlib import redirect_stdout
from io import StringIO

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory


def _config() -> Config:
    return Config("alembic.ini")


def test_revision_graph_matches_expected_head() -> None:
    script = ScriptDirectory.from_config(_config())

    assert script.get_current_head() == "0012_guided_tour"
    assert [revision.revision for revision in script.walk_revisions()] == [
        "0012_guided_tour",
        "0011_haptics_preference",
        "0010_review_language",
        "0009_quests",
        "0008_tigrinya_preferences",
        "0007_reviews",
        "0006_user_word_state",
        "0005_user_preferences",
        "0004_progress",
        "0003_users",
        "0002_batch_review",
        "0001_baseline",
    ]


def test_fresh_postgresql_upgrade_sql_contains_complete_schema(monkeypatch) -> None:
    """Generate all DDL without connecting to any database."""

    from app.db import database

    monkeypatch.setattr(
        database,
        "DATABASE_URL",
        "postgresql+psycopg://user:password@localhost/fidel",
    )
    output = StringIO()
    with redirect_stdout(output):
        command.upgrade(_config(), "head", sql=True)

    sql = output.getvalue()
    for table_name in (
        "words",
        "word_translations",
        "audio_recordings",
        "generation_batches",
        "users",
        "lesson_attempts",
        "answer_attempts",
        "user_words",
        "user_preferences",
        "review_sessions",
        "review_answers",
        "quest_progress",
    ):
        assert f"CREATE TABLE {table_name}" in sql

    assert "0005_user_preferences" in sql
    assert "0006_user_word_state" in sql
    assert "0007_reviews" in sql
    assert "0008_tigrinya_preferences" in sql
    assert "0010_review_language" in sql
    assert "0011_haptics_preference" in sql
    assert "0012_guided_tour" in sql
    assert "tour_completed_version" in sql
    assert "last_seen_update" in sql
    assert "haptics_enabled" in sql
    assert "sound_volume" in sql
    assert "user_preferences_sound_volume_check" in sql
    assert "review_sessions_one_in_progress_per_language" in sql
    assert "learning_language IN ('om','am','ti')" in sql
    assert "user_words_learning_state_check" in sql
    assert "lesson_attempts_one_in_progress_per_lesson" in sql
    assert "audio_recordings_one_active_per_config" in sql
