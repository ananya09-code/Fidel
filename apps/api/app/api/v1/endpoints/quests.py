"""Clerk-scoped adventures. The server owns gates, reply checks and completion."""
import json
import unicodedata
from datetime import datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import JSON, bindparam, text
from sqlalchemy.orm import Session
from app.core.clerk_auth import ClerkUser, get_current_user
from app.api.v1.endpoints.preferences import _ensure_user
from app.api.v1.endpoints.reviews import _load_words
from app.api.v1.endpoints.words import _load_audio
from app.db.database import SessionLocal
from app.schemas.quests import Language, QuestOverview, QuestReply, QuestReplyResult, QuestState
from app.services.quest_definitions import definitions, matches, valid_name

router = APIRouter(prefix="/quests", tags=["quests"])


def get_db():
    with SessionLocal() as db:
        yield db


def _uid(db, clerk_id):
    return db.execute(text("SELECT id FROM users WHERE clerk_id=:clerk"), {"clerk": clerk_id}).scalar_one_or_none()


def _rows(db, user_id, language):
    if user_id is None:
        return {}
    return {row["quest_key"]: row for row in db.execute(text("SELECT * FROM quest_progress WHERE user_id=:uid AND language_code=:lang"), {"uid":user_id,"lang":language}).mappings()}


def _state(row):
    answers = json.loads(row["answers"]) if isinstance(row["answers"], str) else row["answers"]
    return QuestState(version=row["definition_version"], step_index=row["step_index"], answers=answers, completed=row["completed_at"] is not None)


def _overview(db, uid, language):
    catalogue = db.execute(text("SELECT id,text FROM words WHERE language_code=:lang AND status='approved'"), {"lang":language}).mappings().all()
    recordings = _load_audio(db, [row["id"] for row in catalogue])
    available = [row["text"] for row in catalogue if recordings.get(str(row["id"]), {}).get("storage_key")]
    bank_ids = db.execute(text("""SELECT w.id FROM user_words uw JOIN words w ON w.id=uw.word_id
        WHERE uw.user_id=:uid AND w.language_code=:lang AND w.status='approved'
          AND (uw.learning_state='learned' OR (uw.learning_state='needs_review' AND uw.times_correct>0))
        ORDER BY w.text,w.id"""), {"uid":uid,"lang":language}).scalars().all() if uid else []
    bank = _load_words(db, bank_ids, uid) if bank_ids else []
    rows = _rows(db, uid, language)
    quests=[]
    for definition in definitions(language):
        missing=[word["key"] for word in definition["required"] if not any(matches(language,word["key"],item.text) for item in bank)]
        unavailable=[word["key"] for word in definition["required"] if not any(matches(language,word["key"],value) for value in available)]
        previous=rows.get(definition["prerequisite"])
        reasons=[]
        if definition["prerequisite"] and (previous is None or previous["completed_at"] is None):
            reasons.append("Finish the previous conversation first.")
        if missing:
            reasons.append("Collect the required words in Learn or the dictionary.")
        if unavailable:
            reasons.append("Some required words are waiting for approved audio.")
        row=rows.get(definition["id"])
        if row is not None and row["definition_version"] != definition["version"]:
            reasons.append("This saved quest uses an older version. Please contact support.")
        quests.append({**definition,"state":_state(row) if row else None,"locked":bool(reasons),"reasons":reasons,
                       "missing_words":missing,"unavailable_words":unavailable})
    return QuestOverview(language_code=language,quests=quests,bank=bank)


def _quest(overview, quest_key):
    item=next((quest for quest in overview.quests if quest.id==quest_key),None)
    if item is None:
        raise HTTPException(404,"Quest not found.")
    return item


def _lock_user(db, uid):
    # Serializes starts and replies across all of a user's quest rows. Never lock another user.
    if db.get_bind().dialect.name == "postgresql":
        db.execute(text("SELECT id FROM users WHERE id=:uid FOR UPDATE"),{"uid":uid})


@router.get("", response_model=QuestOverview)
def overview(language_code:Language, current_user:Annotated[ClerkUser,Depends(get_current_user)], db:Session=Depends(get_db)):
    return _overview(db,_uid(db,current_user.user_id),language_code)


@router.post("/{language}/{quest_key}/start", response_model=QuestState)
def start(language:Language, quest_key:str, current_user:Annotated[ClerkUser,Depends(get_current_user)], db:Session=Depends(get_db)):
    now=datetime.now(timezone.utc)
    uid=_ensure_user(db,current_user.user_id,now)
    _lock_user(db,uid)
    item=_quest(_overview(db,uid,language),quest_key)
    if item.state and item.state.version != item.version:
        raise HTTPException(409,"The quest version changed. Please contact support.")
    if item.state and item.state.completed:
        db.commit()
        return item.state
    if item.locked:
        raise HTTPException(409," ".join(item.reasons))
    if item.state:
        db.commit()
        return item.state
    db.execute(text("""INSERT INTO quest_progress
        (user_id,language_code,quest_key,definition_version,step_index,answers,started_at,updated_at)
        VALUES (:uid,:lang,:key,:version,0,:answers,:now,:now)
        ON CONFLICT (user_id,language_code,quest_key) DO NOTHING""").bindparams(bindparam("answers",type_=JSON)),
        {"uid":uid,"lang":language,"key":quest_key,"version":item.version,"answers":[],"now":now})
    result=_state(_rows(db,uid,language)[quest_key])
    db.commit()
    return result


@router.put("/{language}/{quest_key}/reply", response_model=QuestReplyResult)
def reply(language:Language, quest_key:str, payload:QuestReply, current_user:Annotated[ClerkUser,Depends(get_current_user)], db:Session=Depends(get_db)):
    uid=_uid(db,current_user.user_id)
    if uid is None:
        raise HTTPException(404,"Start this quest first.")
    _lock_user(db,uid)
    overview=_overview(db,uid,language)
    item=_quest(overview,quest_key)
    state=item.state
    if state is None:
        raise HTTPException(404,"Start this quest first.")
    if payload.version != item.version or state.version != item.version:
        raise HTTPException(409,"The quest version changed. Reload before replying.")
    if (payload.word_id is None) == (payload.name is None):
        raise HTTPException(422,"Send either a name or one collected word.")
    value=str(payload.word_id) if payload.word_id else unicodedata.normalize("NFC",payload.name or "").strip()
    if payload.expected_step < state.step_index:
        saved=state.answers[payload.expected_step]
        if saved["value"]==value:
            return QuestReplyResult(accepted=True,state=state)
        raise HTTPException(409,"That step was already saved with another reply. Reload to continue.")
    if payload.expected_step != state.step_index or state.completed:
        raise HTTPException(409,"This conversation has moved on. Reload to continue.")
    if item.locked:
        raise HTTPException(409," ".join(item.reasons))
    step=item.steps[state.step_index]
    if step.kind=="name":
        accepted=payload.word_id is None and valid_name(payload.name,language)
        display=value
    else:
        word=next((word for word in overview.bank if str(word.id)==value),None)
        if payload.name is not None or word is None:
            raise HTTPException(422,"Choose a collected word from this language's word bank.")
        display=word.text
        accepted=any(matches(language,key,display) for key in step.accepts)
    if not accepted:
        return QuestReplyResult(accepted=False,feedback="Hmm? Let’s try that together. Take a look at the hint.",state=state)
    now=datetime.now(timezone.utc)
    answers=[*state.answers,{"step_id":step.id,"value":value,"text":display}]
    completed=state.step_index+1==len(item.steps)
    changed=db.execute(text("""UPDATE quest_progress SET step_index=:step,answers=:answers,updated_at=:now,completed_at=:completed
        WHERE user_id=:uid AND language_code=:lang AND quest_key=:key AND step_index=:expected""").bindparams(bindparam("answers",type_=JSON)),
        {"step":state.step_index+1,"answers":answers,"now":now,"completed":now if completed else None,
         "uid":uid,"lang":language,"key":quest_key,"expected":state.step_index})
    if changed.rowcount != 1:
        raise HTTPException(409,"This conversation has moved on. Reload to continue.")
    result=_state(_rows(db,uid,language)[quest_key])
    db.commit()
    return QuestReplyResult(accepted=True,state=result)
