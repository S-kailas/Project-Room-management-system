from datetime import datetime
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.models import CleaningTask, Room


async def create_cleaning_task(db: AsyncSession, room_id: int, cleaner_id: int) -> CleaningTask:
    task = CleaningTask(
        room_id=room_id,
        assigned_cleaner_id=cleaner_id,
        status="PENDING",
        created_at=datetime.utcnow(),
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def get_tasks_for_cleaner(db: AsyncSession, cleaner_id: int) -> List[CleaningTask]:
    result = await db.execute(
        select(CleaningTask)
        .where(CleaningTask.assigned_cleaner_id == cleaner_id)
        .where(CleaningTask.status.in_(["PENDING", "CLEANING"]))
        .order_by(CleaningTask.created_at.desc())
    )
    return result.scalars().all()


async def start_task(db: AsyncSession, task_id: int, cleaner_id: int) -> CleaningTask:
    result = await db.execute(
        select(CleaningTask)
        .where(CleaningTask.id == task_id)
        .where(CleaningTask.assigned_cleaner_id == cleaner_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise ValueError("Task not found or not assigned to you")
    task.status = "CLEANING"
    task.started_at = datetime.utcnow()
    await db.commit()
    await db.refresh(task)
    return task


async def complete_task(db: AsyncSession, task_id: int, cleaner_id: int) -> CleaningTask:
    result = await db.execute(
        select(CleaningTask)
        .where(CleaningTask.id == task_id)
        .where(CleaningTask.assigned_cleaner_id == cleaner_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise ValueError("Task not found or not assigned to you")
    task.status = "COMPLETED"
    task.completed_at = datetime.utcnow()
    await db.commit()
    await db.refresh(task)
    return task
