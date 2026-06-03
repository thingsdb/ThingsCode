import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { useActiveWorkspaceId, useWebSocket, useEvent, useError } from '../hooks';
import WorkspaceNotFound from '../components/WorkspaceNotFound';
import { ActiveWorkspaceContext, WorkspaceContext } from '../context';
import type { ProjectFile, Result, Room } from '../types';

interface ActiveWorkspaceProviderProps {
  children: React.ReactNode;
}

export function ActiveWorkspaceProvider({ children }: ActiveWorkspaceProviderProps) {
  const activeId = useActiveWorkspaceId();
  const { setWorkspace } = useEvent();
  const { setErrorMessage } = useError();
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("ActiveWorkspaceProvider must be wrapped within a valid WorkspaceProvider element!");
  }
  const { workspaces } = context;
  const { status, emit } = useWebSocket();

  const activeFetchRef = useRef<string | null>(null);
  const currentWorkspace = workspaces.find((ws) => ws.id === activeId);

  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeFilename, setActiveFilename] = useState<string | null>(null);
  const [activeContent, setActiveContent] = useState<string | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScope, setActiveScope] = useState<string | null>(null);
  const [fileScopes, setFileScopes] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  useEffect(() => {
    if (currentWorkspace) {
      setWorkspace(currentWorkspace.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id, setWorkspace]);

  useEffect(() => {
    return () => {
      console.log('[ActiveWorkspaceProvider] Provider unmounting.');
      setWorkspace(null);
    };
  }, [setWorkspace]);

  useEffect(() => {
    if (
      !currentWorkspace ||
      status !== 'connected' ||
      activeFetchRef.current === currentWorkspace.id) return;

    activeFetchRef.current = currentWorkspace.id;

    const loadWorkspaceData = async () => {
      let isFailed = false;
      try {
        const [_files, _scopes, _fileScopes, _rooms] = await Promise.all([
          emit<ProjectFile[]>('FETCH_FILES', currentWorkspace),
          emit<string[]>('FETCH_SCOPES', currentWorkspace),
          emit<Record<string, string>>('FETCH_FILE_SCOPES', currentWorkspace),
          emit<Room[]>('FETCH_ROOMS', currentWorkspace),
        ]);

        if (activeFetchRef.current !== currentWorkspace.id) return;

        setFiles(_files);
        setScopes(_scopes);
        setFileScopes(_fileScopes);
        setRooms(_rooms);

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
          isFailed = true;
        }
      } finally {
        if (activeFetchRef.current === currentWorkspace.id) {
          setLoading(isFailed);
        }
      }
    };

    loadWorkspaceData();
  }, [currentWorkspace, status, emit, setErrorMessage]);

  const activeFile = useMemo(() => {
    return files.find(f => f.filename === activeFilename) || null;
  }, [files, activeFilename])

  if (!currentWorkspace) return <WorkspaceNotFound />

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
    if (activeFilename && activeFilename.endsWith('.ti')) {
      updateFileScope(activeFilename, scope);
    }
  };

  const storeFileContent = async (filename: string, newContent: string) => {
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

  const updateQueryVars = async (filename: string, newQueryVars: string) => {
    setFiles(prev => prev.map(f =>
      f.filename === filename ? { ...f, queryVars: newQueryVars } : f
    ));
    try {
      await emit('UPDATE_EXEC_ARGS', {
        id: currentWorkspace.id,
        filename: filename,
        queryVars: newQueryVars,
      })
    } catch (err) {
      console.error("Failed to save execution arguments:", err);
      if (activeFetchRef.current === currentWorkspace.id) {
        const message = err instanceof Error
          ? err.message
          : typeof err === 'string' ? err : "Failed to save execution arguments.";
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
      console.error("Backend failed to save updated file scope:", err);
      if (activeFetchRef.current === currentWorkspace.id) {
        const message = err instanceof Error
          ? err.message
          : typeof err === 'string' ? err : "Failed to save file scope.";
        setErrorMessage(message);
      }
    }
    setFileScopes((prev) => {
      return {
        ...prev,
        [filename]: scope,
      };
    });
  };

  const createFile = async (filename: string) => {
    try {
      await emit('CREATE_FILE', {
        id: currentWorkspace.id,
        filename: filename,
      });
    } catch (err: unknown) {
      console.error("Backend failed to create file:", err);
      if (activeFetchRef.current === currentWorkspace.id) {
        const message = err instanceof Error
          ? err.message
          : typeof err === 'string' ? err : "Failed to create file.";
        setErrorMessage(message);
      }
    }
    setFiles(prev => {
      return [
        ...prev,
        {
          filename,
          content: '',
        } as ProjectFile
      ];
    });
    setActiveFilename(filename);
  };

  const renameFile = async (filename: string, newFilename: string) => {
    try {
      await emit('RENAME_FILE', {
        id: currentWorkspace.id,
        filename: filename,
        newFilename: newFilename,
      });
    } catch (err: unknown) {
      console.error("Backend failed to rename file:", err);
      if (activeFetchRef.current === currentWorkspace.id) {
        const message = err instanceof Error
          ? err.message
          : typeof err === 'string' ? err : "Failed to rename file.";
        setErrorMessage(message);
      }
    }
    setFiles(prev => prev.map(f =>
      f.filename === filename ? { ...f, filename: newFilename } : f
    ));
    if (activeFilename === filename) {
      setActiveFilename(newFilename);
    }
  };

  const deleteFile = async (filename: string) => {
    try {
      await emit('DELETE_FILE', {
        id: currentWorkspace.id,
        filename: filename,
      });
    } catch (err: unknown) {
      console.error("Backend failed to delete file:", err);
      if (activeFetchRef.current === currentWorkspace.id) {
        const message = err instanceof Error
          ? err.message
          : typeof err === 'string' ? err : "Failed to delete file.";
        setErrorMessage(message);
      }
    }
    setFiles(prev => prev.filter((file) => file.filename !== filename));
    if (activeFilename === filename) {
      setActiveFilename(null);
    }
  };

  const execCode = async (filename: string, scope: string, code: string, queryVars: string | null) => {
    setIsExecuting(true);
    setFiles(prev => prev.map(f =>
      f.filename === filename ? { ...f, result: undefined } : f
    ));
    try {
      const vars = queryVars ? JSON.parse(queryVars) : null;
      const result = await emit('EXEC_CODE', {
        id: currentWorkspace.id,
        filename,
        scope,
        code,
        vars,
      }) as Result;
      setFiles(prev => prev.map(f =>
        f.filename === filename ? { ...f, result: result } : f
      ));
    } catch (err: unknown) {
      console.error("Failed to save execution arguments:", err);
      if (activeFetchRef.current === currentWorkspace.id) {
        const message = err instanceof Error
          ? err.message
          : typeof err === 'string' ? err : "Failed to save execution arguments.";
        setErrorMessage(message);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const refreshFiles = async () => {
    const _files = await emit<ProjectFile[]>('FETCH_FILES', currentWorkspace);
    setFiles(_files);
  };

  const joinRoom = async () => {

  }

  return (
    <ActiveWorkspaceContext.Provider value={{
      workspace: currentWorkspace,
      files,
      rooms,
      activeFilename,
      activeContent,
      activeFile,
      scopes,
      activeScope,
      loading,
      isExecuting,

      setActiveScopeState,
      setActiveContent,
      setActiveFile,
      createFile,
      renameFile,
      deleteFile,
      storeFileContent,
      updateQueryVars,
      execCode,
      refreshFiles,
    }}>
      {children}
    </ActiveWorkspaceContext.Provider>
  );
};