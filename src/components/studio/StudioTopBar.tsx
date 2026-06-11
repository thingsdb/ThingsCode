import { Flex, Text, Button, Tooltip, IconButton, Separator, Box, Badge } from '@radix-ui/themes';
import { ExitIcon, MoonIcon, PlayIcon, SunIcon, UpdateIcon, GitHubLogoIcon, ReaderIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, CubeIcon, PersonIcon, MixerHorizontalIcon } from '@radix-ui/react-icons';
import { useActiveWorkspace, useWebSocket } from '../../hooks';
import { useTheme } from '../../hooks';
import ScopeSelector from './ScopeSelector';
import { useEffect, useState } from 'react';
import QueryVarsDialog from './QueryVarsDialog';
import AboutModal from '../AboutModal';
import { Search } from '..';
import { SearchIndexType, type SearchRecord } from '../../types';
import ThingExplorerModal from '../ThingExplorerModal';
import MyUserModal from './MyUserModal';

export default function StudioTopBar() {
  const { status, emit } = useWebSocket();
  const { loading, activeScope, activeFile, setActiveScopeState, setActiveFile, updateQueryVars, activeFilename, refreshScopes, activeContent, workspace, isExecuting, execCode, scopes, files } = useActiveWorkspace();
  const { appearance, toggleAppearance } = useTheme();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [isMyUserOpen, setIsMyUserOpen] = useState(false);

  const isTiCode = activeFilename && activeFilename.endsWith('.ti');
  const isCollectionScope = activeScope && activeScope.startsWith('@collection:');

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
    execCode(activeFile.filename, activeScope, activeContent, activeFile.queryVars || null);
  };

  const handleRefreshScopes = async () => {
    setIsRefreshing(true);
    try {
      await refreshScopes();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearchSelect = (selection: SearchRecord) => {
    if (selection.type === SearchIndexType.File) {
      setActiveFile(selection.name);
    } else if (selection.type === SearchIndexType.Scope) {
      setActiveScopeState(selection.name);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        const radixDialogExists = document.querySelector('[data-state="open"][class*="DialogContent"]');
        const radixOverlayExists = document.querySelector('[class*="DialogOverlay"]');

        if (!isSearchOpen && !radixDialogExists && !radixOverlayExists) {
          setIsSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchOpen]);

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
        <Box
          onClick={() => setIsAboutOpen(true)}
          style={{
            cursor: 'pointer',
            borderRadius: 'var(--radius-2)',
            padding: '4px',
            margin: '-4px',
            display: 'inline-flex',
            alignItems: 'center',
            userSelect: 'none',
          }}
          title="About ThingsCode"
        >
          <img
            src={appearance === 'dark' ? '/images/logo_on_dark.svg' : '/images/logo_on_white.svg'}
            alt="ThingsDB Logo"
            style={{ width: 28, height: 28, objectFit: 'contain' }}
          />
        </Box>

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
        <ScopeSelector disabled={loading} />

        <Flex align="center" gap="2">
          <Button
            size="2"
            color="green"
            variant="solid"
            loading={isExecuting || isRefreshing}
            disabled={!isTiCode}
            onClick={handleExecuteCode}
            style={{ cursor: !isTiCode ? 'not-allowed' : 'pointer' }}
          >
            <PlayIcon width="14" height="14" />
          </Button>

          <Separator orientation="vertical" size="1" />

          <IconButton
            variant="ghost"
            color="gray"
            size="2"
            disabled={!isTiCode || isRefreshing}
            onClick={() => setIsConfigOpen(true)}
            title="Edit Runtime Arguments"
            style={{ cursor: !isTiCode || isRefreshing ? 'not-allowed' : 'pointer' }}
          >
            <MixerHorizontalIcon width="16" height="16" />
          </IconButton>

          <Separator orientation="vertical" size="1" />

          <IconButton
            variant="ghost"
            color="gray"
            size="2"
            disabled={isRefreshing || loading}
            onClick={() => handleRefreshScopes()}
            title="Refresh Scopes"
            style={{ cursor: isRefreshing || loading ? 'not-allowed' : 'pointer' }}
          >
            <UpdateIcon width="16" height="16" />
          </IconButton>

          <Separator orientation="vertical" size="1" />

          <IconButton
            variant="ghost"
            color="gray"
            size="2"
            disabled={!isCollectionScope || isRefreshing || loading || isExplorerOpen}
            onClick={() => setIsExplorerOpen(true)}
            title="Open Thing Explorer"
            style={{ cursor: !isCollectionScope || isRefreshing || loading || isExplorerOpen ? 'not-allowed' : 'pointer' }}
          >
            <CubeIcon width="16" height="16" />
          </IconButton>

          {workspace.type && <Separator orientation="vertical" size="1" /> }

          {workspace.type === 'production' && (
            <Badge color="red" variant="surface" size="2" style={{ letterSpacing: '0.05em' }}>
              <ExclamationTriangleIcon width="14" height="14" />
              <Text size="1" weight="bold">PRODUCTION</Text>
            </Badge>
          )}

          {workspace.type === 'staging' && (
            <Badge color="amber" variant="surface" size="2" style={{ letterSpacing: '0.05em' }}>
              <Text size="1" weight="bold">STAGING</Text>
            </Badge>
          )}

          {workspace.type === 'development' && (
            <Badge color="iris" variant="outline" size="2" style={{ letterSpacing: '0.05em', borderColor: 'var(--blue-5)' }}>
              <Text size="1" weight="medium">DEVELOPMENT</Text>
            </Badge>
          )}

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
        <Tooltip content="Open ThingsDB GitHub organization">
          <IconButton
            variant="ghost"
            size="2"
            color="gray"
            style={{ cursor: 'pointer' }}
            asChild
          >
            <a
              href="https://github.com/thingsdb"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubLogoIcon width="16" height="16" />
            </a>
          </IconButton>
        </Tooltip>

        {/* DOCUMENTATION LINK */}
        <Tooltip content="Open ThingsDB documentation page">
          <IconButton
            variant="ghost"
            size="2"
            color="gray"
            style={{ cursor: 'pointer' }}
            asChild
          >
            <a
              href="https://docs.thingsdb.io/v1/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ReaderIcon width="16" height="16" />
            </a>
          </IconButton>
        </Tooltip>

        <Separator orientation="vertical" size="1" />

        <Tooltip content="Search files or scopes (Ctrl+p)">
          <Button
            variant="ghost"
            onClick={() => setIsSearchOpen(true)}
            disabled={isSearchOpen}
            size="2"
            style={{ cursor: 'pointer' }}
            color="gray"
          >
            <MagnifyingGlassIcon width="16" height="16" />
          </Button>
        </Tooltip>

        <Separator orientation="vertical" size="1" />

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

        <Separator orientation="vertical" size="1" />

        <Tooltip content="View user profile">
          <Button
            variant="ghost"
            onClick={() => setIsMyUserOpen(true)}
            size="2"
            style={{ cursor: 'pointer' }}
            color="gray"
          >
            <PersonIcon width="16" height="16" />
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
      <AboutModal isOpen={isAboutOpen} onOpenChange={setIsAboutOpen} />
      {isSearchOpen && (
        <Search
          files={files}
          scopes={scopes}
          onClose={() => setIsSearchOpen(false)}
          onSelect={handleSearchSelect}
        />
      )}
      {isExplorerOpen && isCollectionScope && (
        <ThingExplorerModal
          scope={activeScope}
          onClose={() => setIsExplorerOpen(false)}
        />
      )}
      {isMyUserOpen && (
        <MyUserModal
          onClose={() => setIsMyUserOpen(false)}
        />
      )}
    </Flex>
  );
}