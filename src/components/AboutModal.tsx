import { Dialog, Flex, Heading, Text, Button, Badge } from '@radix-ui/themes';
import { GitHubLogoIcon, HeartIcon } from '@radix-ui/react-icons';
import { useTheme } from '../hooks';
import { version } from '../../package.json';

interface AboutModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AboutModal({ isOpen, onOpenChange }: AboutModalProps) {
  const { appearance } = useTheme();
  const appVersion = version || '1.0.2';

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content
        style={{ maxWidth: 440, padding: '24px', textAlign: 'center' }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Flex direction="column" align="center" gap="2" mb="4" mt="2">
          <img
            src={appearance === 'dark' ? '/images/logo_on_dark.svg' : '/images/logo_on_white.svg'}
            alt="ThingsDB Logo"
            style={{ width: 72, height: 72, objectFit: 'contain' }}
          />

          <Heading size="6" weight="bold" style={{ letterSpacing: '-0.5px' }}>
            <span style={{ color: 'var(--gray-12)' }}>Things</span>
            <span style={{ color: 'var(--thingscode-blue)' }}>Code</span>
          </Heading>

          <Badge color="gray" variant="surface" size="1" style={{ fontFamily: 'monospace' }}>
            v{appVersion}
          </Badge>
        </Flex>

        <hr style={{ border: 0, borderTop: '1px dashed var(--gray-4)', margin: '16px 0' }} />

        <Flex direction="column" gap="3" mb="5" px="2">
          <Text size="2" color="gray" style={{ lineHeight: '1.5' }}>
            ThingsCode (or <Text weight="bold" color="gray" highContrast>ticode</Text> for short) is the interactive development studio built for ThingsDB.
          </Text>

          <Flex
            direction="column"
            gap="2"
            p="3"
            align="center"
            style={{
              backgroundColor: 'var(--gray-2)',
              border: '1px dashed var(--gray-5)',
              borderRadius: 'var(--radius-3)'
            }}
          >
            <Flex align="center" gap="2">
              <HeartIcon color="var(--red-9)" width="14" height="14" />
              <Text size="2" weight="medium">Support the Project</Text>
            </Flex>
            <Text size="1" color="gray" style={{ textAlign: 'center', maxWidth: '320px' }}>
              If you like using ThingsCode, please give us a star on our official GitHub organization page!
            </Text>

            <Button size="1" color="gray" variant="classic" mt="1" asChild className="cursor-pointer">
              <a href="https://github.com/thingsdb" target="_blank" rel="noopener noreferrer" style={{ gap: '6px' }}>
                <GitHubLogoIcon width="13" height="13" />
                Star on GitHub
              </a>
            </Button>
          </Flex>
        </Flex>

        <Flex justify="center">
          <Dialog.Close>
            <Button variant="soft" color="gray" size="2" style={{ cursor: 'pointer', minWidth: 100 }}>
              Dismiss
            </Button>
          </Dialog.Close>
        </Flex>

      </Dialog.Content>
    </Dialog.Root>
  );
}