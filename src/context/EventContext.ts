import { createContext } from "react";
import type { EmitEvent, NodeStatus, Warning } from "../types";

interface EventContextType {
  nodeStatus: NodeStatus | null;
  warnings: Warning[];
  emitEvents: EmitEvent[];

  setWorkspace: (workspaceID: string | null) => void;
  setNodeStatus: (nodeStatus: NodeStatus) => void;
  appendWarning: (warning: Warning) => void;
  appendEmitEvent: (emitEvent: EmitEvent) => void;
  clearWarnings: () => void;
  clearEmitEvents: () => void;
}

export const EventContext = createContext<EventContextType | undefined>(undefined);
