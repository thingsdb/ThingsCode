import { useActiveWorkspaceId } from './hooks/useActiveWorkspaceId';
import { ActiveWorkspaceProvider } from './providers/ActiveWorkspaceProvider';
import WorkspaceLauncher from './components/WorkspaceLauncher';
import StudioLayout from './components/studio/StudioLayout';
import ConnectionOverlay from './components/ConnectionOverlay';
import { NotificationToast } from './components';
import { useError } from './hooks';

export default function App() {
  const activeWorkspaceId = useActiveWorkspaceId();
  const { errorMessage, setErrorMessage } = useError();

  if (!activeWorkspaceId) {
    return (
      <>
        <WorkspaceLauncher />
        <ConnectionOverlay />
        {errorMessage && (
          <NotificationToast
            message={errorMessage}
            onClear={() => { setErrorMessage(null); }}
          />
        )}
      </>
    );
  }

  return (
    <ActiveWorkspaceProvider key={activeWorkspaceId}>
      <StudioLayout />
      <ConnectionOverlay />
      {errorMessage && (
        <NotificationToast
          message={errorMessage}
          onClear={() => { setErrorMessage(null); }}
        />
      )}
    </ActiveWorkspaceProvider>
  );
}