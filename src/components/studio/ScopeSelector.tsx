import { Select, Flex } from '@radix-ui/themes';
import { useContext } from 'react';
import { ActiveWorkspaceContext } from '../../context';

export default function ScopeSelector() {
  const context = useContext(ActiveWorkspaceContext);

  if (!context || context.loading) return null;

  return (
    <Flex align="center" gap="2">

      <Select.Root
        value={context.activeScope || ''}
        onValueChange={context.setActiveScopeState}
      >
        <Select.Trigger
            style={{ minWidth: '200px' }}
            placeholder="Select Scope..."
        />
        <Select.Content>
          {context.scopes.map((scope) => (
            <Select.Item key={scope} value={scope}>
              {scope}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}