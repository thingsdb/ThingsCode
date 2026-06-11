import { useState } from 'react';
import { Dialog, Flex, Button, Box, Text, Badge, Tabs, DataList } from '@radix-ui/themes';
import { CalendarIcon } from '@radix-ui/react-icons';
import type { Type } from '../../types';
import { MethodsTab } from '../';
import FieldsTab from '../FieldsTab';

interface TypeModalProps {
  onClose: (open: boolean) => void;
  tp: Type;
  onNavigateToType: (name: string) => void;
}

export default function TypeModal({ onClose, tp, onNavigateToType }: TypeModalProps) {
  const [activeTab, setActiveTab] = useState<string>('general');

  if (!tp) return null;

  return (
    <Dialog.Root defaultOpen onOpenChange={onClose}>
      <Dialog.Content aria-describedby={undefined} style={{ width: '65vw', maxWidth: '1024px', padding: '16px' }}>
        <Box flexShrink="0" mb="3">
          <Dialog.Title size="3" style={{ margin: 0 }}>
            <Flex align="center" justify="between">
              <Flex align="center" gap="2">
                <Badge size="2" color="iris" variant="surface" style={{ fontWeight: 'bold' }}>
                  {tp.name}
                </Badge>
                <Text size="3" weight="bold" color="gray">Type Details</Text>
              </Flex>
              <Flex align="center" gap="2">
                {tp.autoIndex && <Badge color="yellow" variant="outline" size="1">IDX</Badge>}
                {tp.hideId && <Badge color="gray" variant="outline" size="1">HID</Badge>}
                {tp.wrapOnly && <Badge color="iris" variant="outline" size="1">WPO</Badge>}
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
            <Tabs.Trigger value="fields" className="cursor-pointer">
              Fields ({tp.fields.length})
            </Tabs.Trigger>
            <Tabs.Trigger value="methods" className="cursor-pointer">
              Methods ({Object.keys(tp.methods).length})
            </Tabs.Trigger>
          </Tabs.List>

          <Box pt="3" style={{ flexGrow: 1, minHeight: 0 }}>

            {/* GENERAL */}
            <Tabs.Content value="general" style={{ height: '100%' }}>
              <DataList.Root size="2" style={{ '--data-list-label-width': '180px', '--data-list-row-gap': '8px' } as React.CSSProperties}>
                <DataList.Item>
                  <DataList.Label color="gray">Type Name</DataList.Label>
                  <DataList.Value><Text weight="bold" color="iris">{tp.name}</Text></DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label color="gray">Auto Index</DataList.Label>
                  <DataList.Value>
                    {tp.autoIndex ? (
                      <Badge color="green" variant="outline" size="1">ON</Badge>
                    ) : (
                      <Badge color="gray" variant="outline" size="1">OFF</Badge>
                    )}
                  </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label color="gray">Hide ID</DataList.Label>
                  <DataList.Value>
                    {tp.hideId ? (
                      <Badge color="green" variant="outline" size="1">ON</Badge>
                    ) : (
                      <Badge color="gray" variant="outline" size="1">OFF</Badge>
                    )}
                  </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label color="gray">Wrap Only</DataList.Label>
                  <DataList.Value>
                    {tp.wrapOnly ? (
                      <Badge color="green" variant="outline" size="1">ON</Badge>
                    ) : (
                      <Badge color="gray" variant="outline" size="1">OFF</Badge>
                    )}
                  </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label color="gray">Created At</DataList.Label>
                  <DataList.Value>
                    <Flex align="center" gap="1" style={{color: "gray"}}>
                      <CalendarIcon width="14" height="14" />
                      <Text size="2">{new Date(tp.createdAt * 1000).toLocaleString(undefined, {hour12: false})}</Text>
                    </Flex>
                  </DataList.Value>
                </DataList.Item>
                {tp.modifiedAt && (
                  <DataList.Item>
                    <DataList.Label color="gray">Modified At</DataList.Label>
                    <DataList.Value>
                      <Flex align="center" gap="1" style={{color: "gray"}}>
                        <CalendarIcon width="14" height="14" />
                        <Text size="2">{new Date(tp.modifiedAt * 1000).toLocaleString(undefined, {hour12: false})}</Text>
                      </Flex>
                    </DataList.Value>
                  </DataList.Item>
                )}
              </DataList.Root>
            </Tabs.Content>

            {/* FIELDS */}
            <Tabs.Content value="fields" style={{ height: '100%', maxHeight: '100%' }}>
              <FieldsTab
                tp={tp}
                onNavigateToType={onNavigateToType}
              />
            </Tabs.Content>

            {/* METHODS */}
            <Tabs.Content value="methods" style={{ height: '100%' }}>
              <MethodsTab
                methods={tp.methods}
                editorPathPrefix="enum"
                fallbackText="No methods defined on this type."
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