import { useActiveWorkspaceId } from './hooks/useActiveWorkspaceId';
import { ActiveWorkspaceProvider } from './providers/ActiveWorkspaceProvider';
import WorkspaceLauncher from './components/WorkspaceLauncher';
import StudioLayout from './components/studio/StudioLayout';
import ConnectionOverlay from './components/ConnectionOverlay';

export default function App() {
  const activeWorkspaceId = useActiveWorkspaceId();

  if (!activeWorkspaceId) {
    return (
      <>
        <WorkspaceLauncher />
        <ConnectionOverlay />
      </>
    );
  }

  return (
    <ActiveWorkspaceProvider key={activeWorkspaceId}>
      <StudioLayout />
      <ConnectionOverlay />
    </ActiveWorkspaceProvider>
  );
}