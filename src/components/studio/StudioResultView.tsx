import { Box, Callout, Flex, Text } from '@radix-ui/themes';
import { InfoCircledIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import Editor from '@monaco-editor/react';
import { useActiveWorkspace, useTheme } from '../../hooks';
import { useMemo } from 'react';

export interface Result {
  data: unknown | null;
  error: string | null;
  warning: string | null;
}

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

  const result = useMemo<Result | null>(() => {
    return activeFile?.result || null;
  }, [activeFile?.result]);

  const formattedJson = useMemo(() => {
    if (result?.data === null) return '';

    return JSON.stringify(result?.data, null, 2);
  }, [result?.data]);

  if (result === null || (result.data === null && !result.error && !result.warning)) {
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

  console.log('RESULT RENDER');

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

      {result.data !== null && !result.error && (
        <Box
          style={{
            flexGrow: 1,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <Editor
            height="100%"
            language="json"
            path="ticode-query-result.json" // Unique namespace token
            value={formattedJson}
            theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
            loading={null}
            options={{
              readOnly: true,
              domReadOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              fontFamily: 'monospace',
              lineNumbers: 'on',
              automaticLayout: true,
              folding: true,
              wordWrap: 'on',
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible'
              },
              contextmenu: true,  // Allows users to right-click copy
            }}
          />
        </Box>
      )}
    </Flex>
  );
}