import { createContext } from "react";
import type { NodeStatus } from "../types";

interface EventContextType {
  nodeStatus: NodeStatus | null;
  setWorkspace: (workspaceID: string | null) => void;
  setNodeStatus: (nodeStatus: NodeStatus) => void;
}

export const EventContext = createContext<EventContextType | undefined>(undefined);
