from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.connection import get_db
from app.database.models import User, Room, Log
from app.auth.dependencies import require_role
from app.auth.password_utils import hash_password
from app.utils.logger import write_log
from app.services.room_service import get_all_rooms

router = APIRouter(prefix="/admin", tags=["admin"])


class CreateCleanerRequest(BaseModel):
    username: str
    password: str


@router.post("/create-cleaner", status_code=status.HTTP_201_CREATED)
async def create_cleaner(
    payload: CreateCleanerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    # Check uniqueness
    result = await db.execute(select(User).where(User.username == payload.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        role="CLEANER",
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    await write_log(db, f"Admin created cleaner account: {payload.username}", current_user.id, new_user.id)
    return {"message": "Cleaner account created", "user_id": new_user.id}


@router.get("/rooms")
async def list_all_rooms(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    rooms = await get_all_rooms(db)
    return [{"id": r.id, "room_number": r.room_number, "status": r.status} for r in rooms]


@router.get("/logs")
async def view_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
    limit: int = 100,
):
    result = await db.execute(
        select(Log).order_by(Log.timestamp.desc()).limit(limit)
    )
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "target_id": log.target_id,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        }
        for log in logs
    ]
