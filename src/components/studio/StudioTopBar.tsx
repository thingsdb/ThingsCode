import { Flex, Text, Button, Tooltip } from '@radix-ui/themes';
import { ExitIcon, MoonIcon, SunIcon } from '@radix-ui/react-icons';
import { useActiveWorkspace } from '../../hooks';
import { useTheme } from '../../hooks';

export default function StudioTopBar() {
  const { workspace } = useActiveWorkspace();
  const { appearance, toggleAppearance } = useTheme();

  const handleLogout = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <Flex
      px="3"
      align="center"
      justify="between"
      style={{
        height: 40,
        borderBottom: '1px solid var(--gray-4)',
        backgroundColor: 'var(--gray-2)',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Left side */}
      <Flex align="center" gap="2">
        <Text size="1" weight="bold" color="blue">{workspace.name}</Text>
      </Flex>

      {/* Center */}
      <Flex
        align="center"
        gap="2"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1
        }}
      >
        <Text size="1" color="gray">[Execution Toolbar Placeholder]</Text>
      </Flex>

      {/* Right side */}
      <Flex align="center" gap="2">
        <Tooltip content={appearance === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          <Button
            variant="ghost"
            onClick={toggleAppearance}
            size="2"
            style={{ cursor: 'pointer' }}
            color="gray"
          >
            {appearance === 'dark' ? <SunIcon width="16" height="16" /> : <MoonIcon width="16" height="16" />}
          </Button>
        </Tooltip>
        <Tooltip content="Logout session">
          <Button
            size="1"
            color="red"
            variant="ghost"
            onClick={handleLogout}
            style={{ cursor: 'pointer', gap: '4px' }}
          >
            <ExitIcon width="12" height="12" />
          </Button>
        </Tooltip>
      </Flex>
    </Flex>
  );
}