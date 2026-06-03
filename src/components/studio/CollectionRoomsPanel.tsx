import React, { useState } from 'react';
import { Flex, Text, Card, Box, Badge, IconButton, Tooltip, Spinner } from '@radix-ui/themes';
import { PlusIcon, InfoCircledIcon, UpdateIcon, LinkBreak2Icon, Pencil1Icon } from '@radix-ui/react-icons';
import { useActiveWorkspace } from '../../hooks';
import RoomJoinModal from './RoomJoinModal';
import type { Room } from '../../types';

interface CollectionRoomsPanelProps {
  scope: string;
}

export default function CollectionRoomsPanel({ scope }: CollectionRoomsPanelProps) {
  const { rooms, joinRoom, updateRoom, leaveRoom, refreshRooms, loading } = useActiveWorkspace();
  const [isRoomJoinOpen, setIsRoomJoinOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const filteredRooms = rooms.filter((room) => room.scope === scope);

  const handleLeaveRoom = async (roomName: string) => {
    try {
      setIsRefreshing(true);
      await leaveRoom(scope, roomName);
      setIsRefreshing(false);
    } catch (err: unknown) {
      console.error(`Failed to leave room [${roomName}]:`, err);
    }
  };

  const handleOnJoin = async (name: string, code: string) => {
    await joinRoom(scope, name, code);
    return null;
  };

  const handleOnUpdate = async (name: string, code: string) => {
    await updateRoom(scope, name, code);
    return null;
  };

  const handleRefreshClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const refresh = async () => {
      setIsRefreshing(true);
      await refreshRooms();
      setIsRefreshing(false);
    };
    refresh();
  };

  const handleJoinRoomClick = (room: Room | null) => {
    setSelectedRoom(room);
    setIsRoomJoinOpen(true)
  };

  if (isRefreshing || loading) {
    return <Flex justify="center" py="3"><Spinner size="2" /></Flex>;
  }

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Text size="1" color="gray" weight="bold" mt="2">
          WATCHING ({filteredRooms.length})
        </Text>
        <Flex gap="1">
          <Tooltip content="Refresh rooms">
            <IconButton
              size="1"
              variant="soft"
              color="gray"
              onClick={handleRefreshClick}
              style={{ cursor: isRefreshing ? 'not-allowed' : 'pointer' }}
            >
              <UpdateIcon width="13" height="13" className={isRefreshing ? 'animate-spin' : ''} />
            </IconButton>
          </Tooltip>
          <Tooltip content="Join room">
            <IconButton
              size="1"
              variant="soft"
              color="iris"
              onClick={() => handleJoinRoomClick(null)}
              style={{ cursor: 'pointer' }}
            >
              <PlusIcon width="14" height="14" />
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>

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
        <Flex direction="column" gap="2">
          {filteredRooms.map((room) => {
            const isWorking = room.id !== undefined;
            const hasError = !!room.errMsg;
            return (
              <Card
                key={room.name}
                size="1"
                style={{
                  padding: '6px 8px',
                  backgroundColor: 'var(--gray-2)',
                  borderColor: hasError ? 'var(--orange-6)' : 'var(--gray-4)'
                }}
              >
                <Flex align="center" justify="between">
                  <Flex
                    align="center"
                    gap="2"
                    style={{ cursor: 'pointer', flexGrow: 1, minWidth: 0 }}
                    onClick={() => handleJoinRoomClick(room)}
                  >
                    {isWorking ? (
                      <Flex align="center" gap="2">
                        <Badge size="1" color="iris" variant="outline" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          #{room.id}
                        </Badge>
                        <Text size="2" weight="bold" color="gray">
                          {room.name}
                        </Text>
                      </Flex>
                    ) : (
                      <Flex align="center" gap="2" style={{ minWidth: 0 }}>
                        <InfoCircledIcon color="var(--orange-9)" />
                        <Text size="2" weight="bold" color="orange">
                          {room.name}
                        </Text>
                      </Flex>
                    )}
                    <Pencil1Icon className="edit-hover-icon" width="11" height="11" color="var(--gray-8)" style={{ opacity: 0.4 }} />
                  </Flex>

                  {/* LEAVE ROOM */}
                  <Tooltip content="Disconnect from (leave) room">
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="gray"
                      highContrast
                      onClick={() => handleLeaveRoom(room.name)}
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                    >
                      <LinkBreak2Icon width="15" height="15" />
                    </IconButton>
                  </Tooltip>
                </Flex>

                {/* 🚨 DYNAMIC LOWER LEVEL ERROR DISCLOSURE PANE */}
                {hasError && (
                  <Box
                    mt="1"
                    p="1"
                    style={{
                      backgroundColor: 'var(--orange-2)',
                      borderRadius: 'var(--radius-1)',
                      borderLeft: '2px solid var(--orange-8)'
                    }}
                  >
                    <Text size="1" color="orange">
                      {room.errMsg}
                    </Text>
                  </Box>
                )}
              </Card>
            );
          })}
        </Flex>
      )}

      {isRoomJoinOpen && (
        <RoomJoinModal
          isOpen={isRoomJoinOpen}
          onOpenChange={setIsRoomJoinOpen}
          scope={scope}
          existingRooms={filteredRooms}
          onJoin={selectedRoom === null ? handleOnJoin : handleOnUpdate}
          selectedRoom={selectedRoom}
        />
      )}
    </Flex>
  );
}