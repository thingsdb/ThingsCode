import { ChevronUpIcon, DragHandleHorizontalIcon } from "@radix-ui/react-icons";
import { Button, ChevronDownIcon, Flex } from "@radix-ui/themes";

interface StudioConsoleHeaderProps {
  consoleTab: 'output' | 'log';
  setConsoleTab: (tab: 'output' | 'log') => void
  showExpandButton: boolean;
  isMaximized: boolean;
  onToggleMaximize: () => void;
}

export default function StudioConsoleHeader({
  consoleTab,
  setConsoleTab,
  showExpandButton,
  isMaximized,
  onToggleMaximize,
}: StudioConsoleHeaderProps) {
  console.log('showExpandButton', showExpandButton);
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
      {showExpandButton && (
        <Button
          size="1"
          variant="ghost"
          color="gray"
          onClick={(e) => {
            e.stopPropagation(); // Stop the click from causing accidental panel dragging actions!
            onToggleMaximize();
          }}
          title={isMaximized ? "Restore Editor Panel Size" : "Maximize Console View"}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          {isMaximized ? (
            <ChevronDownIcon width="14" height="14" />
          ) : (
            <ChevronUpIcon width="14" height="14" />
          )}
        </Button>
      )}
    </Flex>

  );
}