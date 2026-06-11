import React, { useState, useRef } from 'react';
import { Dialog, Flex, Button, TextField, Text, Box } from '@radix-ui/themes';
import { ExclamationTriangleIcon, Pencil1Icon } from '@radix-ui/react-icons';

interface CreateFileDialogProps {
  onOpenChange: (open: boolean) => void;
  existingFiles: string[];
  onCreate: (filename: string) => void;
}

export default function CreateFileDialog({
  onOpenChange,
  existingFiles,
  onCreate,
}: CreateFileDialogProps) {
  const [filename, setFilename] = useState(() => {
    let n = 0;
    let fn = `Untitled-${n}.ti`;

    while (existingFiles.some((f) => f.toLowerCase() === fn.toLowerCase())) {
      n++;
      fn = `Untitled-${n}.ti`;
    }
    return fn;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const dotIndex = filename.lastIndexOf('.');

    if (dotIndex > 0) {
      // Selects only the file name prefix, leaving the extension ".ti" unselected
      inputEl.setSelectionRange(0, dotIndex);
    } else {
      inputEl.select();
    }
  };

  // Validation processing rules
  const trimmedName = filename.trim();
  const isDuplicate = existingFiles.some(
    (f) => f.toLowerCase() === trimmedName.toLowerCase()
  );
  const isEmpty = trimmedName === '';
  const isHidden = trimmedName.startsWith('.');
  const isValid = !isEmpty && !isDuplicate && !isHidden;

  const handleSubmit = (e: React.ChangeEvent) => {
    e.preventDefault();
    if (isValid) {
      onCreate(trimmedName);
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={true} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 400, padding: '20px' }}>
        <Dialog.Title size="3" mb="1">
          Create File
        </Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Enter a new file name:
        </Dialog.Description>

        <div ref={containerRef}>
          <form onSubmit={handleSubmit}>
            <TextField.Root
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="filename.ti"
              size="2"
              mb="4"
              autoFocus
              onFocus={handleInputFocus}
            >
              <TextField.Slot>
                <Pencil1Icon height="14" width="14" />
              </TextField.Slot>
            </TextField.Root>

            {isDuplicate && (
              <Box mb="4">
                <Flex gap="1" align="center" style={{ color: 'var(--amber-9)' }}>
                  <ExclamationTriangleIcon width="14" height="14" />
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
                Create
              </Button>
            </Flex>
          </form>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}