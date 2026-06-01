import React, { useState, useEffect, useMemo } from 'react';
import { useWebSocket } from '../hooks';
import { type Workspace } from '../types';
import { WorkspaceContext } from '../context';
import { NotificationToast } from '../components';


interface WorkspaceProviderProps {
  children: React.ReactNode;
  appearance: 'light' | 'dark';
}

export function WorkspaceProvider({children, appearance}: WorkspaceProviderProps) {
  const { status, emit } = useWebSocket();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      console.error("Backend failed to remove workspace:", err);
      setWorkspaces(fallback);
      const message = err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : `Failed to remove workspace ID ${id}.`;
      setErrorMessage(message);
    }
  };

  const updateWorkspace = async (updated: Workspace) => {
    try {
      const res = await emit('UPDATE_WORKSPACE', updated) as { id: string, workfolder: string };
      updated.workfolder = res.workfolder;
      setWorkspaces((prev) => {
        return prev.map((ws) => (ws.id === updated.id ? updated : ws));
      });
    } catch (err: unknown) {
      console.error("Backend failed to save workspace settings:", err);
      const message = err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : `Failed to save changes to ${updated.name}.`;
      setErrorMessage(message);
    }
  };

  const addWorkspaceHelper = async (newWs: Omit<Workspace, 'id'>) => {
    const res = await emit('ADD_WORKSPACE', newWs) as { id: string, workfolder: string };
    if (!res || !res.id) {
      throw new Error("Backend response did not return a valid workspace ID");
    }
    setWorkspaces((prev) => [
      ...prev,
      {
        ...newWs,
        id: res.id,
        workfolder: res.workfolder,
      } as Workspace,
    ]);
    return res.id;
  };

  const addWorkspace = async (newWs: Omit<Workspace, 'id'>) => {
    try {
      await addWorkspaceHelper(newWs);
    } catch (err) {
      console.error("Backend failed to add workspace:", err);
      const message = err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : `Failed to add workspace ${newWs.name}.`;
      setErrorMessage(message);
    }
  };

  const quickConnect = async (tmpWs: Omit<Workspace, 'id'>) => {
    try {
      const id = await addWorkspaceHelper(tmpWs);
      window.history.pushState({}, '', `/workspace/${id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      console.error("Backend failed to set-up quick connect workspace:", err);
      const message = err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : `Failed to open ${tmpWs.name}.`;
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
      {errorMessage && (
        <NotificationToast
          message={errorMessage}
          onClear={() => setErrorMessage(null)}
        />
      )}
    </WorkspaceContext.Provider>
  );
};
