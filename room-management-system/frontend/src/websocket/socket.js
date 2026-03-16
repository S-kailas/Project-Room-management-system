const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/cleaner';
const PING_INTERVAL = 30_000; // 30 seconds
const RECONNECT_DELAY = 3_000; // 3 seconds

export function createSocket(onMessage) {
  let ws = null;
  let pingTimer = null;
  let reconnectTimer = null;
  let closed = false;

  function connect() {
    if (closed) return;
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('[WS] Connected');
      pingTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, PING_INTERVAL);
    };

    ws.onmessage = (event) => {
      if (event.data === 'pong') return;
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (_) {}
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected, reconnecting...');
      clearInterval(pingTimer);
      if (!closed) {
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  function destroy() {
    closed = true;
    clearInterval(pingTimer);
    clearTimeout(reconnectTimer);
    ws?.close();
  }

  connect();
  return { destroy };
}
