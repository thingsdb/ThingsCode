import { createContext } from 'react';
import { type ProjectFile, type Room, type Scope, type Workspace } from '../types';


interface ActiveWorkspaceContextType {
  workspace: Workspace;
  files: ProjectFile[];
  rooms: Room[];
  activeFilename: string | null;
  activeContent: string | null;
  activeFile: ProjectFile | null;  // derived from activeFilename
  scopes: Scope[];
  activeScope: string | null;
  requireCommit: boolean;
  loading: boolean;
  isExecuting: boolean;

  setActiveScopeState: (scope: string) => void;
  setActiveContent: (content: string) => void;
  setActiveFile: (filename: string) => void;
  createFile: (filename: string) => Promise<void>;
  renameFile: (filename: string, newFilename: string) => Promise<void>;
  deleteFile: (filename: string) => Promise<void>;
  storeFileContent: (filename: string, newContent: string) => Promise<void>;
  updateQueryVars: (filename: string, newQueryVars: string) => Promise<void>;
  execCode: (filename: string, scope: string, code: string, queryVars: string | null) => Promise<void>;
  refreshFiles: () => Promise<void>;
  refreshScopes: () => Promise<void>;
  refreshRooms: () => Promise<void>;
  joinRoom: (scope: string, name: string, code: string) => Promise<void>;
  updateRoom: (scope: string, name: string, code: string) => Promise<void>;
  leaveRoom: (scope: string, name: string) => Promise<void>;
}

export const ActiveWorkspaceContext = createContext<ActiveWorkspaceContextType | undefined>(undefined);