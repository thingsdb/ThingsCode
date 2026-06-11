import { useState, useMemo } from 'react';
import { Dialog, Flex, Button, Box, Text, Badge, Tabs, DataList, ScrollArea, Callout } from '@radix-ui/themes';
import { InfoCircledIcon, ExclamationTriangleIcon, CalendarIcon, LoopIcon, FileIcon } from '@radix-ui/react-icons';
import type { Backup } from '../../types';

interface BackupModalProps {
  onClose: (open: boolean) => void;
  scope: string;
  backup: Backup;
}

export default function BackupModal({
  onClose,
  scope,
  backup,
}: BackupModalProps) {
  const [activeTab, setActiveTab] = useState<string>('general');

  const formatRepeatInterval = (seconds: number | undefined) => {
    if (seconds === undefined) return 'Run once (No repeat schedule)';
    if (seconds < 60) return `Every ${seconds} seconds`;
    if (seconds == 60) return 'Every minute';
    if (seconds < 3600) return `Every ${Math.floor(seconds / 60)} minutes`;
    if (seconds == 3600) return 'Every hour';
    if (seconds < 86400) return `Every ${Math.floor(seconds / 3600)} hours`;
    if (seconds == 86400) return 'Every day';
    return `Every ${Math.floor(seconds / 86400)} days`;
  };

  // Needs a code editor blocks layout?
  const isMessageMultiLine = useMemo(() => {
    return !!backup.resultMessage && backup.resultMessage.includes('\n');
  }, [backup.resultMessage]);

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
                  #{backup.id}
                </Badge>
                <Text size="3" weight="bold" color="gray">Backup ({scope})</Text>
              </Flex>
              {/* ⚡ PENDING/OK/FAILED */}
              {backup.resultCode === undefined ? (
                <Badge color="amber" variant="surface" size="1" style={{ gap: '2px', padding: '0 5px', flexShrink: 0 }}>
                  <Text size="1" weight="medium" style={{ fontSize: '10px', letterSpacing: '0.03em' }}>PENDING</Text>
                </Badge>
              ) : backup.resultCode === 0 ? (
                <Badge color="green" variant="outline" size="1" style={{ gap: '2px', padding: '0 5px', flexShrink: 0, borderColor: 'var(--gray-5)' }}>
                  <Text size="1" weight="medium" style={{ fontSize: '10px', color: 'var(--green-10)' }}>OK</Text>
                </Badge>
              ) : (
                <Badge color="red" variant="outline" size="1" style={{ gap: '2px', padding: '0 5px', flexShrink: 0, borderColor: 'var(--gray-5)' }}>
                  <Text size="1" weight="medium" style={{ fontSize: '10px', color: 'var(--red-10)' }}>ERROR</Text>
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
            <Tabs.Trigger value="general" className="cursor-pointer">
              General
            </Tabs.Trigger>
            <Tabs.Trigger value="files" className="cursor-pointer">
              Files Generated ({backup.files?.length || 0})
            </Tabs.Trigger>
          </Tabs.List>

          <Box pt="3" style={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

            {/* GENERAL */}
            <Tabs.Content value="general" style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <DataList.Root size="2" style={{ '--data-list-label-width': '180px', '--data-list-row-gap': '8px' } as React.CSSProperties}>
                <DataList.Item>
                  <DataList.Label color="gray">File Template</DataList.Label>
                  <DataList.Value>
                    <Text weight="bold" color="iris" style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                      {backup.fileTemplate}
                    </Text>
                  </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label color="gray">Repeat Schedule</DataList.Label>
                  <DataList.Value>
                    <Flex align="center" gap="2">
                      {backup.repeat && <LoopIcon width="14" height="14" color="var(--gray-8)" />}
                      <Text size="2">{formatRepeatInterval(backup.repeat)}</Text>
                    </Flex>
                  </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label color="gray">Retention</DataList.Label>
                  <DataList.Value>
                    <Text size="2">
                      {backup.maxFiles !== undefined ? `Keep max ${backup.maxFiles} files` : 'Keep all files infinitely'}
                    </Text>
                  </DataList.Value>
                </DataList.Item>
                {backup.nextRun && (
                  <DataList.Item>
                    <DataList.Label color="gray">Next Run</DataList.Label>
                  <DataList.Value>
                    <Flex align="center" gap="2" style={{ color: "gray" }}>
                      <CalendarIcon width="14" height="14" />
                      <Text size="2">{new Date(backup.nextRun).toLocaleString(undefined, {hour12: false})}</Text>
                    </Flex>
                  </DataList.Value>
                  </DataList.Item>
                )}
              </DataList.Root>

              {backup.resultMessage && (
                <Flex direction="column" gap="1" style={{ flexGrow: 1, minHeight: 0 }}>
                  <Text size="1" weight="bold" color="gray">Backup Error Response</Text>

                  {backup.resultCode !== 0 ? (
                    isMessageMultiLine ? (
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
                          {backup.resultMessage}
                        </Text>
                      </ScrollArea>
                    ) : (
                      <Callout.Root color="red" size="1">
                        <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
                        <Callout.Text style={{ fontFamily: 'monospace' }}>{backup.resultMessage}</Callout.Text>
                      </Callout.Root>
                    )
                  ) : (
                    <Callout.Root color="green" size="1">
                      <Callout.Icon><InfoCircledIcon /></Callout.Icon>
                      <Callout.Text style={{ fontFamily: 'monospace' }}>{backup.resultMessage}</Callout.Text>
                    </Callout.Root>
                  )}
                </Flex>
              )}
            </Tabs.Content>

            {/* FILES */}
            <Tabs.Content value="files" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <ScrollArea
                type="auto"
                scrollbars="vertical"
                style={{
                  flexGrow: 1,
                  border: '1px solid var(--gray-4)',
                  borderRadius: 'var(--radius-3)',
                  backgroundColor: 'var(--gray-1)'
                }}
              >
                {(!backup.files || backup.files.length === 0) ? (
                  <Flex justify="center" align="center" direction="column" gap="2" style={{ height: '160px', color: 'var(--gray-8)' }}>
                    <FileIcon width="20" height="20" style={{ opacity: 0.5 }} />
                    <Text size="1" style={{ fontStyle: 'italic' }}>
                      No backup files generated yet.
                    </Text>
                  </Flex>
                ) : (
                  <DataList.Root size="1" style={{ '--data-list-label-width': 'auto', display: 'flex', flexDirection: 'column' } as React.CSSProperties}>
                    {backup.files.map((filePath, index) => (
                      <DataList.Item
                        key={`${filePath}-${index}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '12px',
                          paddingBlock: '6px',
                          paddingInline: '12px',
                          borderBottom: '1px solid var(--gray-3)'
                        }}
                      >
                        <DataList.Label style={{ display: 'flex', alignItems: 'center', color: 'var(--gray-8)' }}>
                          <FileIcon width="14" height="14" />
                        </DataList.Label>
                        <DataList.Value>
                          <Text size="2" style={{ fontFamily: 'monospace', color: 'var(--gray-12)' }}>
                            {filePath}
                          </Text>
                        </DataList.Value>
                      </DataList.Item>
                    ))}
                  </DataList.Root>
                )}
              </ScrollArea>
            </Tabs.Content>
          </Box>
        </Tabs.Root>

        {/* FOOTER */}
        <Flex gap="3" justify="end" flexShrink="0" style={{ paddingTop: '12px', marginTop: '12px', borderTop: '1px solid var(--gray-4)' }}>
          <Dialog.Close>
            <Button type="button" variant="soft" color="gray" size="2" className="cursor-pointer">
              Close
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}