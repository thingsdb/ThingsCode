import { useContext } from 'react';
import { ActiveWorkspaceContext } from '../context';

export const useActiveWorkspace = () => {
  const context = useContext(ActiveWorkspaceContext);
  if (!context) {
    throw new Error('useActiveWorkspace must be used inside an ActiveWorkspaceProvider');
  }
  return context;
};