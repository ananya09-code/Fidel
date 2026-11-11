from datetime import datetime, timezone
from uuid import uuid4
import importlib.util
from pathlib import Path
import pytest
from sqlalchemy import text
from alembic.migration import MigrationContext
from alembic.operations import Operations
from app.services.quest_definitions import definitions, LEXICON, term
from tests.conftest import AUTH_HEADERS

BASE="/api/v1/quests"


@pytest.fixture()
def quest_words(auth_client,mock_clerk,session_factory,monkeypatch):
    from app.api.v1.endpoints import words
    monkeypatch.setattr(words.storage,"generate_audio_url",lambda *args,**kwargs:"https://audio.example.test/word.mp3")
    assert auth_client.post("/api/v1/auth/profile",headers=AUTH_HEADERS).status_code==200
    result={}
    with session_factory() as db:
        uid=db.execute(text("SELECT id FROM users WHERE clerk_id='user_test'")).scalar_one()
        now=datetime.now(timezone.utc)
        for lang in ("om","am","ti"):
            result[lang]={}
            for key in LEXICON:
                value=term(lang,key)
                wid=uuid4();result[lang][key]=str(wid)
                db.execute(text("INSERT INTO words (id,language_code,text,status,created_at) VALUES (:id,:lang,:word,'approved',:now)"),{"id":wid,"lang":lang,"word":value["text"],"now":now})
                for code,meaning in [("en",value["english"]),("am",value["amharic"])]:
                    db.execute(text("INSERT INTO word_translations (id,word_id,language_code,meaning,created_at) VALUES (:id,:wid,:lang,:meaning,:now)"),{"id":uuid4(),"wid":wid,"lang":code,"meaning":meaning,"now":now})
                db.execute(text("""INSERT INTO user_words (user_id,word_id,times_seen,times_correct,learning_state,first_seen_at,last_seen_at)
                    VALUES (:uid,:wid,1,1,'learned',:now,:now)"""),{"uid":uid,"wid":wid,"now":now})
                db.execute(text("INSERT INTO audio_recordings (id,word_id,storage_key,status,created_at) VALUES (:id,:wid,:key,'approved',:now)"),{"id":uuid4(),"wid":wid,"key":f"quest/{wid}.mp3","now":now})
        db.commit()
    return result


def send(client,lang,key,index,word_id=None,name=None,version=1):
    payload={"expected_step":index,"version":version}
    payload.update({"word_id":word_id} if word_id else {"name":name})
    return client.put(f"{BASE}/{lang}/{key}/reply",json=payload,headers=AUTH_HEADERS)


@pytest.mark.parametrize("lang,name",[("om","Ana"),("am","አና"),("ti","አና")])
def test_five_quest_journey_resumes_and_saves_only_once(auth_client,quest_words,lang,name):
    overview=auth_client.get(BASE,params={"language_code":lang},headers=AUTH_HEADERS).json()
    assert len(overview["quests"])==5
    assert len(overview["bank"])==len(LEXICON)
    assert not overview["quests"][0]["locked"]
    assert all(q["locked"] for q in overview["quests"][1:])
    for definition in definitions(lang):
        path=f"{BASE}/{lang}/{definition['id']}/start"
        assert auth_client.post(path,headers=AUTH_HEADERS).status_code==200
        for i,step in enumerate(definition["steps"]):
            # Wrong but collected words do not advance or overwrite earlier replies.
            wrong=next(key for key in LEXICON if key not in step["accepts"])
            if step["kind"]=="word":
                response=send(auth_client,lang,definition["id"],i,word_id=quest_words[lang][wrong])
                assert response.status_code==200 and not response.json()["accepted"]
                assert response.json()["state"]["step_index"]==i
            kwargs={"name":name} if step["kind"]=="name" else {"word_id":quest_words[lang][step["accepts"][0]]}
            response=send(auth_client,lang,definition["id"],i,**kwargs)
            assert response.status_code==200,response.text
            assert response.json()["accepted"]
            assert response.json()["state"]["step_index"]==i+1
            assert send(auth_client,lang,definition["id"],i,**kwargs).json()==response.json()
            assert auth_client.post(path,headers=AUTH_HEADERS).json()==response.json()["state"]
        assert response.json()["state"]["completed"]
    assert all(q["state"]["completed"] for q in auth_client.get(BASE,params={"language_code":lang},headers=AUTH_HEADERS).json()["quests"])
    other="ti" if lang!="ti" else "am"
    assert all(q["state"] is None for q in auth_client.get(BASE,params={"language_code":other},headers=AUTH_HEADERS).json()["quests"])


def test_gates_isolation_and_untrusted_replies(auth_client,quest_words,mock_clerk,session_factory):
    assert auth_client.post(f"{BASE}/om/cafe/start",headers=AUTH_HEADERS).status_code==409
    assert auth_client.post(f"{BASE}/om/intro/start",headers=AUTH_HEADERS).status_code==200
    assert send(auth_client,"om","intro",1,word_id=quest_words["om"]["hello"]).status_code==409
    assert send(auth_client,"om","intro",0,name="አና").json()["accepted"] is False
    assert send(auth_client,"om","intro",0,name="Ana",version=2).status_code==409
    assert send(auth_client,"om","intro",0,name="Ana").status_code==200
    assert send(auth_client,"om","intro",0,name="Different").status_code==409
    assert send(auth_client,"om","intro",1,word_id=quest_words["ti"]["hello"]).status_code==422
    assert send(auth_client,"om","intro",1,word_id=str(uuid4())).status_code==422
    with session_factory() as db:
        db.execute(text("UPDATE user_words SET learning_state='learning' WHERE word_id=:wid"),{"wid":quest_words["om"]["hello"]});db.commit()
    assert send(auth_client,"om","intro",1,word_id=quest_words["om"]["hello"]).status_code==409
    mock_clerk(user_id="other_user")
    other=auth_client.get(BASE,params={"language_code":"om"},headers=AUTH_HEADERS).json()
    assert other["bank"]==[] and all(q["state"] is None for q in other["quests"])
    assert send(auth_client,"om","intro",1,word_id=quest_words["om"]["hello"]).status_code==404
    mock_clerk(user_id="")
    assert auth_client.get(BASE,params={"language_code":"om"},headers=AUTH_HEADERS).status_code==401


def test_audio_gate_requires_active_approval(auth_client,quest_words,session_factory):
    with session_factory() as db:
        db.execute(text("UPDATE audio_recordings SET status='draft' WHERE word_id=:wid"),{"wid":quest_words["om"]["hello"]});db.commit()
    item=auth_client.get(BASE,params={"language_code":"om"},headers=AUTH_HEADERS).json()["quests"][0]
    assert item["unavailable_words"]==["hello"] and item["locked"]
    assert auth_client.post(f"{BASE}/om/intro/start",headers=AUTH_HEADERS).status_code==409


def test_migration_is_additive_on_isolated_database(db_engine):
    with db_engine.begin() as connection:
        connection.execute(text("DROP TABLE quest_progress"))
        before=connection.execute(text("SELECT count(*) FROM words")).scalar_one()
        path=Path("alembic/versions/0009_quests.py")
        spec=importlib.util.spec_from_file_location("quest_migration",path)
        migration=importlib.util.module_from_spec(spec);spec.loader.exec_module(migration)
        with Operations.context(MigrationContext.configure(connection)):
            migration.upgrade()
        assert connection.execute(text("SELECT count(*) FROM quest_progress")).scalar_one()==0
        assert connection.execute(text("SELECT count(*) FROM words")).scalar_one()==before
