import { useState } from 'react';
import { IconButton, Tooltip, Flex, Checkbox, Text, Dialog, Button } from '@radix-ui/themes';
import { ComponentInstanceIcon, SymbolIcon } from '@radix-ui/react-icons';
import { useActiveWorkspaceId, useWebSocket } from '../../hooks';
import type { Type, Enum } from '../../types';
import DiagramCanvas from './DiagramCanvas';
import TypeModal from '../studio/TypeModal';
import EnumModal from '../studio/EnumModal';

interface DiagramLauncherProps {
  scope: string;
  disabled: boolean;
}

export default function DiagramLauncher({ scope, disabled }: DiagramLauncherProps) {
  const activeId = useActiveWorkspaceId();
  const { emit } = useWebSocket();

  // Dialog configuration states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [includeWpo, setIncludeWpo] = useState(false);
  const [includeEnums, setIncludeEnums] = useState(false);
  const [includeStandalone, setIncludeStandalone] = useState(false);

  // Canvas states
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [graphData, setGraphData] = useState<[Type[], Enum[]] | null>(null);

  // Type and Enum modal states
  const [viewType, setViewType] = useState<Type | null>(null);
  const [viewEnum, setViewEnum] = useState<Enum | null>(null);

  const handleOnNavigateToType = (name: string) => {
    setIsCanvasOpen(false);
    setViewType(graphData?.[0].find(tp => tp.name === name) ?? null);
  };

  const handleOnNavigateToEnum = (name: string) => {
    setIsCanvasOpen(false);
    setViewEnum(graphData?.[1].find(enu => enu.name === name) ?? null);
  };

  const handleLaunchDiagram = async () => {
    setIsLoading(true);
    try {
      const [resolvedTypes, resolvedEnums] = await Promise.all([
        emit('FETCH_TYPES', { id: activeId, scope }),
        includeEnums
          ? emit('FETCH_ENUMS', { id: activeId, scope })
          : Promise.resolve([] as Enum[]),
      ]) as [Type[], Enum[]];

      setGraphData([resolvedTypes, resolvedEnums]);
      setIsDialogOpen(false);
      setIsCanvasOpen(true);
    } catch (err) {
      console.error('Failed to resolve collection schema profiles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDiagram = () => {
    setIsCanvasOpen(false);
    setGraphData(null);
  };

  return (
    <Flex align="center">
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Trigger>
          <Tooltip content="Open Full-Screen Collection Graph">
            <IconButton
              size="2"
              variant="ghost"
              color="gray"
              disabled={disabled}
              onClick={() => { void setIsDialogOpen(true); }}
              className="cursor-pointer"
            >
              <ComponentInstanceIcon width="16" height="16" />
            </IconButton>
          </Tooltip>
        </Dialog.Trigger>

        <Dialog.Content size="2" style={{ maxWidth: 400 }}>
          <Dialog.Title size="3" className="font-mono">
            Configure Collection Graph
          </Dialog.Title>
          <Dialog.Description size="1" color="gray" className="mb-4">
            Select which extra components to include for scope: <code className="bg-[var(--gray-3)] px-1 py-0.5 rounded text-[var(--gray-12)]">{scope}</code>
          </Dialog.Description>

          <Flex direction="column" gap="3" className="my-4">
            <Flex align="center" gap="3">
              <Checkbox
                id="modal-wpo-toggle"
                checked={includeWpo}
                onCheckedChange={(checked) => setIncludeWpo(!!checked)}
              />
              <Text as="label" htmlFor="modal-wpo-toggle" size="2" className="cursor-pointer select-none">
                Include wrap-only types
              </Text>
            </Flex>

            <Flex align="center" gap="3">
              <Checkbox
                id="modal-enums-toggle"
                checked={includeEnums}
                onCheckedChange={(checked) => { setIncludeEnums(!!checked); }}
              />
              <Text as="label" htmlFor="modal-enums-toggle" size="2" className="cursor-pointer select-none">
                Include enumerators
              </Text>
            </Flex>

            <Flex direction="column" gap="1">
              <Flex align="center" gap="3">
                <Checkbox
                  id="modal-standalone-toggle"
                  checked={includeStandalone}
                  onCheckedChange={(checked) => { setIncludeStandalone(!!checked); }}
                />
                <Text as="label" htmlFor="modal-standalone-toggle" size="2" className="cursor-pointer select-none">
                  Include standalone
                </Text>
              </Flex>
              <Text size="1" color="gray" className="pl-6">
                Include standalone types and enumerators that have no connection with any other type.
              </Text>
            </Flex>

          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={isLoading} className="cursor-pointer">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={() => { void handleLaunchDiagram(); }}
              disabled={isLoading}
              color="iris"
              className="cursor-pointer min-w-[100px]"
            >
              {isLoading ? (
                <SymbolIcon width="14" height="14" className="animate-spin" />
              ) : (
                'Generate Graph'
              )}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {isCanvasOpen && graphData && (
        <DiagramCanvas
          onClose={handleCloseDiagram}
          data={graphData}
          scope={scope}
          onNavigateToType={handleOnNavigateToType}
          onNavigateToEnum={handleOnNavigateToEnum}
          includeWpo={includeWpo}
          includeStandalone={includeStandalone}
        />
      )}
      {viewType && (
        <TypeModal
          onClose={() => { setViewType(null); }}
          tp={viewType}
          onNavigateToType={handleOnNavigateToType}
        />
      )}
      {viewEnum && (
        <EnumModal
          onClose={() => { setViewEnum(null); }}
          enu={viewEnum}
          scope={scope}
        />
      )}
    </Flex>
  );
}