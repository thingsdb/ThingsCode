import { useMemo, useState } from 'react';
import { Dialog, Flex, Button, Box, Text, Tooltip, IconButton } from '@radix-ui/themes';
import Editor from '@monaco-editor/react';
import { CopyIcon, CheckIcon } from '@radix-ui/react-icons';
import { useTheme } from '../../hooks';
import type { EmitEvent } from '../../types';

interface EventArgsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventItem: EmitEvent | null;
}

export default function EventArgsModal({
  isOpen,
  onOpenChange,
  eventItem,
}: EventArgsModalProps) {
  const { appearance } = useTheme();
  const [copied, setCopied] = useState(false);

  const formattedJson = useMemo(() => {
    if (!eventItem || !eventItem.args) {
      return '[]';
    }
    return JSON.stringify(eventItem.args, null, 2);
  }, [eventItem]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy event arguments payload:', err);
    }
  };

  if (!eventItem) {
    return null;
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content
        style={{ maxWidth: 640, padding: '16px' }}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Flex justify="between" align="start" mb="1">
          <Box style={{ minWidth: 0, flexGrow: 1 }}>
            <Dialog.Title size="3" mb="0" style={{ display: 'inline-flex', alignItems: 'center' }}>
              Event Emit Arguments
            </Dialog.Title>
            <Dialog.Description size="2" color="gray" mt="1">
              Arguments list emitted by event: <Text weight="bold" color="iris" style={{ fontFamily: 'monospace' }}>"{eventItem.event}"</Text>
            </Dialog.Description>
          </Box>
        </Flex>

        <Box
          mt="3"
          mb="4"
          style={{
            height: '320px',
            border: '1px solid var(--gray-5)',
            borderRadius: 'var(--radius-2)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <Flex
            style={{
              position: 'absolute',
              top: '8px',
              right: '24px', // Clears the inner Monaco slider
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            <Tooltip content={copied ? "Copied!" : "Copy arguments JSON to clipboard"}>
              <IconButton
                size="1"
                variant="soft"
                color={copied ? "green" : "gray"}
                highContrast={!copied}
                onClick={handleCopyToClipboard}
                style={{
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-2)',
                  pointerEvents: 'auto'
                }}
              >
                {copied ? <CheckIcon width="14" height="14" /> : <CopyIcon width="13" height="13" />}
              </IconButton>
            </Tooltip>
          </Flex>

          <Editor
            height="100%"
            theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
            language="json"
            path={`ticode-eventargs-${eventItem.roomId}-${eventItem.event}.json`}
            value={formattedJson}
            options={{
              readOnly: true,
              domReadOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: 'on',
              tabSize: 2,
              automaticLayout: true,
              folding: true,
              wordWrap: 'on',
              scrollbar: { vertical: 'visible', horizontal: 'hidden' },
              contextmenu: true,
            }}
          />
        </Box>

        <Flex gap="3" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray" size="2" style={{ cursor: 'pointer' }}>
              Close
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}