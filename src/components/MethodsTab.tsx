import { useState, useEffect, useMemo } from 'react';
import { Flex, Text, Box, Badge, TextField, IconButton } from '@radix-ui/themes';
import { InfoCircledIcon, LightningBoltIcon, EyeOpenIcon, CodeIcon, MagnifyingGlassIcon, Cross2Icon } from '@radix-ui/react-icons';
import Editor from '@monaco-editor/react';
import { useTheme } from '../hooks';
import type { Method } from '../types';

interface MethodsTabProps {
  methods: Record<string, Method> | undefined;
  fallbackText?: string;
  editorPathPrefix: string;  // enum or type
}

export default function MethodsTab({
  methods,
  fallbackText = "No custom methods defined on this type.",
  editorPathPrefix
}: MethodsTabProps) {
  const { appearance } = useTheme();
  const [selectedMethodName, setSelectedMethodName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sort methods
  const methodNames = useMemo(() => {
    return methods ? Object.keys(methods).sort() : [];
  }, [methods]);

  const filtered = useMemo(() => {
    const cleanedQuery = searchQuery.trim().toLowerCase();
    if (!cleanedQuery) {
      return methodNames;
    }

    return methodNames.filter((name) => {
      const nameMatch = name.toLowerCase().includes(cleanedQuery);

      return nameMatch;
    });
  }, [methodNames, searchQuery]);

  useEffect(() => {
    if (methodNames.length > 0) {
      const name = methodNames[0];
      queueMicrotask(() => { setSelectedMethodName(name); });
    } else {
      queueMicrotask(() => { setSelectedMethodName(null); });
    }
  }, [methodNames]);


  if (methodNames.length === 0) {
    return (
      <Flex align="center" justify="center" style={{ height: '100%' }}>
        <Text size="2" style={{ fontStyle: 'italic', color: 'var(--gray-8)' }}>
          {fallbackText}
        </Text>
      </Flex>
    );
  }

  const activeMethod: Method | undefined = methods?.[selectedMethodName ?? ''];

  return (
    <Flex gap="3" style={{ height: '100%', minHeight: 0 }}>
      <Flex direction="column" gap="2" style={{ height: '100%', minHeight: 0, width: '240px', flexShrink: 0 }}>
        {(methodNames.length > 0 || searchQuery) && (
          <TextField.Root
            placeholder="Search name..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); }}
            size="1"
            style={{ flexShrink: 0 }}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon height="14" width="14" />
            </TextField.Slot>
            {searchQuery && (
              <TextField.Slot style={{ paddingRight: '4px' }}>
                <IconButton
                  size="1"
                  variant="ghost"
                  color="gray"
                  onClick={() => { setSearchQuery(''); }}
                  style={{ cursor: 'pointer', height: '16px', width: '16px' }}
                >
                  <Cross2Icon height="12" width="12" />
                </IconButton>
              </TextField.Slot>
            )}
          </TextField.Root>
        )}
        <Flex
          direction="column"
          gap="1"
          style={{
            width: '100%',
            flexGrow: 1,
            minHeight: 0,
            overflowY: 'auto',
            border: '1px solid var(--gray-4)',
            borderRadius: 'var(--radius-3)',
            padding: '2px',
            backgroundColor: 'var(--gray-1)'
          }}
        >
          {methodNames.length > 0 && filtered.length === 0 && (
            <Box
              py="3"
              px="2"
              style={{
                textAlign: 'center',
                border: '1px dashed var(--gray-5)',
                borderRadius: 'var(--radius-2)'
              }}
            >
              <Text size="1" color="gray" >No matching methods match your query.</Text>
            </Box>
          )}
          {filtered.map((mName) => {
            const isSelected = mName === selectedMethodName;
            return (
              <Box
                key={mName}
                onClick={() => { setSelectedMethodName(mName); }}
                px="2"
                py="1"
                style={{
                  borderRadius: 'var(--radius-2)',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--iris-9)' : 'transparent',
                  transition: 'background-color 0.1s ease',
                }}
              >
                <Text
                  size="1"
                  weight={isSelected ? "bold" : "regular"}
                  style={{
                    color: isSelected ? '#fff' : 'var(--gray-12)',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}
                >
                  {mName}()
                </Text>
              </Box>
            );
          })}
        </Flex>
      </Flex>

      <Flex direction="column" style={{ flexGrow: 1, minHeight: 0, gap: '8px' }}>
        {activeMethod && selectedMethodName ? (
          <Flex direction="column" style={{ height: '100%', minHeight: 0 }} gap="2">
            <Flex align="center" justify="between" flexShrink="0">
              <Flex gap="2">

                <CodeIcon color="gray" />
                <Text size="1" weight="bold" style={{ fontFamily: 'monospace' }}>
                  {selectedMethodName}({activeMethod.arguments.join(', ') || ''})
                </Text>
              </Flex>

              {activeMethod.withSideEffects ? (
                <Badge color="orange" variant="surface" size="1" style={{ gap: '2px' }}>
                  <LightningBoltIcon width="10" height="10" />
                  <Text style={{ fontSize: '9px' }}>WSE</Text>
                </Badge>
              ) : (
                <Badge color="gray" variant="outline" size="1" style={{ gap: '2px', borderColor: 'var(--gray-4)' }}>
                  <EyeOpenIcon width="10" height="10" color="var(--gray-7)" />
                  <Text style={{ fontSize: '9px', color: 'var(--gray-9)' }}>NSE</Text>
                </Badge>
              )}
            </Flex>

            {/* Optional Docstring Container */}
            {activeMethod.doc && (
              <Flex align="start" gap="2" p="2" style={{ backgroundColor: 'var(--gray-2)', borderRadius: 'var(--radius-2)' }} flexShrink="0">
                <InfoCircledIcon width="14" height="14" color="var(--iris-8)" style={{ marginTop: '1px', flexShrink: 0 }} />
                <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
                  {activeMethod.doc}
                </Text>
              </Flex>
            )}

            {/* Monaco Editor */}
            <Box style={{ flexGrow: 1, border: '1px solid var(--gray-5)', borderRadius: 'var(--radius-2)', overflow: 'hidden' }}>
              <Editor
                theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
                language="thingsdb"
                path={`.ticode-${editorPathPrefix}-method-${selectedMethodName}.ti`}
                value={activeMethod.definition}
                options={{
                  readOnly: true,
                  domReadOnly: true,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  minimap: { enabled: false },
                  automaticLayout: true,
                  lineNumbers: 'on',
                  scrollbar: { vertical: 'visible', horizontal: 'visible' },
                  tabSize: 4,
                }}
              />
            </Box>
          </Flex>
        ) : (
          <Flex align="center" justify="center" style={{ height: '100%' }}>
            <Text size="1" color="gray">Select a method from the left column to view definition.</Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}