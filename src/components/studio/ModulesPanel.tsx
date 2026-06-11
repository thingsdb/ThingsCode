import { useCallback, useEffect, useState } from 'react';
import { Flex, Text, Card, Box, Badge, IconButton, Tooltip } from '@radix-ui/themes';
import { UpdateIcon, GitHubLogoIcon, CubeIcon, ExternalLinkIcon } from '@radix-ui/react-icons';
import { useActiveWorkspaceId, useWebSocket } from '../../hooks';
import type { Module } from '../../types';
import { errStr } from '../../utils';
import ModuleModal from './ModuleModal';

interface ModulesPanelProps {
  scope: string;
}

export default function ModulesPanel({ scope }: ModulesPanelProps) {
  const { emit } = useWebSocket();
  const activeId = useActiveWorkspaceId();
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [viewModule, setViewModule] = useState<Module | null>(null);

  const fetchModules = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await emit('FETCH_MODULES', { id: activeId, scope }) as Module[];
      setModules(response || []);
    } catch (err: unknown) {
      console.error("Failed to fetch modules:", err);
      setFetchError(errStr(err, "Failed to fetch modules."));
    } finally {
      setIsLoading(false);
    }
  }, [activeId, emit, scope]);

  useEffect(() => {
    queueMicrotask(fetchModules);
  }, [fetchModules]);

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center" mt="2">
        <Text size="1" color="gray" weight="bold" mt="2">
          MODULES ({isLoading ? '...' : modules.length})
        </Text>
        <Tooltip content="Refresh modules list">
          <IconButton
            size="1"
            variant="soft"
            color="gray"
            disabled={isLoading}
            onClick={fetchModules}
            style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            <UpdateIcon width="13" height="13" className={isLoading ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>
      </Flex>

      {fetchError && modules.length === 0 && !isLoading && (
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

      {!fetchError && modules.length === 0 && !isLoading && (
        <Box
          py="3"
          px="2"
          style={{
            textAlign: 'center',
            border: '1px dashed var(--gray-5)',
            borderRadius: 'var(--radius-2)'
          }}
        >
          <Text size="1" color="gray">No modules found.</Text>
        </Box>
      )}

      {!fetchError && isLoading && modules.length === 0 && (
        <Flex justify="center" py="2">
          <Text size="1" color="gray" className="animate-pulse">Loading modules...</Text>
        </Flex>
      )}

      <Flex direction="column" gap="2">
        {modules.map((module) => {
          const isGithub = module.githubOwner && module.githubRef && module.githubRepo;
          return (
            <Card
              key={module.name}
              size="1"
              style={{
                padding: '6px 8px',
                backgroundColor: 'var(--gray-2)',
                borderColor: 'var(--gray-4)',
                cursor: 'pointer',
              }}
              onClick={() => setViewModule(module)}
            >
              <Flex direction="column" gap="2">
                <Flex align="center" justify="between" gap="2">
                  <Flex gap="2">
                    {isGithub ? (
                      <Tooltip content={`${module.githubOwner}/${module.githubRepo}:${module.githubRef}`}>
                        <GitHubLogoIcon color="gray" width="16" height="16" />
                      </Tooltip>
                    ): (
                      <CubeIcon color="gray" width="16" height="16" />
                    )}
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
                      {module.name}
                    </Text>

                  </Flex>

                  {/* ⚡ PENDING/OK/FAILED */}
                  {module.status === "installing module..." ? (
                    <Badge color="amber" variant="surface" size="1" style={{ gap: '2px', padding: '0 5px', flexShrink: 0 }}>
                      <Text size="1" weight="medium" style={{ fontSize: '10px', letterSpacing: '0.03em' }}>installing…</Text>
                    </Badge>
                  ) : module.status === "running" ? (
                    <Badge color="green" variant="outline" size="1" style={{ gap: '2px', padding: '0 5px', flexShrink: 0, borderColor: 'var(--gray-5)' }}>
                      <Text size="1" weight="medium" style={{ fontSize: '10px', color: 'var(--green-10)' }}>running</Text>
                    </Badge>
                  ) : (
                    <Badge color="red" variant="outline" size="1" style={{ gap: '2px', padding: '0 5px', flexShrink: 0, borderColor: 'var(--gray-5)' }}>
                      <Text size="1" weight="medium" style={{ fontSize: '10px', color: 'var(--red-10)' }}>fault</Text>
                    </Badge>
                  )}
                </Flex>

                {module.version && (
                  <Flex
                    align="start"
                    gap="2"
                    style={{
                      minWidth: 0,
                      borderTop: '1px dashed var(--gray-4)',
                      paddingTop: '6px'
                    }}
                  >
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
                      Version: {module.version}
                    </Text>
                    {module.doc && module.doc.startsWith('http') && (
                      <Tooltip content={`Open ${module.doc}`}>
                        <IconButton
                          variant="ghost"
                          size="1"
                          color="gray"
                          className="cursor-pointer"
                          asChild
                        >
                          <a
                            href={module.doc}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLinkIcon width="16" height="16" />
                          </a>
                        </IconButton>
                      </Tooltip>

                    )}
                  </Flex>
                )}
              </Flex>
            </Card>
          );
        })}
      </Flex>
      {viewModule && (
        <ModuleModal
          onClose={() => setViewModule(null)}
          scope={scope}
          module={viewModule}
        />
      )}
    </Flex>
  );
}