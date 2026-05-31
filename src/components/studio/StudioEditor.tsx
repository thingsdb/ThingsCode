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
  const { isExecuting, execCode, activeScope, activeFile, activeContent, setActiveContent, storeFileContent } = useActiveWorkspace();

  const currentFilename = activeFile?.filename || '';
  const fileContent = activeFile?.content ?? '';

  const [localCode, setLocalCode] = useState(fileContent);
  const [prevFilename, setPrevFilename] = useState(currentFilename);

  const executionContextRef = useRef({
    filename: currentFilename,
    activeScope,
    queryVars: activeFile?.queryVars
  });

  if (currentFilename !== prevFilename) {
    const fileLeaving = prevFilename;
    const codeToSave = localCode;

    if (fileLeaving && fileLeaving !== 'unknown') {
      queueMicrotask(() => {
        console.log(`[Tab Switch Save] Safely deferred force-saving edits for ${fileLeaving}...`);
        storeFileContent(fileLeaving, codeToSave);
      });
    }

    setPrevFilename(currentFilename);
    setLocalCode(fileContent);
  }

  // Sync execution parameters for Monaco keyboard hotkeys
  useEffect(() => {
    executionContextRef.current = {
      filename: currentFilename,
      activeScope,
      queryVars: activeFile?.queryVars
    };
  }, [currentFilename, activeScope, activeFile?.queryVars]);

  useEffect(() => {
    if (!currentFilename) return;

    if (localCode !== activeContent) {
      console.log('HERE!!!', localCode, activeContent);
      setActiveContent(localCode);
    }

    const timer = setTimeout(async () => {
      console.log(`[Debounce] Auto-saving changes for ${currentFilename}...`);
      try {
        await storeFileContent(currentFilename, localCode);
      } catch (err) {
        console.error("Failed to auto-save file chunk:", err);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [localCode, activeContent, currentFilename, setActiveContent, storeFileContent]);

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
        transition: 'opacity 0.2s ease',
      }}
    >
      <Editor
        path={currentFilename}
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