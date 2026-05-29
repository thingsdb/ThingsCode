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

  // 🔑 1. ALL HOOKS ARE DECLARED UNCONDITIONALLY AT THE VERY TOP
  const currentFilename = activeFile?.filename || '';
  const fileContent = activeFile?.content ?? '';

  const [localCode, setLocalCode] = useState(fileContent);
  const [prevFilename, setPrevFilename] = useState(currentFilename);
  const [savedBaselineCode, setSavedBaselineCode] = useState(fileContent);

  const localCodeRef = useRef(localCode);
  const savedBaselineRef = useRef(savedBaselineCode);
  const filenameRef = useRef(currentFilename);
  const saveActionRef = useRef(storeFileContent);

  const executionContextRef = useRef({
    filename: currentFilename,
    activeScope,
    queryVars: activeFile?.queryVars
  });

  // 🔄 2. SAFE SYNCHRONOUS RENDER-PHASE TAB TRANSITION
  // No references (.current) or effects are accessed inside this block!
  if (currentFilename !== prevFilename) {
    const fileLeaving = prevFilename;
    const staleLocalCode = localCode; // Use the direct local state variable
    const staleServerCode = savedBaselineCode; // Use the direct baseline state variable

    // Force-save the file we are leaving behind if it has pending changes
    if (fileLeaving && fileLeaving !== 'unknown' && staleLocalCode !== staleServerCode) {
      console.log(`[Tab Switch Save] Force-saving edits for ${fileLeaving}...`);
      storeFileContent(fileLeaving, staleLocalCode);
    }

    // Immediately synchronize local state snapshots for the new file
    setPrevFilename(currentFilename);
    setLocalCode(fileContent);
    setSavedBaselineCode(fileContent);
  }

  // Sync execution parameters for Monaco keyboard hotkeys
  useEffect(() => {
    executionContextRef.current = {
      filename: currentFilename,
      activeScope,
      queryVars: activeFile?.queryVars
    };
  }, [currentFilename, activeScope, activeFile?.queryVars]);

  // Safely synchronize our reference wrappers after the render paints
  useEffect(() => {
    localCodeRef.current = localCode;
  }, [localCode]);

  useEffect(() => {
    savedBaselineRef.current = savedBaselineCode;
  }, [savedBaselineCode]);

  useEffect(() => {
    filenameRef.current = currentFilename;
  }, [currentFilename]);

  useEffect(() => {
    saveActionRef.current = storeFileContent;
  }, [storeFileContent]);


  // useEffect(() => {
  //   if (!currentFilename || localCode === fileContent) return;

  //   // Wait exactly 250ms after you stop typing to sync the global menu bar text
  //   const contextTimer = setTimeout(() => {
  //     updateFileContent(currentFilename, localCode);
  //   }, 250);

  //   return () => clearTimeout(contextTimer);
  // }, [localCode, currentFilename, fileContent, updateFileContent]);


  // 🔄 3. AUTO-SAVE DEBOUNCE COUNTDOWN HOOK
  useEffect(() => {
    if (!currentFilename) return;

    // Send keystroke string updates up to the parent context container layout
    // if (localCode !== savedBaselineCode) {
    //   updateFileContent(currentFilename, localCode);  <--- this is the issue. But if i leave out, and press "RUN" immediatly, it is not updated. However, if I add, activeFile get renewed and we loop
    // }

    const timer = setTimeout(async () => {
      // Compare local buffered edits directly against our stable text baseline
      if (localCode !== savedBaselineRef.current) {
        console.log(`[Debounce] Auto-saving changes for ${currentFilename}...`);
        try {
          await storeFileContent(currentFilename, localCode);
          setSavedBaselineCode(localCode); // Lift the baseline up to match the successful save
        } catch (err) {
          console.error("Failed to auto-save file chunk:", err);
        }
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [localCode, currentFilename, savedBaselineCode, updateFileContent, storeFileContent]);

  useEffect(() => {
    return () => {
      const fileLeaving = filenameRef.current;
      const staleLocalCode = localCodeRef.current;
      const staleServerCode = savedBaselineRef.current;

      if (fileLeaving && fileLeaving !== 'unknown' && staleLocalCode !== staleServerCode) {
        console.log(`[Teardown] Unmounting workspace editor. Saving final buffer for ${fileLeaving}...`);
        saveActionRef.current(fileLeaving, staleLocalCode);
      }
    };
  }, []);

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