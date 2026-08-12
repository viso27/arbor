import requests
import os
from dotenv import load_dotenv

load_dotenv()

MODELS = [
    "nvidia/nemotron-3-nano-30b-a3b:free"
]

def call_openrouter(messages: list, model_index: int = 0) -> str:
    if model_index >= len(MODELS):
        raise Exception("All models rate-limited. Wait 1 minute and try again.")

    model = MODELS[model_index]
    print(f"🤖 Trying: {model}")

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.getenv('OPENROUTER_KEY')}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://arbor-app.com",
            "X-Title": "Arbor Knowledge Graph",
        },
        json={
            "model": model,
            "max_tokens": 4096,
            "messages": messages
        }
    )

    if response.status_code == 429:
        print(f"⚠️  Rate limited, trying next...")
        return call_openrouter(messages, model_index + 1)

    if not response.ok:
        raise Exception(f"OpenRouter error: {response.text}")

    content = response.json()["choices"][0]["message"]["content"]
    print(f"✅ Done — finish_reason: {response.json()['choices'][0].get('finish_reason')}")
    return content


def ask_about_note(note_content: str, question: str) -> str:
    return call_openrouter([
        {"role": "system", "content": f"Answer based ONLY on this note:\n\n{note_content}"},
        {"role": "user",   "content": question}
    ])


def summarize_note(note_content: str) -> str:
    return call_openrouter([
        {"role": "system", "content": "Summarize in 2-3 sentences. Be concise and factual."},
        {"role": "user",   "content": f"Summarize:\n\n{note_content}"}
    ])
