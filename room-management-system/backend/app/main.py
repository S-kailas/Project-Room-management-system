import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text

from app.config import settings
from app.database.connection import engine, AsyncSessionLocal, Base
from app.database.models import User, Room
from app.auth.password_utils import hash_password
from app.websocket.socket_manager import socket_manager
from app.routers import auth_routes, room_routes, checkin_routes, cleaner_routes, admin_routes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def _seed_database():
    """Create tables, seed 20 rooms, ensure admin account exists."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Seed rooms
        result = await db.execute(select(Room))
        existing_rooms = result.scalars().all()
        if not existing_rooms:
            logger.info("Seeding 20 rooms...")
            for i in range(1, 21):
                db.add(Room(room_number=i, status="AVAILABLE", created_at=datetime.utcnow()))
            await db.commit()

        # Ensure admin exists
        result = await db.execute(select(User).where(User.role == "ADMIN"))
        admin = result.scalar_one_or_none()
        if not admin:
            logger.info("Creating default admin account (username: admin, password: admin123)")
            db.add(User(
                username="admin",
                password_hash=hash_password("admin123"),
                role="ADMIN",
                created_at=datetime.utcnow(),
            ))
            await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await _seed_database()
    yield


app = FastAPI(
    title="Room Management System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
API_PREFIX = "/api/v1"
app.include_router(auth_routes.router, prefix=API_PREFIX)
app.include_router(room_routes.router, prefix=API_PREFIX)
app.include_router(checkin_routes.router, prefix=API_PREFIX)
app.include_router(cleaner_routes.router, prefix=API_PREFIX)
app.include_router(admin_routes.router, prefix=API_PREFIX)


# WebSocket endpoint for cleaners
@app.websocket("/ws/cleaner")
async def websocket_endpoint(websocket: WebSocket):
    await socket_manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive; client sends pings
            data = await asyncio.wait_for(websocket.receive_text(), timeout=60)
            if data == "ping":
                await websocket.send_text("pong")
    except (WebSocketDisconnect, asyncio.TimeoutError, Exception):
        await socket_manager.disconnect(websocket)


@app.get("/health")
async def health():
    return {"status": "ok"}
