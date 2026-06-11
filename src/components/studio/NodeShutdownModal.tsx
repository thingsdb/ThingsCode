import React, { useState } from 'react';
import { Dialog, Flex, Button, TextField, Code } from '@radix-ui/themes';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useActiveWorkspaceId, useError, useWebSocket } from '../../hooks';
import { errStr } from '../../utils';

interface NodeShutdownModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: number;
  scope: string;
}

export default function NodeShutdownModal({
  isOpen,
  onOpenChange,
  nodeId,
  scope,
}: NodeShutdownModalProps) {
  const activeId = useActiveWorkspaceId();
  const { emit } = useWebSocket();
  const { setErrorMessage } = useError();
  const [confirmInput, setConfirmInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expectedMatch = String(nodeId);
  const isMatch = confirmInput.trim() === expectedMatch;

  const handleShutdownExecute = async (e: React.ChangeEvent) => {
    e.preventDefault();
    if (!isMatch) return;

    setIsSubmitting(true);
    try {
      await emit('SHUTDOWN_NODE', {
        id: activeId,
        scope,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Shutdown failed:", err);
      const message = errStr(err, "Shutdown failed.");
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
      setConfirmInput('');
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 420 }}>
        <Dialog.Title color="red" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExclamationTriangleIcon width="20" height="20" /> Shutdown Node {nodeId}
        </Dialog.Title>

        <Dialog.Description size="2" mt="2" mb="4">
          You are about to power down this node. To confirm this action, please type the Node ID (<Code highContrast>{nodeId}</Code>) below:
        </Dialog.Description>

        <form onSubmit={handleShutdownExecute}>
          <TextField.Root
            placeholder={`Type ${nodeId} to confirm...`}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            size="2"
            mb="4"
            autoComplete="off"
          />

          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={isSubmitting} className="cursor-pointer">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              type="submit"
              variant="solid"
              color="red"
              disabled={!isMatch || isSubmitting}
              style={{ cursor: isMatch && !isSubmitting ? 'pointer' : 'not-allowed' }}
            >
              {isSubmitting ? 'Stopping Node...' : 'Confirm System Shutdown'}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}