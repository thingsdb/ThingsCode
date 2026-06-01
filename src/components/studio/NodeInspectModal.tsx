import React, { useState } from 'react';
import { Dialog, Flex, Button, Text, Tabs, Box, DataList, Badge, Heading, Code, Em } from '@radix-ui/themes';
import { CopyIcon, CheckIcon, Cross1Icon, InfoCircledIcon, Share2Icon, RocketIcon, GearIcon, Link2Icon } from '@radix-ui/react-icons';

interface NodeInspectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  nodeInfo: Record<string, any> | null;
}

export default function NodeInspectModal({ isOpen, onOpenChange, nodeInfo }: NodeInspectModalProps) {
  const [copied, setCopied] = useState(false);

  if (!nodeInfo) return null;

  // Formatting helpers for raw metrics
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB (${bytes.toLocaleString()} bytes)`;
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return '0s';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m (approx. ${Math.floor(seconds).toLocaleString()}s)`;
  };

  // Raw JSON Copy Engine
  const handleCopyRawJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(nodeInfo, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy json snapshot:', err);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content aria-describedby={undefined} style={{ maxWidth: 640, width: '100%', padding: 0, overflow: 'hidden' }}>

        <Flex
          justify="between"
          align="center"
          px="4"
          py="3"
          style={{ borderBottom: '1px solid var(--gray-4)', backgroundColor: 'var(--gray-2)' }}
        >
          <Flex align="center" gap="2">
            <InfoCircledIcon width="18" height="18" color="var(--iris-9)" />
            {/* Using semantic Dialog.Title wrapper matching Radix Themes style guidelines */}
            <Dialog.Title style={{ margin: 0 }}>
              <Heading size="3" highContrast>
                Inspect Node ({nodeInfo.nodeId}): {nodeInfo.nodeName || 'unknown'}
              </Heading>
            </Dialog.Title>
            <Badge color={nodeInfo.status === 'READY' ? 'green' : 'amber'} variant="surface" size="1">
              {nodeInfo.status}
            </Badge>
          </Flex>

          <Flex align="center" gap="2">
            <Button size="1" variant="ghost" color="gray" onClick={handleCopyRawJson} style={{ cursor: 'pointer' }}>
              {copied ? <CheckIcon color="green" /> : <CopyIcon />}
              {copied ? 'Copied' : 'Copy JSON'}
            </Button>
          </Flex>
        </Flex>

        {/* METRICS VIEW TAB PANEL ROUTER */}
        <Tabs.Root defaultValue="system">
          <Box px="4" style={{ backgroundColor: 'var(--gray-2)', borderBottom: '1px solid var(--gray-4)' }}>
            <Tabs.List size="2">
              <Tabs.Trigger value="system" style={{ gap: 6, cursor: 'pointer' }}><GearIcon style={{marginRight: '6px'}} /> System & Core</Tabs.Trigger>
              <Tabs.Trigger value="network" style={{ gap: 6, cursor: 'pointer' }}><Share2Icon style={{marginRight: '6px'}} /> Network</Tabs.Trigger>
              <Tabs.Trigger value="database" style={{ gap: 6, cursor: 'pointer' }}><RocketIcon style={{marginRight: '6px'}} /> Engine & Transactions</Tabs.Trigger>
              <Tabs.Trigger value="libraries" style={{ gap: 6, cursor: 'pointer' }}><Link2Icon style={{marginRight: '6px'}} /> Dependencies</Tabs.Trigger>
            </Tabs.List>
          </Box>

          <Box px="4" py="4" style={{ minHeight: 340, maxHeight: '60vh', overflowY: 'auto', backgroundColor: 'var(--gray-1)' }}>

            {/* TAB 1: SYSTEM & CORE */}
            <Tabs.Content value="system">
              <DataList.Root size="2" style={{ '--data-list-label-width': '200px' } as React.CSSProperties}>
                <DataList.Item><DataList.Label color="gray">Node Name</DataList.Label><DataList.Value><Text weight="bold">{nodeInfo.nodeName}</Text></DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Node ID</DataList.Label><DataList.Value><Code>{nodeInfo.nodeId}</Code></DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Cluster Zone</DataList.Label><DataList.Value>{nodeInfo.zone}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Version</DataList.Label><DataList.Value style={{ fontFamily: 'monospace' }}>v{nodeInfo.version}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Uptime</DataList.Label><DataList.Value>{formatUptime(nodeInfo.uptime)}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Platform / Arch</DataList.Label><DataList.Value style={{ textTransform: 'capitalize' }}>{nodeInfo.platform} ({nodeInfo.architecture})</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Active Log Level</DataList.Label><DataList.Value><Badge color="amber" variant="soft">{nodeInfo.logLevel}</Badge></DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Storage Path</DataList.Label><DataList.Value style={{ fontFamily: 'monospace', fontSize: '11px' }}>{nodeInfo.storagePath}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Modules Path</DataList.Label><DataList.Value style={{ fontFamily: 'monospace', fontSize: '11px' }}>{nodeInfo.modulesPath}</DataList.Value></DataList.Item>
              </DataList.Root>
            </Tabs.Content>

            {/* TAB 2: NETWORK */}
            <Tabs.Content value="network">
              <DataList.Root size="2" style={{ '--data-list-label-width': '200px' } as React.CSSProperties}>
                <DataList.Item><DataList.Label color="gray">Client API Port</DataList.Label><DataList.Value><Code weight="medium" color="blue">{nodeInfo.clientPort}</Code></DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">HTTP API Port</DataList.Label><DataList.Value><Code weight="medium" color="blue">{nodeInfo.httpApiPort}</Code></DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">HTTP Status Port</DataList.Label><DataList.Value><Code weight="medium" color="blue">{nodeInfo.httpStatusPort}</Code></DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Internal Node Port</DataList.Label><DataList.Value><Code weight="medium" color="orange">{nodeInfo.nodePort}</Code></DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">IP Binding Support</DataList.Label><DataList.Value><Badge color="gray">{nodeInfo.ipSupport}</Badge></DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Connected Clients</DataList.Label><DataList.Value>{nodeInfo.connectedClients}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Python Interpreter</DataList.Label><DataList.Value style={{ fontFamily: 'monospace' }}>{nodeInfo.pythonInterpreter}</DataList.Value></DataList.Item>
              </DataList.Root>
            </Tabs.Content>

            {/* TAB 3: DATABASE ENGINE */}
            <Tabs.Content value="database">
              <DataList.Root size="2" style={{ '--data-list-label-width': '220px' } as React.CSSProperties}>
                <DataList.Item><DataList.Label color="gray">Result Size Limit</DataList.Label><DataList.Value>{formatBytes(nodeInfo.resultSizeLimit)}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Global Stored Change ID</DataList.Label><DataList.Value><Code color="purple">{nodeInfo.globalStoredChangeId?.toLocaleString()}</Code></DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Global Committed Change ID</DataList.Label><DataList.Value><Code color="purple">{nodeInfo.globalCommittedChangeId?.toLocaleString()}</Code></DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Local Stored Change ID</DataList.Label><DataList.Value>{nodeInfo.localStoredChangeId?.toLocaleString()}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Local Committed Change ID</DataList.Label><DataList.Value>{nodeInfo.localCommittedChangeId?.toLocaleString()}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">DB Stored Change ID</DataList.Label><DataList.Value>{nodeInfo.dbStoredChangeId?.toLocaleString()}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Next Transaction ID</DataList.Label><DataList.Value><Text weight="bold">{nodeInfo.nextChangeId?.toLocaleString()}</Text></DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Next Free Record ID</DataList.Label><DataList.Value>{nodeInfo.nextFreeId?.toLocaleString()}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Changes In Async Queue</DataList.Label><DataList.Value>{nodeInfo.changesInQueue}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Syntax Framework Version</DataList.Label><DataList.Value>{nodeInfo.syntaxVersion}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Scheduled Backups</DataList.Label><DataList.Value>{nodeInfo.scheduledBackups}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Commit History Status</DataList.Label><DataList.Value><Badge variant="outline" color={nodeInfo.commitHistory === 'disabled' ? 'gray' : 'green'}>{nodeInfo.commitHistory}</Badge></DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Cached Names count</DataList.Label><DataList.Value>{nodeInfo.cachedNames}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Cached Queries count</DataList.Label><DataList.Value>{nodeInfo.cachedQueries}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Query Cache Threshold</DataList.Label><DataList.Value>{nodeInfo.thresholdQueryCache}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Cache Expiration Window</DataList.Label><DataList.Value>{nodeInfo.cacheExpirationTime}s</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Archive Files count</DataList.Label><DataList.Value>{nodeInfo.archiveFiles}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">Archived In Memory</DataList.Label><DataList.Value>{nodeInfo.archivedInMemory}</DataList.Value></DataList.Item>
              </DataList.Root>
            </Tabs.Content>

            {/* TAB 4: DEPENDENCIES & LIBRARIES */}
            <Tabs.Content value="libraries">
              <DataList.Root size="2" style={{ '--data-list-label-width': '220px' } as React.CSSProperties}>
                <DataList.Item><DataList.Label color="gray">libcleri (Grammar Engine)</DataList.Label><DataList.Value style={{ fontFamily: 'monospace' }}>{nodeInfo.libcleriVersion}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">libpcre2 (Regex Engine)</DataList.Label><DataList.Value style={{ fontFamily: 'monospace' }}>{nodeInfo.libpcre2Version}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">libuv (Async I/O Core)</DataList.Label><DataList.Value style={{ fontFamily: 'monospace' }}>{nodeInfo.libuvVersion}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">libwebsockets</DataList.Label><DataList.Value style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>{nodeInfo.libwebsocketsVersion}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">msgpack (Serialization)</DataList.Label><DataList.Value style={{ fontFamily: 'monospace' }}>{nodeInfo.msgpackVersion}</DataList.Value></DataList.Item>
                <DataList.Item><DataList.Label color="gray">yajl (JSON Parser)</DataList.Label><DataList.Value style={{ fontFamily: 'monospace' }}>{nodeInfo.yajlVersion}</DataList.Value></DataList.Item>
              </DataList.Root>
            </Tabs.Content>
          </Box>
        </Tabs.Root>

        {/* COMPONENT DRAWER CLOSING CONTROL PANEL */}
        <Flex justify="end" px="4" py="3" style={{ borderTop: '1px solid var(--gray-4)', backgroundColor: 'var(--gray-2)' }}>
          <Dialog.Close>
            <Button size="2" variant="ghost" color="gray" style={{ cursor: 'pointer' }}>
              Close Panel
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}