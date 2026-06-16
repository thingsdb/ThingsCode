import { createContext } from 'react';
import { type Workspace } from '../types';

interface WorkspaceContextType {
  workspaces: Workspace[];
  filteredWorkspaces: Workspace[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  deleteWorkspace: (id: string) => Promise<void>;
  editingWorkspace: Workspace | null;
  setEditingWorkspace: (ws: Workspace | null) => void;
  updateWorkspace: (updated: Workspace) => Promise<void>;
  addWorkspace: (ws: Omit<Workspace, 'id'>) => Promise<void>;
  quickConnect: (ws: Omit<Workspace, 'id'>) => Promise<void>;
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);
