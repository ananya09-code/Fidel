"""Execute the preference constraint migration on an isolated database."""
import importlib.util
from pathlib import Path

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError
import pytest


def test_preference_migration_preserves_rows_and_allows_tigrinya():
    engine = create_engine("sqlite://")
    with engine.begin() as connection:
        connection.execute(text("""CREATE TABLE user_preferences (
            user_id TEXT PRIMARY KEY,
            learning_language TEXT NOT NULL,
            interface_language TEXT NOT NULL,
            daily_goal_minutes INTEGER NOT NULL,
            CONSTRAINT user_preferences_learning_language_check CHECK (learning_language IN ('om','am')),
            CONSTRAINT user_preferences_interface_language_check CHECK (interface_language IN ('en','om','am'))
        )"""))
        connection.execute(text("INSERT INTO user_preferences VALUES ('one','om','en',5),('two','am','am',10)"))
    with engine.begin() as connection, pytest.raises(IntegrityError):
        connection.execute(text("UPDATE user_preferences SET learning_language='ti' WHERE user_id='one'"))

    path = Path("alembic/versions/0008_tigrinya_preferences.py")
    spec = importlib.util.spec_from_file_location("tigrinya_migration", path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    with engine.begin() as connection:
        before = connection.execute(text("SELECT * FROM user_preferences ORDER BY user_id")).all()
        with Operations.context(MigrationContext.configure(connection)):
            migration.upgrade()
        assert connection.execute(text("SELECT * FROM user_preferences ORDER BY user_id")).all() == before
        connection.execute(text("UPDATE user_preferences SET learning_language='ti', interface_language='ti' WHERE user_id='one'"))
        assert connection.execute(text("SELECT daily_goal_minutes FROM user_preferences WHERE user_id='one'")).scalar_one() == 5
    with engine.begin() as connection, pytest.raises(IntegrityError):
        connection.execute(text("UPDATE user_preferences SET learning_language='invalid' WHERE user_id='one'"))
    engine.dispose()
