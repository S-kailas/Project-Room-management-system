import asyncio
import json
from typing import List

from fastapi import WebSocket


class SocketManager:
    def __init__(self):
        self._connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self._connections.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self._connections:
                self._connections.remove(websocket)

    async def broadcast(self, event: dict):
        payload = json.dumps(event)
        dead: List[WebSocket] = []
        async with self._lock:
            clients = list(self._connections)
        for ws in clients:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)


# Singleton shared across the application
socket_manager = SocketManager()
