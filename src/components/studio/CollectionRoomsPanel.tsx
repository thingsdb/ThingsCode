import { Flex, Text, Button, Card, Box, Badge, IconButton, Tooltip } from '@radix-ui/themes';
import { PlusIcon, TrashIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import type { Room } from '../../types';
import { useActiveWorkspace } from '../../hooks';

interface CollectionRoomsPanelProps {
  scope: string;
}

export default function CollectionRoomsPanel({ scope }: CollectionRoomsPanelProps) {
  const { rooms } = useActiveWorkspace()
  // 🔑 THE FILTER: Keep the view contextual by isolating only this specific scope's rooms
  const filteredRooms = rooms.filter((room) => room.scope === scope);

  const handleLeaveRoom = async (roomName: string) => {
    try {
      // await leaveRoom(room);
    } catch (err) {
      console.error(`Failed to un-register or leave room tracker [${roomName}]:`, err);
    }
  };

  return (
    <Flex direction="column" gap="2">
      {/* SECTION HEADER ACTIONS TRIGGER */}
      <Flex justify="between" align="center" mb="1">
        <Text size="1" color="gray" weight="bold" style={{ letterSpacing: '0.05em' }}>
          WATCHING ({filteredRooms.length})
        </Text>
        <Button
          size="1"
          variant="ghost"
          color="iris"
          onClick={() => null}
          style={{ cursor: 'pointer', height: 20, padding: '0 6px' }}
        >
          <PlusIcon width="14" height="14" /> Add Room
        </Button>
      </Flex>

      {/* EMPTY RUNTIME FALLBACK STATE */}
      {filteredRooms.length === 0 ? (
        <Box
          py="3"
          px="2"
          style={{
            textAlign: 'center',
            border: '1px dashed var(--gray-5)',
            borderRadius: 'var(--radius-2)'
          }}
        >
          <Text size="1" color="gray">No rooms monitored on this collection scope.</Text>
        </Box>
      ) : (
        /* ACTIVE ROOMS STREAM STACK */
        <Flex direction="column" gap="1.5">
          {filteredRooms.map((room) => {
            const hasError = !!room.errMsg;

            return (
              <Card
                key={room.name}
                size="1"
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--gray-2)',
                  borderColor: hasError ? 'var(--orange-6)' : 'var(--gray-4)'
                }}
              >
                <Flex direction="column" gap="1.5">
                  <Flex align="center" justify="between">
                    <Flex align="center" gap="2">
                      <Text size="2" weight="bold">
                        {room.name}
                      </Text>
                      <Badge size="1" color="gray" variant="surface" style={{ fontFamily: 'monospace' }}>
                        {room.code}
                      </Badge>
                    </Flex>

                    <Tooltip content="Stop watching and un-subscribe from room events">
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="red"
                        onClick={() => handleLeaveRoom(room.name)}
                        style={{ cursor: 'pointer' }}
                      >
                        <TrashIcon width="14" height="14" />
                      </IconButton>
                    </Tooltip>
                  </Flex>

                  {/* 🚨 DYNAMIC INLINE SUBSCRIPTION ERROR MESSAGING CONTAINER */}
                  {hasError && (
                    <Flex
                      align="start"
                      gap="1.5"
                      p="1.5"
                      style={{
                        backgroundColor: 'var(--orange-2)',
                        borderRadius: 'var(--radius-1)',
                        borderLeft: '2px solid var(--orange-8)'
                      }}
                    >
                      <InfoCircledIcon color="var(--orange-9)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <Text size="1" color="orange" style={{ lineHeight: '1.2' }}>
                        {room.errMsg}
                      </Text>
                    </Flex>
                  )}
                </Flex>
              </Card>
            );
          })}
        </Flex>
      )}
    </Flex>
  );
}