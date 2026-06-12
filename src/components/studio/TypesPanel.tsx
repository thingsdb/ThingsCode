import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flex, Text, Card, Box, IconButton, Tooltip, TextField, Badge } from '@radix-ui/themes';
import { UpdateIcon, Cross2Icon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useActiveWorkspaceId, useWebSocket } from '../../hooks';
import type { Type } from '../../types';
import { errStr } from '../../utils';
import TypeModal from './TypeModal';
// import TypeModal from './TypeModal';


interface TypesPanelProps {
  scope: string;
}

export default function TypesPanel({ scope }: TypesPanelProps) {
  const { emit } = useWebSocket();
  const activeId = useActiveWorkspaceId();
  const [types, setTypes] = useState<Type[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState<Type | null>(null);

  const fetchTypes = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response: Type[] = await emit('FETCH_TYPES', { id: activeId, scope });
      setTypes(response);
    } catch (err: unknown) {
      console.error("Failed to fetch types:", err);
      setFetchError(errStr(err, "Failed to fetch types."));
    } finally {
      setIsLoading(false);
    }
  }, [activeId, emit, scope]);

  useEffect(() => {
    queueMicrotask(() => { void fetchTypes(); });
  }, [fetchTypes]);

  const handleOnNavigateToType = (name: string) => {
    setViewType(types.find(tp => tp.name === name) ?? null);
  };

  const filtered = useMemo(() => {
    const cleanedQuery = searchQuery.trim().toLowerCase();
    if (!cleanedQuery) {
      return types;
    }

    return types.filter((tp) => {
      const nameMatch = tp.name.toLowerCase().includes(cleanedQuery);

      return nameMatch;
    });
  }, [types, searchQuery]);

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center" mt="2">
        <Text size="1" color="gray" weight="bold" mt="2">
          TYPES ({isLoading ? '...' : filtered.length})
        </Text>
        <Tooltip content="Refresh types list">
          <IconButton
            size="1"
            variant="soft"
            color="gray"
            disabled={isLoading}
            onClick={() => { void fetchTypes(); }}
            style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            <UpdateIcon width="13" height="13" className={isLoading ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>
      </Flex>

      {(types.length > 0 || searchQuery) && (
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

      {fetchError && types.length === 0 && !isLoading && (
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

      {!fetchError && types.length === 0 && !isLoading && (
        <Box
          py="3"
          px="2"
          style={{
            textAlign: 'center',
            border: '1px dashed var(--gray-5)',
            borderRadius: 'var(--radius-2)'
          }}
        >
          <Text size="1" color="gray">No types found in this scope.</Text>
        </Box>
      )}

      {!fetchError && types.length > 0 && filtered.length === 0 && (
        <Box
          py="3"
          px="2"
          style={{
            textAlign: 'center',
            border: '1px dashed var(--gray-5)',
            borderRadius: 'var(--radius-2)'
          }}
        >
          <Text size="1" color="gray" >No matching types match your query.</Text>
        </Box>
      )}

      {!fetchError && isLoading && types.length === 0 && (
        <Flex justify="center" py="2">
          <Text size="1" color="gray" className="animate-pulse">Loading types...</Text>
        </Flex>
      )}

      <Flex direction="column" gap="2">
        {filtered.map((tp) => {

          return (
            <Card
              key={tp.name}
              size="1"
              style={{
                padding: '6px 8px',
                backgroundColor: 'var(--gray-2)',
                borderColor: 'var(--gray-4)',
                cursor: 'pointer',
              }}
              onClick={() => { setViewType(tp); }}
            >
              <Flex direction="column" gap="2">
                <Flex align="center" justify="between" gap="1">
                  <Tooltip content={tp.name}>
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
                      {tp.name}
                    </Text>
                  </Tooltip>

                  {tp.autoIndex && <Badge color="yellow" variant="outline" size="1">IDX</Badge>}
                  {tp.hideId && <Badge color="gray" variant="outline" size="1">HID</Badge>}
                  {tp.wrapOnly && <Badge color="iris" variant="outline" size="1">WPO</Badge>}
                </Flex>
              </Flex>
            </Card>
          );
        })}
      </Flex>
      {viewType && (
        <TypeModal
          onClose={() => { setViewType(null); }}
          tp={viewType}
          onNavigateToType={handleOnNavigateToType}
        />
      )}
    </Flex>
  );
}