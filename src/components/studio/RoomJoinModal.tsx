import React, { useState } from 'react';
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
  onJoin: (name: string, code: string) => void;
}

export default function RoomJoinModal({
  isOpen,
  onOpenChange,
  scope,
  existingRooms,
  onJoin,
}: RoomJoinModalProps) {
  const { appearance } = useTheme();
  const [name, setName] = useState('');
  const [code, setCode] = useState('// Enter expression resolving to a Room ID or Name\n');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawName = e.target.value;
    setName(rawName);
    validate(rawName, code);
  };

  const handleEditorChange = (val: string | undefined) => {
    const rawCode = val || '';
    setCode(rawCode);
    validate(name, rawCode);
  };

  // Perform dynamic validation checks across name strings and code lines
  const validate = (currentName: string, currentCode: string) => {
    const trimmedName = currentName.trim();
    const trimmedCode = currentCode.trim();

    if (!trimmedName) {
      setValidationError("Watcher display name cannot be blank.");
      return false;
    }

    if (!trimmedCode) {
      setValidationError("ThingsDB execution code expression cannot be empty.");
      return false;
    }

    // Ensure the name identifier is unique (within scope)
    const isDuplicate = existingRooms.some(
      (room) => room.scope === scope && room.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setValidationError(`A watched room named "${trimmedName}" already exists on this scope.`);
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSave = (e: React.ChangeEvent) => {
    e.preventDefault();
    if (validate(name, code)) {
      onJoin(name.trim(), code);
      onOpenChange(false);
    }
  };

  const isValid = !validationError && name.trim().length > 0 && code.trim().length > 0;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 640, padding: '16px' }}>
        <Dialog.Title size="3" mb="1">Join Room</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Joining a room in <Text weight="bold" color="gray" highContrast>{scope}</Text> to listen for emit events.
        </Dialog.Description>
        <form onSubmit={handleSave}>
          <Flex direction="column" gap="3" mb="4">
            <Box>
              <Text as="label" size="2" weight="bold" color="gray" mb="1">
                Watcher name
              </Text>
              <TextField.Root
                placeholder='e.g., My Room'
                value={name}
                onChange={handleNameChange}
                size="2"
                maxLength={64}
                autoFocus
              />
              <Text size="1" color="gray" mt="1">
                A unique watcher name used by ThingsCode to handle or disconnect this room later.
              </Text>
            </Box>

            <Callout.Root color="iris" size="1">
              <Callout.Icon><InfoCircledIcon /></Callout.Icon>
              <Callout.Text size="1">
                The code block below is evaluated inside ThingsDB and <Text weight="bold">must return</Text> either a numeric <Text weight="bold">Room ID</Text> or a string <Text weight="bold">Room Name</Text> to successfully attach the listener hook.
                <Box mt="1" style={{ fontStyle: 'italic' }}>
                  • Expression template: <Text color="gray" highContrast style={{ fontFamily: 'monospace' }}>.rooms.myroom.id();</Text><br />
                  • Direct numeric fallback ID: <Text color="gray" highContrast style={{ fontFamily: 'monospace' }}>123;</Text><br />
                  • Named Room reference: <Text color="gray" highContrast style={{ fontFamily: 'monospace' }}>"myroom";</Text>
                </Box>
              </Callout.Text>
            </Callout.Root>

            <Box>
              <Text as="label" size="2" weight="bold" color="gray" mb="1">
                Code Expression
              </Text>
              <Box
                style={{
                  height: '180px',
                  border: '1px solid var(--gray-5)',
                  borderRadius: 'var(--radius-2)',
                  overflow: 'hidden',
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

            {validationError && (
              <Callout.Root color="orange" size="1">
                <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
                <Callout.Text>{validationError}</Callout.Text>
              </Callout.Root>
            )}
          </Flex>
          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button type="button" variant="soft" color="gray" size="2" style={{ cursor: 'pointer' }}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              type="submit"
              size="2"
              color="iris"
              disabled={!isValid}
              style={{ cursor: isValid ? 'pointer' : 'not-allowed' }}
            >
              Join
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}