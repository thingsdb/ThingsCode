import { createContext } from 'react';
import { type Workspace } from '../types';


interface ActiveWorkspaceContextType {
  workspace: Workspace;
  files: string[];
  loadingFiles: boolean;
  refreshFiles: () => void;
}

export const ActiveWorkspaceContext = createContext<ActiveWorkspaceContextType | undefined>(undefined);