import { Flex, Text, Button, Tooltip, IconButton, Separator } from '@radix-ui/themes';
import { ExitIcon, GearIcon, MoonIcon, PlayIcon, SunIcon } from '@radix-ui/react-icons';
import { useActiveWorkspace, useWebSocket } from '../../hooks';
import { useTheme } from '../../hooks';
import ScopeSelector from './ScopeSelector';
import { useState } from 'react';
import QueryVarsDialog from './QueryVarsDialog';

export default function StudioTopBar() {
  const { status, emit } = useWebSocket();
  const { activeScope, activeFile, updateQueryVars, activeFilename, activeContent, workspace, isExecuting, execCode } = useActiveWorkspace();
  const { appearance, toggleAppearance } = useTheme();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const isTiCode = activeFilename && activeFilename.endsWith('.ti');

  const handleLogout = async () => {
    if (status === 'connected') {
      try {
        await emit('CLOSE_WORKSPACE', workspace);
      } catch (e) {
        console.warn("Quietly handled close workspace failure:", e);
      }
    }
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleExecuteCode = () => {
    if (!activeFile || !activeScope || activeContent === null) return;
    execCode(activeFile.filename, activeScope, activeContent, activeFile.queryVars)
  };

  return (
    <Flex
      px="3"
      align="center"
      justify="between"
      style={{
        height: 40,
        borderBottom: '1px solid var(--gray-4)',
        backgroundColor: 'var(--gray-2)',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Left side */}
      <Flex align="center" gap="2">
        <img
          src={appearance === 'dark' ? '/images/logo_on_dark.svg' : '/images/logo_on_white.svg'}
          alt="ThingsDB Logo"
          style={{ width: 28, height: 28, objectFit: 'contain' }}
        />

        <Text size="1" weight="bold" color="blue">{workspace.name}</Text>
        {activeFilename && (
          <>
            <Separator orientation="vertical" size="1" />
            <Text size="1" weight="bold">{activeFilename}</Text>
          </>
        )}
      </Flex>

      {/* Center */}
      <Flex
        align="center"
        gap="2"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1
        }}
      >
        <ScopeSelector disabled={!isTiCode} />
        <Flex align="center" gap="2">

          <Button
            size="2"
            color="green"
            variant="solid"
            loading={isExecuting}
            disabled={!isTiCode}
            onClick={handleExecuteCode}
            style={{ cursor: isTiCode ? 'pointer' : 'not-allowed' }}
          >
            <PlayIcon width="14" height="14" />
          </Button>

          <Separator orientation="vertical" size="1" />

          <IconButton
            variant="ghost"
            color="gray"
            size="2"
            disabled={!isTiCode}
            onClick={() => setIsConfigOpen(true)}
            title="Edit Execution Arguments (JSON)"
            style={{ cursor: isTiCode ? 'pointer' : 'not-allowed' }}
          >
            <GearIcon width="16" height="16" />
          </IconButton>

        </Flex>

        {isConfigOpen && (
          <QueryVarsDialog
            onOpenChange={setIsConfigOpen}
            configJson={activeFile?.queryVars || "{ }"}
            onSave={(validJson) => updateQueryVars(activeFile?.filename || 'unknown.ti', validJson)}
          />
        )}
      </Flex>

      {/* Right side */}
      <Flex align="center" gap="2">
        <Tooltip content={appearance === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          <Button
            variant="ghost"
            onClick={toggleAppearance}
            size="2"
            style={{ cursor: 'pointer' }}
            color="gray"
          >
            {appearance === 'dark' ? <SunIcon width="16" height="16" /> : <MoonIcon width="16" height="16" />}
          </Button>
        </Tooltip>
        <Tooltip content="Logout session">
          <Button
            size="1"
            color="red"
            variant="ghost"
            onClick={handleLogout}
            style={{ cursor: 'pointer', gap: '4px' }}
          >
            <ExitIcon width="12" height="12" />
          </Button>
        </Tooltip>
      </Flex>
    </Flex>
  );
}