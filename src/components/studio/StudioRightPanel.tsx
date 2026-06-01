import { Flex, Text, Box } from '@radix-ui/themes';

export default function StudioRightPanel() {
  return (
    <Flex
      direction="column"
      p="3"
      style={{
        width: 200,
        borderLeft: '1px solid var(--gray-4)',
        backgroundColor: 'var(--gray-1)'
      }}
    >
      <Text size="1" weight="bold" color="gray" mb="2">CONTEXT ACTIONS</Text>
      <Box style={{ border: '1px dashed var(--gray-5)', borderRadius: 'var(--radius-2)' }} p="3">
        <Text size="1" color="gray">Inspector details placeholder text box</Text>
      </Box>
    </Flex>
  );
}