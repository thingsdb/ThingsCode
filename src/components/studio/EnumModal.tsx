import { Fragment, useState } from 'react';
import { Dialog, Flex, Button, Box, Text, Badge, Tabs, DataList, ScrollArea } from '@radix-ui/themes';
import { QuoteIcon, DividerHorizontalIcon, TokensIcon, CubeIcon, CalendarIcon, ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { HashIcon } from '../icons';
import type { Enum, ThingId } from '../../types';
import { MethodsTab, ThingExplorer } from '../';

interface EnumModalProps {
  onClose: (open: boolean) => void;
  enu: Enum;
  scope: string;
}

export default function EnumModal({ onClose, enu, scope }: EnumModalProps) {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({});

  const toggleMemberExplorer = (key: string) => {
    setExpandedMembers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderMemberValue = (val: string | number | ThingId) => {
    if (typeof val === 'object' && Object.keys(val).length === 1) {
      const thingId = Object.values(val)[0];
      return (
        <Flex align="center" gap="1">
          <CubeIcon color="var(--iris-8)" />
          <Text size="2" style={{ fontFamily: 'monospace', color: 'var(--iris-11)', fontWeight: 500 }}>
            #{thingId}
          </Text>
        </Flex>
      );
    }
    if (typeof val === 'object') {
      return <Text size="2" style={{ fontFamily: 'monospace' }}>{JSON.stringify(val)}</Text>;
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
            <Tabs.Trigger value="general" className="cursor-pointer">General</Tabs.Trigger>
            <Tabs.Trigger value="members" className="cursor-pointer">
              Members ({enu.members.length})
            </Tabs.Trigger>
            <Tabs.Trigger value="methods" className="cursor-pointer">
              Methods ({Object.keys(enu.methods).length})
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
                    <Badge color="gray" variant="surface" style={{ fontFamily: 'monospace' }}>{enu.default}</Badge>
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
                      <Text size="2">{new Date(enu.createdAt * 1000).toLocaleString(undefined, {hour12: false})}</Text>
                    </Flex>
                  </DataList.Value>
                </DataList.Item>
                {enu.modifiedAt && (
                  <DataList.Item>
                    <DataList.Label color="gray">Modified At</DataList.Label>
                    <DataList.Value>
                      <Flex align="center" gap="1" style={{color: "gray"}}>
                        <CalendarIcon width="14" height="14" />
                        <Text size="2">{new Date(enu.modifiedAt * 1000).toLocaleString(undefined, {hour12: false})}</Text>
                      </Flex>
                    </DataList.Value>
                  </DataList.Item>
                )}
              </DataList.Root>
            </Tabs.Content>

            {/* MEMBERS */}
            <Tabs.Content value="members" style={{ height: '100%', maxHeight: '100%' }}>
              <Flex direction="column" style={{ height: '100%', maxHeight: '100%', minHeight: 0, overflow: 'hidden' }}>
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
                      {enu.members.map(([key, val]) => {
                        const isDefault = key === enu.default;
                        const isThingType = enu.type === 'thing' && typeof val === 'object' && Object.keys(val).length === 1;
                        const isRowOpen = expandedMembers[key];

                        return (
                          <Fragment key={key}>
                            <DataList.Item
                              onClick={() => { if (isThingType) toggleMemberExplorer(key); }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'start',
                                gap: '12px',
                                paddingBlock: '6px',
                                paddingInline: '12px',
                                borderBottom: isRowOpen ? 'none' : '1px solid var(--gray-3)',
                                cursor: isThingType ? 'pointer' : 'default',
                                userSelect: 'none'
                              }}
                            >
                              {/* expandable thing */}
                              {isThingType && (
                                <Box style={{ color: 'var(--gray-8)', marginLeft: '-4px', marginRight: '-4px', display: 'flex' }}>
                                  {isRowOpen ? <ChevronDownIcon width="14" height="14" /> : <ChevronRightIcon width="14" height="14" />}
                                </Box>
                              )}

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

                            {/* THING EXPLORER */}
                            {isThingType && isRowOpen && (
                              <Box
                                px="3"
                                pb="3"
                                style={{
                                  backgroundColor: isDefault ? 'var(--iris-1)' : 'transparent',
                                  borderBottom: '1px solid var(--gray-3)'
                                }}
                              >
                                <Box style={{ paddingLeft: '16px', borderLeft: '2px solid var(--iris-4)' }}>
                                  <ThingExplorer
                                    scope={scope}
                                    startThingId={Object.values(val)[0]}
                                  />
                                </Box>
                              </Box>
                            )}
                          </Fragment>
                        );
                      })}
                    </DataList.Root>
                  </ScrollArea>
                </Box>
              </Flex>
            </Tabs.Content>

            {/* METHODS */}
            <Tabs.Content value="methods" style={{ height: '100%' }}>
              <MethodsTab
                methods={enu.methods}
                editorPathPrefix="enum"
                fallbackText="No methods defined on this enumerator type."
              />
            </Tabs.Content>
          </Box>
        </Tabs.Root>

        <Flex gap="3" justify="end" flexShrink="0" style={{ paddingTop: '12px', marginTop: '12px' }}>
          <Dialog.Close>
            <Button type="button" variant="soft" color="gray" size="2" className="cursor-pointer">Close</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}