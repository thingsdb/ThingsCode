import React, { useState, useEffect, useRef } from 'react';
import { Dialog, Flex, Button, TextField, Text } from '@radix-ui/themes';
import { Pencil1Icon } from '@radix-ui/react-icons';

interface RenameFileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filename: string;
  onRename: (oldName: string, newName: string) => void;
}

export default function RenameFileDialog({
  isOpen,
  onOpenChange,
  filename,
  onRename,
}: RenameFileDialogProps) {
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNewName(filename);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const dotIndex = filename.lastIndexOf('.');
          if (dotIndex > 0) {
            inputRef.current.setSelectionRange(0, dotIndex);
          } else {
            inputRef.current.select();
          }
        }
      }, 50);
    }
  }, [isOpen, filename]);

  // Validation rules
  const trimmedName = newName.trim();
  const isValid = trimmedName !== '' && trimmedName !== filename;

  const handleSubmit = (e: React.ChangeEvent) => {
    e.preventDefault();
    if (isValid) {
      onRename(filename, trimmedName);
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 400, padding: '20px' }}>
        <Dialog.Title size="3" mb="1">
          Rename File
        </Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Enter a new name for <Text weight="bold" color="gray">{filename}</Text>:
        </Dialog.Description>

        <form onSubmit={handleSubmit}>
          <TextField.Root
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="filename.ti"
            size="2"
            mb="4"
          >
            <TextField.Slot>
              <Pencil1Icon height="14" width="14" />
            </TextField.Slot>
          </TextField.Root>

          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" size="2" style={{ cursor: 'pointer' }}>
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
              Rename
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}