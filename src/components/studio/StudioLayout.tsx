import { useRef, useState } from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { Group, Panel, Separator, useDefaultLayout, type Layout } from 'react-resizable-panels';
import { type PanelImperativeHandle } from 'react-resizable-panels';
import StudioTopBar from './StudioTopBar';
import StudioLeftPanel from './StudioLeftPanel';
import StudioRightPanel from './StudioRightPanel';
import StudioEditor from './StudioEditor';
import StudioConsoleHeader from './StudioConsoleHeader';
import StudioResultView from './StudioResultView';
import type { StudioTab } from '../../types';
import StudioLogView from './StudioLogView';
import StudioEventView from './StudioEventView';

export default function StudioLayout() {
  const editorPanelRef = useRef<PanelImperativeHandle>(null);
  const [consoleTab, setConsoleTab] = useState<StudioTab>('result');
  const [cachedEditorSize, setCachedEditorSize] = useState<number | null>(null);
  const [isConsoleMaximized, setIsConsoleMaximized] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);


  const horizontalLayout = useDefaultLayout({
    id: "ticode-main-horizontal-layout",
    storage: localStorage,
  });

  const verticalLayout = useDefaultLayout({
    id: "ticode-center-vertical-split",
    storage: localStorage,
  });

  const [currentLayout, setCurrentLayout] = useState<Layout>(verticalLayout.defaultLayout || ([] as unknown as Layout));

  const handleLayoutChange = (sizes: Layout) => {
    setCurrentLayout(sizes);

    if (verticalLayout.onLayoutChanged) {
      verticalLayout.onLayoutChanged(sizes);
    }

    if (sizes['editor-canvas-panel'] > 10 && isConsoleMaximized) {
      setIsConsoleMaximized(false);
    }
  };

  const handleToggleConsoleMaximize = () => {
    const editorPanel = editorPanelRef.current;
    if (!editorPanel) return;

    if (isConsoleMaximized) {
      // RESTORE_SIZE
      const restoreSize = cachedEditorSize !== null ? cachedEditorSize : 60;
      editorPanel.resize(`${restoreSize}%`);
      setIsConsoleMaximized(false);
    } else {
      // MAXIMIZE
      setCachedEditorSize(currentLayout['editor-canvas-panel']);
      editorPanel.collapse();
      setIsConsoleMaximized(true);
    }
  };

  const editorPercentage = currentLayout['editor-canvas-panel'] || 0;
  const showMaximizeButton = editorPercentage >= 25 || isConsoleMaximized;

  return (
    <Flex
      direction="column"
      style={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden'
      }}
    >
      <StudioTopBar />
      <Flex style={{ flexGrow: 1, height: 'calc(100vh - 40px)' }}>
        <Group
          orientation="horizontal"
          defaultLayout={horizontalLayout.defaultLayout}
          onLayoutChanged={horizontalLayout.onLayoutChanged}
        >
          <Panel id="explorer-panel" defaultSize={200} minSize={200} maxSize={400}>
            <StudioLeftPanel
              isCreateOpen={isCreateOpen}
              setIsCreateOpen={setIsCreateOpen}
            />
          </Panel>

          <Separator className="resize-handle" />

          <Panel id="workspace-center-panel" minSize={300}>
            <Group
              orientation="vertical"
              defaultLayout={verticalLayout.defaultLayout}
              onLayoutChanged={handleLayoutChange}
            >
              <Panel
                id="editor-canvas-panel"
                panelRef={editorPanelRef}
                defaultSize={400}
                collapsible={true}
              >
                <StudioEditor
                  onCreateFile={() => { setIsCreateOpen(true); }}
                />
              </Panel>

              <Separator className="vertical-handle" style={{ width: '100%' }}>
                <StudioConsoleHeader
                  consoleTab={consoleTab}
                  setConsoleTab={setConsoleTab}
                  showExpandButton={showMaximizeButton}
                  isMaximized={isConsoleMaximized}
                  onToggleMaximize={handleToggleConsoleMaximize}
                />
              </Separator>

              <Panel id="ouput-panel" defaultSize={200} minSize={10}>
                <Box
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'var(--gray-surface)',
                    borderTop: '1px solid var(--gray-4)'
                  }}
                  p="0"
                >
                  {consoleTab === 'result' ? (
                    <StudioResultView />
                  ) : consoleTab === 'events' ? (
                    <StudioEventView />
                  ) : consoleTab === 'log' ? (
                    <StudioLogView />
                  ) : (
                    <Text size="1" style={{ fontFamily: 'monospace', color: '#f39c12' }}>{"..."}</Text>
                  )}
                </Box>
              </Panel>
            </Group>
          </Panel>

          <Separator className="resize-handle" />

          <Panel id="context-actions-panel" defaultSize={280} minSize={280} maxSize={460}>
            <StudioRightPanel />
          </Panel>
        </Group>

        <style>{`
          .resize-handle {
            width: 2px;
            background-color: var(--gray-4);
            cursor: col-resize;
            transition: background-color 0.15s ease;
            position: relative;
            z-index: 100;
          }
          .resize-handle:hover,
          .resize-handle[data-resize-handle-state="drag"] {
            background-color: var(--accent-9);
          }
          [data-panel-group-direction="vertical"] > [data-panel-resize-handle] {
            height: auto !important;
            background-color: transparent !important;
          }
          [data-panel-resize-handle-id] button,
          [data-panel-resize-handle-id] [role="button"],
          [data-resize-handle-state] button,
          .vertical-handle button {
              cursor: pointer !important;
          }
          [data-panel-resize-handle-id] button *,
          [data-resize-handle-state] button *,
          .vertical-handle button * {
              cursor: pointer !important;
          }
          [data-panel-resize-handle-id] .action-tabs-container,
          .vertical-handle .action-tabs-container {
              cursor: default !important;
          }
          body:has([data-resize-handle-state="drag"]) * {
            user-select: none !important;
          }
          body:has([data-resize-handle-state="drag"]) iframe,
          body:has([data-resize-handle-state="drag"]) .monaco-editor {
            pointer-events: none !important;
          }
        `}</style>
      </Flex>
    </Flex>
  );
}