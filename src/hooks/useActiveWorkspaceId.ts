import { useEffect, useState } from 'react';

export function useActiveWorkspaceId() {
  const getWorkspaceId = () =>
    new URLSearchParams(window.location.search).get('workspace');

  const [workspaceId, setWorkspaceId] = useState(getWorkspaceId);

  useEffect(() => {
    const handleLocationChange = () => setWorkspaceId(getWorkspaceId());

    window.addEventListener('popstate', handleLocationChange);

    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  return workspaceId;
}