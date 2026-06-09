import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flex, Text, Card, Box, IconButton, Tooltip, TextField } from '@radix-ui/themes';
import { UpdateIcon, MagnifyingGlassIcon, Cross2Icon } from '@radix-ui/react-icons';
import { useActiveWorkspaceId, useWebSocket } from '../../hooks';
import type { User } from '../../types';
import { errStr } from '../../utils';
import UserModal from './UserModal';
// import UserModal from './UserModal';


export default function UsersPanel() {
  const { emit } = useWebSocket();
  const activeId = useActiveWorkspaceId();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewUser, setViewUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await emit('FETCH_USERS', { id: activeId }) as User[];
      setUsers(response || []);
    } catch (err: unknown) {
      console.error("Failed to fetch users:", err);
      setFetchError(errStr(err, "Failed to fetch users."));
    } finally {
      setIsLoading(false);
    }
  }, [activeId, emit]);

  useEffect(() => {
    queueMicrotask(fetchUsers);
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    const cleanedQuery = searchQuery.trim().toLowerCase();
    if (!cleanedQuery) {
      return users;
    }

    return users.filter((proc) => {
      const nameMatch = proc.name?.toLowerCase().includes(cleanedQuery);
      return nameMatch;
    });
  }, [users, searchQuery]);

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center" mt="2">
        <Text size="1" color="gray" weight="bold" mt="2">
          USERS ({isLoading ? '...' : filtered.length})
        </Text>
        <Tooltip content="Refresh users list">
          <IconButton
            size="1"
            variant="soft"
            color="gray"
            disabled={isLoading}
            onClick={fetchUsers}
            style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            <UpdateIcon width="13" height="13" className={isLoading ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>
      </Flex>

      {(users.length > 0 || searchQuery) && (
        <TextField.Root
          placeholder="Search name or doc..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="1"
        >
          <TextField.Slot>
            <MagnifyingGlassIcon height="14" width="14" />
          </TextField.Slot>
          {searchQuery && (
            <TextField.Slot style={{ paddingRight: '4px' }}>
              <IconButton
                size="1"
                variant="ghost"
                color="gray"
                onClick={() => setSearchQuery('')}
                style={{ cursor: 'pointer', height: '16px', width: '16px' }}
              >
                <Cross2Icon height="12" width="12" />
              </IconButton>
            </TextField.Slot>
          )}
        </TextField.Root>
      )}

      {fetchError && users.length === 0 && !isLoading && (
        <Box
          py="3"
          px="2"
          style={{
            backgroundColor: 'var(--red-2)',
            borderRadius: 'var(--radius-2)',
            border: '1px dashed var(--red-4)',
            textAlign: 'center',
          }}
        >
          <Text size="1" color="red">{fetchError}</Text>
        </Box>
      )}

      {!fetchError && users.length === 0 && !isLoading && (
        <Box
          py="3"
          px="2"
          style={{
            textAlign: 'center',
            border: '1px dashed var(--gray-5)',
            borderRadius: 'var(--radius-2)'
          }}
        >
          <Text size="1" color="gray">No users found in this scope.</Text>
        </Box>
      )}

      {!fetchError && users.length > 0 && filtered.length === 0 && (
        <Box
          py="3"
          px="2"
          style={{
            textAlign: 'center',
            border: '1px dashed var(--gray-5)',
            borderRadius: 'var(--radius-2)'
          }}
        >
          <Text size="1" color="gray" >No matching users match your query.</Text>
        </Box>
      )}

      {!fetchError && isLoading && users.length === 0 && (
        <Flex justify="center" py="2">
          <Text size="1" color="gray" className="animate-pulse">Loading users...</Text>
        </Flex>
      )}

      <Flex direction="column" gap="2">
        {filtered.map((user) => {

          return (
            <Card
              key={user.name}
              size="1"
              style={{
                padding: '6px 8px',
                backgroundColor: 'var(--gray-2)',
                borderColor: 'var(--gray-4)',
                cursor: 'pointer',
              }}
              onClick={() => setViewUser(user)}
            >
              <Flex direction="column" gap="2">
                <Tooltip content={user.name}>
                <Text
                    size="1"
                    weight="bold"
                    truncate
                    style={{
                    fontFamily: 'monospace',
                    color: 'var(--gray-12)',
                    minWidth: 0,
                    flexGrow: 1
                    }}
                >
                    {user.name}
                </Text>
                </Tooltip>
              </Flex>
            </Card>
          );
        })}
      </Flex>
      {viewUser && (
        <UserModal
          onClose={() => setViewUser(null)}
          user={viewUser}
        />
      )}
    </Flex>
  );
}