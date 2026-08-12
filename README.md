# 🌿 Arbor — AI Knowledge Graph
 
Arbor is an AI-powered note-taking app that automatically discovers semantic relationships between your notes and visualizes them as an interactive knowledge graph — no manual linking, tagging, or folders required.
 
Write a note. Arbor converts it into a vector embedding, finds semantically similar notes using MongoDB Atlas Vector Search, and connects them live in a React Flow graph.
 
**🔗 Live Demo:** [arbor-topaz.vercel.app](arbor-topaz.vercel.app)

 
---
 
## ✨ Features
 
- **Automatic note linking** — Notes are embedded via OpenRouter and connected using cosine similarity (threshold 0.75), no manual tagging needed
- **Interactive knowledge graph** — React Flow renders notes as nodes and relationships as edges with live similarity scores
- **Real-time updates** — Socket.io pushes graph updates instantly when new connections are found
- **Ask AI** — Ask questions about any note, answered using only that note's content as context
- **Semantic search** — Search by meaning, not keywords (searching "AI" finds notes about "neural networks")
- **Rich text editor** — TipTap-powered note editor with formatting support
- **Secure auth** — JWT-based authentication with bcrypt password hashing
---
 
## 🛠️ Tech Stack
 
**Backend**
- FastAPI (Python) — async REST API
- MongoDB Atlas — document storage + Vector Search
- OpenRouter API — embeddings (1536-dim) + LLM (Ask AI)
- Socket.io — real-time graph updates
- JWT + bcrypt — authentication
**Frontend**
- React + Vite
- React Flow — knowledge graph visualization
- TipTap — rich text editor
- Axios + Socket.io-client
---
 
## 🧠 How It Works
 
1. User writes and saves a note
2. FastAPI saves the note to MongoDB and returns instantly
3. In the background, the note content is sent to OpenRouter to generate a 1536-dimensional embedding
4. MongoDB Atlas Vector Search finds the top 5 most similar existing notes (cosine similarity ≥ 0.75)
5. Relationships are saved as edges in a separate collection
6. Socket.io notifies the frontend, and React Flow re-renders the graph with new connections — all within a few seconds
```
Note saved → Background embedding → Vector Search → Auto-linked → Live graph update
```
 
---
 
## 📂 Project Structure
 
```
arbor/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app + Socket.io
│   │   ├── database.py       # MongoDB connection
│   │   ├── auth.py           # JWT handling
│   │   ├── embedding.py      # OpenRouter embedding calls
│   │   ├── similarity.py     # Vector Search queries
│   │   ├── openrouter.py     # LLM calls with fallback
│   │   └── routes_*.py       # API route handlers
│   ├── requirements.txt
│   └── run.py
└── frontend/
    └── src/
        ├── components/
        │   ├── Graph/         # React Flow graph components
        │   ├── Editor/        # TipTap note editor
        │   └── AI/            # Ask AI component
        ├── pages/              # Login, Register, Home
        └── context/            # Auth context
```
 
---
 
## 🚀 Running Locally
 
**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # fill in your keys
python run.py
```
 
**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
 
Backend runs on `http://localhost:8000`, frontend on `http://localhost:5173`.
 
### Required Environment Variables
 
**backend/.env**
```
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
OPENROUTER_KEY=your_openrouter_api_key
CLIENT_URL=http://localhost:5173
```
 
---
 
## 📊 MongoDB Atlas Vector Search Setup
 
Create a Vector Search index named `notes_vector_index` on the `notes` collection:
 
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}
```
 
---
