"""
Round-robin cleaner assignment.

The last-assigned cleaner index is tracked in-memory (process-local).
For multi-process deployments, move this state to the database or Redis.
Currently uses a simple list of CLEANER users ordered by id.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.models import User

# In-memory index tracking last assigned cleaner position
_last_index: int = -1


async def assign_next_cleaner(db: AsyncSession) -> User:
    global _last_index
    result = await db.execute(
        select(User).where(User.role == "CLEANER").order_by(User.id)
    )
    cleaners = result.scalars().all()
    if not cleaners:
        raise ValueError("No cleaner accounts exist. Create at least one cleaner first.")
    _last_index = (_last_index + 1) % len(cleaners)
    return cleaners[_last_index]
