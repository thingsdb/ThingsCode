import React, { useState } from 'react';
import { Dialog, Button, Flex, Text, TextField, Box, IconButton, Switch, RadioGroup } from '@radix-ui/themes';
import { EyeOpenIcon, EyeNoneIcon, RocketIcon } from '@radix-ui/react-icons';
import { useWorkspaces } from '../hooks';


export default function QuickConnectModal() {
  const { quickConnect } = useWorkspaces();
  const [open, setOpen] = useState(false);

  // Connection Parameters
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState(9200);
  const [authType, setAuthType] = useState<'credentials' | 'token'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [ssl, setSsl] = useState(false);

  // Visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = async (e: React.ChangeEvent) => {
    e.preventDefault();

    quickConnect({
      name: `${host}:${port}`,
      host,
      port,
      authType,
      username: authType === 'credentials' ? username : undefined,
      password: authType === 'credentials' ? password : undefined,
      token: authType === 'token' ? token : undefined,
      ssl,
      workfolder: '',
      isTmp: true,
    });

    window.history.pushState({}, '', `/workspace/quick-connect`);
    window.dispatchEvent(new PopStateEvent('popstate')); // Force view re-render

    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger style={{ flex: 1 }}>
        <Button size="3" variant="solid" style={{ cursor: 'pointer', backgroundColor: 'var(--thingscode-blue)' }}>
          <RocketIcon width="16" height="16" /> Quick Connect
        </Button>
      </Dialog.Trigger>
      <Dialog.Content
        style={{ maxWidth: 450 }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
      >
        <Dialog.Title>
            <Flex align="center" gap="2">
            Quick Connect
            </Flex>
        </Dialog.Title>
        <Dialog.Description size="2" mb="4" color="gray">
            Establish a temporary session link. This configuration won't be saved to your workspaces list.
        </Dialog.Description>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            {/* Host & Port Configuration Row */}
            <Flex gap="3">
              <Box style={{ flexGrow: 1 }}>
                <Text as="div" size="2" weight="bold" mb="1">Host / IP</Text>
                <TextField.Root value={host} onChange={e => setHost(e.target.value)} required />
              </Box>
              <Box style={{ width: 100 }}>
                <Text as="div" size="2" weight="bold" mb="1">Port</Text>
                <TextField.Root
                  type="number"
                  value={port}
                  onChange={e => setPort(Number(e.target.value))}
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
                onValueChange={(value) => setAuthType(value as 'credentials' | 'token')}
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

            {/* Conditional Input Rendering Fields */}
            {authType === 'token' ? (
                <label>
                <Text as="div" size="2" weight="bold" mb="1">ThingsDB Access Token</Text>
                <TextField.Root type={showToken ? "text" : "password"} value={token} onChange={e => setToken(e.target.value)} required>
                    <TextField.Slot side="right" px="1">
                    <IconButton type="button" variant="ghost" color="gray" onClick={() => setShowToken(!showToken)} style={{ cursor: 'pointer' }}>
                        {showToken ? <EyeNoneIcon width="16" height="16" /> : <EyeOpenIcon width="16" height="16" />}
                    </IconButton>
                    </TextField.Slot>
                </TextField.Root>
                </label>
            ) : (
                <Flex gap="3">
                <Box style={{ flexGrow: 1 }}>
                    <Text as="div" size="2" weight="bold" mb="1">Username</Text>
                    <TextField.Root value={username} onChange={e => setUsername(e.target.value)} required />
                </Box>
                <Box style={{ flexGrow: 1 }}>
                    <Text as="div" size="2" weight="bold" mb="1">Password</Text>
                    <TextField.Root type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required>
                    <TextField.Slot side="right" px="1">
                        <IconButton type="button" variant="ghost" color="gray" onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>
                        {showPassword ? <EyeNoneIcon width="16" height="16" /> : <EyeOpenIcon width="16" height="16" />}
                        </IconButton>
                    </TextField.Slot>
                    </TextField.Root>
                </Box>
                </Flex>
            )}

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button type="button" variant="soft" color="gray">Cancel</Button>
              </Dialog.Close>
              <Button type="submit">Connect</Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>

  );
}