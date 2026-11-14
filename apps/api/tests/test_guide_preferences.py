"""Guide persistence against the isolated learner schema."""

import pytest
from pydantic import ValidationError

from app.api.v1.endpoints.preferences import get_preferences, update_preferences
from app.core.clerk_auth import ClerkUser
from app.schemas.preferences import UserPreferencesUpdate


def _user(user_id: str) -> ClerkUser:
    return ClerkUser(user_id=user_id, session_id=None, claims={})


def test_guide_state_survives_other_updates_and_is_isolated(session_factory):
    with session_factory() as db:
        first = _user("learner_one")
        second = _user("learner_two")
        assert get_preferences(first, db).tour_completed_version == 0
        update_preferences(
            UserPreferencesUpdate(tour_completed_version=1, last_seen_update="2026-11"),
            first, db,
        )
        update_preferences(UserPreferencesUpdate(sound_enabled=False), first, db)
        saved = get_preferences(first, db)
        assert saved.tour_completed_version == 1
        assert saved.last_seen_update == "2026-11"
        assert get_preferences(second, db).tour_completed_version == 0
        assert get_preferences(second, db).last_seen_update is None


def test_negative_tour_version_is_rejected():
    with pytest.raises(ValidationError):
        UserPreferencesUpdate(tour_completed_version=-1)
