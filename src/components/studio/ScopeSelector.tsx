import { Select, Flex } from '@radix-ui/themes';
import { useContext } from 'react';
import { ActiveWorkspaceContext } from '../../context';

interface ScopeSelectorProps {
    disabled: boolean;
}

export default function ScopeSelector({disabled} : ScopeSelectorProps) {
  const context = useContext(ActiveWorkspaceContext);

  if (!context || context.loading) return null;

  return (
    <Flex align="center" gap="2">

      <Select.Root
        disabled={disabled}
        value={context.activeScope || ''}
        onValueChange={context.setActiveScopeState}
      >
        <Select.Trigger
            style={{ minWidth: '260px' }}
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