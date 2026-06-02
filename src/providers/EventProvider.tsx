import React, { useState } from 'react';
import { type EmitEvent, type NodeStatus, type Warning } from '../types';
import { EventContext } from '../context';

interface EventProviderProps {
  children: React.ReactNode;
}

export function EventProvider({children}: EventProviderProps) {
  const [nodeStatus, setNodeStatus] = useState<NodeStatus | null>(null);
  const [workspaceID, setWorkspaceID] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [emitEvents, setEmitEvents] = useState<EmitEvent[]>([]);

  const setWorkspace = (newWorkspaceID: string | null) => {
    if (workspaceID !==  newWorkspaceID) {
      setWorkspaceID(newWorkspaceID);
      setNodeStatus(null);
      setWarnings([]);
    }
  }

  const appendWarning = (warning: Warning) => {
    setWarnings(prev => [...prev, warning]);
  }

  const appendEmitEvent = (emitEvent: EmitEvent) => {
    if (emitEvent.workspaceID === workspaceID) {
      setEmitEvents(prev => [...prev, emitEvent]);
    }
  }

  return (
    <EventContext.Provider value={{
      nodeStatus,
      warnings,
      emitEvents,

      setWorkspace,
      setNodeStatus,
      appendWarning,
      appendEmitEvent,
    }}>
      {children}
    </EventContext.Provider>
  );
};
