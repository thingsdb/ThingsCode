import { createContext } from 'react';

interface WebSocketContextType {
  status: string;
  emit: <TResponse = unknown, TPayload = unknown>(
    type: string,
    payload?: TPayload
  ) => Promise<TResponse>;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

