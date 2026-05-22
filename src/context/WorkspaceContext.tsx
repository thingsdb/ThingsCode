import { createContext } from 'react';
import { type Workspace } from '../types';

interface WorkspaceContextType {
  workspaces: Workspace[];
  filteredWorkspaces: Workspace[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  deleteWorkspace: (id: string) => void;
  appearance: 'light' | 'dark';
  editingWorkspace: Workspace | null;
  setEditingWorkspace: (ws: Workspace | null) => void;
  updateWorkspace: (updated: Workspace) => void;
  addWorkspace: (ws: Omit<Workspace, 'id'>) => void;
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);
