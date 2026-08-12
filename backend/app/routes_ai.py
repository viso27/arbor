from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.database import get_db
from app.auth import verify_token
from app.openrouter import ask_about_note, summarize_note
from app.embedding import embed_text
from app.similarity import find_similar_notes
from bson import ObjectId

router = APIRouter()

class AskRequest(BaseModel):
    note_id: str
    question: str

class SearchRequest(BaseModel):
    query: str


@router.post("/ask")
async def ask_ai(body: AskRequest, user_id: str = Depends(verify_token)):
    db = get_db()
    note = await db.notes.find_one({"_id": ObjectId(body.note_id), "user_id": user_id})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    print(f"💬 Ask: '{body.question}' on '{note['title']}'")
    answer = ask_about_note(note["content"], body.question)
    return {"answer": answer, "note_title": note["title"]}


@router.get("/summarize/{note_id}")
async def get_summary(note_id: str, user_id: str = Depends(verify_token)):
    db = get_db()
    note = await db.notes.find_one({"_id": ObjectId(note_id), "user_id": user_id})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    print(f"📝 Summarizing: {note['title']}")
    summary = summarize_note(note["content"])
    return {"summary": summary, "note_title": note["title"]}


@router.post("/search")
async def semantic_search(body: SearchRequest, user_id: str = Depends(verify_token)):
    db = get_db()
    if not body.query.strip():
        return {"results": []}
    print(f"🔍 Search: '{body.query}'")
    query_embedding = await embed_text(body.query)
    similar = await find_similar_notes(
        embedding=query_embedding,
        user_id=user_id,
        exclude_id="000000000000000000000000",
        db=db
    )
    results = []
    for s in similar:
        note = await db.notes.find_one({"_id": ObjectId(s["note_id"])})
        if note:
            results.append({
                "id":         str(note["_id"]),
                "title":      note["title"],
                "preview":    note["content"][:120],
                "similarity": s["score"]
            })
    return {"results": results, "query": body.query}
