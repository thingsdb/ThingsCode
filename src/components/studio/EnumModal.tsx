import { useState, useEffect, useMemo } from 'react';
import { Dialog, Flex, Button, Box, Text, Badge, Tabs, DataList, ScrollArea } from '@radix-ui/themes';
import Editor from '@monaco-editor/react';
import { InfoCircledIcon, QuoteIcon, DividerHorizontalIcon, TokensIcon, CubeIcon, CalendarIcon, LightningBoltIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { useTheme } from '../../hooks';
import { HashIcon } from '../icons';
import type { Enum, Method, ThingId } from '../../types';

interface EnumModalProps {
  onClose: (open: boolean) => void;
  enu: Enum;
}

export default function EnumModal({ onClose, enu }: EnumModalProps) {
  const { appearance } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('general');
  const [selectedMethodName, setSelectedMethodName] = useState<string | null>(null);

  const methodNames = useMemo(() => {
    return enu?.methods ? Object.keys(enu.methods).sort() : [];
  }, [enu]);

  useEffect(() => {
    if (methodNames.length > 0) {
      const name = methodNames[0];
      queueMicrotask(() => setSelectedMethodName(name));
    } else {
      queueMicrotask(() => setSelectedMethodName(null));
    }
  }, [methodNames]);

  if (!enu) return null;

  const activeMethod: Method | undefined = enu.methods?.[selectedMethodName || ''];

  const renderMemberValue = (val: string | number | ThingId) => {
    if (typeof val === 'object' && val !== null && '#' in val) {
      return (
        <Flex align="center" gap="1">
          <CubeIcon color="var(--gray-8)" />
          <Text size="2" style={{ fontFamily: 'monospace' }}>#{val['#']}</Text>
        </Flex>
      );
    }
    return <Text size="2" style={{ fontFamily: 'monospace' }}>{String(val)}</Text>;
  };

  return (
    <Dialog.Root defaultOpen onOpenChange={onClose}>
      <Dialog.Content aria-describedby={undefined} style={{ width: '65vw', maxWidth: '1024px', padding: '16px' }}>
        <Box flexShrink="0" mb="3">
          <Dialog.Title size="3" style={{ margin: 0 }}>
            <Flex align="center" justify="between">
              <Flex align="center" gap="2">
                <Badge size="2" color="iris" variant="surface" style={{ fontWeight: 'bold' }}>
                  {enu.name}
                </Badge>
                <Text size="3" weight="bold" color="gray">Enumerator Details</Text>
              </Flex>
              <Flex align="center" gap="2">
                {/* Re-use type icons matched directly with text labels */}
                <Badge color="iris" variant="soft" style={{ gap: '4px', paddingInline: '6px' }}>
                  {enu.type === 'str' && <QuoteIcon width="12" height="12" />}
                  {enu.type === 'int' && <HashIcon width="12" height="12" />}
                  {enu.type === 'float' && <DividerHorizontalIcon width="12" height="12" />}
                  {enu.type === 'bytes' && <TokensIcon width="12" height="12" />}
                  {enu.type === 'thing' && <CubeIcon width="12" height="12" />}
                  <Text size="1" weight="bold" style={{ textTransform: 'uppercase' }}>{enu.type}</Text>
                </Badge>
              </Flex>
            </Flex>
          </Dialog.Title>
        </Box>

        {/* TABS */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} style={{
          height: '52vh',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
         }}>
          <Tabs.List size="2" style={{ flexShrink: 0 }}>
            <Tabs.Trigger value="general" style={{ cursor: 'pointer' }}>General</Tabs.Trigger>
            <Tabs.Trigger value="members" style={{ cursor: 'pointer' }}>
              Members ({enu.members?.length || 0})
            </Tabs.Trigger>
            <Tabs.Trigger value="methods" style={{ cursor: 'pointer' }}>
              Methods ({methodNames.length})
            </Tabs.Trigger>
          </Tabs.List>

          <Box pt="3" style={{ flexGrow: 1, minHeight: 0 }}>

            {/* GENERAL */}
            <Tabs.Content value="general" style={{ height: '100%' }}>
              <DataList.Root size="2" style={{ '--data-list-label-width': '180px', '--data-list-row-gap': '8px' } as React.CSSProperties}>
                <DataList.Item>
                  <DataList.Label color="gray">Enum Name</DataList.Label>
                  <DataList.Value><Text weight="bold" color="iris">{enu.name}</Text></DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label color="gray">Default Member</DataList.Label>
                  <DataList.Value>
                    <Badge color="gray" variant="surface" style={{ fontFamily: 'monospace' }}>
                      {enu.default}
                    </Badge>
                  </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label color="gray">Member Type</DataList.Label>
                  <DataList.Value style={{ textTransform: 'capitalize' }}>{enu.type}</DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label color="gray">Created At</DataList.Label>
                  <DataList.Value>
                    <Flex align="center" gap="1" style={{color: "gray"}}>
                      <CalendarIcon width="14" height="14" />
                      <Text size="2">{new Date(enu.createdAt * 1000).toLocaleString()}</Text>
                    </Flex>
                  </DataList.Value>
                </DataList.Item>
                {enu.modifiedAt && (
                  <DataList.Item>
                    <DataList.Label color="gray">Modified At</DataList.Label>
                    <DataList.Value>
                      <Flex align="center" gap="1" style={{color: "gray"}}>
                        <CalendarIcon width="14" height="14" />
                        <Text size="2">{new Date(enu.modifiedAt * 1000).toLocaleString()}</Text>
                      </Flex>
                    </DataList.Value>
                  </DataList.Item>
                )}
              </DataList.Root>
            </Tabs.Content>

            {/* MEMBERS */}
            <Tabs.Content
              value="members"
              style={{
                height: '100%',
                maxHeight: '100%',
              }}
            >
              <Flex
                direction="column"
                style={{
                  height: '100%',
                  maxHeight: '100%',
                  minHeight: 0,
                  overflow: 'hidden'
                }}
              >
                <Box style={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <ScrollArea
                    type="auto"
                    scrollbars="vertical"
                    style={{
                      flexGrow: 1,
                      height: '100%',
                      border: '1px solid var(--gray-4)',
                      borderRadius: 'var(--radius-3)',
                      backgroundColor: 'var(--gray-1)'
                    }}
                  >
                    <DataList.Root
                      size="1"
                      style={{
                        '--data-list-label-width': 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        marginTop: '10px',
                      } as React.CSSProperties}
                    >
                      {enu.members?.map(([key, val]) => {
                        const isDefault = key === enu.default;
                        return (
                          <DataList.Item
                            key={key}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'start',
                              gap: '12px',
                              paddingBlock: '4px',
                              paddingInline: '12px',
                              borderBottom: '1px solid var(--gray-3)',
                            }}
                          >
                            <DataList.Label style={{ flexShrink: 0, minWidth: 'unset', width: 'auto' }}>
                              <Text
                                size="2"
                                weight={isDefault ? "bold" : "medium"}
                                color="gray"
                                style={{ fontFamily: 'monospace' }}
                              >
                                {key}
                              </Text>
                            </DataList.Label>
                            <Text size="1" color="gray" style={{ userSelect: 'none', opacity: 0.5 }}>=</Text>
                            <DataList.Value style={{ width: 'auto' }}>
                              <Flex align="center" gap="2">
                                {renderMemberValue(val)}
                                {isDefault && <Badge color="iris" size="1" variant="soft">Default</Badge>}
                              </Flex>
                            </DataList.Value>
                          </DataList.Item>
                        );
                      })}
                    </DataList.Root>
                  </ScrollArea>
                </Box>
              </Flex>
            </Tabs.Content>

            {/* METHODS */}
            <Tabs.Content value="methods" style={{ height: '100%' }}>
              {methodNames.length === 0 ? (
                <Flex align="center" justify="center" style={{ height: '100%' }}>
                  <Text size="2" style={{ fontStyle: 'italic', color: 'var(--gray-8)' }}>
                    No custom methods defined on this enumerator type.
                  </Text>
                </Flex>
              ) : (
                <Flex gap="3" style={{ height: '100%', minHeight: 0 }}>
                  <Flex direction="column" gap="1" style={{
                    width: '240px',
                    flexShrink: 0,
                    overflowY: 'auto',
                    border: '1px solid var(--gray-4)',
                    borderRadius: 'var(--radius-3)',
                    padding: '2px',
                    backgroundColor: 'var(--gray-1)'
                  }}>
                    {methodNames.map((mName) => {
                      const isSelected = mName === selectedMethodName;
                      return (
                        <Box
                          key={mName}
                          onClick={() => setSelectedMethodName(mName)}
                          px="2"
                          py="1"
                          style={{
                            borderRadius: 'var(--radius-2)',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'var(--iris-9)' : 'transparent',
                            transition: 'background-color 0.1s ease',
                          }}
                        >
                          <Text size="1" weight={isSelected ? "bold" : "regular"} style={{
                            color: isSelected ? '#fff' : 'var(--gray-12)',
                            fontFamily: 'monospace',
                            wordBreak: 'break-all'
                          }}>
                            {mName}()
                          </Text>
                        </Box>
                      );
                    })}
                  </Flex>

                  {/* CODE VIEW */}
                  <Flex direction="column" style={{ flexGrow: 1, minHeight: 0, gap: '8px' }}>
                    {activeMethod ? (
                      <Flex direction="column" style={{ height: '100%', minHeight: 0 }} gap="2">
                        <Flex align="center" justify="between" flexShrink="0">
                          <Flex align="center" gap="2">
                            <Text size="2" weight="bold" style={{ fontFamily: 'monospace' }}>
                              {selectedMethodName}({activeMethod.arguments?.join(', ') || ''})
                            </Text>
                          </Flex>
                          {activeMethod.withSideEffects ? (
                            <Badge color="orange" variant="surface" size="1" style={{ gap: '2px' }}>
                              <LightningBoltIcon width="10" height="10" />
                              <Text style={{ fontSize: '9px' }}>WSE</Text>
                            </Badge>
                          ) : (
                            <Badge color="gray" variant="outline" size="1" style={{ gap: '2px', borderColor: 'var(--gray-4)' }}>
                              <EyeOpenIcon width="10" height="10" color="var(--gray-7)" />
                              <Text style={{ fontSize: '9px', color: 'var(--gray-9)' }}>NSE</Text>
                            </Badge>
                          )}
                        </Flex>

                        {/* Optional Docstring */}
                        {activeMethod.doc && (
                          <Flex align="start" gap="2" p="2" style={{ backgroundColor: 'var(--gray-2)', borderRadius: 'var(--radius-2)' }} flexShrink="0">
                            <InfoCircledIcon width="14" height="14" color="var(--iris-8)" style={{ marginTop: '1px', flexShrink: 0 }} />
                            <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
                              {activeMethod.doc}
                            </Text>
                          </Flex>
                        )}

                        {/* Monaco Editor */}
                        <Box style={{ flexGrow: 1, border: '1px solid var(--gray-5)', borderRadius: 'var(--radius-2)', overflow: 'hidden' }}>
                          <Editor
                            theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
                            language="thingsdb"
                            path={`.ticode-enum-method-${selectedMethodName}.ti`}
                            value={activeMethod.definition}
                            options={{
                              readOnly: true,
                              domReadOnly: true,
                              fontSize: 12,
                              fontFamily: 'monospace',
                              minimap: { enabled: false },
                              automaticLayout: true,
                              lineNumbers: 'on',
                              scrollbar: { vertical: 'visible', horizontal: 'visible' },
                              tabSize: 4,
                            }}
                          />
                        </Box>
                      </Flex>
                    ) : (
                      <Flex align="center" justify="center" style={{ height: '100%' }}>
                        <Text size="1" color="gray">Select a method from the left column to view definition.</Text>
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              )}
            </Tabs.Content>
          </Box>
        </Tabs.Root>

        {/* BOTTOM DIALOG FOOTER ACTION */}
        <Flex gap="3" justify="end" flexShrink="0" style={{ paddingTop: '12px', marginTop: '12px' }}>
          <Dialog.Close>
            <Button type="button" variant="soft" color="gray" size="2" style={{ cursor: 'pointer' }}>
              Close
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}