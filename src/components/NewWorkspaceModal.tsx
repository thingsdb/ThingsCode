import React, { useState } from 'react';
import { Dialog, Flex, Text, TextField, IconButton, Button, Switch, RadioGroup, Box, Select } from '@radix-ui/themes';
import { PlusIcon, EyeOpenIcon, EyeNoneIcon  } from '@radix-ui/react-icons';
import { useWorkspaces } from '../hooks';
import type { WorkspaceType } from '../types';

export default function NewWorkspaceModal() {
  const { addWorkspace } = useWorkspaces();
  const [open, setOpen] = useState(false);

  // Form states initialized to clean defaults
  const [name, setName] = useState('');
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState(9200);
  const [authType, setAuthType] = useState<'credentials' | 'token'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [ssl, setSsl] = useState(false);
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>('development');

  // Folder tracking state
  const [customWorkfolder, setCustomWorkfolder] = useState<string | null>(null);

  // Visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const sanitizedName = name.replace(/[^a-zA-Z0-9-_ ]/g, '');
  const workfolder = customWorkfolder ?? `~/ThingsCode/${sanitizedName}`;

  const resetForm = () => {
    setName('');
    setCustomWorkfolder(null);
    setHost('127.0.0.1');
    setPort(9200);
    setSsl(false);
    setAuthType('credentials');
    setUsername('');
    setPassword('');
    setToken('');
    setWorkspaceType('development');
  };

  const handleSubmit = async (e: React.ChangeEvent) => {
    e.preventDefault();

    await addWorkspace({
      name,
      host,
      port,
      authType,
      username: authType === 'credentials' ? username : undefined,
      password: authType === 'credentials' ? password : undefined,
      token: authType === 'token' ? token : undefined,
      ssl,
      workfolder,
      isTmp: workfolder === "",
      isQuickConnect: false,
      type: workspaceType,
    });

    resetForm();
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger style={{ flex: 1 }}>
        <Button size="3" variant="solid" style={{ cursor: 'pointer', backgroundColor: 'var(--thingscode-blue)' }}>
          <PlusIcon width="16" height="16" /> New Workspace
        </Button>
      </Dialog.Trigger>

      <Dialog.Content
        style={{ maxWidth: 450 }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
      >
        <Dialog.Title>Create New Workspace</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Add a node config profile and link it to a local workspace path.
        </Dialog.Description>

        <form onSubmit={(e) => { void handleSubmit(e); }}>
          <Flex direction="column" gap="4">
            {/* Name Input */}
            <label>
              <Text as="div" size="2" weight="bold" mb="1">Workspace Name</Text>
              <TextField.Root
                placeholder="e.g. Production Node"
                value={name}
                onChange={(e) => { setName(e.target.value); }}
                required
              />
            </label>

            {/* Workfolder Input */}
            <label>
              <Text as="div" size="2" weight="bold" mb="1">Workfolder</Text>
              <TextField.Root
                placeholder="Leave empty for temporary session storage"
                value={workfolder}
                onChange={(e) => {
                  setCustomWorkfolder(e.target.value);
                }}
                required
              />
            </label>

            {/* Workspace Type Selection */}
            <label>
              <Text as="div" size="2" weight="bold" mb="-1">Type</Text>
              <Text size="1" color="gray">Controls a visual badge to warn you of the current context</Text>
              <Select.Root
                value={workspaceType}
                onValueChange={(val) => { setWorkspaceType(val as WorkspaceType); }}
              >
                <Select.Trigger style={{ width: '100%', cursor: 'pointer' }} />
                <Select.Content>
                  <Select.Item value="development">
                    <Flex align="center" gap="2">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--iris-9)' }} />
                      Development
                    </Flex>
                  </Select.Item>
                  <Select.Item value="staging">
                    <Flex align="center" gap="2">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--amber-9)' }} />
                      Staging
                    </Flex>
                  </Select.Item>
                  <Select.Item value="production">
                    <Flex align="center" gap="2">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--red-9)' }} />
                      Production
                    </Flex>
                  </Select.Item>
                </Select.Content>
              </Select.Root>
            </label>

            <hr style={{ border: '0', borderTop: '1px solid var(--gray-5)' }} />

            {/* Connection Address Grid (Host & Port) */}
            <Flex gap="3">
              <Box style={{ flexGrow: 1 }}>
                <Text as="div" size="2" weight="bold" mb="1">Host / IP</Text>
                <TextField.Root value={host} onChange={(e) => { setHost(e.target.value); }} required />
              </Box>
              <Box style={{ width: 100 }}>
                <Text as="div" size="2" weight="bold" mb="1">Port</Text>
                <TextField.Root
                  type="number"
                  value={port}
                  onChange={(e) => { setPort(parseInt(e.target.value) || 0); }}
                  required
                />
              </Box>
            </Flex>

            {/* SSL Toggle Switch Line */}
            <Flex align="center" justify="between" mt="1">
              <Flex direction="column">
                <Text size="2" weight="bold">Secure Connection (SSL / TLS)</Text>
                <Text size="1" color="gray">Encrypted network traffic</Text>
              </Flex>
              <Switch checked={ssl} onCheckedChange={setSsl} />
            </Flex>

            <hr style={{ border: '0', borderTop: '1px solid var(--gray-5)' }} />

            {/* Authentication Choice */}
            <Box>
              <Text as="div" size="2" weight="bold" mb="2">Authentication Mode</Text>
              <RadioGroup.Root
                value={authType}
                onValueChange={(value) => { setAuthType(value as 'credentials' | 'token'); }}
                size="2"
                variant="surface"
              >
                <Flex gap="4">
                  <Text as="label" size="2" style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                    <RadioGroup.Item value="credentials" />
                    User Credentials
                  </Text>
                  <Text as="label" size="2" style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                    <RadioGroup.Item value="token" />
                    Token Security Key
                  </Text>
                </Flex>
              </RadioGroup.Root>
            </Box>

            {/* Auth */}
            {authType === 'token' ? (
              <label>
                <Text as="div" size="2" weight="bold" mb="1">ThingsDB Token</Text>
                <TextField.Root
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={e => { setToken(e.target.value); }}
                  required
                >
                  <TextField.Slot side="right" px="1">
                    <IconButton
                      type="button"
                      variant="ghost"
                      color="gray"
                      onClick={() => { setShowToken(!showToken); }}
                      className="cursor-pointer"
                    >
                      {showToken ? <EyeNoneIcon width="16" height="16" /> : <EyeOpenIcon width="16" height="16" />}
                    </IconButton>
                  </TextField.Slot>
                </TextField.Root>
              </label>
            ) : (
              <Flex gap="3">
                <Box style={{ flexGrow: 1 }}>
                  <Text as="div" size="2" weight="bold" mb="1">Username</Text>
                  <TextField.Root value={username} onChange={e => { setUsername(e.target.value); }} />
                </Box>
                <Box style={{ flexGrow: 1 }}>
                  <Text as="div" size="2" weight="bold" mb="1">Password</Text>
                  <TextField.Root
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); }}
                  >
                    <TextField.Slot side="right" px="1">
                      <IconButton
                        type="button"
                        variant="ghost"
                        color="gray"
                        onClick={() => { setShowPassword(!showPassword); }}
                        className="cursor-pointer"
                      >
                        {showPassword ? <EyeNoneIcon width="16" height="16" /> : <EyeOpenIcon width="16" height="16" />}
                      </IconButton>
                    </TextField.Slot>
                  </TextField.Root>
                </Box>
              </Flex>
            )}
          </Flex>

          <Flex gap="3" mt="5" justify="end">
            <Dialog.Close>
              <Button type="button" variant="soft" color="gray">Cancel</Button>
            </Dialog.Close>
            <Button type="submit">Create Workspace</Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}