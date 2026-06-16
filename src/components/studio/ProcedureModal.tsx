import { useState, useEffect } from 'react';
import { Dialog, Flex, Button, Box, Text, Callout, Badge, Tabs } from '@radix-ui/themes';
import Editor from '@monaco-editor/react';
import { InfoCircledIcon, ExclamationTriangleIcon, LightningBoltIcon, EyeOpenIcon, PlayIcon } from '@radix-ui/react-icons';
import { useTheme, useWebSocket, useActiveWorkspaceId } from '../../hooks';
import type { Procedure, Result } from '../../types';
import { parse } from 'lossless-json';
import { errStr, renderTextWithLinks } from '../../utils';

interface ProcedureModalProps {
  onClose: (open: boolean) => void;
  scope: string;
  procedure: Procedure;
}

export default function ProcedureModal({
  onClose,
  scope,
  procedure,
}: ProcedureModalProps) {
  const { appearance } = useTheme();
  const { emit } = useWebSocket();
  const activeId = useActiveWorkspaceId();

  const [activeTab, setActiveTab] = useState<string>('definition');
  const [jsonArgs, setJsonArgs] = useState<string>('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<Result | null>(null);

  useEffect(() => {
    const initialArgs: Record<string, null> = {};
    procedure.arguments.forEach((argName) => {
      initialArgs[argName] = null;
    });
    queueMicrotask(() => {
      setJsonArgs(JSON.stringify(initialArgs, null, 2));
      setJsonError(null);
      setExecutionResult(null);
      setActiveTab('definition');
    });
  }, [procedure]);

  const handleJsonChange = (val: string | undefined) => {
    if (val === undefined) {
      return;
    }
    setJsonArgs(val);
    if (!val.trim()) {
      setJsonError(null);
      return;
    }
    try {
      const parsed: unknown = JSON.parse(val);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setJsonError('Root element must be a valid JSON Object { ... }');
      } else {
        setJsonError(null);
      }
    } catch (err: unknown) {
      setJsonError(errStr(err, "Failed to parse as JSON."));
    }
  };

  const handleExecuteProcedure = async () => {
    let parsedArgs: unknown;
    try {
      parsedArgs = parse(jsonArgs);
    } catch {
      setJsonError('Cannot execute: Invalid JSON syntax.');
      return;
    }

    setIsRunning(true);
    setExecutionResult(null);

    try {
      const result: Result = await emit('RUN_PROCEDURE', {
        id: activeId,
        scope,
        name: procedure.name,
        args: parsedArgs
      }, true);

      setExecutionResult(result);
    } catch (err: unknown) {
      setExecutionResult({
        error: errStr(err, "An unknown network error occurred during procedure execution."),
        ts: Date.now(),
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Dialog.Root defaultOpen onOpenChange={onClose}>
      <Dialog.Content aria-describedby={undefined} style={{
        width: '60vw',
        maxWidth: '1024px',
        padding: '16px',
      }}>
        <Box flexShrink="0" mb="2">
          <Dialog.Title size="3" style={{ margin: 0 }}>
            <Flex align="center" justify="between">
              <Flex align="center" gap="2">
                <Badge size="2" color="iris" variant="surface" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}>
                  {procedure.name}
                </Badge>
                <Text size="3" weight="bold" color="gray">Procedure Details</Text>
              </Flex>
              {procedure.withSideEffects ? (
                <Badge color="orange" variant="surface" size="2" style={{ gap: '4px', padding: '0 5px', flexShrink: 0 }}>
                  <LightningBoltIcon width="12" height="12" />
                  <Text size="2" weight="medium" style={{ fontSize: '10px', letterSpacing: '0.03em' }}>WSE</Text>
                </Badge>
              ) : (
                <Badge color="gray" variant="outline" size="2" style={{ gap: '4px', padding: '0 5px', flexShrink: 0, borderColor: 'var(--gray-5)' }}>
                  <EyeOpenIcon width="12" height="12" color="var(--gray-8)" />
                  <Text size="2" weight="medium" style={{ fontSize: '10px', color: 'var(--gray-10)' }}>NSE</Text>
                </Badge>
              )}
            </Flex>
          </Dialog.Title>

          {procedure.doc && (
            <Flex align="start" gap="2" mt="2">
              <InfoCircledIcon width="14" height="14" color="var(--iris-8)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <Text size="2" color="gray" style={{ color: 'var(--gray-10)', fontStyle: 'italic' }}>
                {procedure.doc}
              </Text>
            </Flex>
          )}
        </Box>

        <Tabs.Root value={activeTab} onValueChange={setActiveTab} style={{
          height: '50vh',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          minHeight: 0
        }}>
          <Tabs.List size="2">
            <Tabs.Trigger value="definition" className="cursor-pointer">
              Definition
            </Tabs.Trigger>
            <Tabs.Trigger value="execute" className="cursor-pointer">
              Execute
            </Tabs.Trigger>
          </Tabs.List>

          <Box pt="2" style={{ flexGrow: 1, minHeight: 0 }}>

            {/* CODE VIEW */}
            <Tabs.Content value="definition" style={{ height: '100%' }}>
              {procedure.definition ? (
                <Box
                  style={{
                    height: '100%',
                    border: '1px solid var(--gray-5)',
                    borderRadius: 'var(--radius-2)',
                    overflow: 'hidden',
                  }}
                >
                  <Editor
                    theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
                    language="thingsdb"
                    path=".ticode-procedure-code.ti"
                    value={procedure.definition}
                    options={{
                      readOnly: true,
                      domReadOnly: true,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      minimap: { enabled: false },
                      automaticLayout: true,
                      lineNumbers: 'off',
                      scrollbar: { vertical: 'visible', horizontal: 'visible' },
                      tabSize: 4,
                    }}
                  />
                </Box>
              ) : (
                <Callout.Root color="orange" size="1">
                  <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
                  <Callout.Text>You cannot view this procedure because you lack "CHANGE" permissions on scope {scope}.</Callout.Text>
                </Callout.Root>
              )}
            </Tabs.Content>

            <Tabs.Content value="execute" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* ARGUMENTS & EDITOR */}
              <Flex direction="column" gap="1" flexShrink="0">
                <Flex justify="between" align="center">
                  <Text size="1" weight="bold" color="gray">Arguments parameters (JSON Object)</Text>
                  {jsonError ? (
                    <Badge color="red" variant="soft" size="1">Syntax Error</Badge>
                  ) : (
                    <Badge color="green" variant="outline" size="1">Valid JSON</Badge>
                  )}
                </Flex>

                <Box style={{ height: '140px', border: '1px solid var(--gray-5)', borderRadius: 'var(--radius-3)', overflow: 'hidden' }}>
                  <Editor
                    theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
                    language="json"
                    path=".ticode-procedure-args.json"
                    value={jsonArgs}
                    onChange={handleJsonChange}
                    options={{
                      fontSize: 12,
                      fontFamily: 'monospace',
                      minimap: { enabled: false },
                      automaticLayout: true,
                      lineNumbers: 'off',
                      scrollbar: { vertical: 'visible', horizontal: 'visible' },
                      tabSize: 2,
                    }}
                  />
                </Box>

                {jsonError && (
                  <Text size="1" color="red" style={{ fontStyle: 'italic', wordBreak: 'break-all' }}>
                    {jsonError}
                  </Text>
                )}
              </Flex>

              {/* COMPACT TRIGGER RUN */}
              <Flex justify="start" flexShrink="0">
                <Button
                  size="1"
                  color={procedure.withSideEffects ? "orange" : "green"}
                  variant="solid"
                  loading={isRunning}
                  disabled={jsonError !== null}
                  onClick={() => { void handleExecuteProcedure(); }}
                  style={{ cursor: jsonError ? 'not-allowed' : 'pointer' }}
                >
                  <PlayIcon width="14" height="14" />
                  Run
                </Button>
              </Flex>

              {/* RESPONSE */}
              <Flex direction="column" style={{ flexGrow: 1, minHeight: 0 }}>
                <Text size="1" weight="bold" color="gray" mb="1">Response</Text>

                <Box
                  style={{
                    flexGrow: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid var(--gray-5)',
                    borderRadius: 'var(--radius-3)',
                    padding: '2px'
                  }}
                >
                  {!executionResult && !isRunning && (
                    <Flex justify="center" align="center" style={{ height: '100%' }}>
                      <Text size="1" style={{ fontFamily: 'monospace', color: 'var(--gray-8)' }}>
                        No procedure execution result available.
                      </Text>
                    </Flex>
                  )}

                  {isRunning && (
                    <Flex justify="center" align="center" style={{ height: '100%' }}>
                      <Text size="1" color="iris" className="animate-pulse">
                        Waiting for response...
                      </Text>
                    </Flex>
                  )}

                  {executionResult && (
                    <Flex direction="column" gap="2" style={{ height: '100%', minHeight: 0 }}>

                      {executionResult.error && (
                        <Callout.Root color="red" size="1" style={{ flexShrink: 0 }}>
                          <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
                          <Callout.Text style={{ wordBreak: 'break-word' }}>{renderTextWithLinks(executionResult.error)}</Callout.Text>
                        </Callout.Root>
                      )}

                      {executionResult.warning && (
                        <Callout.Root color="amber" size="1" style={{ flexShrink: 0 }}>
                          <Callout.Icon><InfoCircledIcon /></Callout.Icon>
                          <Callout.Text style={{ wordBreak: 'break-word' }}>{executionResult.warning}</Callout.Text>
                        </Callout.Root>
                      )}

                      {executionResult.data !== undefined && !executionResult.error && (
                        <Box style={{
                          flexGrow: 1,
                          minHeight: 0,
                          overflow: 'hidden'
                        }}>
                          <Editor
                            theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
                            language="json"
                            path=".ticode-procedure-result.json"
                            value={JSON.stringify(executionResult.data, null, 2)}
                            options={{
                              readOnly: true,
                              domReadOnly: true,
                              fontSize: 12,
                              fontFamily: 'monospace',
                              minimap: { enabled: false },
                              automaticLayout: true,
                              lineNumbers: 'off',
                              scrollbar: { vertical: 'visible', horizontal: 'visible' },
                              tabSize: 2,
                            }}
                          />
                        </Box>
                      )}
                    </Flex>
                  )}
                </Box>
              </Flex>
            </Tabs.Content>
          </Box>
        </Tabs.Root>

        <Flex gap="3" justify="end" flexShrink="0" style={{ paddingTop: '12px', marginTop: '12px' }}>
          <Dialog.Close>
            <Button type="button" variant="soft" color="gray" size="2" className="cursor-pointer">
              Close
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}