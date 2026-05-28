import { DragHandleHorizontalIcon } from "@radix-ui/react-icons";
import { Button, Flex } from "@radix-ui/themes";

export default function StudioConsoleHeader({
  consoleTab,
  setConsoleTab
}: {
  consoleTab: 'output' | 'log';
  setConsoleTab: (tab: 'output' | 'log') => void
}) {
  return (
    <Flex
      px="2"
      align="center"
      justify="between"
      style={{
        height: 32,
        backgroundColor: 'var(--gray-2)',
        borderBottom: '1px solid var(--gray-4)',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      <div
        className="action-tabs-container"
        style={{
          display: 'flex',
          gap: '8px',
        }}
      >
        <Button
          size="1"
          variant={consoleTab === 'output' ? 'solid' : 'outline'}
          color={consoleTab === 'output' ? 'iris' : 'gray'}
          onClick={() => setConsoleTab('output')}
          style={{ cursor: 'pointer' }}
        >
          JSON Output
        </Button>
        <Button
          size="1"
          variant={consoleTab === 'log' ? 'solid' : 'outline'}
          color={consoleTab === 'log' ? 'iris' : 'gray'}
          onClick={() => setConsoleTab('log')}
          style={{ cursor: 'pointer' }}
        >
          Node Logs
        </Button>
      </div>
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', color: 'var(--gray-8)' }}>
        <DragHandleHorizontalIcon width="20" height="20" />
      </div>
    </Flex>
  );
}