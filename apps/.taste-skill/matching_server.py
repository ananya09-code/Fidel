"""Loopback-only matching preview; every write uses disposable SQLite memory."""
import os
import sys
from pathlib import Path
from uuid import uuid4
from datetime import datetime, timezone

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "api"))
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.api.v1.endpoints import progress
from app.core.clerk_auth import ClerkUser, get_current_user
from tests.support_schema import create_test_engine

sessions = sessionmaker(bind=create_test_engine())
now = datetime.now(timezone.utc)
words = []
for word, meaning, amharic in [("Akkam", "Hello", "ሰላም"), ("Galatoomi", "Thank you", "አመሰግናለሁ"), ("Buna", "Coffee", "ቡና"), ("Mana", "House", "ቤት"), ("Bishaan", "Water", "ውሃ"), ("Haadha", "Mother", "እናት"), ("Abbaa", "Father", "አባት"), ("Hiriyyaa", "Friend", "ጓደኛ"), ("Aduunyaa", "World", "ዓለም"), ("Guyyaa", "Day", "ቀን")]:
    word_id = uuid4()
    words.append({"id": str(word_id), "word": word, "meaning": meaning, "amharic": amharic})
    with sessions() as db:
        db.execute(text("INSERT INTO words (id, language_code, text, category, difficulty, status, created_at) VALUES (:id,'om',:word,'everyday','beginner','approved',:now)"), {"id":word_id,"word":word,"now":now})
        for language, value in [("en",meaning),("am",amharic)]:
            db.execute(text("INSERT INTO word_translations (id,word_id,language_code,meaning,created_at) VALUES (:id,:word,:language,:meaning,:now)"), {"id":uuid4(),"word":word_id,"language":language,"meaning":value,"now":now})
        db.commit()

def db_override():
    with sessions() as db:
        yield db

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["http://127.0.0.1:4186","http://localhost:4186"], allow_methods=["GET","POST","PATCH","PUT"], allow_headers=["Authorization","Content-Type"])
app.include_router(progress.router, prefix="/api/v1")
app.dependency_overrides[progress.get_db] = db_override
app.dependency_overrides[get_current_user] = lambda: ClerkUser(user_id="matching_preview",session_id="local",claims={})

@app.get("/demo/words")
def demo_words():
    return words

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8012)
