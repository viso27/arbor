import requests
import os
from dotenv import load_dotenv

load_dotenv()

async def embed_text(text: str) -> list:
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/embeddings",
            headers={
                "Authorization": f"Bearer {os.getenv('OPENROUTER_KEY')}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://arbor-app.com",
                "X-Title": "Arbor Knowledge Graph",
            },
            json={
                "model": "nvidia/nemotron-3-embed-1b:free",
                "input": text
            }
        )

        if not response.ok:
            raise Exception(f"{response.status_code} {response.text}")

        data = response.json()
        embedding = data["data"][0]["embedding"]
        print(f"✅ Embedded — {len(embedding)} dims")
        return embedding

    except Exception as e:
        print(f"❌ Embedding error: {e}")
        raise Exception(f"Embedding failed: {str(e)}")
