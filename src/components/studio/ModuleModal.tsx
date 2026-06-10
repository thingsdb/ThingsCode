import { useState, useMemo } from 'react';
import { Dialog, Flex, Button, Box, Text, Badge, Tabs, DataList, ScrollArea, Callout } from '@radix-ui/themes';
import { ExclamationTriangleIcon, CalendarIcon } from '@radix-ui/react-icons';
import type { Module } from '../../types';
import { Editor } from '@monaco-editor/react';
import { useTheme } from '../../hooks';

interface ModuleModalProps {
  onClose: (open: boolean) => void;
  scope: string;
  module: Module;
}

export default function ModuleModal({
  onClose,
  scope,
  module,
}: ModuleModalProps) {
  const { appearance } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('general');

  const configuration = useMemo<string | null>(() => {
    return module.conf ? JSON.stringify(module.conf, null, 2) : null;
  }, [module]);

  const exposes = useMemo<string | null>(() => {
    return module.exposes ? JSON.stringify(module.exposes, null, 2) : null;
  }, [module]);

  const isMessageMultiLine = useMemo(() => {
    return module.status.includes('\n');
  }, [module]);

  return (
    <Dialog.Root defaultOpen onOpenChange={onClose}>
      <Dialog.Content aria-describedby={undefined} style={{
          width: '65vw',
          maxWidth: '1024px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh'
      }}>
        {/* HEADER */}
        <Box flexShrink="0" mb="2">
          <Dialog.Title size="3" style={{ margin: 0 }}>
            <Flex align="center" justify="between">
              <Flex align="center" gap="2">
                <Badge size="2" color="iris" variant="surface" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}>
                  {module.name}
                </Badge>
                <Text size="3" weight="bold" color="gray">Details ({scope})</Text>
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
          </Dialog.Title>
        </Box>

        {/* TABS CONTROLLER */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} style={{
          height: '52vh',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}>
          <Tabs.List size="2" style={{ flexShrink: 0 }}>
            <Tabs.Trigger value="general" style={{ cursor: 'pointer' }}>
              General
            </Tabs.Trigger>
            <Tabs.Trigger value="conf" style={{ cursor: 'pointer' }}>
              Configuration
            </Tabs.Trigger>
            <Tabs.Trigger value="exposes" style={{ cursor: 'pointer' }}>
              Exposes
            </Tabs.Trigger>
          </Tabs.List>

          <Box pt="3" style={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

            {/* GENERAL */}
            <Tabs.Content value="general" style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <DataList.Root size="2" style={{ '--data-list-label-width': '180px', '--data-list-row-gap': '8px' } as React.CSSProperties}>
                <DataList.Item>
                  <DataList.Label color="gray">Name</DataList.Label>
                  <DataList.Value>
                    <Text weight="bold" color="iris" style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                      {module.name}
                    </Text>
                  </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label color="gray">Created At</DataList.Label>
                  <DataList.Value>
                    <Flex align="center" gap="2" style={{ color: "gray" }}>
                      <CalendarIcon width="14" height="14" />
                      <Text size="2">{new Date(module.createdAt).toLocaleString(undefined, {hour12: false})}</Text>
                    </Flex>
                  </DataList.Value>
                </DataList.Item>

                {module.version && (
                  <DataList.Item>
                    <DataList.Label color="gray">Version</DataList.Label>
                    <DataList.Value>
                      <Flex align="center" gap="2">
                        {module.version}
                      </Flex>
                    </DataList.Value>
                  </DataList.Item>
                )}
                {module.tasks !== null && (
                  <DataList.Item>
                    <DataList.Label color="gray">Running tasks</DataList.Label>
                    <DataList.Value>
                      <Text size="2">
                        {module.tasks}
                      </Text>
                    </DataList.Value>
                  </DataList.Item>
                )}
                {module.restarts !== null && (
                  <DataList.Item>
                    <DataList.Label color="gray">Module restarts</DataList.Label>
                    <DataList.Value>
                      <Text size="2">
                        {module.restarts}
                      </Text>
                    </DataList.Value>
                  </DataList.Item>
                )}
              </DataList.Root>
              {module.status !== 'running' && module.status !== 'installing module...' && (
                <Flex direction="column" gap="1" style={{ flexGrow: 1, minHeight: 0 }}>
                  <Text size="1" weight="bold" color="gray">Module Error Status</Text>

                  {isMessageMultiLine ? (
                    <ScrollArea
                      type="auto"
                      style={{
                        flexGrow: 1,
                        border: '1px solid var(--red-4)',
                        backgroundColor: 'var(--red-1)',
                        borderRadius: 'var(--radius-3)',
                        padding: '10px'
                      }}
                    >
                      <Text size="1" style={{ fontFamily: 'monospace', color: 'var(--red-11)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                        {module.status}
                      </Text>
                    </ScrollArea>
                  ) : (
                    <Callout.Root color="red" size="1">
                      <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
                      <Callout.Text style={{ fontFamily: 'monospace' }}>{module.status}</Callout.Text>
                    </Callout.Root>
                  )}
                </Flex>
              )}
            </Tabs.Content>

            {/* CONF */}
            <Tabs.Content value="conf" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {configuration ? (
                <Box
                  style={{
                    height: '100%',
                    border: '1px solid var(--gray-5)',
                    borderRadius: 'var(--radius-2)',
                    overflow: 'hidden',
                  }}
                >
                  <Editor
                    theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
                    language="thingsdb"
                    path=".ticode-procedure-code.ti"
                    value={configuration}
                    options={{
                      readOnly: true,
                      domReadOnly: true,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      minimap: { enabled: false },
                      automaticLayout: true,
                      lineNumbers: 'off',
                      scrollbar: { vertical: 'visible', horizontal: 'visible' },
                      tabSize: 4,
                    }}
                  />
                </Box>
              ) : (
              <Flex align="center" justify="center" style={{ height: '100%' }}>
                <Text size="2" style={{ fontStyle: 'italic', color: 'var(--gray-8)' }}>
                  No configuration for this module.
                </Text>
              </Flex>
              )}
            </Tabs.Content>

            {/* EXPOSES */}
            <Tabs.Content value="exposes" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {exposes ? (
                <Box
                  style={{
                    height: '100%',
                    border: '1px solid var(--gray-5)',
                    borderRadius: 'var(--radius-2)',
                    overflow: 'hidden',
                  }}
                >
                  <Editor
                    theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
                    language="thingsdb"
                    path=".ticode-procedure-code.ti"
                    value={exposes}
                    options={{
                      readOnly: true,
                      domReadOnly: true,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      minimap: { enabled: false },
                      automaticLayout: true,
                      lineNumbers: 'off',
                      scrollbar: { vertical: 'visible', horizontal: 'visible' },
                      tabSize: 4,
                    }}
                  />
                </Box>
              ) : (
              <Flex align="center" justify="center" style={{ height: '100%' }}>
                <Text size="2" style={{ fontStyle: 'italic', color: 'var(--gray-8)' }}>
                  No methods exposed on this module.
                </Text>
              </Flex>
              )}
            </Tabs.Content>

          </Box>
        </Tabs.Root>

        {/* FOOTER */}
        <Flex gap="3" justify="end" flexShrink="0" style={{ paddingTop: '12px', marginTop: '12px', borderTop: '1px solid var(--gray-4)' }}>
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