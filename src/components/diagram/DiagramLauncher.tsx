import { useState } from 'react';
import { IconButton, Tooltip, Flex } from '@radix-ui/themes';
import { ComponentInstanceIcon, SymbolIcon } from '@radix-ui/react-icons';
import { useActiveWorkspaceId, useWebSocket } from '../../hooks';
import type { Type, Enum } from '../../types';
import DiagramCanvas from './DiagramCanvas';

interface DiagramLauncherProps {
  scope: string;
  disabled: boolean;
}

export default function DiagramLauncher({ scope, disabled }: DiagramLauncherProps) {
  const activeId = useActiveWorkspaceId();
  const { emit } = useWebSocket();

  // Component operational states
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [graphData, setGraphData] = useState<[Type[], Enum[]] | null>(null);

  const handleLaunchDiagram = async () => {
    setIsLoading(true);
    try {
      const [resolvedTypes, resolvedEnums] = await Promise.all([
        emit('FETCH_TYPES', { id: activeId, scope }),
        emit('FETCH_ENUMS', { id: activeId, scope }),
      ]) as [Type[], Enum[]];

      setGraphData([resolvedTypes, resolvedEnums]);
      setIsOpen(true);
    } catch (err) {
      console.error('Failed to resolve collection schema profiles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDiagram = () => {
    setIsOpen(false);
    setGraphData(null);
  };

  return (
    <Flex align="center">
      <Tooltip content="Open full-screen collection architecture graph">
        <IconButton
          size="2"
          variant="ghost"
          color="gray"
          disabled={isLoading || disabled}
          onClick={() => { void handleLaunchDiagram(); }}
          className={isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}
        >
          {isLoading ? (
            <SymbolIcon width="16" height="16" className="animate-spin" />
          ) : (
            <ComponentInstanceIcon width="16" height="16" />
          )}
        </IconButton>
      </Tooltip>

      {isOpen && graphData && (
        <DiagramCanvas
          onClose={handleCloseDiagram}
          data={graphData}
        />
      )}
    </Flex>
  );
}