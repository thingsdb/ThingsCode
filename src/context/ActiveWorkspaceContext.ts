import { createContext } from 'react';
import { type ProjectFile, type Workspace } from '../types';


interface ActiveWorkspaceContextType {
  workspace: Workspace;
  files: ProjectFile[];
  activeFilename: string | null;
  activeContent: string | null;
  activeFile: ProjectFile | null;  // derived from activeFilename
  scopes: string[];
  activeScope: string | null;
  loading: boolean;
  isExecuting: boolean;

  setActiveScopeState: (scope: string) => void;
  setActiveContent: (content: string) => void;
  setActiveFile: (filename: string) => void;
  createFile: (filename: string) => void;
  renameFile: (filename: string, newFilename: string) => void;
  deleteFile: (filename: string) => void;
  storeFileContent: (filename: string, newContent: string) => Promise<void>;
  updateQueryVars: (filename: string, newQueryVars: string) => Promise<void>;
  execCode: (filename: string, scope: string, code: string, queryVars: string | null) => Promise<void>;
  refreshFiles: () => Promise<void>;
}

export const ActiveWorkspaceContext = createContext<ActiveWorkspaceContextType | undefined>(undefined);