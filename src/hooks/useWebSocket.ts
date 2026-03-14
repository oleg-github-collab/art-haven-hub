import { useEffect, useRef, useCallback, useState } from "react";
import { getAccessToken } from "@/lib/api";

const WS_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080")
  .replace("http://", "ws://")
  .replace("https://", "wss://");

export type WSMessage = {
  type: string;
  payload: Record<string, unknown>;
};

type WSHandler = (msg: WSMessage) => void;

export function useWebSocket(onMessage?: WSHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<WSHandler | undefined>(onMessage);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();

  handlersRef.current = onMessage;

  const connect = useCallback(() => {
    const token = getAccessToken();
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WSMessage;
        handlersRef.current?.(msg);
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Reconnect after 3 seconds
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    send({ type: "join_room", payload: { room_id: roomId } });
  }, [send]);

  const leaveRoom = useCallback((roomId: string) => {
    send({ type: "leave_room", payload: { room_id: roomId } });
  }, [send]);

  const sendTyping = useCallback((roomId: string) => {
    send({ type: "typing", payload: { room_id: roomId } });
  }, [send]);

  return { isConnected, send, joinRoom, leaveRoom, sendTyping };
}
