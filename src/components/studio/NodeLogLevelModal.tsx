import React, { useState } from 'react';
import { Dialog, Flex, Button, Text, Select } from '@radix-ui/themes';
import { useActiveWorkspaceId, useError, useWebSocket } from '../../hooks';
import { errStr } from '../../utils';

interface NodeLogLevelModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  scope: string;
  currentNodeLogLevel: string;
}

const LOG_LEVELS = [
  { name: 'DEBUG (0)', value: 'DEBUG', level: 0 },
  { name: 'INFO (1)', value: 'INFO', level: 1 },
  { name: 'WARNING (2)', value: 'WARNING', level: 2 },
  { name: 'ERROR (3)', value: 'ERROR', level: 3 },
  { name: 'CRITICAL (4)', value: 'CRITICAL', level: 4 },
];

export default function NodeLogLevelModal({
  isOpen,
  onOpenChange,
  scope,
  currentNodeLogLevel,
}: NodeLogLevelModalProps) {
  const activeId = useActiveWorkspaceId();
  const { emit } = useWebSocket();
  const { setErrorMessage } = useError();
  const [selectedLevel, setSelectedLevel] = useState<string>(currentNodeLogLevel);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogLevelSubmit = async (e: React.ChangeEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const target = LOG_LEVELS.find((l) => l.value === selectedLevel);
      await emit('SET_NODE_LOG_LEVEL', {
        id: activeId,
        scope,
        logLevel: target ? target.level : 2,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Failed to update node log level:", err);
      const message = errStr(err, "Failed to update node log level.");
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 400, width: '100%' }}>
        <Dialog.Title>Log Level</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Select log verbosity for <Text weight="bold" color="gray" highContrast>{scope}</Text>
        </Dialog.Description>

        <form onSubmit={handleLogLevelSubmit}>
          <Flex direction="column" gap="3" mb="4">
            <Select.Root value={selectedLevel} onValueChange={setSelectedLevel} size="2">
              <Select.Trigger style={{ width: '100%', cursor: 'pointer' }} />
              <Select.Content>
                {LOG_LEVELS.map((level) => (
                  <Select.Item key={level.value} value={level.value} className="cursor-pointer">
                    {level.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={isSubmitting} className="cursor-pointer">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              type="submit"
              variant="solid"
              color="iris"
              disabled={isSubmitting}
              style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}