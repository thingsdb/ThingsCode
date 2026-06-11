import { useEffect, useState } from 'react';
import { Flex, Heading, Text } from '@radix-ui/themes';
import { UpdateIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { useWebSocket } from '../hooks';

export default function ConnectionOverlay() {
  const { status } = useWebSocket();
  const [showOverlay, setShowOverlay] = useState(() => status !== 'connected');
  const [prevStatus, setPrevStatus] = useState(status);

  if (status !== prevStatus) {
    setPrevStatus(status);
    if (status !== 'connected') {
      setShowOverlay(true);
    }
  }

  useEffect(() => {
    if (status !== 'connected') return;
    const timer = setTimeout(() => {
      setShowOverlay(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [status]);

  if (!showOverlay) return null;

  return (
    <Flex
      align="center"
      justify="center"
      direction="column"
      gap="4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: 'rgba(2, 9, 23, 0.82)',
        backdropFilter: 'blur(8px)',
        transition: 'opacity 0.3s ease, backdrop-filter 0.3s ease',
      }}
    >
      <Flex
        direction="column"
        align="center"
        gap="3"
        p="6"
        style={{
          backgroundColor: 'var(--gray-2)',
          borderRadius: 'var(--radius-4)',
          border: '1px solid var(--gray-4)',
          boxShadow: 'var(--shadow-5)',
          maxWidth: 360,
          textAlign: 'center'
        }}
      >
        {status === 'connecting' || status === 'connected' ? (
          <>
            <UpdateIcon
              className="animate-spin"
              style={{ width: 32, height: 32, color: 'var(--thingscode-blue)' }} />
            <Heading size="4" mt="2">Initializing connection</Heading>
            <Text size="2" color="gray">
              Trying to connect to ThingsCode...
            </Text>
          </>
        ) : (
          <>
            <CrossCircledIcon style={{ width: 32, height: 32, color: 'var(--red-9)' }} />
            <Heading size="4" mt="2">Connection Interrupted</Heading>
            <Text size="2" color="gray">
              Disconnected from ThingsCode. Retrying connection loop automatically...
            </Text>
          </>
        )}
      </Flex>
    </Flex>
  );
}