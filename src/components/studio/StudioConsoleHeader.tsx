import { ChevronUpIcon, DragHandleHorizontalIcon } from "@radix-ui/react-icons";
import { Button, ChevronDownIcon, Flex, SegmentedControl } from "@radix-ui/themes";
import type { StudioTab } from "../../types";

interface StudioConsoleHeaderProps {
  consoleTab: StudioTab;
  setConsoleTab: (tab: StudioTab) => void
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
        <SegmentedControl.Root
          size="1"
          value={consoleTab}
          onValueChange={(value) => setConsoleTab(value as StudioTab)}
          style={{ cursor: 'pointer' }}
        >
          <SegmentedControl.Item value="result">
            Result
          </SegmentedControl.Item>
          <SegmentedControl.Item value="rooms">
            Rooms
          </SegmentedControl.Item>
          <SegmentedControl.Item value="log">
            Node Logs
          </SegmentedControl.Item>
        </SegmentedControl.Root>
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