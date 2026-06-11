import { useState, useEffect, useCallback } from 'react';
import { Flex, Text, Button, Spinner, DataList, Grid, Box, Tooltip } from '@radix-ui/themes';
import { UpdateIcon, TrashIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useActiveWorkspaceId, useError, useWebSocket } from '../../hooks';
import { ConfirmDialog } from '..';
import { errStr } from '../../utils';

interface NodeCountersPanelProps {
  scope: string;
}

interface NodeCountersData {
  averageChangeDuration: number;
  averageQueryDuration: number;
  changesCommitted: number;
  changesFailed: number;
  changesKilled: number;
  changesSkipped: number;
  changesUnaligned: number;
  changesWithGap: number;
  garbageCollected: number;
  largestResultSize: number;
  longestChangeDuration: number;
  longestQueryDuration: number;
  queriesFromCache: number;
  queriesSuccess: number;
  queriesWithError: number;
  quorumLost: number;
  startedAt: number;
  tasksSuccess: number;
  tasksWithError: number;
  wastedCache: number;
}

export default function NodeCountersPanel({ scope }: NodeCountersPanelProps) {
  const activeId = useActiveWorkspaceId();
  const { emit } = useWebSocket();
  const { setErrorMessage } = useError();
  const [counters, setCounters] = useState<NodeCountersData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResetCounters, setIsResetCounters] = useState(false);

  const fetchCounters = useCallback(async (abortCheck?: {isMounted: boolean}) => {
    setLoading(true);
    try {
      const data = await emit<NodeCountersData>('GET_NODE_COUNTERS', {
        id: activeId,
        scope,
      });
      if (!abortCheck || abortCheck.isMounted) {
        setCounters(data);
      }
    } catch (err: unknown) {
      if (!abortCheck || abortCheck.isMounted) {
        console.error("Failed to acquire node counters:", err);
        const message = errStr(err, "Failed to acquire node counters.");
        setErrorMessage(message);
      }

    } finally {
      if (!abortCheck || abortCheck.isMounted) {
        setLoading(false);
      }
    }
  }, [activeId, scope, emit, setErrorMessage]);

  const handleResetCounters = async () => {
    setIsResetting(true);
    try {
      await emit('RESET_NODE_COUNTERS', {
        id: activeId,
        scope,
      });
      await fetchCounters();
    } catch (err: unknown) {
      console.error("Failed to execute counters reset:", err);
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    const abortCheck = { isMounted: true };

    queueMicrotask(() => {
      if (abortCheck.isMounted) {
        fetchCounters(abortCheck);
      }
    });

    return () => {
      abortCheck.isMounted = false;
    };
  }, [fetchCounters]);

  const formatDuration = (seconds: number) => {
    if (seconds === undefined || seconds === null) return '0s';
    if (seconds < 0.001) return `${(seconds * 1000000).toFixed(0)} μs`;
    if (seconds < 1) return `${(seconds * 1000).toFixed(2)} ms`;
    return `${seconds.toFixed(3)} s`;
  };

  const formatUptimeDate = (unixTimestamp: number) => {
    if (!unixTimestamp) return 'Never';
    return new Date(unixTimestamp * 1000).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return <Flex justify="center" py="3"><Spinner size="2" /></Flex>;
  }

  if (!counters) {
    return (
      <Button size="1" variant="outline" onClick={() => fetchCounters()} style={{ cursor: 'pointer', width: '100%' }}>
        Load Counters
      </Button>
    );
  }

  // Critical issues
  const hasCriticalErrors = counters.changesFailed > 0 || counters.changesKilled > 0 || counters.changesSkipped > 0;

  return (
    <>
      <Flex direction="column" gap="3">

        {/* CRITICAL INDICATOR */}
        {hasCriticalErrors && (
          <Flex align="center" gap="2" p="2" style={{ backgroundColor: 'var(--red-2)', borderRadius: 4, border: '1px solid var(--red-4)' }}>
            <ExclamationTriangleIcon color="var(--red-9)" />
            <Text size="1" color="red" weight="bold">
              Critical problems detected!
            </Text>
          </Flex>
        )}

        {/* QUERIES & TASKS */}
        <Box>
          <Text size="1" color="gray" weight="bold" mb="1" style={{ letterSpacing: '0.05em' }}>
            QUERIES & TASKS
          </Text>
          <DataList.Root size="1">
            <DataList.Item>
              <DataList.Label color="gray">Query Success / Error</DataList.Label>
              <DataList.Value>
                <Text color="green">{counters.queriesSuccess}</Text>
                <Text color="gray" mx="1">/</Text>
                <Text color={counters.queriesWithError > 0 ? 'orange' : 'gray'}>{counters.queriesWithError}</Text>
              </DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label color="gray">Task Success / Error</DataList.Label>
              <DataList.Value>
                <Text color="green">{counters.tasksSuccess}</Text>
                <Text color="gray" mx="1">/</Text>
                <Text color={counters.tasksWithError > 0 ? 'orange' : 'gray'}>{counters.tasksWithError}</Text>
              </DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label color="gray">Avg / Max Duration</DataList.Label>
              <DataList.Value>{formatDuration(counters.averageQueryDuration)} / {formatDuration(counters.longestQueryDuration)}</DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label color="gray">Max Response Payload</DataList.Label>
              <DataList.Value>{counters.largestResultSize.toLocaleString()} B</DataList.Value>
            </DataList.Item>
          </DataList.Root>
        </Box>

        {/* TRANSACTIONS & CHANGES */}
        <Box>
          <Text size="1" color="gray" weight="bold" mb="1" style={{ letterSpacing: '0.05em' }}>
            TRANSACTIONS
          </Text>
          <DataList.Root size="1">
            <DataList.Item>
              <DataList.Label color="gray">Committed / Failed</DataList.Label>
              <DataList.Value>
                <Text weight="medium">{counters.changesCommitted}</Text>
                <Text color="gray" mx="1">/</Text>
                <Text weight="medium" color={counters.changesFailed > 0 ? 'red' : 'gray'}>{counters.changesFailed}</Text>
              </DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label color="gray">Avg / Max Duration</DataList.Label>
              <DataList.Value>{formatDuration(counters.averageChangeDuration)} / {formatDuration(counters.longestChangeDuration)}</DataList.Value>
            </DataList.Item>

            <DataList.Item>
              <Tooltip content="Number of times a change cannot be pushed to the end of the queue and needs re-ordering.">
                <DataList.Label color="gray" style={{ cursor: 'help' }}>Unaligned Changes</DataList.Label>
              </Tooltip>
              <DataList.Value>
                <Text color={counters.changesUnaligned > 0 ? 'amber' : undefined}>
                  {counters.changesUnaligned.toLocaleString()}
                </Text>
              </DataList.Value>
            </DataList.Item>

            <DataList.Item>
              <Tooltip content="Changes which are committed but at least one change-Id was skipped.">
                <DataList.Label color="gray" style={{ cursor: 'help' }}>Changes with Gap</DataList.Label>
              </Tooltip>
              <DataList.Value>
                <Text color={counters.changesWithGap > 0 ? 'amber' : undefined}>
                  {counters.changesWithGap.toLocaleString()}
                </Text>
              </DataList.Value>
            </DataList.Item>

            <DataList.Item>
              <Tooltip content="Changes which cannot be committed since a change with a higher id is already processed.">
                <DataList.Label color="gray" style={{ cursor: 'help' }}>Skipped Changes</DataList.Label>
              </Tooltip>
              <DataList.Value>
                <Text color={counters.changesSkipped > 0 ? 'amber' : undefined}>
                  {counters.changesSkipped.toLocaleString()}
                </Text>
              </DataList.Value>
            </DataList.Item>

            <DataList.Item>
              <Tooltip content="Killed changes took too long for receiving the READY status. These changes may be processed later.">
                <DataList.Label color="gray" style={{ cursor: 'help' }}>Killed Changes</DataList.Label>
              </Tooltip>
              <DataList.Value>
                <Text color={counters.changesKilled > 0 ? 'amber' : undefined}>
                  {counters.changesKilled.toLocaleString()}
                </Text>
              </DataList.Value>
            </DataList.Item>

            <DataList.Item>
              <Tooltip content="Number of times this node did not get a change Id accepted by the quorum of nodes due to ticket collisions.">
                <DataList.Label color="gray" style={{ cursor: 'help' }}>Quorum Collisions</DataList.Label>
              </Tooltip>
              <DataList.Value>
                <Text color={counters.quorumLost > 0 ? 'amber' : undefined}>
                  {counters.quorumLost.toLocaleString()}
                </Text>
              </DataList.Value>
            </DataList.Item>
          </DataList.Root>
        </Box>

        {/* SUB-CATEGORY C: CACHE & ENGINE */}
        <Box>
          <Text size="1" color="gray" weight="bold" mb="1" style={{ letterSpacing: '0.05em' }}>
            ENGINE & MEMORY
          </Text>
          <DataList.Root size="1">
            <DataList.Item>
              <DataList.Label color="gray">Cache Hits / Wasted</DataList.Label>
              <DataList.Value>
                <Text color="green">{counters.queriesFromCache}</Text>
                <Text color="gray" mx="1">/</Text>
                <Text color={counters.wastedCache > 0 ? 'amber' : 'gray'}>{counters.wastedCache}</Text>
              </DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label color="gray">Garbage Collected</DataList.Label>
              <DataList.Value>{counters.garbageCollected}</DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label color="gray">Running Since</DataList.Label>
              <DataList.Value style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUptimeDate(counters.startedAt)}</DataList.Value>
            </DataList.Item>
          </DataList.Root>
        </Box>

        {/* TOOLBOX UTILITY CONTROL SYSTEM PANEL BUTTONS */}
        <Grid columns="2" gap="2" mt="1">
          <Button
            size="1"
            variant="soft"
            color="gray"
            onClick={() => fetchCounters()}
            className="cursor-pointer"
          >
            <UpdateIcon /> Refresh
          </Button>
          <Button
            size="1"
            variant="soft"
            color="red"
            onClick={() => setIsResetCounters(true)}
            disabled={isResetting}
            style={{ cursor: isResetting ? 'not-allowed' : 'pointer' }}
          >
            <TrashIcon /> Reset
          </Button>
        </Grid>
      </Flex>
      <ConfirmDialog
        open={isResetCounters}
        onOpenChange={setIsResetCounters}
        title="Reset counters"
        description={`Are you sure you want to reset the counters for ${scope}?`}
        confirmText="Reset counters"
        colorVariant="red"
        onConfirm={handleResetCounters}
      />
    </>

  );
}