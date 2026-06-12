import React, { useState } from 'react';
import { Dialog, Flex, Button, Box, Text, TextField, Badge } from '@radix-ui/themes';
import { CubeIcon, ArrowRightIcon, ShadowIcon } from '@radix-ui/react-icons';
import ThingExplorer from './ThingExplorer';
import { HashIcon } from './icons';

interface ThingExplorerModalProps {
  onClose: (open: boolean) => void;
  scope: string;
}

export default function ThingExplorerModal({ onClose, scope }: ThingExplorerModalProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [activeThingId, setActiveThingId] = useState<number | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const handleLaunchExplorer = (e: React.ChangeEvent) => {
    e.preventDefault();
    setInputError(null);

    const parsedId = parseInt(inputValue.trim() || '1', 10);

    // Validate that the input is a valid non-negative integer
    if (isNaN(parsedId) || parsedId < 0) {
      setInputError('Please input a valid Thing ID.');
      return;
    }

    setActiveThingId(parsedId);
  };

  const handleReset = () => {
    setActiveThingId(null);
    setInputValue('');
    setInputError(null);
  };

  // Dynamically size the container based on whether the explorer is loaded or not
  const isExplorerActive = activeThingId !== null;

  return (
    <Dialog.Root defaultOpen onOpenChange={onClose}>
      <Dialog.Content
        aria-describedby={undefined}
        style={{
          // Smooth resizing
          width: isExplorerActive ? '60vw' : '400px',
          maxWidth: '1024px',
          padding: '16px',
          transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh'
        }}
      >
        {/* HEADER */}
        <Box mb="3" style={{ flexShrink: 0 }}>
          <Dialog.Title size="3" style={{ margin: 0 }}>
            <Flex align="center" justify="between">
              <Flex align="center" gap="2">
                <CubeIcon color="var(--iris-9)" width="18" height="18" />
                <Text size="3" weight="bold" color="gray">Thing Explorer</Text>
              </Flex>
              <Badge color="gray" variant="surface" size="1" style={{ fontFamily: 'monospace' }}>
                {scope}
              </Badge>
            </Flex>
          </Dialog.Title>
        </Box>

        {/* PROMPT THING ID */}
        {!isExplorerActive ? (
          <form onSubmit={handleLaunchExplorer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Text size="2" color="gray">
              Enter a Thing ID to inspect.
            </Text>

            <Flex direction="column" gap="1">
              <TextField.Root
                placeholder="e.g. 42 or empty for root"
                size="2"
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); }}
                autoFocus
              >
                <TextField.Slot>
                  <HashIcon height="16" width="16" />
                </TextField.Slot>
              </TextField.Root>

              {inputError && (
                <Text size="1" color="red" style={{ fontStyle: 'italic' }}>
                  {inputError}
                </Text>
              )}
            </Flex>

            <Flex gap="3" justify="end" mt="2">
              <Dialog.Close>
                <Button type="button" variant="soft" color="gray" size="2" className="cursor-pointer">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" variant="solid" color="iris" size="2" className="cursor-pointer">
                Explore <ArrowRightIcon width="14" height="14" />
              </Button>
            </Flex>
          </form>
        ) : (

          /* EXPLORER */
          <Flex direction="column" style={{ flexGrow: 1, minHeight: 0 }} gap="3">
            <Box style={{ flexGrow: 1, minHeight: 0, overflowY: 'auto' }}>
              <ThingExplorer
                scope={scope}
                startThingId={activeThingId}
              />
            </Box>

            {/* FOOTER */}
            <Flex gap="3" justify="between"style={{ flexShrink: 0, borderTop: '1px solid var(--gray-4)', paddingTop: '12px' }}>
              <Button type="button" variant="ghost" color="gray" size="2" onClick={handleReset} className="cursor-pointer">
                <ShadowIcon width="14" height="14" /> Inspect another Thing ID
              </Button>
              <Dialog.Close>
                <Button type="button" variant="soft" color="gray" size="2" className="cursor-pointer">
                  Close
                </Button>
              </Dialog.Close>
            </Flex>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}