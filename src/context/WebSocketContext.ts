import { createContext } from 'react';

interface WebSocketContextType {
  status: string;
  emit: <TResponse = unknown, TPayload = unknown>(
    type: string,
    payload?: TPayload,
    useLossless?: boolean,
  ) => Promise<TResponse>;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

