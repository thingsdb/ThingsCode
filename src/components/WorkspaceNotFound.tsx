import { Box, Button, Flex, Heading, Text, Card } from '@radix-ui/themes';
import { ExclamationTriangleIcon, ArrowLeftIcon } from '@radix-ui/react-icons';

export default function WorkspaceNotFound() {

  const handleToLauncher = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--gray-2)'
      }}
      p="4"
    >
      <Card size="3" style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
        <Flex direction="column" align="center" gap="4" py="3">
          <Box
            style={{
              backgroundColor: 'var(--orange-3)',
              color: 'var(--orange-9)',
              borderRadius: '50%',
              padding: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ExclamationTriangleIcon width="32" height="32" />
          </Box>

          {/* Heading Details */}
          <Flex direction="column" gap="1">
            <Heading size="5" weight="bold" color="gray">
              Workspace Not Found
            </Heading>
            <Text size="2" color="gray" style={{ maxWidth: 340, margin: '0 auto' }}>
              The workspace you are trying to access does not exist or has expired.
            </Text>
          </Flex>

          <Button
            size="3"
            variant="surface"
            color="iris"
            onClick={handleToLauncher}
            style={{ cursor: 'pointer', marginTop: '8px' }}
          >
            <ArrowLeftIcon width="16" height="16" />
            Back to Workspace Launcher
          </Button>

        </Flex>
      </Card>
    </Flex>
  );
}