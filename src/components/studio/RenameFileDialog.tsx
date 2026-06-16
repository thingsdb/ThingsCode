import React, { useState, useEffect, useRef } from 'react';
import { Dialog, Flex, Button, TextField, Text, Box } from '@radix-ui/themes';
import { ExclamationTriangleIcon, Pencil1Icon } from '@radix-ui/react-icons';

interface RenameFileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filename: string;
  existingFiles: string[];
  onRename: (oldName: string, newName: string) => void;
}

export default function RenameFileDialog({
  onOpenChange,
  filename,
  existingFiles,
  onRename,
}: RenameFileDialogProps) {
  const [newName, setNewName] = useState(filename);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
  }, [filename]);

  // Validation rules
  const trimmedName = newName.trim();
  const isDuplicate = existingFiles
    .filter((f) => f !== filename)
    .some((f) => f.toLowerCase() == trimmedName.toLowerCase());  // Case-insensitive for Windows?
  const isSameName = trimmedName === filename;
  const isEmpty = trimmedName === '';
  const isHidden = trimmedName.startsWith('.');
  const isValid = !isEmpty && !isDuplicate && !isSameName && !isHidden;

  const handleSubmit = (e: React.ChangeEvent) => {
    e.preventDefault();
    if (isValid) {
      onRename(filename, trimmedName);
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
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
            onChange={(e) => { setNewName(e.target.value); }}
            placeholder="filename.ti"
            size="2"
            mb="4"
          >
            <TextField.Slot>
              <Pencil1Icon height="14" width="14" />
            </TextField.Slot>
          </TextField.Root>

          {isDuplicate && (
            <Box mb="4">
              <Flex gap="1" align="center" className="text-amber-600 dark:text-amber-400">
                <ExclamationTriangleIcon width="12" height="12" />
                <Text size="1" weight="medium">
                  A file named "{trimmedName}" already exists in this workspace.
                </Text>
              </Flex>
            </Box>
          )}

          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" size="2" className="cursor-pointer">
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