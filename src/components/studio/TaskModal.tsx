import { useEffect, useState } from 'react';
import { Dialog, Flex, Text, Badge, Box, Button, Spinner, Callout } from '@radix-ui/themes';
import { ExclamationTriangleIcon, CalendarIcon, PersonIcon } from '@radix-ui/react-icons';
import Editor from '@monaco-editor/react';
import { useTheme, useWebSocket, useActiveWorkspaceId } from '../../hooks';
import { errStr, renderTextWithLinks } from '../../utils';

interface TaskDetail {
  id: number;
  owner: string;
  at: string | null;
  closure: string;
  error: string | null;
}

interface TaskModalProps {
  taskId: number;
  scope: string;
  onClose: () => void;
}

export default function TaskModal({ taskId, scope, onClose }: TaskModalProps) {
  const { emit } = useWebSocket();
  const activeId = useActiveWorkspaceId();
  const { appearance } = useTheme();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskId === null) {
      queueMicrotask(() => setTask(null));
      return;
    }

    const fetchTaskDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await emit('FETCH_TASK', { id: activeId, scope, taskId }) as TaskDetail;
        setTask(response);
      } catch (err: unknown) {
        console.error("Failed to fetch task details:", err);
        setError(errStr(err, "Failed to fetch task details."));
      } finally {
        setIsLoading(false);
      }
    };

    queueMicrotask(fetchTaskDetail);
  }, [taskId, scope, activeId, emit]);

  return (
    <Dialog.Root open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Content aria-describedby={undefined} style={{
        width: '60vw',
        maxWidth: '1024px',
        padding: '16px'
      }}>
        <Dialog.Title style={{ margin: 0, paddingBottom: '12px' }}>
          <Flex align="center" justify="between">
            <Flex align="center" gap="2">
              <Badge size="2" color="iris" variant="surface" style={{ fontVariantNumeric: 'tabular-nums' }}>
                TASK #{taskId}
              </Badge>
              <Text size="3" weight="bold">Details</Text>
            </Flex>

            {/* Owner Tag badge */}
            {task && (
              <Flex align="center" gap="2">
                <PersonIcon color="var(--gray-8)" />
                <Text size="1" color="gray" weight="medium">
                  Owner: <Text color="gray" highContrast>{task.owner}</Text>
                </Text>
              </Flex>
            )}
          </Flex>
        </Dialog.Title>

        {/* LOADING & ERROR LAYOUT PANELS */}
        {isLoading && (
          <Flex justify="center" align="center" py="6" direction="column" gap="3">
            <Spinner size="3" />
            <Text size="1" color="gray">Fetching task...</Text>
          </Flex>
        )}

        {error && !isLoading && (
          <Box py="4" px="3" my="2" style={{ backgroundColor: 'var(--red-2)', border: '1px dashed var(--red-5)', borderRadius: 'var(--radius-3)' }}>
            <Text size="2" color="red">{error}</Text>
          </Box>
        )}

        {task && !isLoading && (
          <Flex direction="column" gap="4" mt="2">
            {task.error ? (
              <Callout.Root color="red" size="1" style={{ flexShrink: 0 }}>
                <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
                <Callout.Text style={{ wordBreak: 'break-word' }}>{renderTextWithLinks(task.error)}</Callout.Text>
              </Callout.Root>
            ) : (
              <Box>
                <Text as="label" size="1" weight="bold" color="gray">
                  Next Planned Run
                </Text>
                <Flex
                  align="center"
                  gap="2"
                  p="2"
                  style={{
                    backgroundColor: 'var(--gray-2)',
                    borderRadius: 'var(--radius-3)',
                    border: '1px solid var(--gray-4)',
                  }}
                >
                  <CalendarIcon color="var(--iris-8)" />
                  <Flex direction="column">
                    <Text size="2" color="gray" weight="medium" style={{ fontFamily: 'monospace' }}>
                      {task.at ? new Date(task.at).toLocaleString(undefined, {
                        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                      }) : 'Immediate (Next execution tick loop)'}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            )}

            {/* MONACO EDITOR */}
            <Box>
              <Text as="label" size="1" weight="bold" color="gray">
                Code Expression (Read-Only)
              </Text>
              <Box
                style={{
                  height: '50vh',
                  border: '1px solid var(--gray-5)',
                  borderRadius: 'var(--radius-2)',
                  overflow: 'hidden',
                  opacity: 0.75,  // dimmed when read-only
                }}
              >
                <Editor
                  language="thingsdb"
                  path=".ticode-task-code.ti"
                  value={task.closure}
                  theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
                  options={{
                    readOnly: true,
                    domReadOnly: true,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    minimap: { enabled: false },
                    automaticLayout: true,
                    lineNumbers: 'off',
                    scrollbar: { vertical: 'visible', horizontal: 'visible' },
                    tabSize: 4,
                  }}
                />
              </Box>
            </Box>

            <Flex justify="end" gap="2" pt="2">
              <Dialog.Close>
                <Button variant="soft" color="gray" className="cursor-pointer" onClick={onClose}>
                  Close
                </Button>
              </Dialog.Close>
            </Flex>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}