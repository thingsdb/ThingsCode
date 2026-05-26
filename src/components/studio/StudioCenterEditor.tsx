import { useEffect, useRef, useState } from 'react';
import { Flex, Box, Text, Button } from '@radix-ui/themes';
import { DragHandleHorizontalIcon } from '@radix-ui/react-icons';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../hooks';

const MIN_EDITOR_HEIGHT = 150;
const DEFAULT_EDITOR_HEIGHT = 400;


export default function StudioCenterEditor() {
  const [consoleTab, setConsoleTab] = useState<'output' | 'log'>('output');
  const [editorHeight, setEditorHeight] = useState<number>(() => {
    const savedHeight = localStorage.getItem('ticode-editor-height');
    if (savedHeight) {
      const parsedHeight = parseInt(savedHeight, 10);

      if (!isNaN(parsedHeight) && parsedHeight >= MIN_EDITOR_HEIGHT && parsedHeight < window.innerHeight - 200) {
        return parsedHeight;
      }
    }
    return DEFAULT_EDITOR_HEIGHT;
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { appearance } = useTheme();

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    localStorage.setItem('ticode-editor-height', editorHeight.toString());
  }, [editorHeight]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const totalWorkspaceHeight = containerRect.height;
      const requestedHeight = e.clientY - containerRect.top;
      const dynamicMaxHeight = totalWorkspaceHeight - 150;

      const clampedHeight = Math.max(
        MIN_EDITOR_HEIGHT,
        Math.min(requestedHeight, dynamicMaxHeight)
      );
      setEditorHeight(clampedHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <Flex
      ref={containerRef}
      direction="column"
      style={{ flexGrow: 1, backgroundColor: 'var(--gray-3)' }}
    >
      {/* Top Section: Active Code Canvas Frame */}
      <Box
        style={{
          height: editorHeight,
          backgroundColor: 'var(--gray-surface)',
          borderBottom: '1px solid var(--gray-4)',
          position: 'relative' // Helps Monaco scale its dimensions properly
        }}
      >
        <Editor
          height="100%"
          width="100%"
          theme={appearance === 'dark' ? 'vs-dark' : 'light'}
          defaultLanguage="javascript" // TODO: language
          defaultValue="// ThingsCode IDE Engine v1.0&#10;'Hello World';&#10;"
          options={{
            fontSize: 13,
            fontFamily: 'monospace',
            minimap: { enabled: true },
            automaticLayout: true, // Tells Monaco to auto-resize when you drag the handle bar!
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible'
            },
            padding: { top: 12 },  // Restores clean internal spacing for code text
            lineNumbers: 'on',
            tabSize: 4,
          }}
        />
      </Box>

      {/* 📊 Middle Navigation Choice Console Bar */}
      <Flex
        px="2"
        align="center"
        justify="between"
        gap="2"
        onMouseDown={handleMouseDown} // Trigger drag start
        style={{
          height: 32,
          backgroundColor: isDragging ? 'var(--accent-1)' : 'var(--gray-2)',
          borderBottom: '1px solid var(--gray-4)',
          cursor: 'ns-resize',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        <div onMouseDown={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '8px' }}>
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
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            color: isDragging ? 'var(--accent-9)' : 'var(--gray-8)', // Glows when dragging!
            pointerEvents: 'none', // Mouse clicks pass straight through to the drag handle parent
            zIndex: 1
          }}
        >
          <DragHandleHorizontalIcon width="20" height="20" />
        </div>
      </Flex>

      {/* 📄 Bottom Section: Content Box display slot based on tab choice */}
      <Box style={{ flexGrow: 1, backgroundColor: 'var(--gray-surface)' }} p="3">
        {consoleTab === 'output' ? (
          <Text size="1" style={{ fontFamily: 'monospace' }}>
            {"..."}
          </Text>
        ) : (
          <Text size="1" style={{ fontFamily: 'monospace', color: '#f39c12' }}>
            {"..."}
          </Text>
        )}
      </Box>

    </Flex>
  );
}