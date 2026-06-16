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
import DiagramLauncher from '../diagram/DiagramLauncher';
import { isDialogOpen } from '../../utils';


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

  const isTiCode = activeFilename?.endsWith('.ti') ?? false;
  const isCollectionScope = activeScope?.startsWith('@collection:') ?? false;

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
    void execCode(activeFile.filename, activeScope, activeContent, activeFile.queryVars ?? null);
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
    } else {
      setActiveScopeState(selection.name);  // Scope
    }
  };



  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        if (!isSearchOpen && !isDialogOpen()) {
          setIsSearchOpen(true);
        }
      }
      if (event.ctrlKey && event.key === 'e') {
        event.preventDefault();
        if (!isExplorerOpen && !isDialogOpen()) {
          setIsExplorerOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchOpen, isExplorerOpen]);

  return (
    <Flex
      px="3"
      align="center"
      justify="between"
      className="h-10 border-b border-[var(--gray-4)] bg-[var(--gray-2)] relative z-10"
    >
      {/* Left side */}
      <Flex align="center" gap="2">
        <Box
          onClick={() => { setIsAboutOpen(true); }}
          className="cursor-pointer rounded-[var(--radius-2)] p-1 -m-1 inline-flex items-center select-none"
          title="About ThingsCode"
        >
          <img
            src={appearance === 'dark' ? '/images/logo_on_dark.svg' : '/images/logo_on_white.svg'}
            alt="ThingsDB Logo"
            className="w-7 h-7 object-contain"
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
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
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
            className={!isTiCode ? 'cursor-not-allowed' : 'cursor-pointer'}
          >
            <PlayIcon width="14" height="14" />
          </Button>

          <Separator orientation="vertical" size="1" />

          <IconButton
            variant="ghost"
            color="gray"
            size="2"
            disabled={!isTiCode || isRefreshing}
            onClick={() => { setIsConfigOpen(true); }}
            title="Edit Runtime Arguments"
            className={!isTiCode || isRefreshing ? 'cursor-not-allowed' : 'cursor-pointer'}
          >
            <MixerHorizontalIcon width="16" height="16" />
          </IconButton>

          <Separator orientation="vertical" size="1" />

          <IconButton
            variant="ghost"
            color="gray"
            size="2"
            disabled={isRefreshing || loading}
            onClick={() => { void handleRefreshScopes(); }}
            title="Refresh Scopes"
            className={isRefreshing || loading ? 'cursor-not-allowed' : 'cursor-pointer'}
          >
            <UpdateIcon width="16" height="16" className={isRefreshing ? 'animate-spin' : ''} />
          </IconButton>

          <Separator orientation="vertical" size="1" />

          <IconButton
            variant="ghost"
            color="gray"
            size="2"
            disabled={!isCollectionScope || isRefreshing || loading || isExplorerOpen}
            onClick={() => { setIsExplorerOpen(true); }}
            title="Open Thing Explorer (Ctrl+e)"
            className={!isCollectionScope || isRefreshing || loading || isExplorerOpen ? 'cursor-not-allowed' : 'cursor-pointer'}
          >
            <CubeIcon width="16" height="16" />
          </IconButton>

          <Separator orientation="vertical" size="1" />

          <DiagramLauncher
            scope={activeScope ?? ''}
            disabled={!isCollectionScope || isRefreshing || loading || isExplorerOpen}
          />

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
            configJson={activeFile?.queryVars ?? "{ }"}
            onSave={(validJson) => { void updateQueryVars(activeFile?.filename ?? 'unknown.ti', validJson); }}
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
            className="cursor-pointer"
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
            className="cursor-pointer"
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
            onClick={() => { setIsSearchOpen(true); }}
            disabled={isSearchOpen}
            size="2"
            className="cursor-pointer"
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
            className="cursor-pointer"
            color="gray"
          >
            {appearance === 'dark' ? <SunIcon width="16" height="16" /> : <MoonIcon width="16" height="16" />}
          </Button>
        </Tooltip>

        <Separator orientation="vertical" size="1" />

        <Tooltip content="View user profile">
          <Button
            variant="ghost"
            onClick={() => { setIsMyUserOpen(true); }}
            size="2"
            className="cursor-pointer"
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
            onClick={() => { void handleLogout(); }}
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
          onClose={() => { setIsSearchOpen(false); }}
          onSelect={handleSearchSelect}
        />
      )}
      {isExplorerOpen && isCollectionScope && activeScope && (
        <ThingExplorerModal
          scope={activeScope}
          onClose={() => { setIsExplorerOpen(false); }}
        />
      )}
      {isMyUserOpen && (
        <MyUserModal
          onClose={() => { setIsMyUserOpen(false); }}
        />
      )}
    </Flex>
  );
}