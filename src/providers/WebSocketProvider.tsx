// src/context/WebSocketContext.tsx
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { WebSocketContext } from '../context';


interface WSResponsePayload<T = unknown> {
  data?: T;
  error?: string;
}

interface WSResponse<T = unknown> {
  id: string;
  type: string;
  payload: WSResponsePayload<T>;
}

interface WSRequest<T = unknown> {
  id: string;
  type: string;
  payload?: T;
}

interface WebSocketProviderProps {
  children: React.ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const pendingRequestsRef = useRef<Map<string, { resolve: (val: unknown) => void; reject: (err: unknown) => void }>>(new Map());

  const connect = useCallback(function connect(): void {
    if (socketRef.current && (
          socketRef.current.readyState === WebSocket.CONNECTING ||
          socketRef.current.readyState === WebSocket.OPEN)) {
      return;
    }
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
        const msg: WSResponse = JSON.parse(event.data);

        // Check if this incoming message has a correlation ID matching a pending request
        if (msg.id && pendingRequestsRef.current.has(msg.id)) {
          const { resolve, reject } = pendingRequestsRef.current.get(msg.id)!;

          pendingRequestsRef.current.delete(msg.id);

          if (msg.payload?.error) {
            const backendErr = new Error(msg.payload.error);
            reject(backendErr);
          } else {
            resolve(msg.payload.data);
          }
        }
      } catch {
        console.warn('Received non-JSON message:', event.data);
      }
    };
  }, []);

  const emit = useCallback(<TResponse = unknown, TPayload = unknown>(type: string, payload?: TPayload): Promise<TResponse> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket is not connected'));
      }

      const msgId = crypto.randomUUID();
      const message: WSRequest<TPayload> = {
        id: msgId,
        type,
        payload,
      };

      pendingRequestsRef.current.set(msgId, { resolve: resolve as (val: unknown) => void, reject });

      socketRef.current.send(JSON.stringify(message));

      // 20-second timeout so promises don't hang forever if server dies
      setTimeout(() => {
        if (pendingRequestsRef.current.has(msgId)) {
          pendingRequestsRef.current.get(msgId)!.reject(new Error(`Request "${type}" timed out.`));
          pendingRequestsRef.current.delete(msgId);
        }
      }, 20000);
    });
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  return (
    <WebSocketContext.Provider value={{
        status,
        emit,
     }}>
      {children}
    </WebSocketContext.Provider>
  );
}

