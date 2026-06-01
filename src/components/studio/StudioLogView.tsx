import { useState, useMemo } from 'react';
import { Card, Flex, Text, Button, ScrollArea, Heading } from '@radix-ui/themes';
import { ArrowDownIcon, ArrowUpIcon, InfoCircledIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useEvent } from '../../hooks';

// Map warning codes to presentable UI designations and colors
const getLogTypeMeta = (code: number) => {
  if (code === 2) {
    return { label: 'LOG', color: 'blue' as const, icon: <InfoCircledIcon width="14" height="14" /> };
  }
  // Codes other than 2 usually denote deprecations or system alerts
  return { label: 'WARN', color: 'amber' as const, icon: <ExclamationTriangleIcon width="14" height="14" /> };
};

export default function StudioLogView() {
  const { warnings } = useEvent();
  const [sortNewestFirst, setSortNewestFirst] = useState<boolean>(true);

  // Parse, format, and sort the logs based on user selection
  const processedLogs = useMemo(() => {
    const formatted = warnings.map((log) => {
      const meta = getLogTypeMeta(log.Code);

      // Convert Epoch timestamp to local browser time string
      let localTime = 'Unknown Time';
      try {
        localTime = new Date(log.Timestamp).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
      } catch (e) {
        console.error('Failed to parse log timestamp:', e);
      }

      return {
        ...log,
        localTime,
        meta,
      };
    });

    // Sort logs based on state toggle
    return formatted.sort((a, b) => {
      return sortNewestFirst ? b.Timestamp - a.Timestamp : a.Timestamp - b.Timestamp;
    });
  }, [warnings, sortNewestFirst]);

  if (warnings.length === 0) {
    return (
      <Flex align="center" justify="center" style={{ height: '100%', minHeight: 180 }} direction="column" gap="2">
        <Text size="2" color="gray" weight="medium">
          No logs or ThingsDB warnings recorded yet.
        </Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" style={{ height: '100%', width: '100%', backgroundColor: 'var(--gray-surface)' }}>
      {/* CONTROL BAR */}
      <Flex
        px="3"
        py="2"
        align="center"
        justify="between"
        style={{ borderBottom: '1px solid var(--gray-4)', backgroundColor: 'var(--gray-1)' }}
      >
        <Heading size="1" color="gray" weight="bold" highContrast>
          Node Warnings/Log ({warnings.length})
        </Heading>
        <Button
          size="1"
          variant="soft"
          color="gray"
          onClick={() => setSortNewestFirst((prev) => !prev)}
          style={{ cursor: 'pointer' }}
        >
          {sortNewestFirst ? (
            <>
              Newest First <ArrowDownIcon />
            </>
          ) : (
            <>
              Oldest First <ArrowUpIcon />
            </>
          )}
        </Button>
      </Flex>

      {/* LOG STREAM SCROLL PANEL */}
      <ScrollArea scrollbars="vertical" style={{ flexGrow: 1, padding: 12 }}>
        <Flex direction="column" gap="2" pb="4">
          {processedLogs.map((log, index) => (
            <Card
              key={`${log.Timestamp}-${index}`}
              size="1"
              variant="surface"
              style={{
                borderColor: log.Code === 2 ? 'var(--gray-4)' : 'var(--amber-4)',
                backgroundColor: log.Code === 2 ? 'var(--gray-2)' : 'var(--amber-1)'
              }}
            >
              <Flex gap="3" align="start">
                <Text color={log.meta.color} style={{ gap: 2, display: 'inline-flex', alignItems: 'center' }}>
                  {log.meta.icon}
                </Text>

                <Text size="1" color="gray" style={{ fontFamily: 'monospace', minWidth: 65 }}>
                  {log.localTime}
                </Text>

                <Text size="1" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {log.Msg}
                </Text>
              </Flex>
            </Card>
          ))}
        </Flex>
      </ScrollArea>
    </Flex>
  );
}