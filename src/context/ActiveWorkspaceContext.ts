import { createContext } from 'react';
import { type ProjectFile, type Workspace } from '../types';


interface ActiveWorkspaceContextType {
  workspace: Workspace;
  files: ProjectFile[];
  activeFilename: string | null;
  activeFile: ProjectFile | null;  // derived from activeFilename
  scopes: string[];
  activeScope: string | null;
  loading: boolean;

  setActiveScopeState: (scope: string) => void;
  setActiveFile: (filename: string) => void;
  updateFileContent: (filename: string, newContent: string) => Promise<void>;
  refresh: () => void;
}

export const ActiveWorkspaceContext = createContext<ActiveWorkspaceContextType | undefined>(undefined);