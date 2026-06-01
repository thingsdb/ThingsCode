import { Flex, Heading, Text, Button, Box } from '@radix-ui/themes';
import { FileIcon, PlusIcon } from '@radix-ui/react-icons';
import { useActiveWorkspace } from '../../hooks';

interface NoActiveFileProps {
  onCreateFile: () => void;
}

export default function NoActiveFile({ onCreateFile }: NoActiveFileProps) {
  const { loading } = useActiveWorkspace();
  return (
    <Flex
      align="center"
      justify="center"
      direction="column"
      style={{
        height: '100%',
        width: '100%',
        backgroundColor: 'var(--gray-2)', // Slightly different from code surface to indicate empty zone
        backgroundImage: 'radial-gradient(var(--gray-4) 1px, transparent 1px)', // Soft grid background
        backgroundSize: '20px 20px',
        userSelect: 'none',
      }}
    >
      <Box
        p="6"
        style={{
          maxWidth: '400px',
          textAlign: 'center',
          backgroundColor: 'var(--gray-surface)',
          border: '1px solid var(--gray-4)',
          borderRadius: 'var(--radius-3)',
          boxShadow: 'var(--shadow-2)',
        }}
      >
        {/* Subtle Floating Icon Container */}
        <Flex
          align="center"
          justify="center"
          mx="auto"
          mb="4"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-3)',
            backgroundColor: 'var(--iris-a3)',
            color: 'var(--iris-11)',
          }}
        >
          <FileIcon width="24" height="24" />
        </Flex>

        {/* Messaging Hierarchy */}
        <Heading size="3" mb="1" weight="bold" color="gray">
          No File Open
        </Heading>
        <Text size="2" color="gray" as="p" mb="4">
          Select an existing script from the workspace explorer sidebar, or initialize a clean script file below to begin writing ThingsDB queries.
        </Text>

        {/* Quick Action Button */}
        <Button
          size="2"
          variant="solid"
          color="iris"
          onClick={onCreateFile}
          disabled={loading}
          style={{ cursor: 'pointer', margin: '0 auto' }}
        >
          <PlusIcon width="14" height="14" />
          Create New File
        </Button>
      </Box>
    </Flex>
  );
}