from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.auth import create_token, verify_token
from bson import ObjectId
import bcrypt

router = APIRouter()

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
async def register(body: UserRegister):
    db = get_db()
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = bcrypt.hashpw(body.password.encode("utf-8"), bcrypt.gensalt())
    result = await db.users.insert_one({
        "name": body.name,
        "email": body.email,
        "password": hashed.decode("utf-8")
    })
    user_id = str(result.inserted_id)
    token = create_token(user_id)
    print(f"✅ Registered: {body.email}")
    return {"token": token, "user": {"id": user_id, "name": body.name, "email": body.email}}


@router.post("/login")
async def login(body: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": body.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not bcrypt.checkpw(body.password.encode("utf-8"), user["password"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user_id = str(user["_id"])
    token = create_token(user_id)
    print(f"✅ Login: {body.email}")
    return {"token": token, "user": {"id": user_id, "name": user["name"], "email": user["email"]}}


@router.get("/me")
async def get_me(user_id: str = Depends(verify_token)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": str(user["_id"]), "name": user["name"], "email": user["email"]}
