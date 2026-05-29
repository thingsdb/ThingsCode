import React, { useState, useEffect, useRef } from 'react';
import { Dialog, Flex, Button, TextField, Text, Box } from '@radix-ui/themes';
import { ExclamationTriangleIcon, Pencil1Icon } from '@radix-ui/react-icons';

interface CreateFileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  existingFiles: string[];
  onCreate: (filename: string) => void;
}

export default function CreateFileDialog({
  isOpen,
  onOpenChange,
  existingFiles,
  onCreate,
}: CreateFileDialogProps) {
  const [filename, setFilename] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('OPEN: ', isOpen);
    if (isOpen) {let n = 0;
      let fn = `Untitled-${n}.ti`;

      while (true) {
        const nameExists = existingFiles.some(
          (f) => f.toLowerCase() === fn.toLowerCase()
        );
        if (!nameExists) {
          break;
        }
        n++;
        fn = `Untitled-${n}.ti`;
      }
      setFilename(fn);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const dotIndex = fn.lastIndexOf('.');
          if (dotIndex > 0) {
            inputRef.current.setSelectionRange(0, dotIndex);
          } else {
            inputRef.current.select();
          }
        }
      }, 50);
    }
  }, [isOpen, existingFiles]);

  // Validation rules
  const trimmedName = filename.trim();
  const isDuplicate = existingFiles
    .filter((f) => f !== filename)
    .some((f) => f.toLowerCase() == trimmedName.toLowerCase());  // Case-insensitive for Windows?
  const isSameName = trimmedName === filename;
  const isEmpty = trimmedName === '';
  const isValid = !isEmpty && !isDuplicate && !isSameName;

  const handleSubmit = (e: React.ChangeEvent) => {
    e.preventDefault();
    if (isValid) {
      onCreate(filename);
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 400, padding: '20px' }}>
        <Dialog.Title size="3" mb="1">
          Create File
        </Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Enter a new file name:
        </Dialog.Description>

        <form onSubmit={handleSubmit}>
          <TextField.Root
            ref={inputRef}
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
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
              Create
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}