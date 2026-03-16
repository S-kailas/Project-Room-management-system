from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.database.models import User, CleaningTask, Room
from app.auth.dependencies import require_role, get_current_user
from app.services.cleaning_service import get_tasks_for_cleaner, start_task, complete_task
from app.services.room_service import update_room_status
from app.utils.logger import write_log

router = APIRouter(prefix="/cleaner", tags=["cleaner"])


def _task_dict(task: CleaningTask, room: Room = None):
    return {
        "id": task.id,
        "room_id": task.room_id,
        "room_number": room.room_number if room else None,
        "status": task.status,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "started_at": task.started_at.isoformat() if task.started_at else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
    }


@router.get("/tasks")
async def get_my_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("CLEANER")),
):
    tasks = await get_tasks_for_cleaner(db, current_user.id)
    result = []
    for task in tasks:
        # Eagerly load room
        await db.refresh(task, attribute_names=["room"])
        result.append(_task_dict(task, task.room))
    return result


@router.post("/start/{task_id}")
async def start_cleaning(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("CLEANER")),
):
    try:
        task = await start_task(db, task_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    await update_room_status(db, task.room_id, "CLEANING")
    await write_log(db, f"Cleaner started cleaning room (task {task_id})", current_user.id, task.room_id)
    return {"message": "Cleaning started", "task_id": task.id}


@router.post("/complete/{task_id}")
async def complete_cleaning(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("CLEANER")),
):
    try:
        task = await complete_task(db, task_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    await update_room_status(db, task.room_id, "AVAILABLE")
    await write_log(db, f"Cleaner completed cleaning room (task {task_id})", current_user.id, task.room_id)
    return {"message": "Cleaning completed", "task_id": task.id}
