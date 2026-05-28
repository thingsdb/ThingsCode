import React, { useState, useEffect, useContext } from 'react';
import { useActiveWorkspaceId, useWebSocket } from '../hooks';
import WorkspaceNotFound from '../components/WorkspaceNotFound';
import { ActiveWorkspaceContext, WorkspaceContext } from '../context';
import type { ProjectFile } from '../types';
import { NotificationToast } from '../components';


export const ActiveWorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeId = useActiveWorkspaceId();
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("ActiveWorkspaceProvider must be wrapped within a valid WorkspaceProvider element!");
  }
  const { workspaces, updateFileScope } = context;
  const { status, emit } = useWebSocket();

  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFilename, setActiveFilename] = useState<string | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScope, setActiveScope] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentWorkspace = workspaces.find((ws) => ws.id === activeId);
  const [prevWorkspaceId, setPrevWorkspaceId] = useState<string | undefined>(currentWorkspace?.id);

  // Reset lifecycle states
  if (currentWorkspace?.id !== prevWorkspaceId) {
    setPrevWorkspaceId(currentWorkspace?.id);
    setLoading(true);
    setFiles([]);
    setScopes([]);
    setActiveScope(null);
    setActiveFilename(null);
    setErrorMessage(null);
  }

  useEffect(() => {
    if (!currentWorkspace || status !== 'connected') return;

    let isMounted = true;

    const loadWorkspaceData = async () => {
      try {
        const [_files, _scopes] = await Promise.all([
          emit<ProjectFile[]>('FETCH_FILES', currentWorkspace),
          emit<string[]>('FETCH_SCOPES', currentWorkspace)
        ]);

        if (!isMounted) return;

        setFiles(_files);
        setScopes(_scopes);
        if (_files.length > 0) {
          const savedSelectedFile = localStorage.getItem('ticode-selected-file');
          const selectedFile = _files.find((file) => file.filename === savedSelectedFile) || _files[0];
          const fileToSet = selectedFile.filename;
          setActiveFilename(fileToSet);
          const lastSelectedScope = currentWorkspace.fileScopes?.[fileToSet];
          if (lastSelectedScope) {
            setActiveScope(lastSelectedScope);
          } else if (_scopes.length > 0) {
            setActiveScope(_scopes[0]);
          }
        } else if (_scopes.length > 0) {
          setActiveScope(_scopes[0]);
        }
      } catch (err) {
        console.error("Workspace initialization aborted:", err);
        if (isMounted) {
          const message = err instanceof Error
            ? err.message
            : typeof err === 'string' ? err : "Failed to load workspace.";
          setErrorMessage(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadWorkspaceData();

    // Clean up
    return () => {
      isMounted = false;
    };
  }, [currentWorkspace, status, emit]);

  if (!currentWorkspace) return <WorkspaceNotFound />

  const activeFile = files.find(f => f.filename === activeFilename) || null;

  const setActiveFile = (filename: string) => {
    localStorage.setItem('ticode-selected-file', filename);
    setActiveFilename(filename);
    const targetFile = files.find(f => f.filename === filename);
    if (targetFile) {
      const lastSelectedScope = currentWorkspace.fileScopes?.[filename];
      if (lastSelectedScope) {
        setActiveScopeState(lastSelectedScope);
      }
    }
  };

  const setActiveScopeState = (scope: string) => {
    setActiveScope(scope);
    if (activeFilename) {
      updateFileScope(currentWorkspace.id, activeFilename, scope);
    }
  };

  const updateFileContent = (filename: string, newContent: string) => {
    setFiles(prev => prev.map(f =>
      f.filename === filename ? { ...f, content: newContent } : f
    ));
  };

  const refresh = () => {
    // Re-trigger synchronization queries manually
  };

  return (
    <ActiveWorkspaceContext.Provider value={{
      workspace: currentWorkspace,
      files,
      activeFilename,
      activeFile,
      scopes,
      activeScope,
      loading,
      setActiveScopeState,
      setActiveFile,
      updateFileContent,
      refresh
    }}>
      {children}
      {errorMessage && (
        <NotificationToast
          message={errorMessage}
          onClear={() => setErrorMessage(null)}
        />
      )}
    </ActiveWorkspaceContext.Provider>
  );
};