from fastapi import APIRouter, Depends
from app.database import get_db
from app.auth import verify_token

router = APIRouter()

@router.get("")
async def get_graph(user_id: str = Depends(verify_token)):
    db = get_db()
    cursor = db.notes.find(
        {"user_id": user_id},
        {"embedding": 0}
    ).sort("created_at", -1)
    notes = await cursor.to_list(length=200)
    edge_cursor = db.edges.find({"user_id": user_id})
    edges = await edge_cursor.to_list(length=1000)
    nodes = [{
        "id":      str(n["_id"]),
        "title":   n.get("title", "Untitled"),
        "preview": n.get("content", "")[:80],
    } for n in notes]
    formatted_edges = [{
        "id":           str(e["_id"]),
        "from_note_id": e["from_note_id"],
        "to_note_id":   e["to_note_id"],
        "similarity":   e["similarity"],
    } for e in edges]
    print(f"📊 Graph: {len(nodes)} nodes, {len(formatted_edges)} edges")
    return {"nodes": nodes, "edges": formatted_edges}
