import { useState } from 'react';
import { Dialog, Flex, Button, Box, Text, Badge, Tabs, DataList, ScrollArea, Table, Tooltip, IconButton } from '@radix-ui/themes';
import {
  PersonIcon,
  CalendarIcon,
  LayersIcon,
  LockOpen1Icon,
  CheckCircledIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
  CheckIcon,
  CopyIcon
} from '@radix-ui/react-icons';
import type { User } from '../../types';

interface UserModalProps {
  onClose: (open: boolean) => void;
  user: User;
}

export default function UserModal({ onClose, user }: UserModalProps) {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [copied, setCopied] = useState<string | null>(null);

  if (!user) return null;

  // Helper helper to color-code user access
  const renderPrivilegeBadges = (privString: string) => {
    if (!privString) return <Badge color="gray">NONE</Badge>;

    if (privString === 'FULL') return <Badge color="crimson" variant="solid" style={{ fontWeight: 'bold' }}>FULL</Badge>;
    if (privString === 'USER') return <Badge color="iris" variant="solid" style={{ fontWeight: 'bold' }}>USER</Badge>;

    const tokens = privString.split('|');
    return (
      <Flex gap="1" wrap="wrap">
        {tokens.map((token) => {
          let badgeColor: 'blue' | 'orange' | 'amber' | 'green' | 'purple' = 'blue';

          switch (token.trim()) {
            case 'CHANGE': badgeColor = 'orange'; break;
            case 'GRANT': badgeColor = 'amber'; break;
            case 'JOIN': badgeColor = 'purple'; break;
            case 'RUN': badgeColor = 'green'; break;
            case 'QUERY': badgeColor = 'blue'; break;
          }

          return (
            <Badge key={token} color={badgeColor} variant="soft" style={{ fontSize: '10px', fontWeight: 'bold' }}>
              {token}
            </Badge>
          );
        })}
      </Flex>
    );
  };

  const handleCopyToClipboard = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy token key:', err);
    }
  };

  return (
    <Dialog.Root defaultOpen onOpenChange={onClose}>
      <Dialog.Content aria-describedby={undefined} style={{ width: '65vw', maxWidth: '1024px', padding: '16px' }}>

        {/* HEADER */}
        <Box flexShrink="0" mb="3">
          <Dialog.Title size="3" style={{ margin: 0 }}>
            <Flex align="center" justify="between">
              <Flex align="center" gap="2">
                <PersonIcon width="18" height="18" color="var(--iris-9)" />
                <Badge size="2" color="iris" variant="surface" style={{ fontWeight: 'bold' }}>
                  {user.name}
                </Badge>
                <Text size="3" weight="bold" color="gray">User Profile</Text>
              </Flex>
            </Flex>
          </Dialog.Title>
        </Box>

        <Tabs.Root value={activeTab} onValueChange={setActiveTab} style={{
          height: '52vh',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          <Tabs.List size="2" style={{ flexShrink: 0 }}>
            <Tabs.Trigger value="general" style={{ cursor: 'pointer' }}>General</Tabs.Trigger>
            <Tabs.Trigger value="access" style={{ cursor: 'pointer' }}>
              Scope Access ({user.access?.length || 0})
            </Tabs.Trigger>
            <Tabs.Trigger value="tokens" style={{ cursor: 'pointer' }}>
              Tokens ({user.tokens?.length || 0})
            </Tabs.Trigger>
            <Tabs.Trigger value="whitelists" style={{ cursor: 'pointer' }}>Whitelists</Tabs.Trigger>
          </Tabs.List>

          <Box pt="3" style={{ flexGrow: 1, minHeight: 0 }}>

            {/* GENERAL */}
            <Tabs.Content value="general" style={{ height: '100%' }}>
              <DataList.Root size="2" style={{ '--data-list-label-width': '180px', '--data-list-row-gap': '12px' } as React.CSSProperties}>
                <DataList.Item>
                  <DataList.Label color="gray">Username Handle</DataList.Label>
                  <DataList.Value>
                    <Text weight="bold" color="iris" style={{ fontFamily: 'monospace' }}>{user.name}</Text>
                  </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label color="gray">Created Timestamp</DataList.Label>
                  <DataList.Value>
                    <Flex align="center" gap="1" style={ {color: "gray" }}>
                      <CalendarIcon width="14" height="14" />
                      <Text size="2">{new Date(user.createdAt * 1000).toLocaleString(undefined, {hour12: false})}</Text>
                    </Flex>
                  </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label color="gray">Password Authentication</DataList.Label>
                  <DataList.Value>
                    <Text size="2">{user.hasPassword ? 'Enabled' : 'Disabled (Token access only)'}</Text>
                  </DataList.Value>
                </DataList.Item>
              </DataList.Root>
            </Tabs.Content>

            {/* ACCESS */}
            <Tabs.Content value="access" style={{ height: '100%', maxHeight: '100%' }}>
              <Flex direction="column" style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
                {(!user.access || user.access.length === 0) ? (
                  <Flex p="4" align="center" justify="center" gap="2" style={{ color: 'var(--gray-8)' }}>
                    <InfoCircledIcon /> <Text size="2" style={{ fontStyle: 'italic' }}>No scope privileges.</Text>
                  </Flex>
                ) : (
                  <ScrollArea type="auto" scrollbars="vertical">
                    <Table.Root variant="surface">
                      <Table.Header>
                        <Table.Row style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <Table.ColumnHeaderCell style={{ width: '40%' }}>Scope</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Granted Privileges</Table.ColumnHeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body style={{ fontFamily: 'monospace' }}>
                        {user.access.map((acc, index) => (
                          <Table.Row key={`${acc.scope}-${index}`} align="center">
                            <Table.RowHeaderCell>
                              <Flex align="center" gap="2">
                                <LayersIcon color="var(--gray-7)" width="13" height="13" />
                                <Text size="2" weight="medium">{acc.scope}</Text>
                              </Flex>
                            </Table.RowHeaderCell>
                            <Table.Cell>{renderPrivilegeBadges(acc.privileges)}</Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </ScrollArea>
                )}
              </Flex>
            </Tabs.Content>

            {/* TOKENS */}
            <Tabs.Content value="tokens" style={{ height: '100%', maxHeight: '100%' }}>
              <Flex direction="column" style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
                {(!user.tokens || user.tokens.length === 0) ? (
                  <Flex p="4" align="center" justify="center" gap="2" style={{ color: 'var(--gray-8)' }}>
                    <LockOpen1Icon /> <Text size="2" style={{ fontStyle: 'italic' }}>No access tokens.</Text>
                  </Flex>
                ) : (
                <ScrollArea type="auto" scrollbars="vertical">
                    <Table.Root variant="surface">
                      <Table.Header>
                        <Table.Row style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <Table.ColumnHeaderCell>Token</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell style={{ width: '120px' }}>Status</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Created On</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Expiration Time</Table.ColumnHeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body style={{ fontFamily: 'monospace' }}>
                        {user.tokens.map((token) => {
                          const isExpired = token.status === 'EXPIRED';
                          return (
                            <Table.Row key={token.key} align="center" style={{ opacity: isExpired ? 0.55 : 1 }}>
                              <Table.RowHeaderCell style={{ fontSize: '12px', fontWeight: 600 }}>
                                <Flex align="center" gap="2">
                                  <Tooltip content={copied === token.key ? "Copied!" : "Copy token key to clipboard"}>
                                    <IconButton
                                      size="1"
                                      variant="soft"
                                      color={copied === token.key ? "green" : "gray"}
                                      highContrast={copied !== token.key}
                                      onClick={() => handleCopyToClipboard(token.key)}
                                      style={{
                                        cursor: 'pointer',
                                        boxShadow: 'var(--shadow-2)',
                                        pointerEvents: 'auto'
                                      }}
                                    >
                                      {copied === token.key ? <CheckIcon width="14" height="14" /> : <CopyIcon width="14" height="14" />}
                                    </IconButton>
                                  </Tooltip>
                                  <Text style={{ color: isExpired ? 'var(--gray-9)' : 'var(--iris-11)' }}>{token.key}</Text>
                                </Flex>
                              </Table.RowHeaderCell>
                              <Table.Cell>
                                {isExpired ? (
                                  <Badge color="red" variant="surface" style={{ gap: '3px' }}>
                                    <ExclamationTriangleIcon width="10" height="10" /> EXPIRED
                                  </Badge>
                                ) : (
                                  <Badge color="green" variant="surface" style={{ gap: '3px' }}>
                                    <CheckCircledIcon width="10" height="10" /> OK
                                  </Badge>
                                )}
                              </Table.Cell>
                              <Table.Cell style={{ color: 'var(--gray-10)', fontSize: '11px' }}>
                                {new Date(token.createdOn).toLocaleString(undefined, {hour12: false})}
                              </Table.Cell>
                              <Table.Cell style={{ fontSize: '11px', fontWeight: token.expirationTime === 'never' ? 'bold' : 'normal' }}>
                                {token.expirationTime === 'never' ? (
                                  'Never'
                                ) : (
                                  new Date(token.expirationTime).toLocaleString(undefined, {hour12: false})
                                )}
                              </Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table.Root>
                  </ScrollArea>
                )}
              </Flex>
            </Tabs.Content>

            {/* WHITELISTS */}
            <Tabs.Content value="whitelists" style={{ height: '100%', overflowY: 'auto' }}>
              <Flex direction="column" gap="4">

                {/* PROCEDURES */}
                <Box style={{ border: '1px solid var(--gray-4)', borderRadius: 'var(--radius-3)', padding: '12px', backgroundColor: 'var(--gray-1)' }}>
                  <Text size="2" weight="bold" color="gray" style={{ display: 'block', marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>
                    Allowed Procedures
                  </Text>
                  {user.whitelists?.procedures && user.whitelists.procedures.length > 0 ? (
                    <Flex gap="2" wrap="wrap">
                      {user.whitelists.procedures.map((proc) => (
                        <Badge key={proc} color={proc.startsWith('/') ? "amber" : "iris"} variant="soft" style={{ fontFamily: 'monospace' }}>
                          {proc}
                        </Badge>
                      ))}
                    </Flex>
                  ) : (
                    <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
                      No restrictions by whitelist.
                    </Text>
                  )}
                </Box>

                {/* ROOMS */}
                <Box style={{ border: '1px solid var(--gray-4)', borderRadius: 'var(--radius-3)', padding: '12px', backgroundColor: 'var(--gray-1)' }}>
                  <Text size="2" weight="bold" color="gray" style={{ display: 'block', marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>
                    Allowed Rooms
                  </Text>
                  {user.whitelists?.rooms && user.whitelists.rooms.length > 0 ? (
                    <Flex gap="2" wrap="wrap">
                      {user.whitelists.rooms.map((room) => (
                        <Badge key={room} color={room.startsWith('/') ? "amber" : "iris"} variant="outline" style={{ fontFamily: 'monospace' }}>
                          {room}
                        </Badge>
                      ))}
                    </Flex>
                  ) : (
                    <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
                      No restrictions by whitelist.
                    </Text>
                  )}
                </Box>

              </Flex>
            </Tabs.Content>
          </Box>
        </Tabs.Root>

        {/* FOOTER */}
        <Flex gap="3" justify="end" flexShrink="0" style={{ paddingTop: '12px', marginTop: '12px', borderTop: '1px solid var(--gray-4)' }}>
          <Dialog.Close>
            <Button type="button" variant="soft" color="gray" size="2" style={{ cursor: 'pointer' }}>
              Close
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}