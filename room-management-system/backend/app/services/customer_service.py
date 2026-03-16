from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.models import Customer


async def get_customer_by_phone(db: AsyncSession, phone: str) -> Optional[Customer]:
    result = await db.execute(select(Customer).where(Customer.phone == phone))
    return result.scalar_one_or_none()


async def create_customer(
    db: AsyncSession,
    name: str,
    phone: str,
    aadhaar_image_path: Optional[str] = None,
) -> Customer:
    customer = Customer(name=name, phone=phone, aadhaar_image_path=aadhaar_image_path)
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer
