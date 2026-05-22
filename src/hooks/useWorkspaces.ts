import { useContext } from 'react';
import { WorkspaceContext } from '../context';

export const useWorkspaces = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspaces must be used inside an WorkspaceProvider');
  }
  return context;
};