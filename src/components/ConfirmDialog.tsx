import { AlertDialog, Button, Flex } from '@radix-ui/themes';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  colorVariant?: 'red' | 'blue' | 'orange';
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  colorVariant = 'red',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Content style={{ maxWidth: 400 }}>
        <AlertDialog.Title>{title}</AlertDialog.Title>
        <AlertDialog.Description size="2" mb="4">
          {description}
        </AlertDialog.Description>

        <Flex gap="3" justify="end">
          {/* Cancel Trigger Box */}
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray" style={{ cursor: 'pointer' }}>
              {cancelText}
            </Button>
          </AlertDialog.Cancel>

          {/* Action Execution Trigger Box */}
          <AlertDialog.Action>
            <Button
              variant="solid"
              color={colorVariant}
              onClick={onConfirm}
              style={{ cursor: 'pointer' }}
            >
              {confirmText}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}