from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.models import Room


async def get_rooms_by_status(db: AsyncSession, status: str) -> List[Room]:
    result = await db.execute(select(Room).where(Room.status == status).order_by(Room.room_number))
    return result.scalars().all()


async def get_all_rooms(db: AsyncSession) -> List[Room]:
    result = await db.execute(select(Room).order_by(Room.room_number))
    return result.scalars().all()


async def get_room_by_id(db: AsyncSession, room_id: int) -> Room | None:
    result = await db.execute(select(Room).where(Room.id == room_id))
    return result.scalar_one_or_none()


async def update_room_status(db: AsyncSession, room_id: int, status: str) -> Room:
    room = await get_room_by_id(db, room_id)
    if not room:
        raise ValueError(f"Room {room_id} not found")
    room.status = status
    await db.commit()
    await db.refresh(room)
    return room
