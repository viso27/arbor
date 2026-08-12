from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.auth import verify_token
from app.embedding import embed_text
from app.similarity import find_similar_notes
from bson import ObjectId
from datetime import datetime, timezone
import asyncio

router = APIRouter()

class NoteCreate(BaseModel):
    title: str
    content: str
    html_content: str

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    html_content: Optional[str] = None

def fmt(note) -> dict:
    return {
        "id": str(note["_id"]),
        "title": note.get("title", ""),
        "content": note.get("content", ""),
        "html_content": note.get("html_content", ""),
        "user_id": note.get("user_id", ""),
        "has_embedding": note.get("embedding") is not None,
    }


@router.get("")
async def get_notes(user_id: str = Depends(verify_token)):
    db = get_db()
    cursor = db.notes.find({"user_id": user_id}).sort("created_at", -1)
    notes = await cursor.to_list(length=100)
    return [fmt(n) for n in notes]


@router.post("")
async def create_note(body: NoteCreate, user_id: str = Depends(verify_token)):
    db = get_db()
    result = await db.notes.insert_one({
        "title": body.title,
        "content": body.content,
        "html_content": body.html_content,
        "user_id": user_id,
        "embedding": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    })
    note_id = str(result.inserted_id)
    print(f"✅ Note created: {body.title}")
    asyncio.create_task(_embed_and_link(note_id, body.content, user_id, db))
    return {
        "id": note_id,
        "title": body.title,
        "content": body.content,
        "html_content": body.html_content,
        "user_id": user_id,
        "has_embedding": False,
    }


async def _embed_and_link(note_id: str, content: str, user_id: str, db):
    try:
        embedding = await embed_text(content)
        await db.notes.update_one(
            {"_id": ObjectId(note_id)},
            {"$set": {"embedding": embedding}}
        )
        similar = await find_similar_notes(embedding, user_id, note_id, db)
        await db.edges.delete_many({"from_note_id": note_id})
        for s in similar:
            exists = await db.edges.find_one({
                "$or": [
                    {"from_note_id": note_id,      "to_note_id": s["note_id"]},
                    {"from_note_id": s["note_id"], "to_note_id": note_id},
                ]
            })
            if not exists:
                await db.edges.insert_one({
                    "from_note_id": note_id,
                    "to_note_id":   s["note_id"],
                    "similarity":   s["score"],
                    "user_id":      user_id,
                })
        print(f"🔗 Linked {note_id} to {len(similar)} notes")
        from app.main import sio
        await sio.emit("graph_updated", {"user_id": user_id}, room=user_id)
    except Exception as e:
        print(f"❌ Embed/link error: {e}")


@router.put("/{note_id}")
async def update_note(note_id: str, body: NoteUpdate, user_id: str = Depends(verify_token)):
    db = get_db()
    note = await db.notes.find_one({"_id": ObjectId(note_id), "user_id": user_id})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    updates = {"updated_at": datetime.now(timezone.utc)}
    if body.title is not None:        updates["title"] = body.title
    if body.content is not None:      updates["content"] = body.content
    if body.html_content is not None: updates["html_content"] = body.html_content
    await db.notes.update_one({"_id": ObjectId(note_id)}, {"$set": updates})
    if body.content is not None:
        asyncio.create_task(_embed_and_link(note_id, body.content, user_id, db))
    return {"message": "Note updated"}


@router.delete("/{note_id}")
async def delete_note(note_id: str, user_id: str = Depends(verify_token)):
    db = get_db()
    note = await db.notes.find_one({"_id": ObjectId(note_id), "user_id": user_id})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    await db.notes.delete_one({"_id": ObjectId(note_id)})
    await db.edges.delete_many({
        "$or": [
            {"from_note_id": note_id},
            {"to_note_id": note_id}
        ]
    })
    print(f"🗑️  Deleted note {note_id}")
    return {"message": "Note deleted"}
