import React, { useState, useEffect } from 'react';
import { useActiveWorkspaceId, useWorkspaces } from '../hooks';
import { ActiveWorkspaceContext } from '../context';

export const ActiveWorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeId = useActiveWorkspaceId();
  const { workspaces } = useWorkspaces();

  const [files, setFiles] = useState<string[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  const currentWorkspace = workspaces.find((ws) => ws.id === activeId);

  const [prevWorkspaceId, setPrevWorkspaceId] = useState<string | undefined>(currentWorkspace?.id);

  if (currentWorkspace?.id !== prevWorkspaceId) {
    setPrevWorkspaceId(currentWorkspace?.id);
    setLoadingFiles(true);
    setFiles([]);
  }

  useEffect(() => {
    if (!currentWorkspace) return;

    // TODO: emit....
    console.log(`Scanning Go workfolder directory: ${currentWorkspace.workfolder}`);

    setTimeout(() => {
      setFiles(['main.tcl', 'schema.json', 'procedures.tcl', 'backup.db']);
      setLoadingFiles(false);
    }, 400); // Simulate network roundtrip
  }, [currentWorkspace]);

  if (!currentWorkspace) {
    return <div className="p-5">Workspace not found.</div>;
  }

  const refreshFiles = () => { /* re-fetch from Go */ };

  return (
    <ActiveWorkspaceContext.Provider value={{
      workspace: currentWorkspace,
      files,
      loadingFiles,
      refreshFiles
    }}>
      {children}
    </ActiveWorkspaceContext.Provider>
  );
};
