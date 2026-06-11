import { useEffect, useState } from 'react';
import { Dialog, Flex, Text, Badge, Box, Button, Spinner, Callout } from '@radix-ui/themes';
import { ExclamationTriangleIcon, CalendarIcon, PersonIcon } from '@radix-ui/react-icons';
import Editor from '@monaco-editor/react';
import { useTheme, useWebSocket, useActiveWorkspaceId } from '../../hooks';
import { errStr, renderTextWithLinks } from '../../utils';
import type { Commit } from '../../types';


interface CommitModalProps {
  commitId: number;
  scope: string;
  onClose: () => void;
}

export default function CommitModal({ commitId, scope, onClose }: CommitModalProps) {
  const { emit } = useWebSocket();
  const activeId = useActiveWorkspaceId();
  const { appearance } = useTheme();

  const [commit, setCommit] = useState<Commit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (commitId === null) {
      queueMicrotask(() => setCommit(null));
      return;
    }

    const fetchCommit = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await emit('FETCH_COMMIT', { id: activeId, scope, commitId }) as Commit;
        setCommit(response);
      } catch (err: unknown) {
        console.error("Failed to fetch commit details:", err);
        setError(errStr(err, "Failed to fetch commit details."));
      } finally {
        setIsLoading(false);
      }
    };

    queueMicrotask(fetchCommit);
  }, [commitId, scope, activeId, emit]);

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
                COMMIT #{commitId}
              </Badge>
              <Text size="3" weight="bold">Details</Text>
            </Flex>

            {/* By Tag badge */}
            {commit && (
              <Flex align="center" gap="2">
                <PersonIcon color="var(--gray-8)" />
                <Text size="1" color="gray" weight="medium">
                  By: <Text color="gray" highContrast>{commit.by}</Text>
                </Text>
              </Flex>
            )}
          </Flex>
        </Dialog.Title>

        {/* LOADING & ERROR LAYOUT PANELS */}
        {isLoading && (
          <Flex justify="center" align="center" py="6" direction="column" gap="3">
            <Spinner size="3" />
            <Text size="1" color="gray">Fetching commit...</Text>
          </Flex>
        )}

        {error && !isLoading && (
          <Box py="4" px="3" my="2" style={{ backgroundColor: 'var(--red-2)', border: '1px dashed var(--red-5)', borderRadius: 'var(--radius-3)' }}>
            <Text size="2" color="red">{error}</Text>
          </Box>
        )}

        {commit && !isLoading && (
          <Flex direction="column" gap="4" mt="2">
            {commit.errMsg && (
              <Callout.Root color="red" size="1" style={{ flexShrink: 0 }}>
                <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
                <Callout.Text style={{ wordBreak: 'break-word' }}>{renderTextWithLinks(commit.errMsg)}</Callout.Text>
              </Callout.Root>
            )}

            <Box>
              <Text as="label" size="1" weight="bold" color="gray">
                Created On
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
                    {new Date(commit.createdOn).toLocaleString(undefined, {hour12: false})}
                  </Text>
                </Flex>
              </Flex>
            </Box>

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
                  path=".ticode-commit-code.ti"
                  value={commit.code}
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