import React, { useMemo, useState } from 'react';
import { Box, Flex, Text, Badge, ScrollArea, DataList, TextField, IconButton } from '@radix-ui/themes';
import { CubeIcon, ArrowRightIcon, MagnifyingGlassIcon, Cross2Icon, InfoCircledIcon } from '@radix-ui/react-icons';
import Editor from '@monaco-editor/react';
import { determineCardinality } from '../utils';
import { useTheme } from '../hooks';
import type { Type, Relation, Definition } from '../types';

interface FieldsTabProps {
  tp: Type;
  onNavigateToType: (name: string) => void;
}

export default function FieldsTab({ tp, onNavigateToType }: FieldsTabProps) {
  const { appearance } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});

  const getDefinitionString = (def: string | Definition | Definition[]): string => {
    if (typeof def === 'string') return def;
    try {
      return JSON.stringify(def);
    } catch {
      return '';
    }
  };

  const filtered = useMemo(() => {
    const cleanedQuery = searchQuery.trim().toLowerCase();
    if (!cleanedQuery) {
      return tp.fields.sort();
    }

    return tp.fields.sort().filter(([name, definition]) => {
      const nameMatch = name.toLocaleLowerCase().includes(cleanedQuery);
      const defString = getDefinitionString(definition).toLowerCase();
      return nameMatch || defString.includes(cleanedQuery);
    });
  }, [tp, searchQuery]);

  if (tp.fields.length === 0) {
    return (
      <Flex align="center" justify="center" style={{ height: '100%' }}>
        <Text size="2" style={{ fontStyle: 'italic', color: 'var(--gray-8)' }}>
          No fields defined on this type.
        </Text>
      </Flex>
    );
  }

  const toggleFieldExpand = (name: string) => {
    setExpandedFields((prev) => ({ ...prev, [name]: !prev[name] }));
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
          placeholder="Search name or definition..."
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
                No fields found matching "{searchQuery}"
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
              {filtered.map(([name, definition]) => {
                const relation: Relation | undefined = tp.relations[name];

                const isComplex = typeof definition !== 'string';
                const isRowOpen = expandedFields[name];

                const stringifiedThisDef = getDefinitionString(definition);
                const cardinality = relation ? determineCardinality(stringifiedThisDef, relation.definition) : null;

                const cardinalityColor =
                  cardinality === '1:1' ? 'iris' :
                    cardinality === '1:N' ? 'orange' :
                      cardinality === 'N:1' ? 'yellow' : 'pink';

                return (
                  <React.Fragment key={name}>
                    <DataList.Item
                      onClick={() => { if (isComplex) toggleFieldExpand(name); }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '180px 200px auto',
                        alignItems: 'center',
                        gap: '12px',
                        paddingBlock: '6px',
                        paddingInline: '12px',
                        borderBottom: isRowOpen ? 'none' : '1px solid var(--gray-3)',
                        cursor: isComplex ? 'pointer' : 'default',
                        backgroundColor: isRowOpen ? 'var(--gray-2)' : 'transparent',
                        userSelect: 'none'
                      }}
                    >
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
                          color: isComplex ? 'var(--iris-9)' : 'var(--gray-10)',
                          fontWeight: isComplex ? 600 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isComplex ? (Array.isArray(definition) ? '[{…}]' : '{…}') : definition}
                      </Text>

                      <DataList.Value style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                        {relation ? (
                          <Flex align="center" gap="2" style={{ width: '100%' }} onClick={(e) => { e.stopPropagation(); }}>
                            <Badge size="1" color={cardinalityColor} variant="surface" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}>
                              {cardinality}
                            </Badge>

                            <Flex
                              align="center"
                              gap="1"
                              onClick={() => { onNavigateToType(relation.type); }}
                              style={{
                                cursor: 'pointer',
                                padding: '2px 6px',
                                borderRadius: 'var(--radius-1)',
                                backgroundColor: 'var(--iris-1)',
                                border: '1px solid var(--iris-4)',
                                transition: 'all 0.15s ease',
                                maxWidth: '100%',
                                overflow: 'hidden',
                              }}
                              className="hover:bg-iris-2 hover:border-iris-5 active:scale-95"
                            >
                              <CubeIcon width="13" height="13" color="var(--iris-8)" style={{ flexShrink: 0 }} />
                              <Text
                                size="1"
                                weight="bold"
                                style={{
                                  color: 'var(--iris-11)',
                                  fontFamily: 'monospace',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {relation.type}
                              </Text>
                              <ArrowRightIcon width="11" height="11" color="var(--iris-7)" style={{ flexShrink: 0, marginLeft: '2px' }} />
                              <Text
                                size="1"
                                style={{
                                  color: 'var(--gray-9)',
                                  fontFamily: 'monospace',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                .{relation.property}
                              </Text>
                            </Flex>
                          </Flex>
                        ) : (
                          <Text size="1" color="gray" style={{ fontStyle: 'italic', opacity: 0.35 }}>
                            none
                          </Text>
                        )}
                      </DataList.Value>
                    </DataList.Item>

                    {isComplex && isRowOpen && (
                      <Box
                        px="3"
                        pb="3"
                        style={{
                          backgroundColor: 'var(--gray-2)',
                          borderBottom: '1px solid var(--gray-3)',
                        }}
                      >
                        <Box
                          style={{
                            marginLeft: '28px',
                            height: '140px',
                            border: '1px solid var(--gray-4)',
                            borderRadius: 'var(--radius-2)',
                            overflow: 'hidden'
                          }}
                        >
                          <Editor
                            theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
                            language="json"
                            path={`.ticode-complex-field-def-${tp.name}-${name}.json`}
                            value={JSON.stringify(definition, null, 2)}
                            options={{
                              readOnly: true,
                              domReadOnly: true,
                              fontSize: 11,
                              fontFamily: 'monospace',
                              minimap: { enabled: false },
                              automaticLayout: true,
                              folding: false,
                              lineNumbers: 'off',
                              scrollbar: { vertical: 'visible', horizontal: 'visible' },
                              tabSize: 2,
                            }}
                          />
                        </Box>
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