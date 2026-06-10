import { useCallback, useEffect, useState } from 'react';
import { Flex, Text, Card, Box, Badge, IconButton, Tooltip } from '@radix-ui/themes';
import { UpdateIcon, FileIcon } from '@radix-ui/react-icons';
import { useActiveWorkspaceId, useWebSocket } from '../../hooks';
import type { Backup } from '../../types';
import { errStr } from '../../utils';
import BackupModal from './BackupModal';

interface BackupsPanelProps {
  scope: string;
}

export default function BackupsPanel({ scope }: BackupsPanelProps) {
  const { emit } = useWebSocket();
  const activeId = useActiveWorkspaceId();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [viewBackup, setViewBackup] = useState<Backup | null>(null);

  const fetchBackups = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await emit('FETCH_BACKUPS', { id: activeId, scope }) as Backup[];
      setBackups(response || []);
    } catch (err: unknown) {
      console.error("Failed to fetch backups:", err);
      setFetchError(errStr(err, "Failed to fetch backups."));
    } finally {
      setIsLoading(false);
    }
  }, [activeId, emit, scope]);

  useEffect(() => {
    queueMicrotask(fetchBackups);
  }, [fetchBackups]);

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center" mt="2">
        <Text size="1" color="gray" weight="bold" mt="2">
          BACKUPS ({isLoading ? '...' : backups.length})
        </Text>
        <Tooltip content="Refresh backups list">
          <IconButton
            size="1"
            variant="soft"
            color="gray"
            disabled={isLoading}
            onClick={fetchBackups}
            style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            <UpdateIcon width="13" height="13" className={isLoading ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>
      </Flex>

      {fetchError && backups.length === 0 && !isLoading && (
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

      {!fetchError && backups.length === 0 && !isLoading && (
        <Box
          py="3"
          px="2"
          style={{
            textAlign: 'center',
            border: '1px dashed var(--gray-5)',
            borderRadius: 'var(--radius-2)'
          }}
        >
          <Text size="1" color="gray">No backups found on this node.</Text>
        </Box>
      )}

      {!fetchError && isLoading && backups.length === 0 && (
        <Flex justify="center" py="2">
          <Text size="1" color="gray" className="animate-pulse">Loading backups...</Text>
        </Flex>
      )}

      <Flex direction="column" gap="2">
        {backups.map((backup) => {

          return (
            <Card
              key={`#${backup.id}`}
              size="1"
              style={{
                padding: '6px 8px',
                backgroundColor: 'var(--gray-2)',
                borderColor: 'var(--gray-4)',
                cursor: 'pointer',
              }}
              onClick={() => setViewBackup(backup)}
            >
              <Flex direction="column" gap="2">
                <Flex align="center" justify="between" gap="2">
                  <Text
                    size="1"
                    weight="bold"
                    truncate
                    style={{
                      fontFamily: 'monospace',
                      color: 'var(--gray-12)',
                      minWidth: 0,
                      flexGrow: 1
                    }}
                  >
                    #{backup.id}
                  </Text>

                  {/* ⚡ PENDING/OK/FAILED */}
                  {backup.resultCode === undefined ? (
                    <Badge color="amber" variant="surface" size="1" style={{ gap: '2px', padding: '0 5px', flexShrink: 0 }}>
                      <Text size="1" weight="medium" style={{ fontSize: '10px', letterSpacing: '0.03em' }}>PENDING</Text>
                    </Badge>
                  ) : backup.resultCode === 0 ? (
                    <Badge color="green" variant="outline" size="1" style={{ gap: '2px', padding: '0 5px', flexShrink: 0, borderColor: 'var(--gray-5)' }}>
                      <Text size="1" weight="medium" style={{ fontSize: '10px', color: 'var(--green-10)' }}>OK</Text>
                    </Badge>
                  ) : (
                    <Badge color="red" variant="outline" size="1" style={{ gap: '2px', padding: '0 5px', flexShrink: 0, borderColor: 'var(--gray-5)' }}>
                      <Text size="1" weight="medium" style={{ fontSize: '10px', color: 'var(--red-10)' }}>ERROR</Text>
                    </Badge>
                  )}
                </Flex>

                <Flex
                  align="start"
                  gap="2"
                  style={{
                    minWidth: 0,
                    borderTop: '1px dashed var(--gray-4)',
                    paddingTop: '6px'
                  }}
                >
                  <FileIcon width="12" height="12" color="var(--gray-8)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <Text
                    size="1"
                    color="gray"
                    truncate
                    style={{
                      lineHeight: '1.3',
                      color: 'var(--gray-10)',
                      fontStyle: 'italic'
                    }}
                  >
                    {backup.fileTemplate}
                  </Text>
                </Flex>
              </Flex>
            </Card>
          );
        })}
      </Flex>
      {viewBackup && (
        <BackupModal
          onClose={() => setViewBackup(null)}
          scope={scope}
          backup={viewBackup}
        />
      )}
    </Flex>
  );
}