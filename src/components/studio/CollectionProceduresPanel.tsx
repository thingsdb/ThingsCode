import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flex, Text, Card, Box, Badge, IconButton, Tooltip, TextField } from '@radix-ui/themes';
import { InfoCircledIcon, LightningBoltIcon, UpdateIcon, EyeOpenIcon, MagnifyingGlassIcon, Cross2Icon } from '@radix-ui/react-icons';
import { useActiveWorkspaceId, useWebSocket } from '../../hooks';
import type { Procedure } from '../../types';
import { errStr } from '../../utils';
import ProcedureModal from './ProcedureModal';

interface CollectionProceduresPanelProps {
  scope: string;
}

export default function CollectionProceduresPanel({ scope }: CollectionProceduresPanelProps) {
  const { emit } = useWebSocket();
  const activeId = useActiveWorkspaceId();
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewProcedure, setViewProcedure] = useState<Procedure | null>(null)

  const fetchProcedures = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await emit('FETCH_PROCEDURES', { id: activeId, scope }) as Procedure[];
      setProcedures(response || []);
    } catch (err: unknown) {
      console.error("Failed to fetch procedures:", err);
      setFetchError(errStr(err, "Failed to fetch procedures."));
    } finally {
      setIsLoading(false);
    }
  }, [activeId, emit, scope]);

  useEffect(() => {
    queueMicrotask(fetchProcedures);
  }, [fetchProcedures]);

  const filtered = useMemo(() => {
    const cleanedQuery = searchQuery.trim().toLowerCase();
    if (!cleanedQuery) {
      return procedures;
    }

    return procedures.filter((proc) => {
      const nameMatch = proc.name?.toLowerCase().includes(cleanedQuery);
      const docString = proc.doc || '';
      const docMatch = docString.toLowerCase().includes(cleanedQuery);

      return nameMatch || docMatch;
    });
  }, [procedures, searchQuery]);

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center" mt="2">
        <Text size="1" color="gray" weight="bold" mt="2">
          PROCEDURES ({filtered.length})
        </Text>
        <Tooltip content="Refresh procedures list">
          <IconButton
            size="1"
            variant="soft"
            color="gray"
            disabled={isLoading}
            onClick={fetchProcedures}
            style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            <UpdateIcon width="13" height="13" className={isLoading ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>
      </Flex>

      {(procedures.length > 0 || searchQuery) && (
        <TextField.Root
          placeholder="Search name or doc..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
                onClick={() => setSearchQuery('')}
                style={{ cursor: 'pointer', height: '16px', width: '16px' }}
              >
                <Cross2Icon height="12" width="12" />
              </IconButton>
            </TextField.Slot>
          )}
        </TextField.Root>
      )}

      {fetchError && procedures.length === 0 && !isLoading && (
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

      {!fetchError && procedures.length === 0 && !isLoading && (
        <Box
          py="3"
          px="2"
          style={{
            textAlign: 'center',
            border: '1px dashed var(--gray-5)',
            borderRadius: 'var(--radius-2)'
          }}
        >
          <Text size="1" color="gray">No procedures found in this scope.</Text>
        </Box>
      )}

      {!fetchError && procedures.length > 0 && filtered.length === 0 && (
        <Box
          py="3"
          px="2"
          style={{
            textAlign: 'center',
            border: '1px dashed var(--gray-5)',
            borderRadius: 'var(--radius-2)'
          }}
        >
          <Text size="1" color="gray" >No matching procedures match your query.</Text>
        </Box>
      )}

      {!fetchError && isLoading && procedures.length === 0 && (
        <Flex justify="center" py="2">
          <Text size="1" color="gray" className="animate-pulse">Loading procedures...</Text>
        </Flex>
      )}

      <Flex direction="column" gap="2">
        {filtered.map((procedure) => {

          return (
            <Card
              key={procedure.name}
              size="1"
              style={{
                padding: '6px 8px',
                backgroundColor: 'var(--gray-2)',
                borderColor: 'var(--gray-4)',
                cursor: 'pointer',
              }}
              onClick={() => setViewProcedure(procedure)}
            >
              <Flex direction="column" gap="2">
                <Flex align="center" justify="between" gap="2">
                  <Tooltip content={procedure.name}>
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
                      {procedure.name}
                    </Text>
                  </Tooltip>

                  {/* ⚡ WSE/NSE */}
                  {procedure.withSideEffects ? (
                    <Badge color="orange" variant="surface" size="1" style={{ gap: '2px', padding: '0 5px', flexShrink: 0 }}>
                      <LightningBoltIcon width="11" height="11" />
                      <Text size="1" weight="medium" style={{ fontSize: '10px', letterSpacing: '0.03em' }}>WSE</Text>
                    </Badge>
                  ) : (
                    <Badge color="gray" variant="outline" size="1" style={{ gap: '2px', padding: '0 5px', flexShrink: 0, borderColor: 'var(--gray-5)' }}>
                      <EyeOpenIcon width="11" height="11" color="var(--gray-8)" />
                      <Text size="1" weight="medium" style={{ fontSize: '10px', color: 'var(--gray-10)' }}>NSE</Text>
                    </Badge>
                  )}
                </Flex>

                {/* DOCSTRING */}
                {procedure.doc && (
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
                      {procedure.doc}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Card>
          );
        })}
      </Flex>
      {viewProcedure && (
        <ProcedureModal
          onClose={() => setViewProcedure(null)}
          scope={scope}
          procedure={viewProcedure}
        />
      )}
    </Flex>
  );
}