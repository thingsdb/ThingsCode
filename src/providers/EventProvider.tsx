import React, { useState } from 'react';
import { type NodeStatus } from '../types';
import { EventContext } from '../context';

interface EventProviderProps {
  children: React.ReactNode;
}

export function EventProvider({children}: EventProviderProps) {
  const [nodeStatus, setNodeStatus] = useState<NodeStatus | null>(null);
  const [workspaceID, setWorkspaceID] = useState<string | null>(null);

  const setWorkspace = (newWorkspaceID: string | null) => {
    console.log('SET_WORKSPACE: ', newWorkspaceID);
    if (workspaceID !==  newWorkspaceID) {
      console.log('Actual set..');
      setWorkspaceID(newWorkspaceID);
      setNodeStatus(null);
    }
  }

  return (
    <EventContext.Provider value={{
      nodeStatus,
      setWorkspace,
      setNodeStatus,
    }}>
      {children}
    </EventContext.Provider>
  );
};
