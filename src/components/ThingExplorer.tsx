import { useState, useEffect, useCallback } from 'react';
import { Box } from '@radix-ui/themes';
import { useWebSocket, useActiveWorkspaceId } from '../hooks';
import { errStr } from '../utils';
import { TreeNode } from '.';
import type { TreeNodeType } from '../types';

interface ThingExplorerProps {
  scope: string;
  startThingId: number; // Initial root entry ID
}

export default function ThingExplorer({ scope, startThingId }: ThingExplorerProps) {
  const { emit } = useWebSocket();
  const workspaceId = useActiveWorkspaceId();

  const [thingRegistry, setThingRegistry] = useState<Record<number, TreeNodeType>>({});
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<number, string | null>>({});

  // Lazy load individual things
  const fetchThingNode = useCallback(async (id: number) => {
    if (thingRegistry[id] !== undefined || loadingMap[id] || errorMap[id]) return;

    setLoadingMap((prev) => ({ ...prev, [id]: true }));
    setErrorMap((prev) => ({ ...prev, [id]: null }));

    try {
      const response = await emit('FETCH_THING', {
        id: workspaceId,
        scope,
        thingId: id
      }, true);

      setThingRegistry((prev) => ({ ...prev, [id]: response as TreeNodeType }));
    } catch (err: unknown) {
      setErrorMap((prev) => ({ ...prev, [id]: errStr(err, `Failed to load Thing #${id}`) }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [id]: false }));
    }
  }, [emit, loadingMap, scope, thingRegistry, workspaceId, errorMap]);

  useEffect(() => {
    if (startThingId) {
      fetchThingNode(startThingId);
    }
  }, [startThingId, scope, fetchThingNode]);

  return (
    <Box
      style={{
        fontFamily: 'monospace',
        overflow: 'auto',
        maxHeight: '100%'
      }}
    >
      <TreeNode
        nodeValue={{ '#': startThingId }}
        label={startThingId === 1 ? "root" : "#"}
        registry={thingRegistry}
        loadingMap={loadingMap}
        errorMap={errorMap}
        onExpandRequest={fetchThingNode}
        expandOninit={true}
      />
    </Box>
  );
}

