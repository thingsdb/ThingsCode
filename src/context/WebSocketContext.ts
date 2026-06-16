import { createContext } from 'react';

interface WebSocketContextType {
  status: string;
  emit: <TResponse = unknown>(
    type: string,
    payload?: unknown,
    useLossless?: boolean,
  ) => Promise<TResponse>;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

