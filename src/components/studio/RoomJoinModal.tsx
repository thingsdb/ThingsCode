import React, { useState, useEffect } from 'react';
import { Dialog, Flex, Button, Box, Text, TextField, Callout, Badge } from '@radix-ui/themes';
import Editor from '@monaco-editor/react';
import { InfoCircledIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useTheme } from '../../hooks';
import type { Room } from '../../types';

interface RoomJoinModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  scope: string;
  existingRooms: Room[];
  room: Room | null;
  onJoin: (name: string, code: string) => void;
}

export default function RoomJoinModal({
  isOpen,
  onOpenChange,
  scope,
  existingRooms,
  room,
  onJoin,
}: RoomJoinModalProps) {
  const { appearance } = useTheme();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const mode: 'create' | 'edit' | 'view' = !room
    ? 'create'
    : room.errMsg
      ? 'edit'
      : 'view';

  useEffect(() => {
    if (isOpen) {
      if (room) {
        queueMicrotask(() => {
          setName(room.name);
          setCode(room.code || '');
          setValidationError(null);
      });
      } else {
        queueMicrotask(() => {
          setName('');
          setCode('// Enter expression resolving to a Room ID or Name\n');
          setValidationError(null);
        });
      }
    }
  }, [isOpen, room]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (mode !== 'create') {
      return; // Safety guard
    }
    const rawName = e.target.value;
    setName(rawName);
    validate(rawName, code);
  };

  const handleEditorChange = (val: string | undefined) => {
    if (mode === 'view') {
      return; // Safety guard
    }
    const rawCode = val || '';
    setCode(rawCode);
    validate(name, rawCode);
  };

  const validate = (currentName: string, currentCode: string) => {
    if (mode === 'view') {
      return true;
    }
    const trimmedName = currentName.trim();
    const trimmedCode = currentCode.trim();

    if (!trimmedName) {
      setValidationError("Watcher display name cannot be blank.");
      return false;
    }

    if (!trimmedCode) {
      setValidationError("ThingsDB code expression cannot be empty.");
      return false;
    }

    // Is unique?
    if (mode === 'create') {
      const isDuplicate = existingRooms.some(
        (r) => r.scope === scope && r.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (isDuplicate) {
        setValidationError(`A watched room named "${trimmedName}" already exists on this scope.`);
        return false;
      }
    }

    setValidationError(null);
    return true;
  };

  const handleSave = (e: React.ChangeEvent) => {
    e.preventDefault();
    if (mode === 'view') {
      onOpenChange(false);
      return;
    }
    if (validate(name, code)) {
      onJoin(name.trim(), code.trim());
      onOpenChange(false);
    }
  };

  const isValid = mode === 'view' || (!validationError && name.trim().length > 0 && code.trim().length > 0);
  const titleText = mode === 'create' ? 'Join Room' : mode === 'edit' ? 'Update Join Code' : 'Details';

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content aria-describedby={undefined} style={{ maxWidth: 640, padding: '16px' }}>
        <Dialog.Title size="3" mb="1">
          <Flex align="center" gap="2">
            {room?.id && (
              <Badge size="2" color="iris" variant="surface" style={{ fontVariantNumeric: 'tabular-nums' }}>
                ROOM #{room.id}
              </Badge>
            )}
            <Text size="3" weight="bold">{titleText}</Text>
          </Flex>
        </Dialog.Title>

        <form onSubmit={handleSave}>
          <Flex direction="column" gap="4" mb="4">

            <Box>
              <Text as="label" size="1" weight="bold" color="gray">
                Watcher Name
              </Text>
              <TextField.Root
                placeholder="e.g., My Room"
                value={name}
                onChange={handleNameChange}
                disabled={mode !== 'create'} // Locked out during edit and view frames
                size="2"
                maxLength={64}
              />
              {mode === 'create' && (
                <Text size="1" color="gray" mt="1">
                  A unique watcher name used by ThingsCode to handle or disconnect this room later.
                </Text>
              )}
            </Box>

            {/* DOCS  */}
            {mode !== 'view' && (
              <Callout.Root color="iris" size="1">
                <Callout.Icon>
                  <InfoCircledIcon />
                </Callout.Icon>
                <Flex direction="column" gap="2" style={{ width: '100%' }}>
                  <Text size="1">
                    The code block below is evaluated inside ThingsDB and <Text weight="bold">must return</Text> either a numeric <Text weight="bold">Room ID</Text> or a string <Text weight="bold">Room Name</Text> to successfully join the room. For example:
                  </Text>
                  <Box asChild>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontStyle: 'italic', listStyleType: 'disc' }}>
                      <li>
                        <Text size="1">
                          Expression: <Text color="gray" highContrast style={{ fontFamily: 'monospace', fontStyle: 'normal' }}>.rooms.myroom.id();</Text>
                        </Text>
                      </li>
                      <li>
                        <Text size="1">
                          By room ID: <Text color="gray" highContrast style={{ fontFamily: 'monospace', fontStyle: 'normal' }}>123;</Text>
                        </Text>
                      </li>
                      <li>
                        <Text size="1">
                          Named Room: <Text color="gray" highContrast style={{ fontFamily: 'monospace', fontStyle: 'normal' }}>"myroom";</Text>
                        </Text>
                      </li>
                    </ul>
                  </Box>
                </Flex>
              </Callout.Root>
            )}

            {/* MONACO EDITOR */}
            <Box>
              <Text as="label" size="1" weight="bold" color="gray">
                Code Expression {mode === 'view' && '(Read-Only)'}
              </Text>
              <Box
                style={{
                  height: '180px',
                  border: '1px solid var(--gray-5)',
                  borderRadius: 'var(--radius-2)',
                  overflow: 'hidden',
                  opacity: mode === 'view' ? 0.75 : 1 // dimmed when read-only
                }}
              >
                <Editor
                  language="thingsdb"
                  path=".ticode-room-join-code.ti"
                  value={code}
                  onChange={handleEditorChange}
                  theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
                  options={{
                    readOnly: mode === 'view',
                    domReadOnly: mode === 'view',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    minimap: { enabled: false },
                    automaticLayout: true,
                    lineNumbers: 'off',
                    scrollbar: { vertical: 'visible', horizontal: 'hidden' },
                    tabSize: 4,
                  }}
                />
              </Box>
            </Box>

            {/* ERROR */}
            {validationError && mode !== 'view' && (
              <Callout.Root color="orange" size="1">
                <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
                <Callout.Text>{validationError}</Callout.Text>
              </Callout.Root>
            )}
          </Flex>

          {/* FOOTER */}
          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button type="button" variant="soft" color="gray" size="2" style={{ cursor: 'pointer' }}>
                {mode === 'view' ? 'Close' : 'Cancel'}
              </Button>
            </Dialog.Close>

            {mode !== 'view' && (
              <Button
                type="submit"
                size="2"
                color="iris"
                disabled={!isValid}
                style={{ cursor: isValid ? 'pointer' : 'not-allowed' }}
              >
                Join Room
              </Button>
            )}
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}