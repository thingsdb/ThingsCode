import { Flex, Box, Text, Button, ScrollArea, IconButton } from '@radix-ui/themes';
import { PlusIcon, FileIcon } from '@radix-ui/react-icons';
import { useActiveWorkspace } from '../../hooks';

export default function StudioLeftPanel() {
  const { files, loading } = useActiveWorkspace();

  return (
    <Flex
      direction="column"
      style={{
        width: 220,
        borderRight: '1px solid var(--gray-4)',
        backgroundColor: 'var(--gray-1)'
      }}
    >
      {/* Section Action Trigger */}
      <Flex p="2" align="center" justify="between" style={{ borderBottom: '1px solid var(--gray-3)' }}>
        <Text size="1" weight="bold" color="gray">WORKSPACE FILES</Text>
        <IconButton size="1" variant="soft" color="green" style={{ cursor: 'pointer' }}>
          <PlusIcon width="12" height="12" />
        </IconButton>
      </Flex>

      {/* Scrollable Document Grid Stack */}
      <Box style={{ flexGrow: 1 }}>
        <ScrollArea type="auto" style={{ height: 'calc(100vh - 73px)' }}>
          <Flex direction="column" p="1" gap="1">
            {loading ? (
              <Text size="1" color="gray">Scanning folder...</Text>
            ) : files.length === 0 ? (
              <Text size="1" color="gray">No files found</Text>
            ) : (
              files.map((file) => (
                <Button
                  key={file.filename}
                  variant="ghost"
                  color="gray"
                  size="1"
                  style={{ justifyContent: 'start', cursor: 'pointer', textAlign: 'left' }}
                >
                  <FileIcon width="12" height="12" style={{ marginRight: 4 }} />
                  {file.filename}
                </Button>
              ))
            )}
          </Flex>
        </ScrollArea>
      </Box>
    </Flex>
  );
}