import { useCallback, useEffect, useState } from 'react';
import { Flex, Text, Button, Spinner, DataList, Grid } from '@radix-ui/themes';
import { UpdateIcon, SizeIcon, CrossCircledIcon, ReaderIcon } from '@radix-ui/react-icons';
import { useActiveWorkspaceId, useError, useWebSocket } from '../../hooks';
import NodeShutdownModal from './NodeShutdownModal';
import type { NodeInfo } from '../../types';
import NodeInspectModal from './NodeInspectModal';
import NodeLogLevelModal from './NodeLogLevelModal';
import { errStr } from '../../utils';

interface NodeInfoPanelProps {
  scope: string;
}

export default function NodeInfoPanel({ scope }: NodeInfoPanelProps) {
  const activeId = useActiveWorkspaceId();
  const { emit } = useWebSocket();
  const { setErrorMessage } = useError();
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isShutdownOpen, setIsShutdownOpen] = useState(false);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [isLogLevelOpen, setIsLogLevelOpen] = useState(false);

  const nodeIdMatch = scope.match(/\d+/);
  const nodeId = nodeIdMatch ? parseInt(nodeIdMatch[0], 10) : 0;

  const fetchNodeInfo = useCallback(async (abortCheck?: { isMounted: boolean }) => {
    setLoading(true);
    setNodeInfo(null);
    try {
      const data = await emit<NodeInfo>('GET_NODE_INFO', {
        id: activeId,
        scope,
      });

      if (!abortCheck || abortCheck.isMounted) {
        setNodeInfo(data);
      }
    } catch (err: unknown) {
      if (!abortCheck || abortCheck.isMounted) {
        console.error("Failed to acquire node info:", err);
        const message = errStr(err, "Failed to acquire node info.");
        setErrorMessage(message);
      }
    } finally {
      if (!abortCheck || abortCheck.isMounted) {
        setLoading(false);
      }
    }
  }, [activeId, scope, emit, setErrorMessage]);

  useEffect(() => {
    const abortCheck = { isMounted: true };

    queueMicrotask(() => {
      if (abortCheck.isMounted) {
        fetchNodeInfo(abortCheck);
      }
    });

    return () => {
      abortCheck.isMounted = false;
    };
  }, [fetchNodeInfo]);

  const formatUptime = (seconds: number) => {
    if (!seconds) return '0s';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (loading) {
    return <Flex justify="center" py="3"><Spinner size="2" /></Flex>;
  }

  if (!nodeInfo) {
    return (
      <Button size="1" variant="outline" onClick={() => fetchNodeInfo()} style={{ cursor: 'pointer', width: '100%' }}>
        Load Node Info
      </Button>
    );
  }

  return (
    <>
      <Flex direction="column" gap="2">
        <DataList.Root size="1">
          <DataList.Item>
            <DataList.Label color="gray">Status</DataList.Label>
            <DataList.Value>
              <Text weight="medium">{nodeInfo.status || 'UNKNOWN'}</Text>
            </DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label color="gray">Uptime</DataList.Label>
            <DataList.Value>{formatUptime(nodeInfo.uptime)}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label color="gray">Version</DataList.Label>
            <DataList.Value style={{ fontFamily: 'monospace' }}>{nodeInfo.version}</DataList.Value>
          </DataList.Item>
        </DataList.Root>

        <Grid columns="2" gap="2" mt="1">
          <Button size="1" variant="soft" color="gray" onClick={() => fetchNodeInfo()} className="cursor-pointer">
            <UpdateIcon /> Refresh
          </Button>
          <Button size="1" variant="soft" color="gray" onClick={() => setIsInspectOpen(true)} className="cursor-pointer">
            <SizeIcon /> Inspect Full
          </Button>
          <Button size="1" variant="soft" color="gray" onClick={() => setIsLogLevelOpen(true)} className="cursor-pointer">
            <ReaderIcon /> Log Level
          </Button>
          <Button size="1" variant="soft" color="red" onClick={() => setIsShutdownOpen(true)} className="cursor-pointer">
            <CrossCircledIcon /> Shutdown
          </Button>
        </Grid>
      </Flex>
      <NodeShutdownModal
        isOpen={isShutdownOpen}
        onOpenChange={setIsShutdownOpen}
        nodeId={nodeId}
        scope={scope}
      />
      {nodeInfo && (
        <NodeLogLevelModal
          isOpen={isLogLevelOpen}
          onOpenChange={setIsLogLevelOpen}
          scope={scope}
          currentNodeLogLevel={nodeInfo.logLevel}
        />
      )}
      <NodeInspectModal
        isOpen={isInspectOpen}
        onOpenChange={setIsInspectOpen}
        nodeInfo={nodeInfo}
        onRefresh={fetchNodeInfo}
      />
    </>
  );
}