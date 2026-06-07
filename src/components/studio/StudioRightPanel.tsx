import { Box, Flex, Text, Heading, ScrollArea } from '@radix-ui/themes';
import { useActiveWorkspace } from '../../hooks';
import NodeContextPanel from './NodeContextPanel';
import CollectionContextPanel from './CollectionContextPanel';
import ThingsDBContextPanel from './ThingsDBContextPanel';

export default function StudioRightPanel() {
  const { activeScope } = useActiveWorkspace();

  if (!activeScope) {
    return (
      <Flex align="center" justify="center" p="4" style={{ height: '100%'}}>
        <Text size="2" color="gray" align="center">Select an execution scope to view context actions.</Text>
      </Flex>
    );
  }

  // Determine context by scope prefix
  const isNode = activeScope.startsWith('@node');
  const isCollection = activeScope.startsWith('@collection');
  const isThingsDB = activeScope.startsWith('@thingsdb');

  return (
    <Flex direction="column" style={{ height: '100%', backgroundColor: 'var(--gray-1)', borderLeft: '1px solid var(--gray-4)' }}>
      <Box px="3" py="2" style={{ borderBottom: '1px solid var(--gray-4)', backgroundColor: 'var(--gray-2)' }}>
        <Heading size="2" color="gray" weight="bold">
          {activeScope}
        </Heading>
      </Box>

      <ScrollArea scrollbars="vertical" style={{ flexGrow: 1 }}>
        <Box p="1">
          {isNode && <NodeContextPanel key={`context-node-${activeScope}`} scope={activeScope} />}
          {isCollection && <CollectionContextPanel key={`context-node-${activeScope}`} scope={activeScope} />}
          {isThingsDB && <ThingsDBContextPanel key={`context-node-${activeScope}`} scope={activeScope} />}
        </Box>
      </ScrollArea>
    </Flex>
  );
}