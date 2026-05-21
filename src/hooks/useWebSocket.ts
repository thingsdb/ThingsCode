import { useEffect, useState, useRef, useCallback } from 'react';

interface WSMessage<T = unknown> {
  id?: string;     // Unique identifier matching request to response
  type: string;    // Event type
  payload?: T;     // Data payload
}

export function useWebSocket() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const pendingRequestsRef = useRef<Map<string, { resolve: (val: unknown) => void; reject: (err: unknown) => void }>>(new Map());

  const connect = useCallback(function connect(): void {
    if (socketRef.current && socketRef.current.readyState === WebSocket.CONNECTING) return;
    setStatus('connecting');

    const wsUrl = import.meta.env.DEV
      ? 'ws://localhost:6213/ws'
      : `ws://${window.location.host}/ws`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus('connected');
    };

    socket.onclose = () => {
      setStatus('disconnected');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = window.setTimeout(() => connect(), 2000);
    };

    socket.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);

        // Check if this incoming message has a correlation ID matching a pending request
        if (msg.id && pendingRequestsRef.current.has(msg.id)) {
          const { resolve } = pendingRequestsRef.current.get(msg.id)!;

          // Resolve the specific promise with the payload, then clear it from the tracker
          resolve(msg.payload);
          pendingRequestsRef.current.delete(msg.id);
        }
      } catch {
        console.warn('Received non-JSON message:', event.data);
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
      }
    };
  }, [connect]);

  const emit = useCallback(<TResponse = unknown, TPayload = unknown>(type: string, payload?: TPayload): Promise<TResponse> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket is not connected'));
      }

      const msgId = crypto.randomUUID();
      const message: WSMessage<TPayload> = {
        id: msgId,
        type,
        payload
      };

      pendingRequestsRef.current.set(msgId, { resolve, reject });

      socketRef.current.send(JSON.stringify(message));

      // 10-second timeout so promises don't hang forever if server dies
      setTimeout(() => {
        if (pendingRequestsRef.current.has(msgId)) {
          pendingRequestsRef.current.get(msgId)!.reject(new Error(`Request "${type}" timed out.`));
          pendingRequestsRef.current.delete(msgId);
        }
      }, 10000);
    });
  }, []);

  return { status, emit };
}