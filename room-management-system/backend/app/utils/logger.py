from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import Log


async def write_log(
    db: AsyncSession,
    action: str,
    user_id: Optional[int] = None,
    target_id: Optional[int] = None,
):
    log = Log(
        user_id=user_id,
        action=action,
        target_id=target_id,
        timestamp=datetime.utcnow(),
    )
    db.add(log)
    await db.commit()
