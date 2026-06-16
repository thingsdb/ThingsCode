import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flex, Text, Card, Box, Badge, IconButton, Tooltip, TextField } from '@radix-ui/themes';
import { Cross2Icon, ExclamationTriangleIcon, InfoCircledIcon, MagnifyingGlassIcon, UpdateIcon } from '@radix-ui/react-icons';
import { useActiveWorkspaceId, useWebSocket } from '../../hooks';
import type { Commit } from '../../types';
import { errStr } from '../../utils';
import CommitModal from './CommitModal';
// import CommitModal from './CommitModal';

interface HistorysPanelProps {
  scope: string;
}

export default function HistorysPanel({ scope }: HistorysPanelProps) {
  const { emit } = useWebSocket();
  const activeId = useActiveWorkspaceId();
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewCommitId, setViewCommitId] = useState<number | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response: Commit[] = await emit('FETCH_HISTORY', { id: activeId, scope });
      setCommits(response.sort(commit => -commit.id));
    } catch (err: unknown) {
      console.error("Failed to fetch history:", err);
      setFetchError(errStr(err, "Failed to fetch history."));
    } finally {
      setIsLoading(false);
    }
  }, [activeId, emit, scope]);

  useEffect(() => {
    queueMicrotask(() => { void fetchHistory(); });
  }, [fetchHistory]);

  const filtered = useMemo(() => {
    const cleanedQuery = searchQuery.trim().toLowerCase();
    if (!cleanedQuery) {
      return commits;
    }

    return commits.filter((commit) => {
      const messageMatch = commit.message.toLowerCase().includes(cleanedQuery);

      return messageMatch;
    });
  }, [commits, searchQuery]);


  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center" mt="2">
        <Text size="1" color="gray" weight="bold" mt="2">
          COMMITS ({isLoading ? '...' : filtered.length})
        </Text>
        <Tooltip content="Refresh commit history">
          <IconButton
            size="1"
            variant="soft"
            color="gray"
            disabled={isLoading}
            onClick={() => { void fetchHistory(); }}
            style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            <UpdateIcon width="13" height="13" className={isLoading ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>
      </Flex>

      {(commits.length > 0 || searchQuery) && (
        <TextField.Root
          placeholder="Search commit message..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); }}
          size="1"
        >
          <TextField.Slot>
            <MagnifyingGlassIcon height="14" width="14" />
          </TextField.Slot>
          {searchQuery && (
            <TextField.Slot style={{ paddingRight: '4px' }}>
              <IconButton
                size="1"
                variant="ghost"
                color="gray"
                onClick={() => { setSearchQuery(''); }}
                style={{ cursor: 'pointer', height: '16px', width: '16px' }}
              >
                <Cross2Icon height="12" width="12" />
              </IconButton>
            </TextField.Slot>
          )}
        </TextField.Root>
      )}

      {fetchError && commits.length === 0 && !isLoading && (
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

      {!fetchError && commits.length === 0 && !isLoading && (
        <Box
          py="3"
          px="2"
          style={{
            textAlign: 'center',
            border: '1px dashed var(--gray-5)',
            borderRadius: 'var(--radius-2)'
          }}
        >
          <Text size="1" color="gray">No commits found in this scope.</Text>
        </Box>
      )}

      {!fetchError && commits.length > 0 && filtered.length === 0 && (
        <Box
          py="3"
          px="2"
          style={{
            textAlign: 'center',
            border: '1px dashed var(--gray-5)',
            borderRadius: 'var(--radius-2)'
          }}
        >
          <Text size="1" color="gray" >No matching commits match your query.</Text>
        </Box>
      )}

      {!fetchError && isLoading && commits.length === 0 && (
        <Flex justify="center" py="2">
          <Text size="1" color="gray" className="animate-pulse">Loading commit history...</Text>
        </Flex>
      )}

      <Flex direction="column" gap="2">
        {filtered.map((commit) => {
          const hasError = !!commit.errMsg;
          let displayTime;
          try {
            displayTime = new Date(commit.createdOn).toLocaleString(undefined, { hour12: false });
          } catch {
            displayTime = 'Invalid Date';
          }

          return (
            <Card
              key={commit.id}
              size="1"
              style={{
                padding: '6px 8px',
                backgroundColor: 'var(--gray-2)',
                borderColor: hasError ? 'var(--orange-6)' : 'var(--gray-4)',
                cursor: 'pointer',
              }}
              onClick={() => { setViewCommitId(commit.id); }}
            >
              <Flex direction="column" gap="2">
                <Flex align="center" justify="between" gap="2">

                  {/* Flex-shrink allowed to give timestamps maximum priority */}
                  <Flex align="center" gap="2" style={{ minWidth: 0, flexShrink: 1 }}>
                    <Badge size="1" color={hasError ? 'orange' : 'iris'} variant="outline" style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                      #{commit.id}
                    </Badge>
                  </Flex>

                  {/* Timestamp, solid to prevent time-strings from wrapping or breaking */}
                  <Text size="1" color="gray" style={{ fontFamily: 'monospace', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {displayTime}
                  </Text>
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
                  <InfoCircledIcon width="12" height="12" color="var(--gray-8)" style={{ marginTop: '2px', flexShrink: 0 }} />
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
                    {commit.message}
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
                        {commit.errMsg}
                      </Text>
                    </Flex>
                  </Flex>
                )}
              </Flex>
            </Card>
          );
        })}
      </Flex>
      {viewCommitId && (
        <CommitModal
          commitId={viewCommitId}
          scope={scope}
          onClose={() => { setViewCommitId(null); }}
        />
      )}
    </Flex>
  );
}