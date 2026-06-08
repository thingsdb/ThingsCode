import React, { useState, useEffect, useMemo } from 'react';
import { useError, useWebSocket } from '../hooks';
import { type Workspace } from '../types';
import { WorkspaceContext } from '../context';
import { errStr } from '../utils';


interface WorkspaceProviderProps {
  children: React.ReactNode;
  appearance: 'light' | 'dark';
}

export function WorkspaceProvider({children, appearance}: WorkspaceProviderProps) {
  const { status, emit } = useWebSocket();
  const { setErrorMessage } = useError();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    if (status !== 'connected') {
      return;
    }
    const fetchWorkspaces = async () => {
      const workspaces = await emit<Workspace[]>('FETCH_WORKSPACES');
      setWorkspaces(workspaces);
    };
    fetchWorkspaces();
  }, [status, emit]);

  // Search...
  const filteredWorkspaces = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return workspaces.filter((ws) => !ws.isQuickConnect);

    return workspaces.filter((ws) =>
      !ws.isQuickConnect && (
        ws.name.toLowerCase().includes(query) ||
        ws.host.toLowerCase().includes(query) ||
        ws.port.toString().includes(query)
      )
    );
  }, [workspaces, searchQuery]);

  const deleteWorkspace = async (id: string) => {
    let fallback: Workspace[] = [];
    setWorkspaces((prev) => {
      fallback = prev;
      return prev.filter((ws) => ws.id !== id);
    });

    try {
      await emit('REMOVE_WORKSPACE', {id: id});
    } catch (err: unknown) {
      setWorkspaces(fallback);
      console.error("Failed to remove workspace:", err);
      const message = errStr(err, "Failed to remove workspace.");
      setErrorMessage(message);
    }
  };

  const updateWorkspace = async (updated: Workspace) => {
    try {
      await emit('UPDATE_WORKSPACE', {
        ...updated,
        isTmp: updated.workfolder === "",
      }) as { id: string };
      setWorkspaces((prev) => {
        return prev.map((ws) => (ws.id === updated.id ? updated : ws));
      });
    } catch (err: unknown) {
      console.error("Failed to save workspace settings:", err);
      const message = errStr(err, "Failed to save workspace settings.");
      setErrorMessage(message);
    }
  };

  const addWorkspaceHelper = async (newWs: Omit<Workspace, 'id'>) => {
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
    return res.id;
  };

  const addWorkspace = async (newWs: Omit<Workspace, 'id'>) => {
    try {
      await addWorkspaceHelper(newWs);
    } catch (err: unknown) {
      console.error("Failed to add workspace:", err);
      const message = errStr(err, "Failed to add workspace.");
      setErrorMessage(message);
    }
  };

  const quickConnect = async (tmpWs: Omit<Workspace, 'id'>) => {
    try {
      const id = await addWorkspaceHelper(tmpWs);
      window.history.pushState({}, '', `/workspace/${id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err: unknown) {
      console.error("Failed to set-up quick connect workspace:", err);
      const message = errStr(err, "Failed to set-up quick connect workspace.");
      setErrorMessage(message);
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
      quickConnect,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
