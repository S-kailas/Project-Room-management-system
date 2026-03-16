from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.connection import get_db
from app.database.models import User, Stay
from app.auth.dependencies import require_role
from app.services.room_service import get_room_by_id, update_room_status
from app.services.customer_service import get_customer_by_phone, create_customer
from app.services.cleaning_service import create_cleaning_task
from app.services.assignment_service import assign_next_cleaner
from app.storage import minio_client
from app.utils.logger import write_log
from app.websocket.socket_manager import socket_manager

router = APIRouter(tags=["checkin"])


@router.post("/checkin", status_code=status.HTTP_201_CREATED)
async def check_in(
    name: str = Form(...),
    phone: str = Form(...),
    payment_method: str = Form(...),
    room_id: int = Form(...),
    aadhaar_image: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("CRE")),
):
    # Validate room
    room = await get_room_by_id(db, room_id)
    if not room or room.status != "AVAILABLE":
        raise HTTPException(status_code=400, detail="Room is not available")

    # Resolve customer
    customer = await get_customer_by_phone(db, phone)
    if customer:
        # Existing customer – reuse Aadhaar
        pass
    else:
        # New customer – upload Aadhaar first (temp create without path)
        customer = await create_customer(db, name=name, phone=phone, aadhaar_image_path=None)
        if aadhaar_image:
            file_bytes = await aadhaar_image.read()
            try:
                path = minio_client.upload_aadhaar(
                    customer_id=customer.id,
                    file_bytes=file_bytes,
                    content_type=aadhaar_image.content_type or "image/jpeg",
                )
                customer.aadhaar_image_path = path
                await db.commit()
                await db.refresh(customer)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Aadhaar upload failed: {e}")

    # Create stay
    stay = Stay(
        room_id=room_id,
        customer_id=customer.id,
        payment_method=payment_method,
        checkin_time=datetime.utcnow(),
        status="ACTIVE",
    )
    db.add(stay)
    await db.commit()
    await db.refresh(stay)

    # Update room → OCCUPIED
    await update_room_status(db, room_id, "OCCUPIED")

    # Audit log
    await write_log(db, f"CRE checked in customer {customer.name} to room {room.room_number}", current_user.id, room_id)

    return {"message": "Check-in successful", "stay_id": stay.id}


@router.post("/checkout/{room_id}", status_code=status.HTTP_200_OK)
async def check_out(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("CRE")),
):
    # Validate room
    room = await get_room_by_id(db, room_id)
    if not room or room.status != "OCCUPIED":
        raise HTTPException(status_code=400, detail="Room is not occupied")

    # Close active stay
    result = await db.execute(
        select(Stay)
        .where(Stay.room_id == room_id)
        .where(Stay.status == "ACTIVE")
        .order_by(Stay.checkin_time.desc())
    )
    stay = result.scalars().first()
    if stay:
        stay.checkout_time = datetime.utcnow()
        stay.status = "CHECKED_OUT"
        await db.commit()

    # Room → DIRTY
    await update_room_status(db, room_id, "DIRTY")

    # Assign cleaner
    try:
        cleaner = await assign_next_cleaner(db)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Create cleaning task
    task = await create_cleaning_task(db, room_id=room_id, cleaner_id=cleaner.id)

    # Audit log
    await write_log(db, f"CRE checked out room {room.room_number}", current_user.id, room_id)

    # Broadcast WebSocket event
    await socket_manager.broadcast({
        "event": "NEW_TASK",
        "task_id": task.id,
        "room_id": room_id,
        "room_number": room.room_number,
        "cleaner_id": cleaner.id,
    })

    return {
        "message": "Checkout successful",
        "task_id": task.id,
        "assigned_cleaner": cleaner.username,
    }
