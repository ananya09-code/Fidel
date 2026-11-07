"""Loopback-only preview. All writes go to a disposable in-memory database."""
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone
from uuid import uuid4

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "api"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker
from app.api.v1.endpoints import reviews
from app.core.clerk_auth import ClerkUser, get_current_user
from tests.support_schema import create_test_engine

engine = create_test_engine()
sessions = sessionmaker(bind=engine)
user_id = uuid4()
offset = timedelta()

class Clock(datetime):
    @classmethod
    def now(cls, tz=None):
        return datetime.now(tz) + offset

reviews.datetime = Clock
now = datetime.now(timezone.utc)
vocabulary = [("Akkam", "Hello", "ሰላም"), ("Buna", "Coffee", "ቡና"), ("Mana", "House", "ቤት"), ("Bishaan", "Water", "ውሃ"), ("Galatoomi", "Thank you", "አመሰግናለሁ"), ("Haadha", "Mother", "እናት"), ("Abbaa", "Father", "አባት"), ("Hiriyyaa", "Friend", "ጓደኛ")]
with sessions() as db:
    db.execute(text("INSERT INTO users (id, clerk_id, created_at, updated_at) VALUES (:id, 'memory_demo', :now, :now)"), {"id":user_id,"now":now})
    for i, (word, meaning, amharic) in enumerate(vocabulary):
        word_id = uuid4()
        seen = now - timedelta(days=4 if i < 4 else 0)
        db.execute(text("INSERT INTO words (id, language_code, text, content_type, category, difficulty, status, created_at) VALUES (:id, 'om', :word, 'word', 'everyday', 'beginner', 'approved', :now)"), {"id":word_id,"word":word,"now":now})
        for language, translation in [("en",meaning),("am",amharic)]:
            db.execute(text("INSERT INTO word_translations (id, word_id, language_code, meaning, created_at) VALUES (:id,:word,:language,:meaning,:now)"), {"id":uuid4(),"word":word_id,"language":language,"meaning":translation,"now":now})
        db.execute(text("INSERT INTO user_words (user_id, word_id, times_seen, times_correct, text, meaning, first_seen_at, last_seen_at, learning_state, is_favorite) VALUES (:user,:word_id,1,1,:word,:meaning,:seen,:seen,'learned',false)"), {"user":user_id,"word_id":word_id,"word":word,"meaning":meaning,"seen":seen})
    db.commit()

def db_override():
    with sessions() as db:
        yield db

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["http://127.0.0.1:4185", "http://localhost:4185"], allow_methods=["GET", "POST", "PUT"], allow_headers=["Authorization", "Content-Type"])
app.include_router(reviews.router, prefix="/api/v1")
app.dependency_overrides[reviews.get_db] = db_override
app.dependency_overrides[get_current_user] = lambda: ClerkUser(user_id="memory_demo", session_id="demo", claims={})

@app.post("/demo/advance")
def advance():
    global offset
    offset += timedelta(days=3)
    return {"days_ahead": offset.days}

@app.get("/demo/clock")
def clock():
    return {"days_ahead": offset.days}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8011)
