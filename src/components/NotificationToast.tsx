import React from 'react';
import { Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';

interface NotificationToastProps {
  message: string | null;
  onClear: () => void;
}

export default function NotificationToast({ message, onClear }: NotificationToastProps) {
  // Auto remove after X seconds
  React.useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClear();
    }, 7000);
    return () => clearTimeout(timer);
  }, [message, onClear]);

  if (!message) return null;

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-5 duration-300"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        maxWidth: 460,
        boxShadow: 'var(--shadow-4)',
      }}
    >
      {/* Leveraging Radix's native adaptive Callout element for feedback */}
      <Callout.Root color="red" size="2" variant="surface">
        <Callout.Icon>
          <InfoCircledIcon width="16" height="16" />
        </Callout.Icon>
        <Callout.Text size="2" weight="medium">
          {message}
        </Callout.Text>
      </Callout.Root>
    </div>
  );
}