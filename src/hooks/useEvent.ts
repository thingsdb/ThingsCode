import { useContext } from "react";
import { EventContext } from "../context";

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}