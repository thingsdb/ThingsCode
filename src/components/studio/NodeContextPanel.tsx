import { useEffect, useState } from 'react';
import { Card, Flex, Text, Button, Spinner, DataList, Grid, Box, Em } from '@radix-ui/themes';
import { UpdateIcon, SizeIcon, CrossCircledIcon, ChevronDownIcon, ChevronRightIcon, ReaderIcon } from '@radix-ui/react-icons';
import { useActiveWorkspaceId, useWebSocket } from '../../hooks';
import NodeShutdownModal from './NodeShutdownModal';
import type { NodeInfo } from '../../types';
import { NotificationToast } from '..';
import NodeInspectModal from './NodeInspectModal';

interface NodeContextPanelProps {
  scope: string;
}

export default function NodeContextPanel({ scope }: NodeContextPanelProps) {
  const activeId = useActiveWorkspaceId();
  const { emit } = useWebSocket();
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [isShutdownOpen, setIsShutdownOpen] = useState(false);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [openSection, setOpenSection] = useState<string | null>(null);

  const nodeIdMatch = scope.match(/\d+/);
  const nodeId = nodeIdMatch ? parseInt(nodeIdMatch[0], 10) : 0;

  const fetchNodeInfo = async () => {
    setLoadingInfo(true);
    setNodeInfo(null);
    try {
      const data = await emit<NodeInfo>('GET_NODE_INFO', {
        id: activeId,
        scope,
      });
      setNodeInfo(data);
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : typeof err === 'string' ? err : "Failed to acquire node info.";
      console.error("Failed to acquire node info:", err);
      setErrorMessage(message);
    } finally {
      setLoadingInfo(false);
    }
  };

  const toggleSection = (sectionName: string) => {
    if (openSection === sectionName) {
      setOpenSection(null); // Collapse if clicked again
    } else {
      setOpenSection(sectionName);
      if (sectionName === 'node-info') {
        fetchNodeInfo();
      }
    }
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return '0s';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <Flex direction="column" gap="2">

      {/* NODE INFO */}
      <Card size="1" variant="classic" style={{ borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
        <Flex
          align="center"
          justify="between"
          py="1"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleSection('node-info')}
        >
          <Text size="2" weight="bold">Node Info</Text>
          {openSection === 'node-info' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>

        {openSection === 'node-info' && (
          <Box pb="1" pt="1">
            {loadingInfo ? (
              <Flex justify="center" py="3"><Spinner size="2" /></Flex>
            ) : nodeInfo ? (
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
                  <Button size="1" variant="soft" color="iris" onClick={fetchNodeInfo} style={{ cursor: 'pointer' }}>
                    <UpdateIcon /> Refresh
                  </Button>
                  <Button size="1" variant="soft" color="iris" onClick={() => setIsInspectOpen(true)} style={{ cursor: 'pointer' }}>
                    <SizeIcon /> Inspect Full
                  </Button>
                  <Button size="1" variant="soft" color="iris" style={{ cursor: 'pointer' }}>
                    <ReaderIcon /> Log Level
                  </Button>
                  <Button size="1" variant="solid" color="red" onClick={() => setIsShutdownOpen(true)} style={{ cursor: 'pointer' }}>
                    <CrossCircledIcon /> Shutdown
                  </Button>
                </Grid>
              </Flex>
            ) : (
              <Button size="1" variant="outline" onClick={fetchNodeInfo} style={{ cursor: 'pointer', width: '100%' }}>
                Load Node Info
              </Button>
            )}
          </Box>
        )}
      </Card>

      {/* COUNTERS */}
      <Card size="1" variant="classic" style={{ borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
        <Flex
          align="center"
          justify="between"
          py="1"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleSection('counters')}
        >
          <Text size="2" weight="bold">Counters</Text>
          {openSection === 'counters' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>
        {openSection === 'counters' && <Box pb="3"><Text size="1" color="gray"><Em>Counter metrics coming soon...</Em></Text></Box>}
      </Card>

      {/* COUNTERS */}
      <Card size="1" variant="classic" style={{ borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
        <Flex
          align="center"
          justify="between"
          py="1"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleSection('backups')}
        >
          <Text size="2" weight="bold">Backups</Text>
          {openSection === 'backups' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>
        {openSection === 'backups' && <Box pb="3"><Text size="1" color="gray"><Em>Backup management coming soon...</Em></Text></Box>}
      </Card>

      {/* MODULES */}
      <Card size="1" variant="classic" style={{ borderBottom: '1px solid var(--gray-4)', borderRadius: 0 }}>
        <Flex
          align="center"
          justify="between"
          py="1"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleSection('modules')}
        >
          <Text size="2" weight="bold">Modules</Text>
          {openSection === 'modules' ? <ChevronDownIcon color="gray" /> : <ChevronRightIcon color="gray" />}
        </Flex>
        {openSection === 'modules' && <Box pb="3"><Text size="1" color="gray"><Em>Cluster engine modules coming soon...</Em></Text></Box>}
      </Card>
      <NodeShutdownModal
        isOpen={isShutdownOpen}
        onOpenChange={setIsShutdownOpen}
        nodeId={nodeId}
        scope={scope}
      />
      <NodeInspectModal
        isOpen={isInspectOpen}
        onOpenChange={setIsInspectOpen}
        nodeInfo={nodeInfo}
      />
      {errorMessage && (
        <NotificationToast
          message={errorMessage}
          onClear={() => setErrorMessage(null)}
        />
      )}
    </Flex>
  );
}