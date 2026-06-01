import { Callout, IconButton, Flex } from '@radix-ui/themes';
import { InfoCircledIcon, Cross1Icon } from '@radix-ui/react-icons';

interface NotificationToastProps {
  message: string | null;
  onClear: () => void;
}

export default function NotificationToast({ message, onClear }: NotificationToastProps) {
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
      <Callout.Root color="red" size="2" variant="surface">
        <Flex align="start" gap="3" justify="between" style={{ width: '100%' }}>

          {/* Left Side: Icon & Message Group */}
          <Flex align="start" gap="2" style={{ flexGrow: 1 }}>
            <Callout.Icon style={{ marginTop: '2px' }}>
              <InfoCircledIcon width="16" height="16" />
            </Callout.Icon>
            <Callout.Text size="2" weight="medium" style={{ paddingRight: '8px' }}>
              {message}
            </Callout.Text>
          </Flex>

          {/* Right Side: Close Button */}
          <IconButton
            size="1"
            variant="ghost"
            color="red"
            onClick={onClear}
            style={{
              cursor: 'pointer',
              marginTop: '-2px',
              marginRight: '-4px',
              borderRadius: '50%'
            }}
            title="Dismiss error message"
          >
            <Cross1Icon width="12" height="12" />
          </IconButton>

        </Flex>
      </Callout.Root>
    </div>
  );
}