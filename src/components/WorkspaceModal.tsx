import React, { useState } from 'react';
import { Dialog, Flex, Text, TextField, IconButton, Button, Switch, Select, Box } from '@radix-ui/themes';
import { type Workspace } from '../types';
import { useWorkspaces } from '../hooks';
import { EyeNoneIcon, EyeOpenIcon } from '@radix-ui/react-icons';

export default function WorkspaceModal() {
  const { editingWorkspace, setEditingWorkspace, updateWorkspace } = useWorkspaces();

  const [form, setForm] = useState<Partial<Workspace>>({});

  // Visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [prevId, setPrevId] = useState<string | undefined>(undefined);

  if (editingWorkspace?.id !== prevId) {
    setPrevId(editingWorkspace?.id);
    setForm({...editingWorkspace});
  }

  if (!editingWorkspace) return null;

  const handleSave = (e: React.ChangeEvent) => {
    e.preventDefault();
    updateWorkspace(form as Workspace);
    setEditingWorkspace(null); // Close modal
  };

  return (
    <Dialog.Root open={!!editingWorkspace} onOpenChange={(open) => !open && setEditingWorkspace(null)}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Edit Workspace Settings</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Update your connection preferences for this ThingsDB node.
        </Dialog.Description>

        <form onSubmit={handleSave}>
          <Flex direction="column" gap="4">
            {/* Workspace Name Input */}
            <label>
              <Text as="div" size="2" weight="bold" mb="1">Workspace Name</Text>
              <TextField.Root
                value={form.name || ''}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>

            {/* Workfolder Input */}
            <label>
              <Text as="div" size="2" weight="bold" mb="1">Workfolder</Text>
              <TextField.Root
                placeholder="Leave empty for temporary session storage"
                value={form.workfolder || ''}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </label>

            {/* Connection Address Grid (Host & Port) */}
            <Flex gap="3">
              <Box style={{ flexGrow: 1 }}>
                <Text as="div" size="2" weight="bold" mb="1">Host / IP</Text>
                <TextField.Root
                  value={form.host || ''}
                  onChange={e => setForm({ ...form, host: e.target.value })}
                  required
                />
              </Box>
              <Box style={{ width: 100 }}>
                <Text as="div" size="2" weight="bold" mb="1">Port</Text>
                <TextField.Root
                  type="number"
                  value={form.port || ''}
                  onChange={e => setForm({ ...form, port: parseInt(e.target.value) || 0 })}
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
              <Switch
                checked={!!form.ssl}
                onCheckedChange={(checked) => setForm({ ...form, ssl: checked })}
              />
            </Flex>

            <hr style={{ border: '0', borderTop: '1px solid var(--gray-5)' }} />

            {/* Auth Strategy Selection Flow */}
            <label>
              <Text as="div" size="2" weight="bold" mb="1">Authentication Strategy</Text>
              <Select.Root
                value={form.authType || 'credentials'}
                onValueChange={(val: 'credentials' | 'token') => setForm({ ...form, authType: val })}
              >
                <Select.Trigger className="w-full" />
                <Select.Content>
                  <Select.Item value="credentials">Username & Password</Select.Item>
                  <Select.Item value="token">Authorization Token</Select.Item>
                </Select.Content>
              </Select.Root>
            </label>

            {/* Dynamic Rendering Conditions based on Selected Auth Type */}
            {form.authType === 'token' ? (
              <label>
                <Text as="div" size="2" weight="bold" mb="1">ThingsDB Token</Text>
                <TextField.Root
                  type={showToken ? "text" : "password"}
                  placeholder="Enter access token..."
                  value={form.token || ''}
                  onChange={e => setForm({ ...form, token: e.target.value })}
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
                  <TextField.Root
                    value={form.username || ''}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                  />
                </Box>
                <Box style={{ flexGrow: 1 }}>
                  <Text as="div" size="2" weight="bold" mb="1">Password</Text>
                  <TextField.Root
                    type={showPassword ? "text" : "password"}
                    value={form.password || ''}
                    onChange={e => setForm({ ...form, password: e.target.value })}
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

          {/* Action Row */}
          <Flex gap="3" mt="5" justify="end">
            <Dialog.Close>
              <Button type="button" variant="soft" color="gray" onClick={() => setEditingWorkspace(null)}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="submit">Save Changes</Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}