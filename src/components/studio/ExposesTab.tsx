import React, { useMemo, useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  ScrollArea,
  DataList,
  TextField,
  IconButton,
} from '@radix-ui/themes';
import {
  MagnifyingGlassIcon,
  Cross2Icon,
  InfoCircledIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@radix-ui/react-icons';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../hooks';

export interface ExposedMethod {
  argmap?: string[];
  defaults?: Record<string, unknown>;
  doc?: string;
}

interface ExposesTabProps {
  exposes?: string | Record<string, ExposedMethod> | null;
  moduleName?: string;
}

export default function ExposesTab({ exposes, moduleName = 'module' }: ExposesTabProps) {
  const { appearance } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMethods, setExpandedMethods] = useState<Record<string, boolean>>({});

  const parsedExposes = useMemo<[string, ExposedMethod][]>(() => {
    if (!exposes) return [];
    try {
      const obj: Record<string, ExposedMethod> =
        typeof exposes === 'string' ? JSON.parse(exposes) : exposes;
      if (!obj || typeof obj !== 'object') return [];
      return Object.entries(obj).sort(([a], [b]) => a.localeCompare(b));
    } catch {
      return [];
    }
  }, [exposes]);

  const filtered = useMemo(() => {
    const cleanedQuery = searchQuery.trim().toLowerCase();
    if (!cleanedQuery) return parsedExposes;

    return parsedExposes.filter(([name, spec]) => {
      const nameMatch = name.toLowerCase().includes(cleanedQuery);
      const argMatch = spec.argmap?.some((arg) => arg.toLowerCase().includes(cleanedQuery));
      const docMatch = spec.doc?.toLowerCase().includes(cleanedQuery);
      const defaultsMatch = spec.defaults
        ? JSON.stringify(spec.defaults).toLowerCase().includes(cleanedQuery)
        : false;
      return nameMatch || Boolean(argMatch) || Boolean(docMatch) || defaultsMatch;
    });
  }, [parsedExposes, searchQuery]);

  if (parsedExposes.length === 0) {
    return (
      <Flex align="center" justify="center" style={{ height: '100%' }}>
        <Text size="2" style={{ fontStyle: 'italic', color: 'var(--gray-8)' }}>
          No methods exposed on this module.
        </Text>
      </Flex>
    );
  }

  const toggleMethodExpand = (name: string) => {
    setExpandedMethods((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const getFirstDocLine = (doc?: string): string => {
    if (!doc) return '';
    return doc.split('\n')[0].trim();
  };

  return (
    <Flex
      direction="column"
      style={{
        height: '100%',
        maxHeight: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Box style={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <TextField.Root
          placeholder="Search method, argument, or doc..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); }}
          size="1"
          m="1"
          style={{ flexShrink: 0 }}
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

        <ScrollArea
          type="auto"
          scrollbars="vertical"
          style={{
            flexGrow: 1,
            height: '100%',
            border: '1px solid var(--gray-4)',
            borderRadius: 'var(--radius-3)',
            backgroundColor: 'var(--gray-1)',
          }}
        >
          {searchQuery && filtered.length === 0 ? (
            <Flex
              align="center"
              justify="center"
              direction="column"
              gap="2"
              style={{ height: '140px', color: 'var(--gray-8)' }}
            >
              <InfoCircledIcon width="18" height="18" style={{ opacity: 0.6 }} />
              <Text size="1" style={{ fontStyle: 'italic' }}>
                No methods found matching "{searchQuery}"
              </Text>
            </Flex>
          ) : (
            <DataList.Root
              mt="3"
              size="1"
              style={{
                '--data-list-label-width': 'auto',
                display: 'flex',
                flexDirection: 'column',
              } as React.CSSProperties}
            >
              {filtered.map(([name, spec]) => {
                const isRowOpen = Boolean(expandedMethods[name]);
                const hasDetails = Boolean(spec.doc || spec.defaults || (spec.argmap && spec.argmap.length > 0));
                const argSignature = spec.argmap ? `(${spec.argmap.join(', ')})` : '()';
                const summary = getFirstDocLine(spec.doc);

                return (
                  <React.Fragment key={name}>
                    <DataList.Item
                      onClick={() => { if (hasDetails) toggleMethodExpand(name); }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '16px 140px 180px 1fr auto',
                        alignItems: 'center',
                        gap: '10px',
                        paddingBlock: '7px',
                        paddingInline: '12px',
                        borderBottom: isRowOpen ? 'none' : '1px solid var(--gray-3)',
                        cursor: hasDetails ? 'pointer' : 'default',
                        backgroundColor: isRowOpen ? 'var(--gray-2)' : 'transparent',
                        userSelect: 'none',
                      }}
                    >
                      <Flex align="center" style={{ color: 'var(--gray-9)' }}>
                        {hasDetails && (
                          isRowOpen
                            ? <ChevronDownIcon width="13" height="13" />
                            : <ChevronRightIcon width="13" height="13" />
                        )}
                      </Flex>

                      <DataList.Label style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                        <Text
                          size="1"
                          weight="bold"
                          style={{
                            fontFamily: 'monospace',
                            color: 'var(--gray-12)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {name}
                        </Text>
                      </DataList.Label>

                      <Text
                        size="1"
                        style={{
                          fontFamily: 'monospace',
                          color: 'var(--iris-10)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {argSignature}
                      </Text>

                      <DataList.Value style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                        {summary ? (
                          <Text
                            size="1"
                            style={{
                              color: 'var(--gray-10)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {summary}
                          </Text>
                        ) : (
                          <Text size="1" color="gray" style={{ fontStyle: 'italic', opacity: 0.35 }}>
                            no description
                          </Text>
                        )}
                      </DataList.Value>

                      <Flex align="center" gap="1" style={{ flexShrink: 0 }}>
                        {spec.defaults && Object.keys(spec.defaults).length > 0 && (
                          <Badge size="1" color="iris" variant="soft">
                            defaults
                          </Badge>
                        )}
                      </Flex>
                    </DataList.Item>

                    {hasDetails && isRowOpen && (
                      <Box
                        px="3"
                        pb="3"
                        pt="1"
                        style={{
                          backgroundColor: 'var(--gray-2)',
                          borderBottom: '1px solid var(--gray-3)',
                        }}
                      >
                        <Flex
                          direction="column"
                          gap="3"
                          style={{
                            marginLeft: '26px',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-2)',
                            backgroundColor: 'var(--gray-1)',
                            border: '1px solid var(--gray-4)',
                          }}
                        >
                          {spec.argmap && spec.argmap.length > 0 && (
                            <Flex align="center" gap="2" wrap="wrap">
                              <Text size="1" weight="bold" color="gray" style={{ minWidth: '64px' }}>
                                Arguments:
                              </Text>
                              {spec.argmap.map((arg, idx) => (
                                <Badge
                                  key={`${name}-arg-${idx}`}
                                  size="1"
                                  color={arg === '*' ? 'amber' : 'iris'}
                                  variant="surface"
                                  style={{ fontFamily: 'monospace' }}
                                >
                                  {idx}: {arg}
                                </Badge>
                              ))}
                            </Flex>
                          )}

                          {spec.doc && (
                            <Box>
                              <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginBottom: '4px' }}>
                                Documentation:
                              </Text>
                              <Text
                                size="1"
                                style={{
                                  display: 'block',
                                  whiteSpace: 'pre-wrap',
                                  tabSize: 4,
                                  fontFamily: 'monospace',
                                  lineHeight: 1.5,
                                  color: 'var(--gray-12)',
                                  backgroundColor: 'var(--gray-2)',
                                  padding: '8px 10px',
                                  borderRadius: 'var(--radius-2)',
                                  border: '1px solid var(--gray-3)',
                                }}
                              >
                                {spec.doc}
                              </Text>
                            </Box>
                          )}

                          {spec.defaults && Object.keys(spec.defaults).length > 0 && (
                            <Box>
                              <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginBottom: '4px' }}>
                                Defaults:
                              </Text>
                              <Box
                                style={{
                                  height: `${Math.min(160, Math.max(64, JSON.stringify(spec.defaults, null, 2).split('\n').length * 18 + 12))}px`,
                                  border: '1px solid var(--gray-4)',
                                  borderRadius: 'var(--radius-2)',
                                  overflow: 'hidden',
                                }}
                              >
                                <Editor
                                  theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
                                  language="json"
                                  path={`.ticode-module-expose-defaults-${moduleName}-${name}.json`}
                                  value={JSON.stringify(spec.defaults, null, 2)}
                                  options={{
                                    readOnly: true,
                                    domReadOnly: true,
                                    fontSize: 11,
                                    fontFamily: 'monospace',
                                    minimap: { enabled: false },
                                    automaticLayout: true,
                                    folding: false,
                                    lineNumbers: 'off',
                                    scrollbar: { vertical: 'auto', horizontal: 'auto' },
                                    tabSize: 2,
                                  }}
                                />
                              </Box>
                            </Box>
                          )}
                        </Flex>
                      </Box>
                    )}
                  </React.Fragment>
                );
              })}
            </DataList.Root>
          )}
        </ScrollArea>
      </Box>
    </Flex>
  );
}