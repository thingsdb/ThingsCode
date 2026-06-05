import { Box, Callout, Flex, Text, IconButton, Tooltip } from '@radix-ui/themes';
import { InfoCircledIcon, ExclamationTriangleIcon, CopyIcon, CheckIcon, ClockIcon } from '@radix-ui/react-icons';
import Editor from '@monaco-editor/react';
import { useActiveWorkspace, useTheme } from '../../hooks';
import { useMemo, useState } from 'react';
import type { Result } from '../../types';

const renderTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--red-11)',
            textDecoration: 'underline',
            fontWeight: '600',
            wordBreak: 'break-all',
          }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function StudioResultView() {
  const { appearance } = useTheme();
  const { activeFile, isExecuting } = useActiveWorkspace();
  const [copied, setCopied] = useState(false);

  const result = useMemo<Result | null>(() => {
    return activeFile?.result || null;
  }, [activeFile?.result]);

  const formattedJson = useMemo(() => {
    if (result?.data === undefined) {
      return '';
    }
    return JSON.stringify(result.data, null, 2);
  }, [result]);

  const localTime = useMemo(() => {
    if (!result?.ts) {
      return null;
    }
    try {
      const date = new Date(result.ts);
      return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return null;
    }
  }, [result]);

  const handleCopyToClipboard = async () => {
    if (!formattedJson) {
      return;
    }
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset icon after 2 seconds
    } catch (err) {
      console.error('Failed to copy json execution result payload:', err);
    }
  };

  if (result === null || (result.data === undefined && !result.error && !result.warning)) {
    return (
      <Flex align="center" justify="center" style={{ height: '100%' }}>
        {isExecuting ? (
          <Flex align="center" gap="3">
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 dark:border-gray-700"
              style={{ borderTopColor: 'var(--thingscode-blue)' }}
            />
            <Text size="1" className="text-gray-500 dark:text-gray-400 font-mono">
              Waiting for ThingsDB response...
            </Text>
          </Flex>
        ) : (
          <Text size="1" style={{ fontFamily: 'monospace', color: 'var(--gray-8)' }}>
            No code execution result available.
          </Text>
        )}
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="2" style={{ height: '100%', width: '100%' }}>
      {result.warning && (
        <Box p="1">
          <Callout.Root color="amber" size="1" style={{ padding: '6px 12px' }}>
            <Callout.Icon>
              <InfoCircledIcon width="14" height="14" />
            </Callout.Icon>
            <Callout.Text size="1" style={{ fontWeight: 500 }}>
              {result.warning}
            </Callout.Text>
          </Callout.Root>
        </Box>
      )}

      {result.error && (
        <Box p="1" style={{ flexGrow: 1 }}>
          <Callout.Root color="red" size="2" style={{ height: '100%', alignItems: 'flex-start' }}>
            <Callout.Icon style={{ marginTop: '2px' }}>
              <ExclamationTriangleIcon width="16" height="16" />
            </Callout.Icon>
            <Flex direction="column" gap="1">
              <Text size="2" weight="bold" style={{ lineHeight: 1.2 }}>
                Query Execution Fault
              </Text>
              <Text size="1" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {renderTextWithLinks(result.error)}
              </Text>
            </Flex>
          </Callout.Root>
        </Box>
      )}

      {result.data !== undefined && !result.error && (
        <Box
          style={{
            flexGrow: 1,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <Flex
            gap="2"
            align="center"
            style={{
              position: 'absolute',
              top: '8px',
              right: '24px',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            {localTime && (
              <Tooltip content={`Received at: ${result.ts}`}>
                <Flex
                  align="center"
                  gap="1"
                  px="2"
                  py="1"
                  style={{
                    backgroundColor: 'var(--gray-surface)',
                    border: '1px solid var(--gray-5)',
                    borderRadius: 'var(--radius-2)',
                    boxShadow: 'var(--shadow-1)',
                    pointerEvents: 'auto'
                  }}
                >
                  <ClockIcon width="12" height="12" color="var(--gray-9)" />
                  <Text size="1" weight="medium" style={{ fontFamily: 'monospace', color: 'var(--gray-11)' }}>
                    {localTime}
                  </Text>
                </Flex>
              </Tooltip>
            )}

            <Tooltip content={copied ? "Copied!" : "Copy JSON to clipboard"}>
              <IconButton
                size="1"
                variant="soft"
                color={copied ? "green" : "gray"}
                highContrast={!copied}
                onClick={handleCopyToClipboard}
                style={{
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-1)',
                  pointerEvents: 'auto'
                }}
              >
                {copied ? <CheckIcon width="14" height="14" /> : <CopyIcon width="13" height="13" />}
              </IconButton>
            </Tooltip>
          </Flex>

          <Editor
            language="json"
            path=".ticode-query-result.json"
            value={formattedJson}
            theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
            loading={null}
            options={{
              readOnly: true,
              domReadOnly: true,
              fontSize: 12,
              fontFamily: 'monospace',
              minimap: { enabled: false },
              automaticLayout: true,
              lineNumbers: 'on',
              scrollbar: { vertical: 'visible', horizontal: 'visible' },
              tabSize: 2,
            }}
          />
        </Box>
      )}
    </Flex>
  );
}