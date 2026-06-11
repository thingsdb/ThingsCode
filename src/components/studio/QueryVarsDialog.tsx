import { useState } from 'react';
import { Dialog, Flex, Button, Box, Code } from '@radix-ui/themes';
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
        <Dialog.Title size="3" mb="1">Runtime Arguments</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="3">
          Configure runtime arguments for this specific file. Provide a valid JSON object where keys map to variable names; for example, <Code highContrast>{'{"limit": 10}'}</Code>)  registers '<Code highContrast>limit</Code>' as an accessible variable inside your code.
        </Dialog.Description>

        <Box
          mb="4"
          style={{
            height: '320px',
            border: '1px solid var(--gray-5)',
            borderRadius: 'var(--radius-2)',
            overflow: 'hidden',
          }}
        >
          <Editor
            language="json"
            path=".ticode-execution-arguments.json"
            value={localJson}
            onChange={handleEditorChange}
            theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
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

        <Flex gap="3" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray" size="2" className="cursor-pointer">
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
            Save
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}