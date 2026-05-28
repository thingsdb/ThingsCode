import React, { useState, useEffect, useContext, useRef } from 'react';
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
  const { workspaces } = context;
  const { status, emit } = useWebSocket();

  const activeFetchRef = useRef<string | null>(null);
  const currentWorkspace = workspaces.find((ws) => ws.id === activeId);

  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFilename, setActiveFilename] = useState<string | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScope, setActiveScope] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [prevWorkspaceId, setPrevWorkspaceId] = useState<string | undefined>(currentWorkspace?.id);
  const [fileScopes, setFileScopes] = useState<Record<string, string>>({});


  // Reset lifecycle states
  if (currentWorkspace?.id !== prevWorkspaceId) {
    setPrevWorkspaceId(currentWorkspace?.id);
    setLoading(true);
    setFiles([]);
    setScopes([]);
    setActiveScope(null);
    setActiveFilename(null);
    setErrorMessage(null);
    setFileScopes({});
  }

  useEffect(() => {
    if (
      !currentWorkspace ||
      status !== 'connected' ||
      activeFetchRef.current === currentWorkspace.id) return;

    activeFetchRef.current = currentWorkspace.id;

    const loadWorkspaceData = async () => {
      try {
        const [_files, _scopes, _fileScopes] = await Promise.all([
          emit<ProjectFile[]>('FETCH_FILES', currentWorkspace),
          emit<string[]>('FETCH_SCOPES', currentWorkspace),
          emit<Record<string, string>>('FETCH_FILE_SCOPES', currentWorkspace),
        ]);

        if (activeFetchRef.current !== currentWorkspace.id) return;

        setFiles(_files);
        setScopes(_scopes);
        setFileScopes(_fileScopes);

        if (_files.length > 0) {
          const savedSelectedFile = localStorage.getItem('ticode-selected-file');
          const selectedFile = _files.find((file) => file.filename === savedSelectedFile) || _files[0];
          const fileToSet = selectedFile.filename;
          setActiveFilename(fileToSet);
          // Here we do take it from the current Workspace
          const lastSelectedScope = _fileScopes[fileToSet];
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
        if (activeFetchRef.current === currentWorkspace.id) {
          const message = err instanceof Error
            ? err.message
            : typeof err === 'string' ? err : "Failed to load workspace.";
          setErrorMessage(message);
        }
      } finally {
        if (activeFetchRef.current === currentWorkspace.id) {
          setLoading(false);
        }
      }
    };

    loadWorkspaceData();
  }, [currentWorkspace, status, emit]);

  if (!currentWorkspace) return <WorkspaceNotFound />

  const activeFile = files.find(f => f.filename === activeFilename) || null;

  const setActiveFile = (filename: string) => {
    localStorage.setItem('ticode-selected-file', filename);
    setActiveFilename(filename);
    const lastSelectedScope = fileScopes[filename];
    if (lastSelectedScope) {
      setActiveScope(lastSelectedScope);
    }
  };

  const setActiveScopeState = (scope: string) => {
    setActiveScope(scope);
    if (activeFilename) {
      updateFileScope(activeFilename, scope);
    }
  };

  const updateFileContent = async (filename: string, newContent: string) => {
    setFiles(prev => prev.map(f =>
      f.filename === filename ? { ...f, content: newContent } : f
    ));
    try {
      await emit('UPDATE_FILE_CONTENT', {
        id: currentWorkspace.id,
        filename: filename,
        content: newContent,
      })
    } catch (err) {
        console.error("Failed to save file:", err);
        if (activeFetchRef.current === currentWorkspace.id) {
          const message = err instanceof Error
            ? err.message
            : typeof err === 'string' ? err : "Failed to save file.";
          setErrorMessage(message);
        }
    }
  };

  const updateFileScope = async (filename: string, scope: string) => {
    try {
      await emit('UPDATE_FILE_SCOPE', {
        id: currentWorkspace.id,
        filename: filename,
        scope: scope,
      });
    } catch (err: unknown) {
      console.error("Backend failed to save updated file scope context metric:", err);
    }
    setFileScopes((prev) => {
      return {
        ...prev,
        [filename]: scope,
      };
    });
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