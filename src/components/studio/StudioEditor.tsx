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
  const { isExecuting, execCode, activeScope, activeFile, updateFileContent, storeFileContent } = useActiveWorkspace();

  const fileContent = activeFile?.content ?? '';
  const [prevFilename, setPrevFilename] = useState(activeFile?.filename || '');
  const [localCode, setLocalCode] = useState(fileContent);
  const activeFilenameRef = useRef(activeFile?.filename || '');

  const executionContextRef = useRef({
    filename: activeFile?.filename || '',
    activeScope,
    queryVars: activeFile?.queryVars
  });

  const localCodeRef = useRef(localCode);
  const fileContentRef = useRef(fileContent);

  useEffect(() => {
    executionContextRef.current = {
      filename: activeFile?.filename || '',
      activeScope,
      queryVars: activeFile?.queryVars
    };
  }, [activeFile?.filename, activeScope, activeFile?.queryVars]);

  useEffect(() => {
    localCodeRef.current = localCode;
    fileContentRef.current = fileContent;
  }, [localCode, fileContent]);

  useEffect(() => {
    if (activeFile) {
      activeFilenameRef.current = activeFile.filename;
    }
  }, [activeFile]);

  if (activeFile && activeFile.filename !== prevFilename) {
    if (prevFilename && localCode !== fileContentRef.current) {
      console.log(`[File Switch] Force-saving changes for ${prevFilename} before switching...`);
      storeFileContent(prevFilename, localCode);
    }
    setPrevFilename(activeFile.filename);
    setLocalCode(fileContent);
  }

  useEffect(() => {
    if (!activeFile?.filename || localCode === fileContent) return;
    updateFileContent(activeFile.filename, localCode);

    const timer = setTimeout(async () => {
      if (activeFilenameRef.current === activeFile.filename) {
        console.log(`[Debounce] Auto-saving changes for ${activeFile.filename}...`);
        try {
          await storeFileContent(activeFile.filename, localCode);
        } catch (err) {
          console.error("Failed to auto-save file chunk:", err);
        }
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      const currentFile = activeFilenameRef.current;
      if (currentFile && currentFile !== 'unknown' && localCodeRef.current !== fileContentRef.current) {
        console.log(`[Unmount] Force-saving ${currentFile}...`);
        storeFileContent(currentFile, localCodeRef.current);
      }
    };
  }, [localCode, activeFile, fileContent, updateFileContent, storeFileContent]);

  if (!activeFile || !activeScope) {
    return <NoActiveFile onCreateFile={onCreateFile} />;
  }

  const handleEditorWillMount = (monaco: Monaco) => {
    registerThingsDBLanguage(monaco);
  };

  const handleEditorDidMount = (
    editorInstance: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    // Inject the active Ctrl + Enter action command
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      const currentCode = editorInstance.getValue();
      const { filename: freshFilename, activeScope: freshScope, queryVars: freshVars } = executionContextRef.current;

      if (freshFilename && freshFilename.endsWith('.ti') && freshScope !== null) {
        execCode(freshFilename, freshScope, currentCode, freshVars || null);
      }
    });
  };

  return (
    <Box
      style={{
        height: "100%",
        backgroundColor: 'var(--gray-surface)',
        borderBottom: '1px solid var(--gray-4)',
        position: 'relative',
        opacity: isExecuting ? '50%' : '100%',
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
          readOnly: isExecuting,
          fontSize: 13,
          fontFamily: 'monospace',
          minimap: { enabled: true },
          automaticLayout: true,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible'
          },
          padding: { top: 12 },
          lineNumbers: 'on',
          tabSize: 4,
        }}
      />
    </Box>
  );
}