from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.database.models import User
from app.auth.dependencies import require_role
from app.services.room_service import get_rooms_by_status

router = APIRouter(prefix="/rooms", tags=["rooms"])


def _room_dict(room):
    return {
        "id": room.id,
        "room_number": room.room_number,
        "status": room.status,
    }


@router.get("/available")
async def available_rooms(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("CRE", "ADMIN")),
):
    rooms = await get_rooms_by_status(db, "AVAILABLE")
    return [_room_dict(r) for r in rooms]


@router.get("/occupied")
async def occupied_rooms(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("CRE", "ADMIN")),
):
    rooms = await get_rooms_by_status(db, "OCCUPIED")
    return [_room_dict(r) for r in rooms]
