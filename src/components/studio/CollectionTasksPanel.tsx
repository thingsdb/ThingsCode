import { useCallback, useEffect, useState } from 'react';
import { Flex, Text, Card, Box, Badge, IconButton, Tooltip } from '@radix-ui/themes';
import { ExclamationTriangleIcon, UpdateIcon } from '@radix-ui/react-icons';
import { useActiveWorkspaceId, useWebSocket } from '../../hooks';
import type { Task } from '../../types';
import { errStr } from '../../utils';

interface CollectionTasksPanelProps {
  scope: string;
}

export default function CollectionTasksPanel({ scope }: CollectionTasksPanelProps) {
  const { emit } = useWebSocket();
  const activeId = useActiveWorkspaceId();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await emit('FETCH_TASKS', { id: activeId, scope }) as Task[];
      setTasks(response || []);
    } catch (err: unknown) {
      console.error("Failed to fetch tasks:", err);
      setFetchError(errStr(err, "Failed to fetch tasks."));
    } finally {
      setIsLoading(false);
    }
  }, [activeId, emit, scope]);

  useEffect(() => {
    queueMicrotask(fetchTasks);
  }, [fetchTasks]);

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center" mt="2">
        <Text size="1" color="gray" weight="bold" mt="2">
          TASKS ({tasks.length})
        </Text>
        <Tooltip content="Refresh tasks list">
          <IconButton
            size="1"
            variant="soft"
            color="gray"
            disabled={isLoading}
            onClick={fetchTasks}
            style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            <UpdateIcon width="13" height="13" className={isLoading ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>
      </Flex>

      {fetchError && tasks.length === 0 && !isLoading && (
        <Box
          py="3"
          px="2"
          style={{
            backgroundColor: 'var(--red-2)',
            borderRadius: 'var(--radius-2)',
            border: '1px dashed var(--red-4)',
            textAlign: 'center',
          }}
        >
          <Text size="1" color="red">{fetchError}</Text>
        </Box>
      )}

      {!fetchError && tasks.length === 0 && !isLoading && (
        <Box
          py="3"
          px="2"
          style={{
            textAlign: 'center',
            border: '1px dashed var(--gray-5)',
            borderRadius: 'var(--radius-2)'
          }}
        >
          <Text size="1" color="gray">No active or faulted tasks found in this scope.</Text>
        </Box>
      )}

      {!fetchError && isLoading && tasks.length === 0 && (
        <Flex justify="center" py="2">
          <Text size="1" color="gray" className="animate-pulse">Loading scheduled tasks...</Text>
        </Flex>
      )}

      <Flex direction="column" gap="2">
        {tasks.map((task) => {
          const hasError = !!task.error;

          let displayTime = 'Not scheduled';
          if (task.at) {
            try {
              displayTime = new Date(task.at).toLocaleString(undefined, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              });
            } catch {
              displayTime = 'Invalid Date';
            }
          }

          return (
            <Card
              key={task.id}
              size="1"
              style={{
                padding: '6px 8px',
                backgroundColor: 'var(--gray-2)',
                borderColor: hasError ? 'var(--orange-6)' : 'var(--gray-4)'
              }}
            >
              <Flex direction="column" gap="2">
                <Flex align="center" justify="between" gap="2">

                  {/* Flex-shrink allowed to give timestamps maximum priority */}
                  <Flex align="center" gap="2" style={{ minWidth: 0, flexShrink: 1 }}>
                    <Badge size="1" color={hasError ? 'orange' : 'iris'} variant="outline" style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                      #{task.id}
                    </Badge>
                    <Text size="1" color="gray" weight="medium" truncate>
                      Owner: <Text color="gray" highContrast>{task.owner}</Text>
                    </Text>
                  </Flex>

                  {/* Timestamp, solid to prevent time-strings from wrapping or breaking */}
                  <Text size="1" color="gray" style={{ fontFamily: 'monospace', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {displayTime}
                  </Text>
                </Flex>

                {hasError && (
                  <Flex direction="column" gap="2">
                    {/* Error message */}
                    <Flex
                      align="start"
                      gap="2"
                      p="2"
                      style={{
                        backgroundColor: 'var(--orange-2)',
                        borderRadius: 'var(--radius-1)',
                        borderLeft: '2px solid var(--orange-8)'
                      }}
                    >
                      <ExclamationTriangleIcon color="var(--orange-9)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <Text size="1" color="orange" style={{ fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: '1.2' }}>
                        {task.error}
                      </Text>
                    </Flex>
                  </Flex>
                )}
              </Flex>
            </Card>
          );
        })}
      </Flex>
    </Flex>
  );
}