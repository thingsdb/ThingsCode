import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flex, Text, Card, Box, IconButton, Tooltip, TextField } from '@radix-ui/themes';
import { UpdateIcon, DividerHorizontalIcon, Cross2Icon, QuoteIcon, CubeIcon, TokensIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useActiveWorkspaceId, useWebSocket } from '../../hooks';
import type { Enum } from '../../types';
import { errStr } from '../../utils';
import { HashIcon } from '../icons';
import EnumModal from './EnumModal';


interface EnumsPanelProps {
  scope: string;
}

export default function EnumsPanel({ scope }: EnumsPanelProps) {
  const { emit } = useWebSocket();
  const activeId = useActiveWorkspaceId();
  const [enums, setEnums] = useState<Enum[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewEnum, setViewEnum] = useState<Enum | null>(null);

  const fetchEnums = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response: Enum[] = await emit('FETCH_ENUMS', { id: activeId, scope });
      setEnums(response);
    } catch (err: unknown) {
      console.error("Failed to fetch enums:", err);
      setFetchError(errStr(err, "Failed to fetch enums."));
    } finally {
      setIsLoading(false);
    }
  }, [activeId, emit, scope]);

  useEffect(() => {
    queueMicrotask(() => { void fetchEnums(); });
  }, [fetchEnums]);

  const filtered = useMemo(() => {
    const cleanedQuery = searchQuery.trim().toLowerCase();
    if (!cleanedQuery) {
      return enums;
    }

    return enums.filter((enu) => {
      const nameMatch = enu.name.toLowerCase().includes(cleanedQuery);

      return nameMatch;
    });
  }, [enums, searchQuery]);

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center" mt="2">
        <Text size="1" color="gray" weight="bold" mt="2">
          ENUMS ({isLoading ? '...' : filtered.length})
        </Text>
        <Tooltip content="Refresh enums list">
          <IconButton
            size="1"
            variant="soft"
            color="gray"
            disabled={isLoading}
            onClick={() => { void fetchEnums(); }}
            style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            <UpdateIcon width="13" height="13" className={isLoading ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>
      </Flex>

      {(enums.length > 0 || searchQuery) && (
        <TextField.Root
          placeholder="Search name..."
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

      {fetchError && enums.length === 0 && !isLoading && (
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

      {!fetchError && enums.length === 0 && !isLoading && (
        <Box
          py="3"
          px="2"
          style={{
            textAlign: 'center',
            border: '1px dashed var(--gray-5)',
            borderRadius: 'var(--radius-2)'
          }}
        >
          <Text size="1" color="gray">No enums found in this scope.</Text>
        </Box>
      )}

      {!fetchError && enums.length > 0 && filtered.length === 0 && (
        <Box
          py="3"
          px="2"
          style={{
            textAlign: 'center',
            border: '1px dashed var(--gray-5)',
            borderRadius: 'var(--radius-2)'
          }}
        >
          <Text size="1" color="gray" >No matching enums match your query.</Text>
        </Box>
      )}

      {!fetchError && isLoading && enums.length === 0 && (
        <Flex justify="center" py="2">
          <Text size="1" color="gray" className="animate-pulse">Loading enums...</Text>
        </Flex>
      )}

      <Flex direction="column" gap="2">
        {filtered.map((enu) => {

          return (
            <Card
              key={enu.name}
              size="1"
              style={{
                padding: '6px 8px',
                backgroundColor: 'var(--gray-2)',
                borderColor: 'var(--gray-4)',
                cursor: 'pointer',
              }}
              onClick={() => { setViewEnum(enu); }}
            >
              <Flex direction="column" gap="2">
                <Flex align="center" justify="between" gap="2">
                  <Tooltip content={enu.name}>
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
                      {enu.name}
                    </Text>
                  </Tooltip>

                  {enu.type === 'str' && <QuoteIcon color='var(--iris-5)' width="14" height="14" />}
                  {enu.type === 'int' && <HashIcon color='var(--iris-5)' width="14" height="14" />}
                  {enu.type === 'float' && <DividerHorizontalIcon color='var(--iris-5)' width="14" height="14" />}
                  {enu.type === 'bytes' && <TokensIcon color='var(--iris-5)' width="14" height="14" />}
                  {enu.type === 'thing' && <CubeIcon color='var(--iris-5)' width="14" height="14" />}
                </Flex>
              </Flex>
            </Card>
          );
        })}
      </Flex>
      {viewEnum && (
        <EnumModal
          onClose={() => { setViewEnum(null); }}
          enu={viewEnum}
          scope={scope}
        />
      )}
    </Flex>
  );
}