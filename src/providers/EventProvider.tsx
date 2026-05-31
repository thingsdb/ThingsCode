import React, { useState } from 'react';
import { type NodeStatus, type Warning } from '../types';
import { EventContext } from '../context';

interface EventProviderProps {
  children: React.ReactNode;
}

export function EventProvider({children}: EventProviderProps) {
  const [nodeStatus, setNodeStatus] = useState<NodeStatus | null>(null);
  const [workspaceID, setWorkspaceID] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<Warning[]>([])

  const setWorkspace = (newWorkspaceID: string | null) => {
    if (workspaceID !==  newWorkspaceID) {
      setWorkspaceID(newWorkspaceID);
      setNodeStatus(null);
      setWarnings([]);
    }
  }

  const appendWarning = (warning: Warning) => {
    console.log(warning);
    setWarnings(prev => [...prev, warning]);
  }

  return (
    <EventContext.Provider value={{
      nodeStatus,
      warnings,

      setWorkspace,
      setNodeStatus,
      appendWarning,
    }}>
      {children}
    </EventContext.Provider>
  );
};
