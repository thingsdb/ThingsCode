import { useState } from 'react';
import { Box } from '@radix-ui/themes';
import Editor, { type Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useTheme } from '../../hooks';
import { registerThingsDBLanguage } from '../../utils/thingsdb';


export default function StudioEditor() {
  const { appearance } = useTheme();
  const [code, setCode] = useState('// ThingsCode IDE Engine\n"Hello World";\n');

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
        theme={appearance === 'dark' ? 'ticode-dark' : 'ticode-light'}
        defaultLanguage="thingsdb" // TODO: language
        defaultValue="// ThingsCode IDE Engine v1.0&#10;'Hello World';&#10;"
        value={code}
        onChange={(val) => setCode(val || '')}
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