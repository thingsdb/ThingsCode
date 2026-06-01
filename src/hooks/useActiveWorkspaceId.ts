import { useEffect, useState } from 'react';

// Quick helper hook to grab the workspace ID out of the native browser URL window
export function useActiveWorkspaceId() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  if (currentPath.startsWith('/workspace/')) {
    return currentPath.replace('/workspace/', '');
  }
  return null;
}