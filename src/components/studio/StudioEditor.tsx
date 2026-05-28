import { useEffect, useRef, useState } from 'react';
import { Box } from '@radix-ui/themes';
import Editor, { type Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useTheme, useActiveWorkspace } from '../../hooks';
import { registerThingsDBLanguage } from '../../utils/thingsdb';
import NoActiveFile from './NoActiveFile';

interface StudioEditorProps {
  onCreateFile: () => void;
}

export default function StudioEditor({ onCreateFile }: StudioEditorProps) {
  const { appearance } = useTheme();
  const { activeFile, updateFileContent } = useActiveWorkspace();

  const fileContent = activeFile?.content ?? '';
  const [prevFilename, setPrevFilename] = useState(activeFile?.filename || '');
  const [localCode, setLocalCode] = useState(fileContent);
  const activeFilenameRef = useRef(activeFile?.filename || 'unknown');

  useEffect(() => {
    if (activeFile) {
      activeFilenameRef.current = activeFile.filename;
    }
  }, [activeFile]);

  if (activeFile && activeFile.filename !== prevFilename) {
    setPrevFilename(activeFile.filename);
    setLocalCode(fileContent);
  }

  useEffect(() => {
    if (!activeFile?.filename || localCode === fileContent) return;

    const timer = setTimeout(async () => {
      if (activeFilenameRef.current === activeFile.filename) {
        console.log(`[Debounce] Auto-saving changes for ${activeFile.filename}...`);
        try {
          await updateFileContent(activeFile.filename, localCode);
        } catch (err) {
          console.error("Failed to auto-save file chunk:", err);
        }
      }
    }, 2000);

    return () => clearTimeout(timer); // Cleanup
  }, [localCode, activeFile, fileContent, updateFileContent]);

  if (!activeFile) {
    return (
      <NoActiveFile onCreateFile={onCreateFile} />
    )
  }

  const handleEditorWillMount = (monaco: Monaco) => {
    registerThingsDBLanguage(monaco);
  };

  const handleEditorDidMount = (
    editorInstance: editor.IStandaloneCodeEditor, // 🔑 Typed correctly!
    monaco: Monaco
  ) => {
    // Inject the active Ctrl + Enter action command
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      console.log("Ctrl+Enter shortcut caught! Running dynamic code query sequence:", editorInstance.getValue());
      alert("Executing ThingsDB Code...");
    });
  };

  return (
    <Box
      style={{
        height: "100%",
        backgroundColor: 'var(--gray-surface)',
        borderBottom: '1px solid var(--gray-4)',
        position: 'relative', // Helps Monaco scale its dimensions properly
      }}
    >
      <Editor
        path={activeFile.filename}
        theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
        value={localCode}
        onChange={(val) => setLocalCode(val || '')}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
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
  );
}