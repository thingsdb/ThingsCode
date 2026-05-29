import { useState } from 'react';
import { Dialog, Flex, Button, Box } from '@radix-ui/themes';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../hooks';

interface QueryVarsDialogProps {
  onOpenChange: (open: boolean) => void;
  configJson: string;
  onSave: (validJson: string) => void;
}

export default function QueryVarsDialog({
  onOpenChange,
  configJson,
  onSave,
}: QueryVarsDialogProps) {
  const { appearance } = useTheme();
  const [localJson, setLocalJson] = useState(configJson);
  const [isValid, setIsValid] = useState(true);

  const handleEditorChange = (val: string | undefined) => {
    const content = val || '';
    setLocalJson(content);

    // Quick inline validation check to disable the save button if the user types broken JSON
    try {
      JSON.parse(content);
      setIsValid(true);
    } catch {
      setIsValid(false);
    }
  };

  const handleSave = () => {
    if (isValid) {
      onSave(localJson);
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={true} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 700, padding: '16px' }}>
        <Dialog.Title size="3" mb="1">Execution Configuration</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="3">
          Provide runtime arguments as a valid JSON object.
        </Dialog.Description>

        <Box
          style={{
            height: '320px',
            border: '1px solid var(--gray-5)',
            borderRadius: 'var(--radius-2)',
            overflow: 'hidden',
          }}
          mb="4"
        >
          <Editor
            height="100%"
            theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
            language="json"
            path="ticode-execution-arguments.json"
            value={localJson}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: 'on',
              tabSize: 2,
              automaticLayout: true, // For rendering inside modals that animate open
              scrollbar: { vertical: 'visible', horizontal: 'hidden' },
            }}
          />
        </Box>

        <Flex gap="3" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray" size="2" style={{ cursor: 'pointer' }}>
              Cancel
            </Button>
          </Dialog.Close>

          <Button
            size="2"
            color="iris"
            disabled={!isValid}
            onClick={handleSave}
            style={{ cursor: isValid ? 'pointer' : 'not-allowed' }}
          >
            Save Configuration
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}