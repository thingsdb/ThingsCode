import { useState } from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';
import StudioTopBar from './StudioTopBar';
import StudioLeftPanel from './StudioLeftPanel';
import StudioRightPanel from './StudioRightPanel';
import StudioEditor from './StudioEditor';
import StudioConsoleHeader from './StudioConsoleHeader';

export default function StudioLayout() {
  const [consoleTab, setConsoleTab] = useState<'output' | 'log'>('output');

  const horizontalLayout = useDefaultLayout({
    id: "ticode-main-horizontal-layout",
    storage: localStorage,
  });

  const verticalLayout = useDefaultLayout({
    id: "ticode-center-vertical-split",
    storage: localStorage,
  });

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
          <Panel id="explorer-panel" defaultSize={200} minSize={170} maxSize={400}>
            <StudioLeftPanel />
          </Panel>

          <Separator className="resize-handle" />

          <Panel id="workspace-center-panel" minSize={300}>
            <Group
              orientation="vertical"
              defaultLayout={verticalLayout.defaultLayout}
              onLayoutChanged={verticalLayout.onLayoutChanged}
            >
              <Panel id="editor-canvas-panel" defaultSize={400} minSize={10}>
                <StudioEditor />
              </Panel>

              <Separator className="vertical-handle" style={{ width: '100%' }}>
                <StudioConsoleHeader consoleTab={consoleTab} setConsoleTab={setConsoleTab} />
              </Separator>

              <Panel id="ouput-panel" defaultSize={200} minSize={10}>
                <Box
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'var(--gray-surface)',
                    borderTop: '1px solid var(--gray-4)'
                  }}
                  p="3"
                >
                  {consoleTab === 'output' ? (
                    <Text size="1" style={{ fontFamily: 'monospace' }}>{"..."}</Text>
                  ) : (
                    <Text size="1" style={{ fontFamily: 'monospace', color: '#f39c12' }}>{"..."}</Text>
                  )}
                </Box>
              </Panel>
            </Group>
          </Panel>

          <Separator className="resize-handle" />

          <Panel id="context-actions-panel" defaultSize={200} minSize={170} maxSize={400}>
            <StudioRightPanel />
          </Panel>
        </Group>

        {/* 🎨 Optimized Unified Stylesheet Engine Blocks */}
        <style>{`
          /* 📐 Layout Handle Settings */
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

          /* 🚨 CRITICAL FIX: Forces the vertical drag track to let our 32px header render
             fully instead of choking it down to the library's default 4px height restriction! */
          [data-panel-group-direction="vertical"] > [data-panel-resize-handle] {
            height: auto !important;
            background-color: transparent !important;
          }

          /* 🛡️ THE ULTIMATE POINTER OVERRIDES (Bypasses the library's universal * child rules) */
          [data-panel-resize-handle-id] button,
          [data-panel-resize-handle-id] [role="button"],
          [data-resize-handle-state] button,
          .vertical-handle button {
              cursor: pointer !important;
          }

          /* Optional: Fixes the tab text cursor selection frame too */
          [data-panel-resize-handle-id] .action-tabs-container,
          .vertical-handle .action-tabs-container {
              cursor: default !important;
          }

          /* Global Safety Mask: Maintains the drag cursor layout tracking seamlessly
             if the user's mouse wanders into Monaco's text iframe space while active */
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