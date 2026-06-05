import React, { useState, useEffect } from 'react';
import { Dialog, Flex, Button, Box, Text, TextField, Callout, Badge } from '@radix-ui/themes';
import Editor from '@monaco-editor/react';
import { InfoCircledIcon, ExclamationTriangleIcon, CodeIcon, LightningBoltIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { useTheme } from '../../hooks';
import type { Procedure, Room } from '../../types';

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
  if (procedure === null) {
    return null;
  }
  return (
    <Dialog.Root defaultOpen onOpenChange={onClose}>
      <Dialog.Content aria-describedby={undefined} style={{
          width: '60vw',
          maxWidth: '1024px',
          padding: '16px'
      }}>
        <Dialog.Title size="3" mb="1">
          <Flex align="center" justify="between">
            <Flex align="center" gap="2">
              <Badge size="2" color="iris" variant="surface" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {procedure.name}
              </Badge>
              <Text size="3" weight="bold">Details</Text>
            </Flex>
            {procedure.withSideEffects ? (
              <Badge color="orange" variant="surface" size="1" style={{ gap: '2px', padding: '0 5px', flexShrink: 0 }}>
                <LightningBoltIcon width="11" height="11" />
                <Text size="1" weight="medium" style={{ fontSize: '10px', letterSpacing: '0.03em' }}>WSE</Text>
              </Badge>
            ) : (
              <Badge color="gray" variant="outline" size="1" style={{ gap: '2px', padding: '0 5px', flexShrink: 0, borderColor: 'var(--gray-5)' }}>
                <EyeOpenIcon width="11" height="11" color="var(--gray-8)" />
                <Text size="1" weight="medium" style={{ fontSize: '10px', color: 'var(--gray-10)' }}>NSE</Text>
              </Badge>
            )}
          </Flex>
        </Dialog.Title>

        <Flex direction="column" gap="4" mb="4">
          {procedure.doc && (
            <Flex align="start" gap="2" mt="4">
              <InfoCircledIcon width="14" height="14" color="var(--iris-8)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <Text
                size="2"
                color="gray"
                truncate
                style={{ color: 'var(--gray-10)', fontStyle: 'italic'}}
              >
                {procedure.doc}
              </Text>
            </Flex>
          )}

          {procedure.definition ? (
            <Box>
              <Text as="label" size="1" weight="bold" color="gray">
                Code Expression (Read-Only)
              </Text>
              <Box
                style={{
                  height: '50vh',
                  border: '1px solid var(--gray-5)',
                  borderRadius: 'var(--radius-2)',
                  overflow: 'hidden',
                  opacity: 0.75
                }}
              >
                <Editor
                  theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
                  language="thingsdb"
                  path=".ticode-procedure.ti"
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
            </Box>
          ): (
            <Callout.Root color="orange" size="1">
              <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
              <Callout.Text>You cannot view this procedure because you lack "CHANGE" permissions on scope {scope}.</Callout.Text>
            </Callout.Root>
          )}

        </Flex>
        {/* FOOTER */}
        <Flex gap="3" justify="end">
          <Dialog.Close>
            <Button type="button" variant="soft" color="gray" size="2" style={{ cursor: 'pointer' }}>
              Close
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}