import { createContext } from "react";
import type { NodeStatus, Warning } from "../types";

interface EventContextType {
  nodeStatus: NodeStatus | null;
  warnings: Warning[];

  setWorkspace: (workspaceID: string | null) => void;
  setNodeStatus: (nodeStatus: NodeStatus) => void;
  appendWarning: (warning: Warning) => void;
}

export const EventContext = createContext<EventContextType | undefined>(undefined);
