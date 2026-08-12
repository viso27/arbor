from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from dotenv import load_dotenv

from app.database import connect_db, close_db
from app.routes_auth  import router as auth_router
from app.routes_notes import router as notes_router
from app.routes_graph import router as graph_router
from app.routes_ai    import router as ai_router

load_dotenv()

app = FastAPI(title="Arbor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

@sio.event
async def connect(sid, environ):
    print(f"🔌 Connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"🔌 Disconnected: {sid}")

@sio.event
async def join_user(sid, data):
    user_id = data.get("user_id")
    if user_id:
        await sio.enter_room(sid, user_id)
        print(f"👤 {sid} joined room: {user_id}")

socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

app.include_router(auth_router,  prefix="/api/auth",  tags=["Auth"])
app.include_router(notes_router, prefix="/api/notes", tags=["Notes"])
app.include_router(graph_router, prefix="/api/graph", tags=["Graph"])
app.include_router(ai_router,    prefix="/api/ai",    tags=["AI"])

@app.on_event("startup")
async def startup():
    await connect_db()
    print("🚀 Arbor backend running on http://localhost:8000")

@app.on_event("shutdown")
async def shutdown():
    await close_db()

@app.get("/")
async def root():
    return {"status": "ok", "app": "Arbor API"}
