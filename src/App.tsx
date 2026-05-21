import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import {
  Flex,
  Box,
  Container,
  Heading,
  Text,
  Button,
  Card,
  Badge,
  Code
} from '@radix-ui/themes';
import { CrossCircledIcon, CheckCircledIcon, UpdateIcon, RocketIcon } from '@radix-ui/react-icons';

interface IfacePing {
  message: string;
}

const App = () => {
  const { status, emit } = useWebSocket();
  const [serverResponse, setServerResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handlePing = async () => {
    setLoading(true);
    try {
      const data = await emit<IfacePing>('SEND_PING', { clientTime: new Date().toLocaleTimeString() });
      setServerResponse(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerResponse(`Error: ${err.message}`);
      } else {
        // Fallback fallback if something weird was thrown (like a raw string)
        setServerResponse(`An unexpected error occurred: ${String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to return a clean Radix status Badge with an integrated icon
  const renderStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <Badge color="green" size="2" variant="surface">
            <CheckCircledIcon /> Connected
          </Badge>
        );
      case 'connecting':
        return (
          <Badge color="yellow" size="2" variant="surface">
            <UpdateIcon className="animate-spin" /> Connecting
          </Badge>
        );
      default:
        return (
          <Badge color="red" size="2" variant="surface">
            <CrossCircledIcon /> Disconnected
          </Badge>
        );
    }
  };

  return (
    <Container size="1" p="5" mt="9">
      <Card size="3">
        <Flex direction="column" gap="4">

          {/* Header row containing title and our active connection badge */}
          <Flex justify="between" align="center" style={{ borderBottom: '1px solid var(--gray-5)' }} pb="3">
            <Heading size="4" weight="bold">Rsbuild Workspace</Heading>
            {renderStatusBadge()}
          </Flex>

          {/* Action Trigger Button */}
          <Box>
            <Button
              size="2"
              variant="solid"
              onClick={handlePing}
              disabled={status !== 'connected' || loading}
              style={{ width: '100%' }}
            >
              <RocketIcon /> {loading ? 'Emitting...' : 'Emit "SEND_PING" Event'}
            </Button>
          </Box>

          {/* Conditional Response Render using Radix Code Block styling */}
          {serverResponse && (
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">Latest Backend Server Response:</Text>
              <Card variant="surface" style={{ backgroundColor: 'var(--gray-2)' }}>
                <Box p="2">
                  <Code variant="ghost" size="2" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {serverResponse}
                  </Code>
                </Box>
              </Card>
            </Flex>
          )}

        </Flex>
      </Card>
    </Container>
  );
};

export default App;