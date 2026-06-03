import React, { useCallback, useEffect, useRef, useState } from 'react';
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

  const activeWorkspaceIDRef = useRef(workspaceID);

  useEffect(() => {
    activeWorkspaceIDRef.current = workspaceID;
  }, [workspaceID]);

  const setWorkspace = useCallback((newWorkspaceID: string | null) => {
    if (newWorkspaceID !== activeWorkspaceIDRef.current ) {
      setWorkspaceID(newWorkspaceID);
      setNodeStatus(null);
      setWarnings([]);
      setEmitEvents([]);
    }
  }, []);

  const appendWarning = useCallback((warning: Warning) => {
    setWarnings(prev => [...prev, warning]);
  }, []);

  const appendEmitEvent = useCallback((emitEvent: EmitEvent) => {
    if (emitEvent.workspaceID === activeWorkspaceIDRef.current ) {
      setEmitEvents(prev => [...prev, emitEvent]);
    }
  }, []);

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
