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

  // 🔑 Safe top-level initialization variables
  const currentFilename = activeFile?.filename || '';
  const fileContent = activeFile?.content ?? '';

  const [localCode, setLocalCode] = useState(fileContent);
  const [trackedFilename, setTrackedFilename] = useState(currentFilename);

  const localCodeRef = useRef(localCode);
  const fileContentRef = useRef(fileContent);
  const filenameRef = useRef(currentFilename);
  const saveActionRef = useRef(storeFileContent);

  const executionContextRef = useRef({
    filename: currentFilename,
    activeScope,
    queryVars: activeFile?.queryVars
  });

  // Sync execution parameters for Monaco keyboard hotkeys
  useEffect(() => {
    executionContextRef.current = {
      filename: currentFilename,
      activeScope,
      queryVars: activeFile?.queryVars
    };
  }, [currentFilename, activeScope, activeFile?.queryVars]);

  // Synchronize mutable refs safely outside of the rendering pass pipeline
  useEffect(() => {
    localCodeRef.current = localCode;
  }, [localCode]);

  useEffect(() => {
    fileContentRef.current = fileContent;
  }, [fileContent]);

  useEffect(() => {
    filenameRef.current = currentFilename;
  }, [currentFilename]);

  useEffect(() => {
    saveActionRef.current = storeFileContent;
  }, [storeFileContent]);

  // 🔑 THE SAFE TAB SWITCH MONITOR (Runs cleanly inside a hook after render paint)
  useEffect(() => {
    if (currentFilename && currentFilename !== trackedFilename) {
      // If the user left a modified file buffer behind, auto-save it
      if (trackedFilename && trackedFilename !== 'unknown' && localCodeRef.current !== fileContentRef.current) {
        console.log(`[Tab Switch Save] Force-saving edits for ${trackedFilename}...`);
        storeFileContent(trackedFilename, localCodeRef.current);
      }

      // Sync the local states to display the newly active file
      setTrackedFilename(currentFilename);
      setLocalCode(fileContent);
    }
  }, [currentFilename, trackedFilename, fileContent, storeFileContent]);

  // 🔄 Auto-save Debounce Countdown
  useEffect(() => {
    if (!currentFilename) return;

    // Send keystroke string updates up to the parent context container layout
    if (localCode !== fileContent) {
      updateFileContent(currentFilename, localCode);
    }

    const timer = setTimeout(async () => {
      if (localCode !== fileContentRef.current) {
        console.log(`[Debounce] Auto-saving changes for ${currentFilename}...`);
        try {
          await storeFileContent(currentFilename, localCode);
        } catch (err) {
          console.error("Failed to auto-save file chunk:", err);
        }
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [localCode, currentFilename, fileContent, updateFileContent, storeFileContent]);

  // 📦 APPLICATION CLOSED TEARDOWN SAFEGUARD
  useEffect(() => {
    return () => {
      const fileLeaving = filenameRef.current;
      const staleLocalCode = localCodeRef.current;
      const staleServerCode = fileContentRef.current;

      if (fileLeaving && fileLeaving !== 'unknown' && staleLocalCode !== staleServerCode) {
        console.log(`[Teardown] Unmounting workspace editor. Saving final buffer for ${fileLeaving}...`);
        saveActionRef.current(fileLeaving, staleLocalCode);
      }
    };
  }, []);

  // Guard Clause sits safely at the bottom, AFTER all hook allocations
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