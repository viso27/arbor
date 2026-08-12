from bson import ObjectId

async def find_similar_notes(embedding: list, user_id: str, exclude_id: str, db) -> list:
    try:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "notes_vector_index",
                    "path": "embedding",
                    "queryVector": embedding,
                    "numCandidates": 50,
                    "limit": 10
                }
            },
            {
                "$addFields": {
                    "score": {"$meta": "vectorSearchScore"}
                }
            },
            {
                "$match": {
                    "user_id": user_id,
                    "_id": {"$ne": ObjectId(exclude_id)},
                    "score": {"$gte": 0.75}
                }
            },
            {"$limit": 5}
        ]
        cursor = db.notes.aggregate(pipeline)
        results = await cursor.to_list(length=5)
        similar = []
        for r in results:
            similar.append({
                "note_id": str(r["_id"]),
                "score": round(r["score"], 4)
            })
            print(f"🔗 Similar: {r['title']} — {r['score']:.3f}")
        return similar
    except Exception as e:
        print(f"⚠️  Vector search error (set up Atlas index first): {e}")
        return []
