import { Box, Card, Flex, Grid, Heading, Text, TextField, Button, IconButton } from '@radix-ui/themes';
import { MagnifyingGlassIcon, Pencil2Icon, TrashIcon, Link2Icon } from '@radix-ui/react-icons';
import { ActiveWorkspaceProvider } from '../providers';
import { useActiveWorkspaceId, useWorkspaces } from '../hooks';
import { NewWorkspaceModal, WorkspaceModal } from './'
import QuickConnectModal from './QuickConnectModal';

export default function WorkspaceLauncher() {
  const { filteredWorkspaces, searchQuery, setSearchQuery, deleteWorkspace, appearance, setEditingWorkspace, editingWorkspace } = useWorkspaces();
  const activeWorkspaceId = useActiveWorkspaceId();

  // Routing mechanism
  const handleWorkspaceClick = (id: string) => {
    window.history.pushState({}, '', `/workspace/${id}`);
    window.dispatchEvent(new PopStateEvent('popstate')); // Force view re-render
  };

  // If a workspace is active in the URL, open the workspace
  if (activeWorkspaceId) {
    return (
      <ActiveWorkspaceProvider>
        <Box p="5">

          <Button variant="outline" onClick={() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}>
            ← Back to All Workspaces
          </Button>
          <Heading mt="4">
            Active Workspace Panel ID: {activeWorkspaceId}
          </Heading>
        </Box>
      </ActiveWorkspaceProvider>
    );
  }

  return (
    <Box p="6" style={{ maxWidth: 800, margin: '0 auto' }}>

      {/* Header */}
      <Flex direction="column" align="center" gap="3" mb="7" mt="4">
        <img
          src={appearance === 'dark' ? '/images/logo_on_dark.svg' : '/images/logo_on_white.svg'}
          alt="ThingsDB Logo"
          style={{ width: 100, height: 100, objectFit: 'contain' }}
        />

        <Heading size="8" weight="bold" style={{ letterSpacing: '-1px' }}>
          <span style={{ color: 'var(--gray-12)' }}>Things</span>
          <span style={{ color: 'var(--thingscode-blue)' }}>Code</span>
        </Heading>

        <Text color="gray" size="2">Select or manage your workspaces</Text>
      </Flex>

      <Flex direction="column" gap="4" mb="6">
        <Box style={{ flexGrow: 1 }}>
          <TextField.Root
            placeholder="Search by name, host, or port..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="3"
            autoFocus
          >
            <TextField.Slot>
              <MagnifyingGlassIcon height="16" width="16" />
            </TextField.Slot>
          </TextField.Root>
        </Box>
        <Flex width="100%" gap="4">
          <QuickConnectModal />
          <NewWorkspaceModal />
        </Flex>
      </Flex>

      <Grid columns={{ initial: '1', sm: '2' }} gap="3" width="auto">
        {filteredWorkspaces.map((ws) => (
          <Card
            key={ws.id}
            size="2"
            style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
          >
            <Flex justify="between" align="center">
              {/* Left Side clickable selection space */}
              <Box
                onClick={() => handleWorkspaceClick(ws.id)}
                style={{ flexGrow: 1 }}
              >
                <Heading size="3" mb="1">{ws.name}</Heading>
                <Flex align="center" gap="1">
                    <Link2Icon width="12" height="12" style={{ color: 'var(--gray-9)' }} />
                    <Text size="1" color="gray">
                        {ws.host}:{ws.port}
                    </Text>
                </Flex>
              </Box>

              {/* Action Buttons Right Row Side */}
              <Flex gap="2" style={{ zIndex: 10 }}>
                <IconButton
                  variant="ghost"
                  color="gray"
                  onClick={() => setEditingWorkspace(ws)}
                >
                  <Pencil2Icon width="16" height="16" />
                </IconButton>

                {/* Live Delete Action Button */}
                <IconButton
                  variant="ghost"
                  color="red"
                  onClick={() => {
                    if(confirm(`Are you sure you want to remove ${ws.name}?`)) {
                      deleteWorkspace(ws.id);
                    }
                  }}
                >
                  <TrashIcon width="16" height="16" />
                </IconButton>
              </Flex>
            </Flex>
          </Card>
        ))}
      </Grid>

      {filteredWorkspaces.length === 0 && (
        <Text color="gray" size="2" align="center" as="div" mt="4">
          No matching workspaces found.
        </Text>
      )}
      <WorkspaceModal key={editingWorkspace?.id || 'new-workspace'} />
    </Box>
  );
}