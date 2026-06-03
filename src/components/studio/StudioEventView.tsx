import React, { useState, useMemo } from 'react';
import { Card, Flex, Text, Button, ScrollArea, Heading, TextField, Badge, Tooltip } from '@radix-ui/themes';
import { ArrowDownIcon, ArrowUpIcon, LightningBoltIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useEvent } from '../../hooks'; // Assuming EmitEvents are exposed here like warnings
import type { EmitEvent } from '../../types';


export default function StudioEventView() {
  const { emitEvents = [] } = useEvent(); // Safe fallback array initialization
  const [sortNewestFirst, setSortNewestFirst] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Open inspection view placeholder
  const handleInspectArgs = (eventItem: EmitEvent) => {
    alert(`Arguments Inspector for Event: "${eventItem.event}"\nPayload data: ${JSON.stringify(eventItem.args, null, 2)}`);
  };

  // Process, search-filter, and sort events cleanly inside a useMemo cache loop
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

    // 2. Filter records based on textual user input matching
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

    // 3. Sort stream elements based on time matrix bounds matching
    return filtered.sort((a, b) => {
      return sortNewestFirst ? b.epochMs - a.epochMs : a.epochMs - b.epochMs;
    });
  }, [emitEvents, sortNewestFirst, searchQuery]);

  if (emitEvents.length === 0) {
    return (
      <Flex align="center" justify="center" style={{ height: '100%', minHeight: 180 }} direction="column" gap="2">
        <Text size="2" color="gray" weight="medium">
          No live room events emitted or tracked yet.
        </Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" style={{ height: '100%', width: '100%', backgroundColor: 'var(--gray-surface)' }}>

      {/* HEADER CONTROL AND SEARCH BAR TOOLBOX */}
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

          <Button
            size="1"
            variant="soft"
            color="gray"
            onClick={() => setSortNewestFirst((prev) => !prev)}
            style={{ cursor: 'pointer' }}
          >
            {sortNewestFirst ? (
              <>Newest First <ArrowDownIcon /></>
            ) : (
              <>Oldest First <ArrowUpIcon /></>
            )}
          </Button>
        </Flex>

        {/* INPUT FILTER TRACKER SEARCH FIELD */}
        <TextField.Root
          size="1"
          placeholder="Filter by event name, room ID, or raw arguments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        >
          <TextField.Slot>
            <MagnifyingGlassIcon height="14" width="14" />
          </TextField.Slot>
        </TextField.Root>
      </Flex>

      {/* EVENT ITEMS SCROLL panel AREA */}
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

                    {/* TIMESTAMP FIELD */}
                    <Text size="1" color="gray" style={{ fontFamily: 'monospace', minWidth: 65, flexShrink: 0 }}>
                      {item.localTime}
                    </Text>

                    {/* SCOPE BOUNDARY ROOM IDENTIFIER DISPLAY BADGE */}
                    <Badge color="iris" variant="outline" size="1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      #{item.roomId}
                    </Badge>

                    {/* EVENT EMISSION NAME */}
                    <Text size="1" weight="bold" truncate style={{ fontFamily: 'monospace', color: 'var(--gray-12)' }}>
                      {item.event}
                    </Text>
                  </Flex>

                  {/* ARGUMENTS ACTION DISCLOSURE ELEMENT TRIGGER */}
                  <Tooltip content="Inspect event arguments payload payload data object">
                    <Button
                      size="1"
                      variant="soft"
                      color={item.args.length > 0 ? 'iris' : 'gray'}
                      onClick={() => handleInspectArgs(item)}
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
    </Flex>
  );
}