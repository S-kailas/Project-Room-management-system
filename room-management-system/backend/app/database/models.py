from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Enum, ForeignKey, Index
)
from sqlalchemy.orm import relationship

from app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(Enum("ADMIN", "CRE", "CLEANER"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    cleaning_tasks = relationship("CleaningTask", back_populates="cleaner", foreign_keys="CleaningTask.assigned_cleaner_id")
    logs = relationship("Log", back_populates="user")

    __table_args__ = (
        Index("idx_username", "username"),
    )


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_number = Column(Integer, unique=True, nullable=False)
    status = Column(String(20), nullable=False, default="AVAILABLE")
    created_at = Column(DateTime, default=datetime.utcnow)

    stays = relationship("Stay", back_populates="room")
    cleaning_tasks = relationship("CleaningTask", back_populates="room")

    __table_args__ = (
        Index("idx_room_status", "status"),
    )


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    aadhaar_image_path = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    stays = relationship("Stay", back_populates="customer")

    __table_args__ = (
        Index("idx_phone", "phone"),
    )


class Stay(Base):
    __tablename__ = "stays"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    payment_method = Column(String(50), nullable=False)
    checkin_time = Column(DateTime, default=datetime.utcnow)
    checkout_time = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default="ACTIVE")

    room = relationship("Room", back_populates="stays")
    customer = relationship("Customer", back_populates="stays")

    __table_args__ = (
        Index("idx_stay_room_id", "room_id"),
    )


class CleaningTask(Base):
    __tablename__ = "cleaning_tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    assigned_cleaner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    room = relationship("Room", back_populates="cleaning_tasks")
    cleaner = relationship("User", back_populates="cleaning_tasks", foreign_keys=[assigned_cleaner_id])

    __table_args__ = (
        Index("idx_clean_status", "status"),
    )


class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(Text, nullable=False)
    target_id = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="logs")
