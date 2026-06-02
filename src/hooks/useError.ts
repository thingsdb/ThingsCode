import { useContext } from "react";
import { ErrorContext } from "../context";

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a ErrorProvider");
  }
  return context;
}