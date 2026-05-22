import React, { useState } from 'react';
import { Dialog, Flex, Text, TextField, IconButton, Button, Switch, Select, Box } from '@radix-ui/themes';
import { PlusIcon, EyeOpenIcon, EyeNoneIcon  } from '@radix-ui/react-icons';
import { useWorkspaces } from '../hooks';

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

  // 📁 Folder tracking state
  const [workfolder, setWorkfolder] = useState('~/ThingsCode/');
  const [customWorkfolder, setCustomWorkfolder] = useState<string | null>(null);

  // Visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const sanitizedName = name.replace(/[^a-zA-Z0-9-_ ]/g, '');
  const activeWorkfolder = customWorkfolder !== null
    ? customWorkfolder
    : `~/ThingsCode/${sanitizedName}`;

  const handleSubmit = (e: React.ChangeEvent) => {
    e.preventDefault();

    addWorkspace({
      name,
      host,
      port,
      authType,
      username: authType === 'credentials' ? username : undefined,
      password: authType === 'credentials' ? password : undefined,
      token: authType === 'token' ? token : undefined,
      ssl,
      workfolder,
    });

    // Reset Form and close
    setName('');
    setHost('127.0.0.1');
    setPort(9200);
    setWorkfolder('~/ThingsCode/');
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button size="3" variant="solid" style={{ cursor: 'pointer', backgroundColor: 'var(--thingscode-blue)' }}>
          <PlusIcon width="16" height="16" /> New Workspace
        </Button>
      </Dialog.Trigger>

      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Create New Workspace</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Add a node config profile and link it to a local workspace path.
        </Dialog.Description>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            {/* Name Input */}
            <label>
              <Text as="div" size="2" weight="bold" mb="1">Workspace Name</Text>
              <TextField.Root
                placeholder="e.g. Production Cluster"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            {/* Workfolder Input */}
            <label>
              <Text as="div" size="2" weight="bold" mb="1">Workfolder</Text>
              <TextField.Root
                placeholder="Leave empty for temporary session storage"
                value={activeWorkfolder}
                onChange={(e) => {
                  setCustomWorkfolder(e.target.value);
                }}
                required
              />
            </label>

            {/* Connection Address Grid (Host & Port) */}
            <Flex gap="3">
              <Box style={{ flexGrow: 1 }}>
                <Text as="div" size="2" weight="bold" mb="1">Host / IP</Text>
                <TextField.Root value={host} onChange={(e) => setHost(e.target.value)} required />
              </Box>
              <Box style={{ width: 100 }}>
                <Text as="div" size="2" weight="bold" mb="1">Port</Text>
                <TextField.Root type="number" value={port} onChange={(e) => setPort(parseInt(e.target.value) || 0)} required />
              </Box>
            </Flex>

            {/* SSL Switch */}
            <Flex align="center" justify="between" mt="1">
              <Text size="2" weight="bold">Secure Connection (SSL / TLS)</Text>
              <Switch checked={ssl} onCheckedChange={setSsl} />
            </Flex>

            <hr style={{ border: '0', borderTop: '1px solid var(--gray-5)' }} />

            {/* Authentication Choice */}
            <label>
              <Text as="div" size="2" weight="bold" mb="1">Authentication Strategy</Text>
              <Select.Root value={authType} onValueChange={(val: 'credentials' | 'token') => setAuthType(val)}>
                <Select.Trigger className="w-full" />
                <Select.Content>
                  <Select.Item value="credentials">Username & Password</Select.Item>
                  <Select.Item value="token">Authorization Token</Select.Item>
                </Select.Content>
              </Select.Root>
            </label>

            {authType === 'token' ? (
              <label>
                <Text as="div" size="2" weight="bold" mb="1">ThingsDB Token</Text>
                <TextField.Root
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  required
                >
                  <TextField.Slot side="right" px="1">
                    <IconButton
                      type="button"
                      variant="ghost"
                      color="gray"
                      onClick={() => setShowToken(!showToken)}
                      style={{ cursor: 'pointer' }}
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
                  <TextField.Root value={username} onChange={e => setUsername(e.target.value)} />
                </Box>
                <Box style={{ flexGrow: 1 }}>
                  <Text as="div" size="2" weight="bold" mb="1">Password</Text>
                  <TextField.Root
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  >
                    <TextField.Slot side="right" px="1">
                      <IconButton
                        type="button"
                        variant="ghost"
                        color="gray"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ cursor: 'pointer' }}
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