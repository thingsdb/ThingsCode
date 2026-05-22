import React, { useState, useEffect, useMemo } from 'react';
import { useWebSocket } from '../hooks';
import { type Workspace } from '../types';
import { WorkspaceContext } from '../context';

export const WorkspaceProvider: React.FC<{
      children: React.ReactNode;
      appearance: 'light' | 'dark';
    }> = ({ children, appearance }) => {
  const { status, emit } = useWebSocket();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)

  useEffect(() => {
    if (status !== 'connected') {
      return;
    }
    const fetchWorkspaces = async () => {
      const workspaces = await emit<Workspace[]>('FETCH_WORKSPACES')
      setWorkspaces(workspaces);
    };
    fetchWorkspaces();
  }, [status, emit]);

  // Search...
  const filteredWorkspaces = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return workspaces;

    return workspaces.filter((ws) =>
      ws.name.toLowerCase().includes(query) ||
      ws.host.toLowerCase().includes(query) ||
      ws.port.toString().includes(query)
    );
  }, [workspaces, searchQuery]);

  const deleteWorkspace = (id: string) => {
    setWorkspaces((prev) => prev.filter((ws) => ws.id !== id));
  };

  const updateWorkspace = async (updated: Workspace) => {
    let fallbackWorkspaces: Workspace[] = [];

    setWorkspaces((prevWorkspaces) => {
      fallbackWorkspaces = prevWorkspaces; // Capture snapshot
      return prevWorkspaces.map((ws) => (ws.id === updated.id ? updated : ws));
    });

    try {
      await emit('UPDATE_WORKSPACE', updated);
    } catch (err) {
      console.error("Backend failed to save workspace settings:", err);
      setWorkspaces(fallbackWorkspaces);
      alert(`Failed to save changes to ${updated.name}. Please check your backend logs.`);
    }
  };

  const addWorkspace = async (newWs: Omit<Workspace, 'id'>) => {
    try {
      const res = await emit('ADD_WORKSPACE', newWs) as { id: string };
      if (!res || !res.id) {
        throw new Error("Backend response did not return a valid workspace ID");
      }
      setWorkspaces((prev) => [
        ...prev,
        {
          ...newWs,
          id: res.id,
        } as Workspace,
      ]);
    } catch (err) {
      console.error("Backend failed to add workspace:", err);
      alert(`Failed to add workspace "${newWs.name}". Please check your backend logs.`);
    }
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      filteredWorkspaces,
      searchQuery,
      setSearchQuery,
      deleteWorkspace,
      appearance,
      editingWorkspace,
      setEditingWorkspace,
      updateWorkspace,
      addWorkspace,
    }}>
      {children}

    </WorkspaceContext.Provider>
  );
};
