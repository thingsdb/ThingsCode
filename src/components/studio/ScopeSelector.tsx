import { Select, Flex } from '@radix-ui/themes';
import { useActiveWorkspace } from '../../hooks';

interface ScopeSelectorProps {
    disabled: boolean;
}

export default function ScopeSelector({disabled} : ScopeSelectorProps) {
  const { loading, activeScope, setActiveScopeState, scopes } = useActiveWorkspace();

  if (loading) return null;

  return (
    <Flex align="center" gap="2">

      <Select.Root
        disabled={disabled}
        value={activeScope || ''}
        onValueChange={setActiveScopeState}
      >
        <Select.Trigger
            style={{ minWidth: '260px' }}
            placeholder="Select Scope..."
        />
        <Select.Content>
          {scopes.map((scope) => (
            <Select.Item key={scope.name} value={scope.name}>
              {scope.name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}