import { useState, useMemo } from 'react';
import { Card, Flex, Text, Button, ScrollArea, Heading, TextField, Badge, Tooltip, IconButton } from '@radix-ui/themes';
import { ArrowDownIcon, ArrowUpIcon, Cross2Icon, EraserIcon, LightningBoltIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useEvent } from '../../hooks';
import type { EmitEvent } from '../../types';
import EventArgsModal from './EventArgsModal';


export default function StudioEventView() {
  const { emitEvents = [], clearEmitEvents } = useEvent();
  const [sortNewestFirst, setSortNewestFirst] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isArgsModalOpen, setIsArgsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EmitEvent | null>(null);


  const handleViewArgs = (eventItem: EmitEvent) => {
    setSelectedEvent(eventItem);
    setIsArgsModalOpen(true);
  };

  const processedEvents = useMemo(() => {
    const formatted = emitEvents.map((item: EmitEvent) => {
      let localTime = 'Unknown Time';
      let epochMs = 0;

      try {
        const parsedDate = new Date(item.ts);
        epochMs = parsedDate.getTime();
        localTime = parsedDate.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
      } catch (e) {
        console.error('Failed to parse event timestamp string framework:', e);
      }

      return {
        ...item,
        localTime,
        epochMs,
      };
    });

    // Filter records based on user input
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? formatted.filter((item) => {
          return (
            item.event.toLowerCase().includes(query) ||
            item.roomId.toString().includes(query) ||
            JSON.stringify(item.args).toLowerCase().includes(query)
          );
        })
      : formatted;

    // Sort based on time
    return filtered.sort((a, b) => {
      return sortNewestFirst ? b.epochMs - a.epochMs : a.epochMs - b.epochMs;
    });
  }, [emitEvents, sortNewestFirst, searchQuery]);

  if (emitEvents.length === 0) {
    return (
      <Flex align="center" justify="center" style={{ height: '100%', minHeight: 180 }} direction="column" gap="2">
        <Text size="1" style={{ fontFamily: 'monospace', color: 'var(--gray-8)' }}>
          No room events emitted or tracked yet.
        </Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" style={{ height: '100%', width: '100%', backgroundColor: 'var(--gray-surface)' }}>
      <Flex
        px="3"
        py="2"
        direction="column"
        gap="2"
        style={{ borderBottom: '1px solid var(--gray-4)', backgroundColor: 'var(--gray-1)' }}
      >
        <Flex align="center" justify="between">
          <Heading size="1" color="gray" weight="bold" highContrast>
            Room Emit Events ({processedEvents.length})
          </Heading>
          <Flex gap="2">
            <Button
              size="1"
              variant="soft"
              color="gray"
              onClick={() => setSortNewestFirst((prev) => !prev)}
              className="cursor-pointer"
            >
              {sortNewestFirst ? (
                <>Newest First <ArrowDownIcon /></>
              ) : (
                <>Oldest First <ArrowUpIcon /></>
              )}
            </Button>
            <Tooltip content="Clear all events">
              <IconButton
                size="1"
                variant="soft"
                color="gray"
                onClick={clearEmitEvents}
                className="cursor-pointer"
              >
                <EraserIcon width="14" height="14" />
              </IconButton>
            </Tooltip>
          </Flex>
        </Flex>

        <TextField.Root
          placeholder="Filter by event name, room ID, or raw arguments..."
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
      </Flex>

      <ScrollArea scrollbars="vertical" style={{ flexGrow: 1, padding: 12 }}>
        {processedEvents.length === 0 ? (
          <Flex align="center" justify="center" p="4">
            <Text size="1" color="gray">No events match your current filter query.</Text>
          </Flex>
        ) : (
          <Flex direction="column" gap="2" pb="4">
            {processedEvents.map((item, index) => (
              <Card
                key={`${item.ts}-${index}`}
                size="1"
                variant="surface"
                style={{
                  backgroundColor: 'var(--gray-2)',
                  borderColor: 'var(--gray-4)',
                }}
              >
                <Flex gap="3" align="center" justify="between">
                  <Flex gap="3" align="center" style={{ minWidth: 0, flexGrow: 1 }}>
                    <Text color="iris" style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <LightningBoltIcon width="14" height="14" />
                    </Text>
                    <Text size="1" color="gray" style={{ fontFamily: 'monospace', minWidth: 65, flexShrink: 0 }}>
                      {item.localTime}
                    </Text>
                    <Badge color="iris" variant="outline" size="1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      #{item.roomId} {item.scope}
                    </Badge>
                    <Text size="1" weight="bold" truncate style={{ fontFamily: 'monospace', color: 'var(--gray-12)' }}>
                      {item.event}
                    </Text>
                  </Flex>

                  <Tooltip content="Inspect event arguments">
                    <Button
                      size="1"
                      variant="soft"
                      color={item.args.length > 0 ? 'iris' : 'gray'}
                      onClick={() => handleViewArgs(item)}
                      style={{ cursor: 'pointer', fontVariantNumeric: 'tabular-nums' }}
                    >
                      ARGS {item.args.length}
                    </Button>
                  </Tooltip>
                </Flex>
              </Card>
            ))}
          </Flex>
        )}
      </ScrollArea>
      <EventArgsModal
        isOpen={isArgsModalOpen}
        onOpenChange={setIsArgsModalOpen}
        eventItem={selectedEvent}
      />
    </Flex>
  );
}