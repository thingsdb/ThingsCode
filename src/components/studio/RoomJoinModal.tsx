import React, { useState, useEffect } from 'react';
import { Dialog, Flex, Button, Box, Text, TextField, Callout } from '@radix-ui/themes';
import Editor from '@monaco-editor/react';
import { InfoCircledIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useTheme } from '../../hooks';
import type { Room } from '../../types';

interface RoomJoinModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  scope: string;
  existingRooms: Room[];
  selectedRoom: Room | null;
  onJoin: (name: string, code: string) => void;
}

export default function RoomJoinModal({
  isOpen,
  onOpenChange,
  scope,
  existingRooms,
  selectedRoom,
  onJoin,
}: RoomJoinModalProps) {
  const { appearance } = useTheme();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const mode: 'create' | 'edit' | 'view' = !selectedRoom
    ? 'create'
    : selectedRoom.errMsg
      ? 'edit'
      : 'view';

  useEffect(() => {
    if (isOpen) {
      if (selectedRoom) {
        queueMicrotask(() => {
          setName(selectedRoom.name);
          setCode(selectedRoom.code || '');
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
  }, [isOpen, selectedRoom]);

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
        (room) => room.scope === scope && room.name.toLowerCase() === trimmedName.toLowerCase()
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
  const titleText = mode === 'create' ? 'Join Room' : mode === 'edit' ? 'Update Join Room Code' : 'Room Connection Details';

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 640, padding: '16px' }}>
        <Dialog.Title size="3" mb="1">{titleText}</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Scope: <Text weight="bold" color="gray" highContrast>{scope}</Text>.
        </Dialog.Description>

        <form onSubmit={handleSave}>
          <Flex direction="column" gap="3" mb="4">

            {/* NAME INPUT ROW (Disabled except during explicit creation loops) */}
            <Box>
              <Text as="label" size="2" weight="bold" color="gray" mb="1">
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
              <Text as="label" size="2" weight="bold" color="gray" mb="1">
                Code Expression {mode === 'view' && '(Read-Only)'}
              </Text>
              <Box
                style={{
                  height: '180px',
                  border: '1px solid var(--gray-5)',
                  borderRadius: 'var(--radius-2)',
                  overflow: 'hidden',
                  opacity: mode === 'view' ? 0.75 : 1 // Visually deemphasize when read-only
                }}
              >
                <Editor
                  height="100%"
                  theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
                  language="thingsdb"
                  path={`ticode-room-resolution-${scope.replace(/[^a-zA-Z0-9]/g, '')}.ti`}
                  value={code}
                  onChange={handleEditorChange}
                  options={{
                    readOnly: mode === 'view',
                    domReadOnly: mode === 'view',
                    minimap: { enabled: false },
                    fontSize: 12,
                    lineNumbers: 'on',
                    tabSize: 2,
                    automaticLayout: true,
                    scrollbar: { vertical: 'visible', horizontal: 'hidden' },
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

          {/* DYNAMIC ACTION FOOTER */}
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